"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export function ThemeAwareDashboardImage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder while mounting to prevent hydration mismatch
    return (
      <div className="w-full h-auto">
        <div className="w-full h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  // Use resolvedTheme to handle system theme preference
  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative overflow-hidden shadow-2xl border rounded-xl">
      <Image
        src={isDark ? "/screenshots/dashboard-dark.jpeg" : "/screenshots/dashboard-light.jpeg"}
        alt="SplitIt Dashboard - Expense Management"
        width={1000}
        height={1000}
        className="w-full h-auto aspect-video object-cover object-top rounded-xl"
        priority
      />
      <div className="absolute inset-0 bg-linear-to-t from-primary/5 to-transparent" />
    </div>
  );
}
