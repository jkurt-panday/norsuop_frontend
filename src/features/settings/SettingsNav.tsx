import { Link, useLocation } from "react-router";
import { User, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Profile", href: "/settings/profile", icon: User },
  { title: "Security", href: "/settings/security", icon: Shield },
  { title: "Appearance", href: "/settings/appearance", icon: Palette },
];

export function SettingsNav() {
  const location = useLocation();

  return (
    <nav className="flex flex-col space-y-1" aria-label="Settings navigation">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        return (
          <Button
            key={item.href}
            size="sm"
            variant={isActive ? "secondary" : "ghost"}
            render={<Link to={item.href} />}
            className={`w-full justify-start gap-2.5 font-medium ${
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Button>
        );
      })}
    </nav>
  );
}
