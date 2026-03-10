"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type YearSwitcherProps = {
  years: number[];
  selectedYear: number;
  onSelect: (year: number) => void;
  onAddYear?: () => void;
  onDeleteYear?: (year: number) => void;
};

export function YearSwitcher({
  years,
  selectedYear,
  onSelect,
  onAddYear,
  onDeleteYear
}: YearSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {years.map((year) => (
        <div key={year} className="group relative">
          <button
            className={cn(
              "rounded-full border border-border px-4 py-2 text-sm transition",
              selectedYear === year
                ? "bg-accent text-accentForeground shadow-soft"
                : "bg-card text-mutedForeground hover:bg-muted"
            )}
            onClick={() => onSelect(year)}
            type="button"
          >
            {year}
          </button>
          {onDeleteYear ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteYear(year);
              }}
              className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-mutedForeground shadow-soft transition group-hover:flex group-hover:text-negative"
              aria-label={`Delete year ${year}`}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      ))}
      {onAddYear ? (
        <Button variant="outline" size="sm" onClick={onAddYear} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Year
        </Button>
      ) : null}
    </div>
  );
}
