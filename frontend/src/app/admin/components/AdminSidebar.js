"use client";

import Link from "next/link";
import { LayoutDashboard, Users, BarChart3 } from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const nav = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Artists", href: "/admin/users/artists", icon: Users },
  { name: "Admins", href: "/admin/users/admins", icon: Users },
  { name: "Metrics", href: "/admin/metrics", icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card">
      <div className="p-6">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <p className="text-xs text-muted-foreground">
          System oversight
        </p>
      </div>

      <nav className="px-3 space-y-1">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
                active
                  ? "bg-muted font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
