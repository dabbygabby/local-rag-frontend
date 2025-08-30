import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white dark:bg-neutral-950">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          {/* Logo is now in the floating sidebar, keeping space for layout consistency */}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
      </div>
    </header>
  );
} 