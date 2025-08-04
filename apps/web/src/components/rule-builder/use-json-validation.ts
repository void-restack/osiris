import { useState, useCallback, useEffect } from "react";
import { type PolicyObject } from "./types";
import { cleanInvalidProperties } from "./utils";

export const useJsonValidation = (initialValue?: string) => {
  const [internalJson, setInternalJson] = useState<string>(
    initialValue || '{\n  "allow": [],\n  "deny": []\n}',
  );
  const [isJsonValid, setIsJsonValid] = useState<boolean>(true);

  useEffect(() => {
    if (initialValue !== undefined && initialValue !== internalJson) {
      setInternalJson(initialValue);
    }
  }, [initialValue, internalJson]);

  const validateAndCleanJson = useCallback(
    (
      jsonString: string,
    ): { isValid: boolean; cleaned?: PolicyObject; cleanedJson?: string } => {
      try {
        const parsed = JSON.parse(jsonString) as PolicyObject;
        const cleaned = cleanInvalidProperties(parsed);
        const cleanedJson = JSON.stringify(cleaned, null, 2);

        return {
          isValid: true,
          cleaned,
          cleanedJson,
        };
      } catch {
        return { isValid: false };
      }
    },
    [],
  );

  const updateJson = useCallback(
    (newValue: string, onChange?: (value: string) => void) => {
      const { isValid, cleanedJson } = validateAndCleanJson(newValue);

      setIsJsonValid(isValid);

      if (isValid && cleanedJson && cleanedJson !== newValue) {
        // Auto-clean invalid properties
        setTimeout(() => {
          setInternalJson(cleanedJson);
          onChange?.(cleanedJson);
        }, 0);
      } else {
        setInternalJson(newValue);
        onChange?.(newValue);
      }
    },
    [validateAndCleanJson],
  );

  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(internalJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setInternalJson(formatted);
      return formatted;
    } catch {
      return internalJson;
    }
  }, [internalJson]);

  return {
    internalJson,
    isJsonValid,
    updateJson,
    formatJson,
    validateAndCleanJson,
  };
};
