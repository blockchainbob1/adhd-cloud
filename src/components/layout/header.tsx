"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { UserRole } from "@prisma/client";

interface HeaderProps {
  title?: string;
  role: UserRole;
  userName: string;
}

export function Header({ title, role, userName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar role={role} userName={userName} />
        </SheetContent>
      </Sheet>

      {title && (
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      )}
    </header>
  );
}
