import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/original-tabs';
import { Button } from '@/components/ui/button';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { githubLight } from "@uiw/codemirror-theme-github"
import { Icon } from './ui/icon';

const myFontTheme = EditorView.theme({
    '&': {
        fontFamily: '"Geist Mono", monospace',
        fontSize: '16px',
        lineHeight: '1.6'
    },
    '.cm-content': {
        fontFamily: '"Geist Mono", monospace'
    },
    '.cm-gutters': {
        fontFamily: '"Geist Mono", monospace'
    },
    '.cm-lineNumbers': {
        fontFamily: '"Geist Mono", monospace'
    },
    '.cm-line': {
        fontFamily: '"Geist Mono", monospace'
    },
    '.cm-scroller': {
        fontFamily: '"Geist Mono", monospace'
    },
    '.cm-tooltip': {
        fontFamily: '"Geist Mono", monospace'
    }
});

interface NewPolicyBuilderProps {
    value?: string;
    onChange?: (value: string) => void;
}

export default function NewPolicyBuilder({ value, onChange }: NewPolicyBuilderProps) {
    const [activeTab, setActiveTab] = useState<string>('interactive');
    const [jsonValue, setJsonValue] = useState<string>(
        value || '{\n  "allow": [],\n  "deny": []\n}'
    );
    const [isJsonValid, setIsJsonValid] = useState<boolean>(true);

    const handleJsonChange = (newValue: string): void => {
        setJsonValue(newValue);
        onChange?.(newValue);

        try {
            JSON.parse(newValue);
            setIsJsonValid(true);
        } catch {
            setIsJsonValid(false);
        }
    };

    const addAllowRule = (): void => {
        // TODO: Implement allow rule logic
        console.log('Add allow rule clicked');
    };

    const addDenyRule = (): void => {
        // TODO: Implement deny rule logic
        console.log('Add deny rule clicked');
    };

    const formatJson = (): void => {
        try {
            const parsed = JSON.parse(jsonValue);
            const formatted = JSON.stringify(parsed, null, 2);
            setJsonValue(formatted);
        } catch {
            // Invalid JSON, can't format
        }
    };

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
                    {/* Add Rule Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className="cursor-pointer inset-shadow-policy-cards bg-primary-25 rounded-xl hover:bg-primary-50"
                            onClick={addAllowRule}
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
                            className="cursor-pointer inset-shadow-policy-cards bg-primary-25 rounded-xl hover:bg-primary-50"
                            onClick={addDenyRule}
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

                    {/* Rules Content Area - Empty for now */}
                    <div className="space-y-4">
                        {/* TODO: Rules will be rendered here */}
                        <div className="text-center rounded-xl p-4 flex items-center gap-2 border-2 border-warning-600/20 bg-warning-25 text-sm text-warning-600">
                            <Icon name='wallet' className='size-4' />
                            <span className=''>Pick a rule and start building up your wallet sharing</span>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                    <div className="border rounded-lg overflow-y-scroll max-h-[400px] hidebar">
                        <CodeMirror
                            value={jsonValue}
                            onChange={handleJsonChange}
                            extensions={[json(), myFontTheme]}
                            theme={githubLight}
                            basicSetup={{
                                lineNumbers: false,
                                foldGutter: false,
                                dropCursor: true,
                                allowMultipleSelections: false,
                                tabSize: 2,
                                autocompletion: true,
                            }}
                            style={{
                                fontSize: '14px',
                                maxHeight: '400px'
                            }}
                        />
                    </div>

                    <div className="flex items-center w-full justify-between gap-2">
                        {!isJsonValid && (
                            <span className="text-red-600 text-sm">Invalid JSON</span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className='rounded-[6px]'
                            onClick={formatJson}
                        >
                            Format
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}