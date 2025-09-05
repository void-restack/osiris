import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/original-tabs";
import { Separator } from "@/components/ui/separator";
import {
    Calendar as CalendarIcon,
    Clock,
    ChevronDown,
    Plus,
    Repeat,
    Settings2,
    X
} from "lucide-react";
import { RRule } from 'rrule';
import { type WorkflowData } from "@/lib/store";

interface WorkflowTriggersProps {
    workflowData?: WorkflowData;
    onUpdate?: (trigger: WorkflowData['timeBasedTrigger']) => void;
}

export function WorkflowTriggers({ workflowData, onUpdate }: WorkflowTriggersProps) {
    const [triggerType, setTriggerType] = useState<"manual" | "time" | "event">("manual");
    const [hasTimeSet, setHasTimeSet] = useState(false);
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState("09:00");
    const [rruleString, setRruleString] = useState("");
    const [frequency, setFrequency] = useState<number>(RRule.DAILY);
    const [interval, setInterval] = useState(1);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [count, setCount] = useState<number | undefined>(undefined);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    useEffect(() => {
        if (workflowData?.timeBasedTrigger) {
            setTriggerType("time");
            setHasTimeSet(true);
            const startDateTime = new Date(workflowData.timeBasedTrigger.startTime);
            setDate(startDateTime);
            setTime(startDateTime.toTimeString().slice(0, 5));
            setRruleString(workflowData.timeBasedTrigger.rrule);

            try {
                const rule = RRule.fromString(`DTSTART:${startDateTime.toISOString().replace(/[:\-]|\.\d{3}/g, '')}\n${workflowData.timeBasedTrigger.rrule}`);
                setFrequency(rule.options.freq || RRule.DAILY);
                setInterval(rule.options.interval || 1);
                setCount(rule.options.count || undefined);
            } catch (error) {
                console.error("Failed to parse RRULE:", error);
            }
        }
    }, [workflowData]);

    const generateRRule = () => {
        if (!date) return "";

        const [hours, minutes] = time.split(':');
        const startDateTime = new Date(date);
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const options: any = {
            freq: frequency,
            interval: interval,
            dtstart: startDateTime,
        };

        if (count && count > 0) {
            options.count = count;
        }

        const rule = new RRule(options);
        return rule.toString().replace(/^RRULE:/, 'RRULE:');
    };

    useEffect(() => {
        if (triggerType === "time" && hasTimeSet && date) {
            const newRrule = generateRRule();
            setRruleString(newRrule);

            if (onUpdate) {
                const [hours, minutes] = time.split(':');
                const startDateTime = new Date(date);
                startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                onUpdate({
                    rrule: newRrule,
                    startTime: startDateTime.toISOString(),
                });
            }
        } else if (triggerType === "manual" && onUpdate) {
            onUpdate(null);
        }
    }, [triggerType, hasTimeSet, date, time, frequency, interval, count]);

    const getRuleDescription = (rruleStr: string) => {
        try {
            if (!rruleStr || !date) return "";

            const [hours, minutes] = time.split(':');
            const startDateTime = new Date(date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const rule = RRule.fromString(`DTSTART:${startDateTime.toISOString().replace(/[:\-]|\.\d{3}/g, '')}\n${rruleStr}`);
            return rule.toText();
        } catch (error) {
            return "Invalid recurrence rule";
        }
    };

    const applyPreset = (freq: number, intervalValue: number = 1) => {
        setFrequency(freq);
        setInterval(intervalValue);
        setCount(undefined);
    };

    const handleAddTime = () => {
        if (!date) {
            setDate(new Date());
        }
        setHasTimeSet(true);
        setTriggerType("time");
    };

    const handleRemoveTime = () => {
        setHasTimeSet(false);
        setTriggerType("manual");
    };

    return (
        <div className="space-y-6">
            {/* Trigger Type Tabs */}
            <Tabs value={triggerType} onValueChange={(value) => setTriggerType(value as typeof triggerType)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="manual">Manual</TabsTrigger>
                    <TabsTrigger value="time">Scheduled</TabsTrigger>
                    <TabsTrigger value="event">Event</TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4">
                    <div className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                            <Settings2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Workflow will run manually when triggered</p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="time" className="space-y-4">
                    {/* Date Selection */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="justify-start text-left font-normal hover:bg-gray-50"
                                    >
                                        {date ? format(date, "EEEE, MMMM d") : "Select date"}
                                        <ChevronDown className="h-4 w-4 ml-auto" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(selectedDate) => {
                                            setDate(selectedDate);
                                            setIsDatePickerOpen(false);
                                        }}
                                        captionLayout="dropdown"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time Addition */}
                        {!hasTimeSet && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleAddTime}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add time
                            </Button>
                        )}

                        {/* Time Display */}
                        {hasTimeSet && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <Input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-auto border-none p-0 h-auto text-sm bg-transparent"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleRemoveTime}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {hasTimeSet && (
                        <>
                            <Separator />

                            {/* Recurrence Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Repeat className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm font-medium">Repeat</span>
                                </div>

                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={frequency === RRule.DAILY ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => applyPreset(RRule.DAILY, 1)}
                                        className="h-8"
                                    >
                                        Daily
                                    </Button>
                                    <Button
                                        variant={frequency === RRule.WEEKLY ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => applyPreset(RRule.WEEKLY, 1)}
                                        className="h-8"
                                    >
                                        Weekly
                                    </Button>
                                    <Button
                                        variant={frequency === RRule.MONTHLY ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => applyPreset(RRule.MONTHLY, 1)}
                                        className="h-8"
                                    >
                                        Monthly
                                    </Button>
                                </div>

                                {/* Custom Recurrence */}
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-600">Every</span>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={interval}
                                        onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                                        className="w-16 h-8 text-center"
                                    />
                                    <Select value={frequency.toString()} onValueChange={(value) => setFrequency(parseInt(value))}>
                                        <SelectTrigger className="w-auto h-8 border-none bg-transparent">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={RRule.MINUTELY.toString()}>minute(s)</SelectItem>
                                            <SelectItem value={RRule.HOURLY.toString()}>hour(s)</SelectItem>
                                            <SelectItem value={RRule.DAILY.toString()}>day(s)</SelectItem>
                                            <SelectItem value={RRule.WEEKLY.toString()}>week(s)</SelectItem>
                                            <SelectItem value={RRule.MONTHLY.toString()}>month(s)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Advanced Options */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="text-blue-600 hover:text-blue-700 h-8 p-0"
                                >
                                    {showAdvanced ? "Hide advanced" : "More options"}
                                </Button>

                                {showAdvanced && (
                                    <div className="space-y-3 border-l-2 border-blue-100 pl-4">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm text-gray-600 w-16">Ends:</Label>
                                            <Select
                                                value={count ? "count" : "never"}
                                                onValueChange={(value) => {
                                                    if (value === "never") setCount(undefined);
                                                    else setCount(10);
                                                }}
                                            >
                                                <SelectTrigger className="w-32 h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="never">Never</SelectItem>
                                                    <SelectItem value="count">After</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {count && (
                                                <>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={count}
                                                        onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                                        className="w-16 h-8 text-center"
                                                    />
                                                    <span className="text-sm text-gray-600">occurrences</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Rule Description */}
                                {rruleString && (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                        <div className="text-sm text-blue-800 font-medium mb-1">
                                            {getRuleDescription(rruleString)}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            Starting {date && format(date, "MMMM d, yyyy")} at {time}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="event" className="space-y-4">
                    <div className="text-center py-8">
                        <div className="text-gray-500 mb-4">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Event-based triggers coming soon</p>
                            <p className="text-xs text-gray-400 mt-1">Trigger workflows based on external events</p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
