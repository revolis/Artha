"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format, startOfYear, subDays, subMonths, subYears } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type DateRangePreset = "7d" | "30d" | "3m" | "6m" | "ytd" | "1y" | "custom";

interface DateRangePickerProps {
    date?: DateRange;
    onSelect: (range: DateRange | undefined, preset: DateRangePreset) => void;
    className?: string;
    defaultPreset?: DateRangePreset;
}

export function DateRangePicker({
    date,
    onSelect,
    className,
    defaultPreset = "30d"
}: DateRangePickerProps) {
    const [preset, setPreset] = React.useState<DateRangePreset>(defaultPreset);

    const handlePresetChange = (value: DateRangePreset) => {
        setPreset(value);
        const now = new Date();
        let from = new Date();
        let to = new Date();

        switch (value) {
            case "7d":
                from = subDays(now, 7);
                break;
            case "30d":
                from = subDays(now, 30);
                break;
            case "3m":
                from = subMonths(now, 3);
                break;
            case "6m":
                from = subMonths(now, 6);
                break;
            case "ytd":
                from = startOfYear(now);
                break;
            case "1y":
                from = subYears(now, 1);
                break;
            case "custom":
                return; // Don't change date on custom select initially
        }

        onSelect({ from, to }, value);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select value={preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
            </Select>

            {preset === "custom" && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[260px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(date.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={(range) => onSelect(range, "custom")}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
