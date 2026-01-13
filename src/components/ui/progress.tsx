import * as React from "react";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    />
  )
);
Progress.displayName = "Progress";

const ProgressIndicator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("h-full rounded-full bg-accent", className)}
    {...props}
  />
));
ProgressIndicator.displayName = "ProgressIndicator";

export { Progress, ProgressIndicator };
