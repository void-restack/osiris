import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/original-tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Icon } from "./ui/icon";
import { ChevronDown, ChevronUp, Trash2Icon } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

interface Rule {
  id: number;
  type: 'allow' | 'deny';
  name: string;
  isOpen: boolean;
}

type RuleType = 'allow' | 'deny';

export default function RuleBuilder() {
  const [rules, setRules] = useState<Rule[]>([]);

  const addRule = (type: RuleType): void => {
    const newRule: Rule = {
      id: Date.now(),
      type,
      name: `${type === 'allow' ? 'Allow' : 'Deny'} group ${rules.filter(r => r.type === type).length + 1}`,
      isOpen: true
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id: number): void => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const toggleRule = (id: number): void => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, isOpen: !rule.isOpen } : rule
    ));
  };

  return (
    <div className="w-fit border border-primary-300 rounded-md p-4 min-h-32 h-fit overflow-hidden">
      <Tabs defaultValue="interactive" className="w-[400px] gap-0">
        <TabsList className="inset-shadow-tabs bg-primary-50 rounded-[8px] w-full">
          <TabsTrigger value="interactive" className="rounded-[6px] data-[state=active]:bg-primary-00 px-14 font-normal text-sm data-[state=active]:text-primary-800 text-primary-400">
            Interactive
            <Icon name="swipe" />
          </TabsTrigger>
          <TabsTrigger value="json" className="rounded-[6px] data-[state=active]:bg-primary-00 px-14 font-normal text-sm data-[state=active]:text-primary-800 text-primary-400">
            <Icon name="code" />
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interactive" className="mt-6 space-y-6">
          <div className="flex items-center gap-6 w-full">
            <div
              className="inset-shadow-policy-cards p-4 w-full rounded-xl bg-primary-25 hover:bg-primary-50 select-none cursor-pointer"
              onClick={() => addRule('allow')}
            >
              <Icon name="check" className="mb-4 size-6" />
              <h4 className="font-medium">Add allow rule</h4>
              <span className="text-primary-400 text-sm">Add all your content</span>
            </div>
            <div
              className="inset-shadow-policy-cards w-full p-4 rounded-xl bg-primary-25 hover:bg-primary-50 select-none cursor-pointer"
              onClick={() => addRule('deny')}
            >
              <Icon name="warning" className="mb-4 size-6" />
              <h4 className="font-medium">Add deny rule</h4>
              <span className="text-primary-400 text-sm">Add all your content</span>
            </div>
          </div>


          <ScrollArea className="h-64 w-full hidebar">
            <div className="space-y-6 hidebar">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-primary-100 rounded-md p-4">
                  <Collapsible open={rule.isOpen} onOpenChange={() => toggleRule(rule.id)}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span>{rule.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeRule(rule.id); }} className="bg-danger-50 hover:bg-danger-50 hover:text-danger-600 border border-danger-100 text-danger-600">
                          <Trash2Icon className="size-3" />
                        </Button>
                        <Separator orientation="vertical" className="min-h-8 bg-primary-100 mx-4" />
                        {rule.isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-t-primary-100 border-dashed my-4" />
                      {/* Your content goes here */}
                      <div className="p-4 bg-primary-50 rounded-lg">
                        Content for {rule.name}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          </ScrollArea>

        </TabsContent>

        <TabsContent value="json">JSON</TabsContent>
      </Tabs>
    </div>
  );
}
