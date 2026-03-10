"use client";

import { useSettings } from "@/lib/hooks/use-settings";

export function useCurrency() {
    const { settings } = useSettings();

    const format = (amountUSD: number, forceMode?: "usd" | "npr") => {
        if (!settings) return `$${amountUSD.toLocaleString()}`; // Fallback

        const mode = forceMode || settings.display_currency_mode;

        // 1. USD Mode
        if (mode === "usd") {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUSD);
        }

        // 2. NPR Mode (Convert)
        // Rate priority: Manual > 135 (fallback default)
        const rate = settings.fx_manual_rate_usd_npr || 135;
        const amountNPR = amountUSD * rate;

        if (mode === "npr") {
            return new Intl.NumberFormat('ne-NP', { style: 'currency', currency: 'NPR' }).format(amountNPR);
        }

        // 3. Both Mode
        if (mode === "both") {
            const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountUSD);
            const npr = new Intl.NumberFormat('ne-NP', { style: 'currency', currency: 'NPR' }).format(amountNPR);
            return `${usd} (${npr})`;
        }

        return `$${amountUSD.toLocaleString()}`;
    };

    return { format, settings };
}
