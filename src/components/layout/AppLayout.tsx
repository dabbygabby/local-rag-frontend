import React, { useState, useEffect, useRef } from "react";
import { NavItems } from "./SideNav";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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
        <AnimatePresence mode="wait" initial={false}>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full shadow-lg bg-white dark:bg-neutral-950 border-2 h-12 w-12"
              >
                <Image
                  src="/logo-icon.png"
                  alt="Menu"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-neutral-950 border shadow-2xl rounded-r-2xl z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo in sidebar */}
          <Link href="/" className="flex justify-start items-center mb-4 p-2">
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
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main content - full width */}
      <main className="flex-1 overflow-y-auto w-full px-20 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
