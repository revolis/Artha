"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    gapi?: {
      load: (api: string, callback: () => void) => void;
    };
    google?: {
      picker: {
        Action: { PICKED: string; CANCEL: string };
        ViewId: { DOCS: string };
        DocsUploadView: new () => { setIncludeFolders: (include: boolean) => void };
        PickerBuilder: new () => {
          setOAuthToken: (token: string) => any;
          setDeveloperKey: (key: string) => any;
          setAppId: (id: string) => any;
          setOrigin: (origin: string) => any;
          addView: (view: any) => any;
          setCallback: (cb: (data: any) => void) => any;
          build: () => { setVisible: (visible: boolean) => void };
        };
      };
    };
  }
}

type DrivePickerProps = {
  entryId: string;
  onAttached: (attachments: any[]) => void;
  onError: (message: string) => void;
};

function loadGapiScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.gapi && window.google?.picker) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google="api"]'
    );
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google API")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.dataset.google = "api";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google API"));
    document.body.appendChild(script);
  });
}

export function DrivePicker({ entryId, onAttached, onError }: DrivePickerProps) {
  const [loading, setLoading] = React.useState(false);

  const openPicker = async () => {
    setLoading(true);

    try {
      await loadGapiScript();

      const tokenResponse = await fetch("/api/drive/picker-token", { cache: "no-store" });
      if (!tokenResponse.ok) {
        const payload = await tokenResponse.json().catch(() => ({}));
        throw new Error(payload.error || "Drive not connected");
      }
      const { access_token } = await tokenResponse.json();
      if (!access_token) {
        throw new Error("Missing Drive access token");
      }

      const developerKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
      const appId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID;
      if (!developerKey) {
        throw new Error("Missing Google Drive API key");
      }

      await new Promise<void>((resolve) => {
        window.gapi?.load("picker", () => resolve());
      });

      const view = new window.google!.picker.DocsUploadView();
      view.setIncludeFolders(true);

      const picker = new window.google!.picker.PickerBuilder()
        .setOAuthToken(access_token)
        .setDeveloperKey(developerKey)
        .setOrigin(window.location.origin)
        .setAppId(appId || "")
        .addView(window.google!.picker.ViewId.DOCS)
        .addView(view)
        .setCallback(async (data: any) => {
          if (data.action === window.google!.picker.Action.PICKED) {
            try {
              const files = data.docs ?? [];
              if (files.length === 0) return;

              const attachResponse = await fetch("/api/drive/attach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entry_id: entryId, files })
              });

              if (!attachResponse.ok) {
                const payload = await attachResponse.json().catch(() => ({}));
                throw new Error(payload.error || "Failed to attach files");
              }

              const payload = await attachResponse.json();
              onAttached(payload.attachments ?? []);
            } catch (err) {
              onError(err instanceof Error ? err.message : "Failed to attach files");
            }
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to open picker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={openPicker} disabled={loading}>
      {loading ? "Opening Picker..." : "Pick from Google Drive"}
    </Button>
  );
}
