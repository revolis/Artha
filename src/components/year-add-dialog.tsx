"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { fetchWithAuth } from "@/lib/supabase/browser";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface YearAddDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onYearAdded: (year: number) => void;
}

export function YearAddDialog({
    open,
    onOpenChange,
    onYearAdded
}: YearAddDialogProps) {
    const [year, setYear] = React.useState<string>("");
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // set default year to next year
    React.useEffect(() => {
        if (open) {
            setYear(String(new Date().getFullYear() + 1));
            setError(null);
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseInt(year);

        if (isNaN(parsed) || parsed < 2000 || parsed > 3000) {
            setError("Please enter a valid year (2000-3000)");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetchWithAuth("/api/years", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year: parsed })
            });

            if (!res.ok) {
                throw new Error("Failed to create year");
            }

            onYearAdded(parsed);
            onOpenChange(false);
        } catch (err) {
            setError("Failed to create year. It might already exist.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Financial Year</DialogTitle>
                    <DialogDescription>
                        Create a new year to start tracking finances.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                            id="year"
                            type="number"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            placeholder="e.g. 2026"
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Year
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
