"use client";

import * as React from "react";

import { usePrivateMode } from "@/components/private-mode-provider";

type MaskedValueProps = {
  value: string;
  className?: string;
};

export function MaskedValue({ value, className }: MaskedValueProps) {
  const { enabled } = usePrivateMode();

  if (enabled) {
    return (
      <span className={className} aria-label="Private value">
        ••••
      </span>
    );
  }

  return <span className={className}>{value}</span>;
}
