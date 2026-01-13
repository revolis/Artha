"use client";

import { useCurrency } from "@/lib/hooks/use-currency";
import { MaskedValue } from "@/components/masked-value";

type CurrencyDisplayProps = {
    value: number;
    className?: string; // styles for the text
    forceMode?: "usd" | "npr";
};

export function CurrencyDisplay({ value, className, forceMode }: CurrencyDisplayProps) {
    const { format } = useCurrency();
    const formatted = format(value, forceMode);

    return <MaskedValue value={formatted} className={className} />;
}
