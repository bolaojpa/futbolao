
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
        <div className="h-10 w-24 bg-muted rounded-md animate-pulse"></div>
      </div>
    );
  }

  const themes = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Laptop },
  ];

  return (
    <div className="flex items-center gap-2 rounded-lg border p-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-center gap-2",
            theme === value && "bg-accent text-accent-foreground"
          )}
          onClick={() => setTheme(value)}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
