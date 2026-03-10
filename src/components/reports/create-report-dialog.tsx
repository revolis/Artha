"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";

import { fetchWithAuth } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type CreateReportDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReportCreated: () => void;
};

export function CreateReportDialog({
    open,
    onOpenChange,
    onReportCreated,
}: CreateReportDialogProps) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Form State
    const [startDate, setStartDate] = React.useState(
        format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd") // Jan 1st of current year
    );
    const [endDate, setEndDate] = React.useState(
        format(new Date(), "yyyy-MM-dd") // Today
    );
    const [type, setType] = React.useState("summary");
    const [formatType, setFormatType] = React.useState("csv"); // default CSV

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetchWithAuth("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    range_start: startDate,
                    range_end: endDate,
                    report_type: type,
                    export_format: formatType,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to generate report");
            }

            onReportCreated();
            onOpenChange(false);
            // Reset defaults? Maybe keep inputs for next one.
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Generate Report</DialogTitle>
                    <DialogDescription>
                        Create a new report for a specific period.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 text-sm p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Report Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="summary">Financial Summary</SelectItem>
                                <SelectItem value="tax_fee">Tax & Fees Detail</SelectItem>
                                <SelectItem value="performance">Performance Review</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Export Format</Label>
                        <div className="flex items-center gap-4">
                            <div
                                className={cn(
                                    "flex-1 border rounded-lg p-3 cursor-pointer transition-colors text-center text-sm font-medium",
                                    formatType === "csv"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-muted/50"
                                )}
                                onClick={() => setFormatType("csv")}
                            >
                                CSV
                            </div>
                            <div
                                className={cn(
                                    "flex-1 border rounded-lg p-3 cursor-pointer transition-colors text-center text-sm font-medium",
                                    formatType === "json"
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:bg-muted/50"
                                )}
                                onClick={() => setFormatType("json")}
                            >
                                JSON
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Generating..." : "Generate Report"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
