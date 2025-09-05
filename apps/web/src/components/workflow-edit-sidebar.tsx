import { X, Loader2, Clock, Calendar as CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/lib/store";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { RRule } from 'rrule';

export function WorkflowEditSidebar() {
    const {
        selectedWorkflow,
        closeWorkflowEditSidebar,
        isWorkflowEditSidebarOpen,
        updateSelectedWorkflow
    } = useAppStore();

    const [isPublic, setIsPublic] = useState(true);
    const [triggerType, setTriggerType] = useState("time");
    const [date, setDate] = useState<Date | undefined>();
    const [time, setTime] = useState("12:00");
    const [rruleString, setRruleString] = useState("");
    const [frequency, setFrequency] = useState<number>(RRule.DAILY);
    const [interval, setInterval] = useState(1);
    const [intervalInput, setIntervalInput] = useState("1");
    const [count, setCount] = useState<number | undefined>(undefined);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Initialize form data when workflow is selected
    useEffect(() => {
        if (selectedWorkflow) {
            setIsPublic(selectedWorkflow.isPublic);
            setTriggerType("time");

            if (selectedWorkflow.timeBasedTrigger) {
                const startDateTime = new Date(selectedWorkflow.timeBasedTrigger.startTime);
                setDate(startDateTime);
                setTime(startDateTime.toTimeString().slice(0, 5)); // HH:mm format
                setRruleString(selectedWorkflow.timeBasedTrigger.rrule);

                // Parse existing RRULE to extract frequency, interval, count
                try {
                    const rule = RRule.fromString(`DTSTART:${startDateTime.toISOString().replace(/[:\-]|\.\d{3}/g, '')}\n${selectedWorkflow.timeBasedTrigger.rrule}`);
                    setFrequency(rule.options.freq || RRule.DAILY);
                    const intervalValue = rule.options.interval || 1;
                    setInterval(intervalValue);
                    setIntervalInput(intervalValue.toString());
                    setCount(rule.options.count || undefined);
                } catch (error) {
                    console.error("Failed to parse RRULE:", error);
                    // Fall back to defaults
                    setFrequency(RRule.DAILY);
                    setInterval(1);
                    setIntervalInput("1");
                    setCount(undefined);
                }
            } else {
                // Default values
                setDate(new Date());
                setTime("12:00");
                setFrequency(RRule.DAILY);
                setInterval(1);
                setIntervalInput("1");
                setCount(undefined);
                setRruleString("RRULE:FREQ=DAILY;INTERVAL=1");
            }

            setHasChanges(false);
        }
    }, [selectedWorkflow]);

    // Generate RRULE string from current settings
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

    // Track changes
    useEffect(() => {
        if (selectedWorkflow) {
            const publicChanged = isPublic !== selectedWorkflow.isPublic;

            let timeChanged = false;
            if (selectedWorkflow.timeBasedTrigger && date) {
                const originalStart = new Date(selectedWorkflow.timeBasedTrigger.startTime);
                // Combine date and time into a new datetime
                const [hours, minutes] = time.split(':');
                const newDateTime = new Date(date);
                newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                const newRrule = generateRRule();
                timeChanged = originalStart.getTime() !== newDateTime.getTime() ||
                    newRrule !== selectedWorkflow.timeBasedTrigger.rrule;
            } else if (date) {
                timeChanged = true; // New trigger being added
            }

            setHasChanges(publicChanged || timeChanged);
        }
    }, [isPublic, time, date, frequency, interval, count, selectedWorkflow]);

    // Update RRULE string when settings change
    useEffect(() => {
        const newRrule = generateRRule();
        setRruleString(newRrule);
    }, [date, time, frequency, interval, count]);

    const getRuleDescription = (rruleStr: string) => {
        try {
            if (!rruleStr || !date) return "No recurrence";

            const [hours, minutes] = time.split(':');
            const startDateTime = new Date(date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const rule = RRule.fromString(`DTSTART:${startDateTime.toISOString().replace(/[:\-]|\.\d{3}/g, '')}\n${rruleStr}`);
            return rule.toText() || "Custom recurrence";
        } catch (error) {
            return "Invalid recurrence rule";
        }
    };

    const getNextOccurrences = (rruleStr: string, limit: number = 3) => {
        try {
            if (!rruleStr || !date) return [];

            const [hours, minutes] = time.split(':');
            const startDateTime = new Date(date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const rule = RRule.fromString(`DTSTART:${startDateTime.toISOString().replace(/[:\-]|\.\d{3}/g, '')}\n${rruleStr}`);
            const now = new Date();
            const nextOccurrences = rule.between(now, new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)), true); // Next year
            return nextOccurrences.slice(0, limit);
        } catch (error) {
            return [];
        }
    };

    const applyPreset = (freq: number, intervalValue: number = 1, countValue?: number) => {
        setFrequency(freq);
        setInterval(intervalValue);
        setIntervalInput(intervalValue.toString());
        setCount(countValue);
    };

    const handleSave = async () => {
        if (!selectedWorkflow || !hasChanges || !date) return;

        setIsLoading(true);
        try {
            // Combine date and time into a datetime
            const [hours, minutes] = time.split(':');
            const startDateTime = new Date(date);
            startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const updatedWorkflow = {
                ...selectedWorkflow,
                isPublic,
                timeBasedTrigger: {
                    rrule: generateRRule(),
                    startTime: startDateTime.toISOString(),
                }
            };

            // Here you would call your API to update the workflow
            // await updateWorkflowMutation.mutateAsync(updatedWorkflow);

            // For now, just update the store
            updateSelectedWorkflow(updatedWorkflow);
            setHasChanges(false);
            toast.success("Workflow updated successfully");
        } catch (error) {
            console.error("Failed to update workflow:", error);
            toast.error("Failed to update workflow");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isWorkflowEditSidebarOpen || !selectedWorkflow) {
        return null;
    }

    return (
        <div>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex flex-col">
                    <h2 className="text-lg font-medium text-gray-900">Workflow</h2>
                    <p className="text-sm text-gray-500">{selectedWorkflow.title}</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeWorkflowEditSidebar}
                    className="h-8 w-8 p-0"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto">
                {/* Privacy settings */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Privacy settings</h3>
                    <RadioGroup
                        value={isPublic ? "public" : "private"}
                        onValueChange={(value) => setIsPublic(value === "public")}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="public" id="public" />
                            <Label htmlFor="public" className="cursor-pointer">
                                Public
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="private" id="private" />
                            <Label htmlFor="private" className="cursor-pointer">
                                Private
                            </Label>
                        </div>
                    </RadioGroup>
                    <p className="text-xs text-gray-500">
                        {isPublic ? "Others can discover and use this workflow." : "Only you can access this workflow."}
                    </p>
                </div>

                <Separator />

                {/* Triggers */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Triggers</h3>

                    <Select value={triggerType} onValueChange={setTriggerType}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="time">Time based</SelectItem>
                        </SelectContent>
                    </Select>

                    {triggerType === "time" && (
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                            {/* Date and Time */}
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-3 flex-1">
                                    <Label htmlFor="date-picker" className="px-1">
                                        Start Date *
                                    </Label>
                                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                id="date-picker"
                                                className="justify-between font-normal"
                                            >
                                                {date ? format(date, "PPP") : "Select date"}
                                                <ChevronDownIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                captionLayout="dropdown"
                                                onSelect={(selectedDate) => {
                                                    setDate(selectedDate)
                                                    setIsDatePickerOpen(false)
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-3 flex-1">
                                    <Label htmlFor="time-picker" className="px-1">
                                        Time *
                                    </Label>
                                    <Input
                                        type="time"
                                        id="time-picker"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Quick Presets</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyPreset(RRule.DAILY, 1)}
                                        className="h-8"
                                    >
                                        Daily
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyPreset(RRule.WEEKLY, 1)}
                                        className="h-8"
                                    >
                                        Weekly
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyPreset(RRule.MONTHLY, 1)}
                                        className="h-8"
                                    >
                                        Monthly
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyPreset(RRule.HOURLY, 1)}
                                        className="h-8"
                                    >
                                        Hourly
                                    </Button>
                                </div>
                            </div>

                            {/* Custom Recurrence */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">Recurrence</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="h-6 text-xs"
                                    >
                                        {showAdvanced ? "Hide" : "Advanced"}
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Select value={frequency.toString()} onValueChange={(value) => setFrequency(parseInt(value))}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={RRule.MINUTELY.toString()}>Minutely</SelectItem>
                                                <SelectItem value={RRule.HOURLY.toString()}>Hourly</SelectItem>
                                                <SelectItem value={RRule.DAILY.toString()}>Daily</SelectItem>
                                                <SelectItem value={RRule.WEEKLY.toString()}>Weekly</SelectItem>
                                                <SelectItem value={RRule.MONTHLY.toString()}>Monthly</SelectItem>
                                                <SelectItem value={RRule.YEARLY.toString()}>Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-20">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={intervalInput}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setIntervalInput(value);

                                                // Update interval for RRULE generation
                                                const parsed = parseInt(value);
                                                if (!isNaN(parsed) && parsed >= 1) {
                                                    setInterval(parsed);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                // Ensure we have a valid value when field loses focus
                                                const value = e.target.value;
                                                const parsed = parseInt(value);
                                                if (isNaN(parsed) || parsed < 1) {
                                                    setInterval(1);
                                                    setIntervalInput("1");
                                                } else {
                                                    setInterval(parsed);
                                                    setIntervalInput(parsed.toString());
                                                }
                                            }}
                                            className="h-9"
                                            placeholder="1"
                                        />
                                    </div>
                                </div>

                                {showAdvanced && (
                                    <div className="space-y-3 pt-2 border-t border-gray-200">
                                        <div>
                                            <Label htmlFor="count-input" className="text-sm">
                                                Limit (optional)
                                            </Label>
                                            <Input
                                                id="count-input"
                                                type="number"
                                                min="1"
                                                value={count || ""}
                                                onChange={(e) => setCount(e.target.value ? parseInt(e.target.value) : undefined)}
                                                className="h-8 mt-1"
                                                placeholder="No limit"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Natural Language Description */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Description</Label>
                                <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded border">
                                    {getRuleDescription(rruleString)}
                                </div>
                            </div>

                            {/* Next Occurrences */}
                            {rruleString && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Next Runs</Label>
                                    <div className="text-xs text-gray-600 bg-white p-2 rounded border space-y-1">
                                        {getNextOccurrences(rruleString).map((occurrence, index) => (
                                            <div key={index} className="flex justify-between">
                                                <span>{format(occurrence, "PPP")}</span>
                                                <span>{format(occurrence, "p")}</span>
                                            </div>
                                        ))}
                                        {getNextOccurrences(rruleString).length === 0 && (
                                            <span className="text-gray-400">No upcoming runs</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Agents and MCPs */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Agents and MCPs</h3>

                    <div className="space-y-2">
                        {selectedWorkflow.workflow.map((step, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-gray-400">#</span>
                                <span>Agents {step.name}</span>
                            </div>
                        ))}

                        {selectedWorkflow.workflow.length === 0 && (
                            <p className="text-sm text-gray-500">No agents or MCPs configured</p>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isLoading || !date}
                        className="flex-1"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={closeWorkflowEditSidebar}
                        className="flex-1"
                    >
                        Close
                    </Button>
                </div>

                {hasChanges && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                            You have unsaved changes. Click "Save Changes" to apply them.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
