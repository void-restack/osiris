import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/original-tabs';
import { Icon } from '@/components/ui/icon';
import type { PolicyRule } from './types';
import { usePolicyRules } from './use-policy-rules';
import { useJsonValidation } from './use-json-validation';
import { createNewRule } from './utils';
import { PolicyRuleComponent } from './policy-rule-comp';
import { JsonEditor } from './json-editor';

interface PolicyBuilderProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const PolicyBuilder: React.FC<PolicyBuilderProps> = ({ value, onChange }) => {
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [activeTab, setActiveTab] = useState<string>('interactive');

  const { rulesToPolicy, policyToRules } = usePolicyRules();
  const { internalJson, isJsonValid, updateJson, formatJson } = useJsonValidation(value);

  const currentPolicy = useMemo(() => {
    if (activeTab === 'interactive') {
      return rulesToPolicy(rules);
    }
    return null;
  }, [rules, activeTab, rulesToPolicy]);

  useEffect(() => {
    if (activeTab === 'interactive' && currentPolicy) {
      const newJson = JSON.stringify(currentPolicy, null, 2);
      updateJson(newJson, onChange);
    }
  }, [currentPolicy, activeTab, updateJson, onChange]);

  const handleJsonChange = useCallback((newValue: string) => {
    updateJson(newValue, (cleanedValue) => {
      onChange?.(cleanedValue);

      if (activeTab === 'json') {
        try {
          const parsed = JSON.parse(cleanedValue);
          const newRules = policyToRules(parsed);
          setRules(newRules);
        } catch {
          // Invalid JSON, keep existing rules
        }
      }
    });
  }, [activeTab, updateJson, onChange, policyToRules]);

  const addRule = useCallback((type: 'allow' | 'deny'): void => {
    const newRule = createNewRule(type, rules);
    setRules(prevRules => [...prevRules, newRule]);
  }, [rules]);

  const updateRule = useCallback((id: number, updatedRule: PolicyRule): void => {
    setRules(prevRules => prevRules.map(rule => rule.id === id ? updatedRule : rule));
  }, []);

  const removeRule = useCallback((id: number): void => {
    setRules(prevRules => prevRules.filter(rule => rule.id !== id));
  }, []);

  const handleFormatJson = useCallback(() => {
    const formatted = formatJson();
    onChange?.(formatted);
  }, [formatJson, onChange]);

  return (
    <div className="w-full max-w-md mx-auto p-4 rounded-md">
      <Tabs value={activeTab} onValueChange={setActiveTab} className='gap-6'>
        <TabsList className="w-full inset-shadow-tabs h-10 p-1 max-w-[416px]">
          <TabsTrigger value="interactive" className='font-normal data-[state=active]:text-primary-800 text-primary-400'>
            Interactive <Icon name='swipe' />
          </TabsTrigger>
          <TabsTrigger value="json">
            <Icon name='code' /> JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="space-y-6 max-h-[400px] overflow-y-scroll hidebar">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="cursor-pointer  inset-shadow-policy-cards bg-primary-25 rounded-xl"
              onClick={() => addRule('allow')}
            >
              <div className="px-[18px] py-6 rounded-xl">
                <Icon name='check' className='text-primary-800 size-6 mb-4 transition-transform duration-300 hover:scale-110' />
                <div className='flex flex-col'>
                  <h3 className="font-medium transition-colors duration-200">Add allow rule</h3>
                  <p className="text-sm text-primary-400 transition-colors duration-200">Define permitted actions</p>
                </div>
              </div>
            </div>

            <div
              className="cursor-pointer inset-shadow-policy-cards bg-primary-25 rounded-xl"
              onClick={() => addRule('deny')}
            >
              <div className="px-[18px] py-6 rounded-xl">
                <Icon name='warning' className='text-primary-800 size-6 mb-4 transition-transform duration-300 hover:scale-110' />
                <div className='flex flex-col'>
                  <h3 className="font-medium transition-colors duration-200">Add deny rule</h3>
                  <p className="text-sm text-primary-400 transition-colors duration-200">Define blocked actions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {rules.map(rule => (
              <div key={rule.id} className="animate-in slide-in-from-top-4 fade-in-0 duration-500 ease-out">
                <PolicyRuleComponent
                  rule={rule}
                  onChange={(updatedRule: PolicyRule) => updateRule(rule.id, updatedRule)}
                  onRemove={() => removeRule(rule.id)}
                />
              </div>
            ))}
          </div>

          {rules.length === 0 && (
            <div className="text-center rounded-xl p-4 flex items-center gap-2 border-2 border-warning-600/20 bg-warning-25 text-sm text-warning-600">
              <Icon name='wallet' className='size-4' />
              <span className=''>Pick a rule and start building up your wallet sharing</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="json" className="space-y-4">
          <JsonEditor
            value={internalJson}
            onChange={handleJsonChange}
            isValid={isJsonValid}
            onFormat={handleFormatJson}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolicyBuilder;
