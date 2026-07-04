"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import {
  Menu,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Newspaper,
  Group,
  HardDrive,
  Users,
} from "lucide-react";

export default function Panel() {
  const [panel, setPanel] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;

  const navGroups = [
    {
      label: "Articles",
      icon: <Newspaper size={18} />,
      links: [
        { name: "View", href: "/articles/view" },
        { name: "Write", href: "/articles/write" },
        { name: "Manage", href: "/articles/manage" },
        { name: "Analytics", href: "/articles/analytics" },
      ],
    },
    {
      label: "Categories",
      icon: <Group size={18} />,
      links: [
        { name: "Overview", href: "/categories" },
        { name: "Create", href: "/categories/new" },
      ],
    },
    {
      label: "Files",
      icon: <HardDrive size={18} />,
      links: [
        { name: "Library", href: "/files" },
        { name: "Upload", href: "/files/upload" },
      ],
    },
    {
      label: "Users",
      icon: <Users size={18} />,
      links: [
        { name: "Authorize", href: "/authorize-email" },
        { name: "Permissions", href: "/users/permissions" },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-canvas select-none">
      {/* --- ICON BAR --- */}
      <section className="w-16 h-full bg-canvas border-r border-border z-50 flex flex-col">
        {/* Synchronized Header Row */}
        <div className="h-14 flex items-center justify-center border-b border-border flex-shrink-0">
          <button
            onClick={() => setPanel((prev) => !prev)}
            className="p-2 rounded-md text-ink hover:bg-surface transition-colors"
            aria-label="Toggle Panel"
          >
            <Menu size={22} />
          </button>
        </div>
        
        {/* Navigation List Column */}
        <div className="flex flex-col space-y-2 p-3 overflow-y-auto overflow-x-hidden items-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/dashboard"
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
              isActive("/dashboard") ? "bg-east text-canvas" : "text-ink hover:bg-surface"
            }`}
            aria-label="Dashboard"
          >
            <LayoutDashboard size={18} />
          </Link>

          {navGroups.map((group) => {
            const isGroupOpen = openMenu === group.label;
            const isChildActive = group.links.some(l => isActive(l.href));

            return (
              <div key={group.label} className="flex flex-col space-y-2 items-center w-full">
                <Link
                  href={group.links[0].href}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                    isChildActive ? "bg-east text-canvas" : "text-ink hover:bg-surface"
                  }`}
                  aria-label={group.label}
                >
                  {group.icon}
                </Link>

                {/* Vertical spacer matching the dropdown layout to keep remaining icons in line */}
                {panel && isGroupOpen && (
                  <div className="my-1 flex flex-col space-y-1">
                    {group.links.map((link) => (
                      <div key={link.href} className="h-[28px] w-10" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* --- EXPANDABLE FLYOUT PANEL --- */}
      <div
        className={`h-full bg-canvas border-r border-border transition-all duration-300 ease-in-out z-40 flex flex-col ${
          panel ? "w-56 opacity-100" : "w-0 opacity-0 overflow-hidden border-r-0"
        }`}
      >
        {/* Synchronized Header Row */}
        <div className="h-14 flex items-center border-b border-border px-4 flex-shrink-0">
          <h1 className="text-sm font-bold text-ink tracking-wider uppercase">News App</h1>
        </div>

        {/* Navigation List Column */}
        <div className="flex flex-col space-y-2 p-3 overflow-y-auto">
          <Link
            href="/dashboard"
            className={`h-10 flex items-center space-x-3 px-3 rounded-lg font-medium text-sm transition-all flex-shrink-0 ${
              isActive("/dashboard")
                ? "bg-east text-canvas"
                : "text-ink hover:bg-east-light hover:text-east"
            }`}
          >
            <span>Dashboard</span>
          </Link>

          {navGroups.map((group) => {
            const isGroupOpen = openMenu === group.label;
            const isChildActive = group.links.some((link) => isActive(link.href));

            return (
              <div key={group.label} className="flex flex-col space-y-2">
                <button
                  onClick={() => setOpenMenu(isGroupOpen ? null : group.label)}
                  className={`h-10 w-full flex justify-between items-center px-3 rounded-lg font-medium text-sm transition-all flex-shrink-0 ${
                    isChildActive && !isGroupOpen
                      ? "bg-surface text-east font-semibold"
                      : "text-ink hover:bg-surface"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>{group.label}</span>
                  </div>
                  <span className="text-ink/50">
                    {isGroupOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {/* Dropdown Content */}
                {isGroupOpen && (
                  <div className="pr-9 pl-2 flex flex-col space-y-1 border-l-2 border-border ml-5 my-1">
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`h-[28px] flex items-center rounded-md text-xs font-medium transition-colors ${
                          isActive(link.href)
                            ? "bg-east text-canvas"
                            : "text-ink/70 hover:bg-surface hover:text-ink"
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 