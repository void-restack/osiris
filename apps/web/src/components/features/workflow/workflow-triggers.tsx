import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    const [count, setCount] = useState<number | undefined>(undefined);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t);

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
        if (!date || !isValidTime(time)) return "";

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
        if (triggerType === "time" && hasTimeSet && date && isValidTime(time)) {
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
        } else if (triggerType === "manual") {
            if (onUpdate) onUpdate(null);
            setRruleString("");
        } else if (!isValidTime(time)) {
            setRruleString("");
            if (onUpdate) onUpdate(null);
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
            <div className="space-y-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="w-full justify-between">
                            {triggerType === "manual" && "Manual"}
                            {triggerType === "time" && "Scheduled"}
                            {triggerType === "event" && "Event"}
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
                        <DropdownMenuItem onClick={() => setTriggerType("manual")}>
                            Manual
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTriggerType("time")}>
                            Scheduled
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTriggerType("event")}>
                            Event
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {triggerType === "manual" && (
                    <div className="text-center py-8 border border-dashed border-primary-100 rounded-md p-2">
                        <div className="text-gray-500 mb-4">
                            <Settings2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Workflow will run manually when triggered</p>
                        </div>
                    </div>
                )}

                {triggerType === "time" && (
                    <div className="space-y-4">
                        {/* Date Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline2"
                                            className="justify-start w-full text-left font-normal hover:bg-gray-50"
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
                                            disabled={{ before: new Date() }}
                                            fromDate={new Date()}
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <>
                                    {!hasTimeSet && (
                                        <Button
                                            variant="outline2"
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
                                            <Input
                                                type="time"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-auto border p-1.5 h-auto text-sm"
                                            />
                                            <Button
                                                variant="outline2"
                                                size="sm"
                                                onClick={handleRemoveTime}
                                                className="size-8 p-1.5 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            </div>
                        </div>

                        {hasTimeSet && (
                            <>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-primary-400">Repeat</span>
                                        </div>
                                        <RadioGroup
                                            value={frequency.toString()}
                                            onValueChange={(value) => applyPreset(parseInt(value), 1)}
                                            className="flex flex-col gap-2 w-full bg-primary-25 rounded-md p-2"
                                        >
                                            <div className="flex items-center space-x-2 flex-1">
                                                <RadioGroupItem value={RRule.DAILY.toString()} id="daily" />
                                                <Label htmlFor="daily" className="text-sm font-normal cursor-pointer">
                                                    Daily
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 flex-1">
                                                <RadioGroupItem value={RRule.WEEKLY.toString()} id="weekly" />
                                                <Label htmlFor="weekly" className="text-sm font-normal cursor-pointer">
                                                    Weekly
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 flex-1">
                                                <RadioGroupItem value={RRule.MONTHLY.toString()} id="monthly" />
                                                <Label htmlFor="monthly" className="text-sm font-normal cursor-pointer">
                                                    Monthly
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <Separator className="h-0 border-t border-dashed bg-transparent" />

                                    {/* Custom Recurrence */}
                                    <div className="flex flex-col items-start gap-2 w-full text-sm">
                                        <span className="text-sm text-primary-400">Recurrence</span>
                                        <div className="flex items-center gap-2 w-full ">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={interval}
                                                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                                                className="w-16 h-9 text-center rounded-sm"
                                            />
                                            <Select value={frequency.toString()} onValueChange={(value) => setFrequency(parseInt(value))}>
                                                <SelectTrigger className="w-auto h-8 border rounded-sm">
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
                                    </div>

                                    {/* Advanced Options */}
                                    <Accordion type="single" collapsible className="w-full bg-primary-25 rounded-md p-2">
                                        <AccordionItem value="advanced" className="">
                                            <AccordionTrigger className="text-sm py-2 px-2 hover:no-underline text-primary-400">
                                                More options
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2 px-2">
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-sm text-gray-400 w-16">Ends:</Label>
                                                        <Select
                                                            value={count ? "count" : "never"}
                                                            onValueChange={(value) => {
                                                                if (value === "never") setCount(undefined);
                                                                else setCount(10);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-32 h-8 border rounded-sm">
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
                                                                    className="w-16 h-9 text-center rounded-sm"
                                                                />
                                                                <span className="text-sm text-gray-600">occurrences</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                    {/* Rule Description */}
                                    {rruleString && (
                                        <div className="border border-dashed border-primary-100 rounded-sm p-3">
                                            <div className="text-sm text-primary-600 font-medium mb-1">
                                                {getRuleDescription(rruleString).toString()}
                                            </div>
                                            <div className="text-xs text-primary-400">
                                                Starting {date && format(date, "MMMM d, yyyy")} at {time}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {triggerType === "event" && (
                    <div className="text-center py-8 border border-dashed border-primary-100 rounded-md p-2">
                        <div className="text-gray-500 mb-4">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Event-based triggers coming soon</p>
                            <p className="text-xs text-gray-400 mt-1">Trigger workflows based on external events</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
