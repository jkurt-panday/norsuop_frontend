import { Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SettingsNav } from "./SettingsNav";
import { useAppearance, type Appearance } from "../../hooks/use-appearance";

export function AppearancePage() {
  const { appearance, updateAppearance } = useAppearance();

  const themes: Array<{ value: Appearance; label: string; icon: typeof Sun; description: string }> = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Clean bright theme optimal for high ambient light.",
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Deep contrast dark mode reducing eye fatigue.",
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Automatically matches your operating system preferences.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {/* Page Header */}
      <div>
        <h1 className="font-['Poppins'] text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account profile, password credentials, and theme preferences.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col lg:flex-row lg:space-x-12">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-56 mb-6 lg:mb-0">
          <SettingsNav />
        </aside>

        {/* Content Section */}
        <div className="flex-1 max-w-xl">
          <Card className="rounded-2xl border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground">
                Appearance Preferences
              </CardTitle>
              <CardDescription>
                Customize how NORSU Order Payment System looks across your devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {themes.map(({ value, label, icon: Icon, description }) => {
                  const isSelected = appearance === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateAppearance(value)}
                      className={`flex flex-col items-center justify-between rounded-xl border p-4 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary"
                          : "border-border bg-card text-muted-foreground hover:border-border hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <div className="font-semibold text-sm text-foreground">{label}</div>
                      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                        {description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
