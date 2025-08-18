"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; 
  }

  const isDarkMode = theme === "dark";

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label htmlFor="dark-mode" className="text-base">
          Modo Escuro
        </Label>
        <p className="text-sm text-muted-foreground">
          Ative para uma experiência com cores mais escuras.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Sun className={`h-5 w-5 transition-colors ${!isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
        <Switch
          id="dark-mode"
          checked={isDarkMode}
          onCheckedChange={handleThemeChange}
          aria-label="Alternar modo escuro"
        />
        <Moon className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </div>
  );
}