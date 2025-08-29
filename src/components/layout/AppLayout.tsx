import React, { useState } from "react";
import { Menu } from "lucide-react";
import { TopNav } from "./TopNav";
import { SideNav, NavItems } from "./SideNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <SideNav />
        
        {/* Mobile navigation */}
        <div className="md:hidden fixed bottom-4 left-4 z-40">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-full shadow-md">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[260px] p-0">
              <nav className="flex h-full flex-col p-4">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 