"use client";

import { useState, useEffect, useContext, createContext } from "react";
import { fetchWithAuth } from "@/lib/supabase/browser";

type Settings = {
    display_currency_mode: "usd" | "npr" | "both";
    fx_mode: "stored_only" | "manual";
    fx_manual_rate_usd_npr: number | null;
    private_mode_default: boolean;
};

type SettingsContextType = {
    settings: Settings | null;
    loading: boolean;
    updateSettings: (updates: Partial<Settings>) => Promise<void>;
    refresh: () => void;
};

const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    loading: true,
    updateSettings: async () => { },
    refresh: () => { }
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = async () => {
        try {
            const res = await fetchWithAuth("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data.settings);
            }
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSettings = async (updates: Partial<Settings>) => {
        setSettings(prev => prev ? { ...prev, ...updates } : null);

        try {
            const res = await fetchWithAuth("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates)
            });
            if (!res.ok) throw new Error("Failed to save");
            const data = await res.json();
            setSettings(data.settings);
        } catch {
            fetchSettings();
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, updateSettings, refresh: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
