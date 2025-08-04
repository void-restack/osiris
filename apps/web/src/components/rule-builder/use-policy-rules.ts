import { useCallback } from "react";
import type {
  PolicyRule,
  PolicyObject,
  PolicyField,
  Constraint,
  SchemaObject,
} from "./types";
import { CONSTRAINT_TYPES } from "./constants";
import { setNestedProperty, cleanEmptyObjects } from "./utils";

export const usePolicyRules = () => {
  const convertLogicalConstraintValue = useCallback(
    (constraintType: string, constraintValue: unknown): unknown => {
      if (
        ["anyOf", "allOf", "oneOf"].includes(constraintType) &&
        Array.isArray(constraintValue)
      ) {
        return constraintValue.map((item) => {
          if (item && typeof item === "object" && "nestedFields" in item) {
            const schemaObj = item as SchemaObject;
            const converted: Record<string, unknown> = {};

            if (schemaObj.nestedFields?.length > 0) {
              schemaObj.nestedFields.forEach((nestedField) => {
                if (!nestedField.property) return;

                const fieldPath = nestedField.property;
                if (nestedField.constraints.length > 0) {
                  const nestedConstraints = nestedField.constraints.filter(
                    (c) =>
                      c.value !== "" &&
                      c.value !== null &&
                      c.value !== undefined,
                  );

                  if (nestedConstraints.length > 0) {
                    if (
                      nestedConstraints.length === 1 &&
                      nestedConstraints[0].type === "const"
                    ) {
                      converted[fieldPath] = nestedConstraints[0].value;
                    } else if (nestedConstraints.length === 1) {
                      const nc = nestedConstraints[0];
                      if (["anyOf", "allOf", "oneOf"].includes(nc.type)) {
                        converted[fieldPath] = {
                          [nc.type]: convertLogicalConstraintValue(
                            nc.type,
                            nc.value,
                          ),
                        };
                      } else {
                        converted[fieldPath] = { [nc.type]: nc.value };
                      }
                    } else {
                      const nestedConstraintObj: Record<string, unknown> = {};
                      nestedConstraints.forEach((nc) => {
                        if (["anyOf", "allOf", "oneOf"].includes(nc.type)) {
                          nestedConstraintObj[nc.type] =
                            convertLogicalConstraintValue(nc.type, nc.value);
                        } else {
                          nestedConstraintObj[nc.type] = nc.value;
                        }
                      });
                      converted[fieldPath] = nestedConstraintObj;
                    }
                  }
                }
              });
            }
            return converted;
          }
          return item as Record<string, unknown>;
        });
      }
      return constraintValue;
    },
    [],
  );

  const rulesToPolicy = useCallback(
    (rulesArray: PolicyRule[]): PolicyObject => {
      const policy: PolicyObject = { allow: [], deny: [] };

      rulesArray.forEach((rule) => {
        if (!rule.method && rule.fields.length === 0 && !rule.argsField) return;

        const policyRule: Record<string, unknown> = {};
        if (rule.method) policyRule.method = rule.method;
        if (rule.chain) policyRule.chain = rule.chain;

        const section = rule.method === "signMessage" ? "payload" : "decoded";
        const sectionData: Record<string, unknown> = {};
        const allFieldData: Array<{ key: string; value: unknown }> = [];

        const processField = (field: PolicyField, basePath = ""): void => {
          if (!field.property) return;

          const fullPath = basePath
            ? `${basePath}.${field.property}`
            : field.property;
          const validConstraints = field.constraints.filter(
            (c) => c.value !== "" && c.value !== null && c.value !== undefined,
          );

          if (validConstraints.length > 0) {
            let constraintValue: unknown;

            if (
              validConstraints.length === 1 &&
              validConstraints[0].type === "const"
            ) {
              constraintValue = validConstraints[0].value;
            } else if (validConstraints.length === 1) {
              const constraint = validConstraints[0];
              if (
                ["anyOf", "allOf", "oneOf"].includes(constraint.type) &&
                Array.isArray(constraint.value)
              ) {
                const schemaObjects = constraint.value as SchemaObject[];
                const convertedSchemas = schemaObjects.map((schemaObj) => {
                  const converted: Record<string, unknown> = {};
                  const convertNestedFields = (
                    fields: PolicyField[],
                    basePath = "",
                  ): void => {
                    fields.forEach((nestedField) => {
                      if (!nestedField.property) return;
                      const fieldPath = basePath
                        ? `${basePath}.${nestedField.property}`
                        : nestedField.property;

                      if (nestedField.constraints.length > 0) {
                        const nestedConstraints =
                          nestedField.constraints.filter(
                            (c) =>
                              c.value !== "" &&
                              c.value !== null &&
                              c.value !== undefined,
                          );

                        if (nestedConstraints.length > 0) {
                          if (
                            nestedConstraints.length === 1 &&
                            nestedConstraints[0].type === "const"
                          ) {
                            converted[fieldPath] = nestedConstraints[0].value;
                          } else if (nestedConstraints.length === 1) {
                            const nc = nestedConstraints[0];
                            if (["anyOf", "allOf", "oneOf"].includes(nc.type)) {
                              converted[fieldPath] = {
                                [nc.type]: convertLogicalConstraintValue(
                                  nc.type,
                                  nc.value,
                                ),
                              };
                            } else {
                              converted[fieldPath] = { [nc.type]: nc.value };
                            }
                          } else {
                            const nestedConstraintObj: Record<string, unknown> =
                              {};
                            nestedConstraints.forEach((nc) => {
                              if (
                                ["anyOf", "allOf", "oneOf"].includes(nc.type)
                              ) {
                                nestedConstraintObj[nc.type] =
                                  convertLogicalConstraintValue(
                                    nc.type,
                                    nc.value,
                                  );
                              } else {
                                nestedConstraintObj[nc.type] = nc.value;
                              }
                            });
                            converted[fieldPath] = nestedConstraintObj;
                          }
                        }
                      }

                      if (nestedField.nestedFields?.length > 0) {
                        convertNestedFields(
                          nestedField.nestedFields,
                          fieldPath,
                        );
                      }
                    });
                  };

                  if (schemaObj.nestedFields?.length > 0) {
                    convertNestedFields(schemaObj.nestedFields);
                  }
                  return converted;
                });
                constraintValue = { [constraint.type]: convertedSchemas };
              } else {
                constraintValue = { [constraint.type]: constraint.value };
              }
            } else {
              const constraintObj: Record<string, unknown> = {};
              validConstraints.forEach((c) => {
                if (
                  ["anyOf", "allOf", "oneOf"].includes(c.type) &&
                  Array.isArray(c.value)
                ) {
                  const schemaObjects = c.value as SchemaObject[];
                  const convertedSchemas = schemaObjects.map((schemaObj) => {
                    const converted: Record<string, unknown> = {};
                    const convertNestedFields = (
                      fields: PolicyField[],
                      basePath = "",
                    ): void => {
                      fields.forEach((nestedField) => {
                        if (!nestedField.property) return;
                        const fieldPath = basePath
                          ? `${basePath}.${nestedField.property}`
                          : nestedField.property;

                        if (nestedField.constraints.length > 0) {
                          const nestedConstraints =
                            nestedField.constraints.filter(
                              (nc) =>
                                nc.value !== "" &&
                                nc.value !== null &&
                                nc.value !== undefined,
                            );

                          if (nestedConstraints.length > 0) {
                            if (
                              nestedConstraints.length === 1 &&
                              nestedConstraints[0].type === "const"
                            ) {
                              converted[fieldPath] = nestedConstraints[0].value;
                            } else if (nestedConstraints.length === 1) {
                              const nc = nestedConstraints[0];
                              if (
                                ["anyOf", "allOf", "oneOf"].includes(nc.type)
                              ) {
                                converted[fieldPath] = {
                                  [nc.type]: convertLogicalConstraintValue(
                                    nc.type,
                                    nc.value,
                                  ),
                                };
                              } else {
                                converted[fieldPath] = { [nc.type]: nc.value };
                              }
                            } else {
                              const nestedConstraintObj: Record<
                                string,
                                unknown
                              > = {};
                              nestedConstraints.forEach((nc) => {
                                if (
                                  ["anyOf", "allOf", "oneOf"].includes(nc.type)
                                ) {
                                  nestedConstraintObj[nc.type] =
                                    convertLogicalConstraintValue(
                                      nc.type,
                                      nc.value,
                                    );
                                } else {
                                  nestedConstraintObj[nc.type] = nc.value;
                                }
                              });
                              converted[fieldPath] = nestedConstraintObj;
                            }
                          }
                        }

                        if (nestedField.nestedFields?.length > 0) {
                          convertNestedFields(
                            nestedField.nestedFields,
                            fieldPath,
                          );
                        }
                      });
                    };

                    if (schemaObj.nestedFields?.length > 0) {
                      convertNestedFields(schemaObj.nestedFields);
                    }
                    return converted;
                  });

                  constraintObj[c.type] = convertedSchemas;
                } else {
                  constraintObj[c.type] = c.value;
                }
              });
              constraintValue = constraintObj;
            }

            allFieldData.push({ key: fullPath, value: constraintValue });
          }

          if (field.nestedFields?.length > 0) {
            field.nestedFields.forEach((nestedField) => {
              processField(nestedField, fullPath);
            });
          }

          if (
            field.indexedElements &&
            Object.keys(field.indexedElements).length > 0
          ) {
            Object.entries(field.indexedElements).forEach(
              ([index, indexedField]) => {
                const indexPath = `${fullPath}.${index}`;
                const validConstraints = indexedField.constraints.filter(
                  (c) =>
                    c.value !== "" && c.value !== null && c.value !== undefined,
                );

                if (validConstraints.length > 0) {
                  let constraintValue: unknown;

                  if (
                    validConstraints.length === 1 &&
                    validConstraints[0].type === "const"
                  ) {
                    constraintValue = validConstraints[0].value;
                  } else if (validConstraints.length === 1) {
                    const constraint = validConstraints[0];
                    if (
                      ["anyOf", "allOf", "oneOf"].includes(constraint.type) &&
                      Array.isArray(constraint.value)
                    ) {
                      const rawArray = constraint.value as Array<unknown>;
                      const convertedSchemas = rawArray.map((item) => {
                        if (
                          item &&
                          typeof item === "object" &&
                          "nestedFields" in item
                        ) {
                          const schemaObj = item as SchemaObject;
                          const converted: Record<string, unknown> = {};

                          if (schemaObj.nestedFields?.length > 0) {
                            schemaObj.nestedFields.forEach((nestedField) => {
                              if (!nestedField.property) return;
                              const fieldPath = nestedField.property;

                              if (nestedField.constraints.length > 0) {
                                const nestedConstraints =
                                  nestedField.constraints.filter(
                                    (c) =>
                                      c.value !== "" &&
                                      c.value !== null &&
                                      c.value !== undefined,
                                  );

                                if (nestedConstraints.length > 0) {
                                  if (
                                    nestedConstraints.length === 1 &&
                                    nestedConstraints[0].type === "const"
                                  ) {
                                    converted[fieldPath] =
                                      nestedConstraints[0].value;
                                  } else if (nestedConstraints.length === 1) {
                                    const nc = nestedConstraints[0];
                                    if (
                                      ["anyOf", "allOf", "oneOf"].includes(
                                        nc.type,
                                      )
                                    ) {
                                      converted[fieldPath] = {
                                        [nc.type]:
                                          convertLogicalConstraintValue(
                                            nc.type,
                                            nc.value,
                                          ),
                                      };
                                    } else {
                                      converted[fieldPath] = {
                                        [nc.type]: nc.value,
                                      };
                                    }
                                  } else {
                                    const nestedConstraintObj: Record<
                                      string,
                                      unknown
                                    > = {};
                                    nestedConstraints.forEach((nc) => {
                                      if (
                                        ["anyOf", "allOf", "oneOf"].includes(
                                          nc.type,
                                        )
                                      ) {
                                        nestedConstraintObj[nc.type] =
                                          convertLogicalConstraintValue(
                                            nc.type,
                                            nc.value,
                                          );
                                      } else {
                                        nestedConstraintObj[nc.type] = nc.value;
                                      }
                                    });
                                    converted[fieldPath] = nestedConstraintObj;
                                  }
                                }
                              }
                            });
                          }
                          return converted;
                        }
                        return item as Record<string, unknown>;
                      });
                      constraintValue = { [constraint.type]: convertedSchemas };
                    } else {
                      constraintValue = { [constraint.type]: constraint.value };
                    }
                  } else {
                    const constraintObj: Record<string, unknown> = {};
                    validConstraints.forEach((c) => {
                      if (
                        ["anyOf", "allOf", "oneOf"].includes(c.type) &&
                        Array.isArray(c.value)
                      ) {
                        const rawArray = c.value as Array<unknown>;
                        const convertedSchemas = rawArray.map((item) => {
                          if (
                            item &&
                            typeof item === "object" &&
                            "nestedFields" in item
                          ) {
                            const schemaObj = item as SchemaObject;
                            const converted: Record<string, unknown> = {};

                            if (schemaObj.nestedFields?.length > 0) {
                              schemaObj.nestedFields.forEach((nestedField) => {
                                if (!nestedField.property) return;
                                const fieldPath = nestedField.property;

                                if (nestedField.constraints.length > 0) {
                                  const nestedConstraints =
                                    nestedField.constraints.filter(
                                      (nc) =>
                                        nc.value !== "" &&
                                        nc.value !== null &&
                                        nc.value !== undefined,
                                    );

                                  if (nestedConstraints.length > 0) {
                                    if (
                                      nestedConstraints.length === 1 &&
                                      nestedConstraints[0].type === "const"
                                    ) {
                                      converted[fieldPath] =
                                        nestedConstraints[0].value;
                                    } else if (nestedConstraints.length === 1) {
                                      const nc = nestedConstraints[0];
                                      if (
                                        ["anyOf", "allOf", "oneOf"].includes(
                                          nc.type,
                                        )
                                      ) {
                                        converted[fieldPath] = {
                                          [nc.type]:
                                            convertLogicalConstraintValue(
                                              nc.type,
                                              nc.value,
                                            ),
                                        };
                                      } else {
                                        converted[fieldPath] = {
                                          [nc.type]: nc.value,
                                        };
                                      }
                                    } else {
                                      const nestedConstraintObj: Record<
                                        string,
                                        unknown
                                      > = {};
                                      nestedConstraints.forEach((nc) => {
                                        if (
                                          ["anyOf", "allOf", "oneOf"].includes(
                                            nc.type,
                                          )
                                        ) {
                                          nestedConstraintObj[nc.type] =
                                            convertLogicalConstraintValue(
                                              nc.type,
                                              nc.value,
                                            );
                                        } else {
                                          nestedConstraintObj[nc.type] =
                                            nc.value;
                                        }
                                      });
                                      converted[fieldPath] =
                                        nestedConstraintObj;
                                    }
                                  }
                                }
                              });
                            }
                            return converted;
                          }
                          return item as Record<string, unknown>;
                        });
                        constraintObj[c.type] = convertedSchemas;
                      } else {
                        constraintObj[c.type] = c.value;
                      }
                    });
                    constraintValue = constraintObj;
                  }

                  allFieldData.push({ key: indexPath, value: constraintValue });
                }

                if (indexedField.nestedFields?.length > 0) {
                  indexedField.nestedFields.forEach((nestedField) => {
                    processField(nestedField, indexPath);
                  });
                }

                if (
                  indexedField.indexedElements &&
                  Object.keys(indexedField.indexedElements).length > 0
                ) {
                  Object.entries(indexedField.indexedElements).forEach(
                    ([subIndex, subIndexedField]) => {
                      const subIndexPath = `${indexPath}.${subIndex}`;
                      const subValidConstraints =
                        subIndexedField.constraints.filter(
                          (c) =>
                            c.value !== "" &&
                            c.value !== null &&
                            c.value !== undefined,
                        );

                      if (subValidConstraints.length > 0) {
                        let subConstraintValue: unknown;

                        if (
                          subValidConstraints.length === 1 &&
                          subValidConstraints[0].type === "const"
                        ) {
                          subConstraintValue = subValidConstraints[0].value;
                        } else if (subValidConstraints.length === 1) {
                          const constraint = subValidConstraints[0];
                          if (
                            ["anyOf", "allOf", "oneOf"].includes(
                              constraint.type,
                            ) &&
                            Array.isArray(constraint.value)
                          ) {
                            const rawArray = constraint.value as Array<unknown>;
                            const convertedSchemas = rawArray.map((item) => {
                              if (
                                item &&
                                typeof item === "object" &&
                                "nestedFields" in item
                              ) {
                                const schemaObj = item as SchemaObject;
                                const converted: Record<string, unknown> = {};

                                if (schemaObj.nestedFields?.length > 0) {
                                  schemaObj.nestedFields.forEach(
                                    (nestedField) => {
                                      if (!nestedField.property) return;
                                      const fieldPath = nestedField.property;

                                      if (nestedField.constraints.length > 0) {
                                        const nestedConstraints =
                                          nestedField.constraints.filter(
                                            (c) =>
                                              c.value !== "" &&
                                              c.value !== null &&
                                              c.value !== undefined,
                                          );

                                        if (nestedConstraints.length > 0) {
                                          if (
                                            nestedConstraints.length === 1 &&
                                            nestedConstraints[0].type ===
                                              "const"
                                          ) {
                                            converted[fieldPath] =
                                              nestedConstraints[0].value;
                                          } else if (
                                            nestedConstraints.length === 1
                                          ) {
                                            const nc = nestedConstraints[0];
                                            if (
                                              [
                                                "anyOf",
                                                "allOf",
                                                "oneOf",
                                              ].includes(nc.type)
                                            ) {
                                              converted[fieldPath] = {
                                                [nc.type]:
                                                  convertLogicalConstraintValue(
                                                    nc.type,
                                                    nc.value,
                                                  ),
                                              };
                                            } else {
                                              converted[fieldPath] = {
                                                [nc.type]: nc.value,
                                              };
                                            }
                                          } else {
                                            const nestedConstraintObj: Record<
                                              string,
                                              unknown
                                            > = {};
                                            nestedConstraints.forEach((nc) => {
                                              if (
                                                [
                                                  "anyOf",
                                                  "allOf",
                                                  "oneOf",
                                                ].includes(nc.type)
                                              ) {
                                                nestedConstraintObj[nc.type] =
                                                  convertLogicalConstraintValue(
                                                    nc.type,
                                                    nc.value,
                                                  );
                                              } else {
                                                nestedConstraintObj[nc.type] =
                                                  nc.value;
                                              }
                                            });
                                            converted[fieldPath] =
                                              nestedConstraintObj;
                                          }
                                        }
                                      }
                                    },
                                  );
                                }
                                return converted;
                              }
                              return item as Record<string, unknown>;
                            });
                            subConstraintValue = {
                              [constraint.type]: convertedSchemas,
                            };
                          } else {
                            subConstraintValue = {
                              [constraint.type]: constraint.value,
                            };
                          }
                        } else {
                          const subConstraintObj: Record<string, unknown> = {};
                          subValidConstraints.forEach((c) => {
                            if (
                              ["anyOf", "allOf", "oneOf"].includes(c.type) &&
                              Array.isArray(c.value)
                            ) {
                              const rawArray = c.value as Array<unknown>;
                              const convertedSchemas = rawArray.map((item) => {
                                if (
                                  item &&
                                  typeof item === "object" &&
                                  "nestedFields" in item
                                ) {
                                  const schemaObj = item as SchemaObject;
                                  const converted: Record<string, unknown> = {};

                                  if (schemaObj.nestedFields?.length > 0) {
                                    schemaObj.nestedFields.forEach(
                                      (nestedField) => {
                                        if (!nestedField.property) return;
                                        const fieldPath = nestedField.property;

                                        if (
                                          nestedField.constraints.length > 0
                                        ) {
                                          const nestedConstraints =
                                            nestedField.constraints.filter(
                                              (nc) =>
                                                nc.value !== "" &&
                                                nc.value !== null &&
                                                nc.value !== undefined,
                                            );

                                          if (nestedConstraints.length > 0) {
                                            if (
                                              nestedConstraints.length === 1 &&
                                              nestedConstraints[0].type ===
                                                "const"
                                            ) {
                                              converted[fieldPath] =
                                                nestedConstraints[0].value;
                                            } else if (
                                              nestedConstraints.length === 1
                                            ) {
                                              const nc = nestedConstraints[0];
                                              if (
                                                [
                                                  "anyOf",
                                                  "allOf",
                                                  "oneOf",
                                                ].includes(nc.type)
                                              ) {
                                                converted[fieldPath] = {
                                                  [nc.type]:
                                                    convertLogicalConstraintValue(
                                                      nc.type,
                                                      nc.value,
                                                    ),
                                                };
                                              } else {
                                                converted[fieldPath] = {
                                                  [nc.type]: nc.value,
                                                };
                                              }
                                            } else {
                                              const nestedConstraintObj: Record<
                                                string,
                                                unknown
                                              > = {};
                                              nestedConstraints.forEach(
                                                (nc) => {
                                                  if (
                                                    [
                                                      "anyOf",
                                                      "allOf",
                                                      "oneOf",
                                                    ].includes(nc.type)
                                                  ) {
                                                    nestedConstraintObj[
                                                      nc.type
                                                    ] =
                                                      convertLogicalConstraintValue(
                                                        nc.type,
                                                        nc.value,
                                                      );
                                                  } else {
                                                    nestedConstraintObj[
                                                      nc.type
                                                    ] = nc.value;
                                                  }
                                                },
                                              );
                                              converted[fieldPath] =
                                                nestedConstraintObj;
                                            }
                                          }
                                        }
                                      },
                                    );
                                  }
                                  return converted;
                                }
                                return item as Record<string, unknown>;
                              });
                              subConstraintObj[c.type] = convertedSchemas;
                            } else {
                              subConstraintObj[c.type] = c.value;
                            }
                          });
                          subConstraintValue = subConstraintObj;
                        }

                        allFieldData.push({
                          key: subIndexPath,
                          value: subConstraintValue,
                        });
                      }
                    },
                  );
                }
              },
            );
          }
        };

        rule.fields.forEach((field) => processField(field));
        if (rule.argsField) {
          processField(rule.argsField);
        }

        allFieldData.forEach(({ key, value }) => {
          setNestedProperty(sectionData, key, value);
        });

        if (Object.keys(sectionData).length > 0) {
          policyRule[section] = sectionData;
        }

        if (Object.keys(policyRule).length > 0) {
          policy[rule.type].push(
            cleanEmptyObjects(policyRule) as Record<string, unknown>,
          );
        }
      });

      return policy;
    },
    [convertLogicalConstraintValue],
  );

  const policyToRules = useCallback((policy: PolicyObject): PolicyRule[] => {
    const newRules: PolicyRule[] = [];
    let ruleId = 1;

    (["allow", "deny"] as const).forEach((type) => {
      (policy[type] || []).forEach((policyRule) => {
        const rule: PolicyRule = {
          id: ruleId++,
          type,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} group ${newRules.filter((r) => r.type === type).length + 1}`,
          method: String(policyRule.method || ""),
          chain: String(policyRule.chain || ""),
          fields: [],
          argsField: null,
        };

        const section = (policyRule.decoded ||
          policyRule.payload ||
          {}) as Record<string, unknown>;

        const buildFieldTree = (
          flatPaths: Array<{ path: string; constraints: Constraint[] }>,
        ): PolicyField[] => {
          const pathGroups: Record<
            string,
            Array<{ path: string; constraints: Constraint[] }>
          > = {};
          const directFields: Array<{
            path: string;
            constraints: Constraint[];
          }> = [];

          flatPaths.forEach((item) => {
            const pathParts = item.path.split(".");
            if (pathParts.length === 1) {
              directFields.push(item);
            } else {
              const rootPath = pathParts[0];
              if (!pathGroups[rootPath]) {
                pathGroups[rootPath] = [];
              }
              pathGroups[rootPath].push({
                path: pathParts.slice(1).join("."),
                constraints: item.constraints,
              });
            }
          });

          const fields: PolicyField[] = [];

          directFields.forEach((item) => {
            fields.push({
              property: item.path,
              fieldType: "String",
              constraints: item.constraints,
              nestedFields: undefined,
              indexedElements: undefined,
            });
          });

          Object.entries(pathGroups).forEach(([rootPath, nestedPaths]) => {
            const nestedFields = buildFieldTree(nestedPaths);
            const hasNumericKeys = nestedPaths.some((item) =>
              /^\d+/.test(item.path),
            );
            const fieldType = hasNumericKeys ? "Array" : "Object";

            if (fieldType === "Array") {
              const indexedElements: Record<string, PolicyField> = {};
              nestedPaths.forEach((item) => {
                const pathParts = item.path.split(".");
                const indexKey = pathParts[0];
                if (/^\d+$/.test(indexKey)) {
                  indexedElements[indexKey] = {
                    property: indexKey,
                    fieldType: "String",
                    constraints: item.constraints,
                    nestedFields: undefined,
                    indexedElements: undefined,
                  };
                }
              });

              fields.push({
                property: rootPath,
                fieldType: "Array",
                constraints: [],
                nestedFields: undefined,
                indexedElements,
              });
            } else {
              fields.push({
                property: rootPath,
                fieldType: "Object",
                constraints: [],
                nestedFields:
                  nestedFields.length > 0 ? nestedFields : undefined,
                indexedElements: undefined,
              });
            }
          });

          return fields;
        };

        const extractFields = (
          obj: Record<string, unknown>,
          prefix = "",
        ): Array<{ path: string; constraints: Constraint[] }> => {
          const flatFields: Array<{ path: string; constraints: Constraint[] }> =
            [];

          Object.entries(obj).forEach(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;

            if (typeof value === "string" || typeof value === "number") {
              flatFields.push({
                path,
                constraints: [{ type: "const", value }],
              });
              return;
            }

            if (Array.isArray(value)) {
              flatFields.push({ path, constraints: [{ type: "enum", value }] });
              return;
            }

            if (value && typeof value === "object") {
              const constraintKeys = Object.keys(
                value as Record<string, unknown>,
              );
              const constraintOnlyKeys = constraintKeys.filter(
                (k) => CONSTRAINT_TYPES[k],
              );

              if (constraintOnlyKeys.length > 0) {
                const constraints = constraintOnlyKeys.map((k) => {
                  const constraintValue = (value as Record<string, unknown>)[k];

                  if (
                    ["anyOf", "allOf", "oneOf"].includes(k) &&
                    Array.isArray(constraintValue)
                  ) {
                    const schemaObjects: SchemaObject[] = (
                      constraintValue as Array<Record<string, unknown>>
                    ).map((schema) => {
                      const nestedFields: PolicyField[] = [];

                      Object.entries(schema).forEach(([propKey, propValue]) => {
                        if (
                          propKey &&
                          propValue !== undefined &&
                          propValue !== null &&
                          propValue !== ""
                        ) {
                          let fieldType: PolicyField["fieldType"] = "String";
                          let constraints: Constraint[] = [];

                          if (
                            typeof propValue === "object" &&
                            !Array.isArray(propValue)
                          ) {
                            const constraintObj = propValue as Record<
                              string,
                              unknown
                            >;
                            const constraintKeys = Object.keys(constraintObj);

                            constraints = constraintKeys
                              .filter((ck) => CONSTRAINT_TYPES[ck])
                              .map((ck) => ({
                                type: ck,
                                value: constraintObj[ck] as
                                  | string
                                  | number
                                  | boolean
                                  | object
                                  | Array<unknown>,
                              }));

                            if (
                              constraints.some(
                                (c) =>
                                  c.type.includes("numeric") ||
                                  c.type.includes("Min") ||
                                  c.type.includes("Max") ||
                                  [
                                    "min",
                                    "max",
                                    "lt",
                                    "lte",
                                    "gt",
                                    "gte",
                                    "minimum",
                                    "maximum",
                                    "24hLimit",
                                  ].includes(c.type),
                              )
                            ) {
                              fieldType = "Number";
                            } else if (
                              constraints.some((c) => c.type.includes("bigInt"))
                            ) {
                              fieldType = "BigInt";
                            } else if (
                              constraints.some((c) =>
                                c.type.includes("address"),
                              )
                            ) {
                              fieldType = "String";
                            } else if (
                              constraints.some(
                                (c) =>
                                  c.type.includes("string") ||
                                  [
                                    "contains",
                                    "startsWith",
                                    "endsWith",
                                    "matches",
                                    "pattern",
                                    "inList",
                                    "before",
                                    "after",
                                  ].includes(c.type),
                              )
                            ) {
                              fieldType = "String";
                            } else if (
                              constraints.some((c) => ["is"].includes(c.type))
                            ) {
                              fieldType = "Boolean";
                            } else if (
                              constraints.some((c) =>
                                [
                                  "containsItem",
                                  "containsAny",
                                  "containsAll",
                                  "equals",
                                ].includes(c.type),
                              )
                            ) {
                              fieldType = "Array";
                            } else if (
                              constraints.some((c) =>
                                ["lengthEq", "minLength", "maxLength"].includes(
                                  c.type,
                                ),
                              )
                            ) {
                              fieldType = "Array";
                            } else if (
                              constraints.some((c) =>
                                ["shape", "hasKeys", "requiredKeys"].includes(
                                  c.type,
                                ),
                              )
                            ) {
                              fieldType = "Object";
                            } else if (
                              constraints.some((c) =>
                                [
                                  "anyOf",
                                  "allOf",
                                  "oneOf",
                                  "not",
                                  "if",
                                  "then",
                                  "else",
                                  "type",
                                ].includes(c.type),
                              )
                            ) {
                              fieldType = "Object";
                            }
                          } else {
                            if (typeof propValue === "number") {
                              fieldType = "Number";
                              constraints = [
                                { type: "const", value: propValue },
                              ];
                            } else if (typeof propValue === "boolean") {
                              fieldType = "Boolean";
                              constraints = [
                                { type: "const", value: propValue },
                              ];
                            } else {
                              fieldType = "String";
                              constraints = [
                                { type: "const", value: propValue },
                              ];
                            }
                          }

                          nestedFields.push({
                            property: propKey,
                            fieldType,
                            constraints,
                            nestedFields:
                              fieldType === "Object" ? [] : undefined,
                            indexedElements:
                              fieldType === "Array" ? {} : undefined,
                          });
                        }
                      });

                      return { nestedFields };
                    });

                    return {
                      type: k,
                      value: schemaObjects,
                    };
                  }

                  return {
                    type: k,
                    value: constraintValue as
                      | string
                      | number
                      | boolean
                      | object
                      | Array<unknown>,
                  };
                });
                flatFields.push({ path, constraints });
              }

              const nonConstraintKeys = constraintKeys.filter(
                (k) => !CONSTRAINT_TYPES[k],
              );
              nonConstraintKeys.forEach((nestedKey) => {
                const nestedValue = (value as Record<string, unknown>)[
                  nestedKey
                ];
                const nestedFields = extractFields(
                  { [nestedKey]: nestedValue },
                  path,
                );
                flatFields.push(...nestedFields);
              });
            }
          });

          return flatFields;
        };

        const flatFields = extractFields(section);
        const treeFields = buildFieldTree(flatFields);

        const argsFieldIndex = treeFields.findIndex(
          (field) => field.property === "args",
        );
        if (argsFieldIndex !== -1) {
          rule.argsField = treeFields[argsFieldIndex];
          treeFields.splice(argsFieldIndex, 1);
        }

        rule.fields = treeFields;
        newRules.push(rule);
      });
    });

    return newRules;
  }, []);

  return {
    rulesToPolicy,
    policyToRules,
  };
};
