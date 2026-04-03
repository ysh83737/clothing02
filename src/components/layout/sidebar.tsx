"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  Users,
  ShoppingCart,
  ArrowLeftRight,
  LayoutDashboard,
  Menu,
  X,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    title: "仪表盘",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "库存管理",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "员工管理",
    href: "/employee",
    icon: Users,
  },
  {
    title: "出借管理",
    href: "/loan",
    icon: ShoppingCart,
  },
  {
    title: "归还销账",
    href: "/return",
    icon: ArrowLeftRight,
  },
  {
    title: "归还记录",
    href: "/return-record",
    icon: ArrowRightLeft,
  },
  {
    title: "丢失记录",
    href: "/lost-record",
    icon: AlertTriangle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-white border-r z-40
          transform transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <h1 className="text-xl font-bold text-primary">服装仓库</h1>
              <p className="text-sm text-muted-foreground">管理系统</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              v1.0.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
