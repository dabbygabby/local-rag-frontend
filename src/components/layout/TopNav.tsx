import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white dark:bg-neutral-950">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="mr-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={195}
              height={52}
              priority
            />
          </Link>
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