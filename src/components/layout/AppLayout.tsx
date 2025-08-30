import React, { useState, useEffect, useRef } from "react";
import { NavItems } from "./SideNav";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Handle clicking outside to close sidebar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key to close sidebar
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);
  
  return (
    <div className="flex h-screen flex-col">
      {/* Logo icon toggle button - top right */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full shadow-lg bg-white dark:bg-neutral-950 border-2"
        >
          <Image
            src="/logo-icon.png"
            alt="Menu"
            width={20}
            height={20}
            className="object-contain"
          />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Floating sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-4 left-4 bottom-4 w-80 bg-white dark:bg-neutral-950 border shadow-2xl rounded-2xl z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo in sidebar */}
          <Link href="/" className="flex justify-start items-center mb-4">
            <Image
              src="/logo.png"
              alt="Logo"
              width={195}
              height={52}
              priority
              className="max-w-full h-auto"
            />
          </Link>
          
          {/* Navigation */}
          <nav className="flex-1">
            <NavItems />
          </nav>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Main content - full width */}
      <main className="flex-1 overflow-y-auto w-full">{children}</main>
    </div>
  );
} 