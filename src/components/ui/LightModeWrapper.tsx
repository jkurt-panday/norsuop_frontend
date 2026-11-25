import type { ReactNode } from "react";

export function LightModeWrapper({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        colorScheme: "light",
        "--background": "#f4f6fc",
        "--page-background": "#eaf3ff",
        "--foreground": "#0f1e36",
        "--card": "#ffffff",
        "--card-foreground": "#0f1e36",
        "--popover": "#ffffff",
        "--popover-foreground": "#0f1e36",
        "--primary": "#0062cc",
        "--primary-foreground": "#ffffff",
        "--secondary": "#e2e8f0",
        "--secondary-foreground": "#0f1e36",
        "--muted": "#e2e8f0",
        "--muted-foreground": "#556378",
        "--accent": "#e2e8f0",
        "--accent-foreground": "#0f1e36",
        "--destructive": "#dc2626",
        "--destructive-foreground": "#ffffff",
        "--border": "#d5e0f2",
        "--input": "#d5e0f2",
        "--ring": "#0062cc",
        "--sidebar": "#f8fafc",
        "--sidebar-foreground": "#0f1e36",
        "--sidebar-primary": "#0062cc",
        "--sidebar-primary-foreground": "#ffffff",
        "--sidebar-accent": "#e2e8f0",
        "--sidebar-accent-foreground": "#0f1e36",
        "--sidebar-border": "#d5e0f2",
        "--sidebar-ring": "#0062cc",
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}