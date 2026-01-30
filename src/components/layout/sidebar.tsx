"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import {
  Calendar,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Settings,
  Users,
  Video,
  Clock,
  BarChart3,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItemsByRole: Record<UserRole, NavItem[]> = {
  PATIENT: [
    { href: "/patient", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/patient/book", label: "Book Appointment", icon: <Calendar className="h-5 w-5" /> },
    { href: "/patient/appointments", label: "My Appointments", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/patient/documents", label: "Documents", icon: <FileText className="h-5 w-5" /> },
    { href: "/patient/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ],
  DOCTOR: [
    { href: "/doctor", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/doctor/roster", label: "My Roster", icon: <Clock className="h-5 w-5" /> },
    { href: "/doctor/appointments", label: "Appointments", icon: <ClipboardList className="h-5 w-5" /> },
    { href: "/doctor/patients", label: "Patients", icon: <Users className="h-5 w-5" /> },
  ],
  RECEPTION: [
    { href: "/reception", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/reception/bookings", label: "Bookings", icon: <Calendar className="h-5 w-5" /> },
    { href: "/reception/patients", label: "Patients", icon: <Users className="h-5 w-5" /> },
  ],
  CLINIC_MANAGER: [
    { href: "/admin", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/admin/users", label: "Users", icon: <Users className="h-5 w-5" /> },
    { href: "/admin/doctors", label: "Doctors", icon: <Users className="h-5 w-5" /> },
    { href: "/admin/reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ],
};

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navItemsByRole[role] || [];

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">ADHD Clinic</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== `/${role.toLowerCase()}` &&
             item.href !== "/admin" &&
             pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium">
              {userName.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-gray-400 capitalize">
              {role.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-gray-800 mt-2"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
