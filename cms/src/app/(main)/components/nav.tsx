"use client";

import {
  BellDot,
  LogOut,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/components/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  return (
    <header className="sticky top-0 w-full h-14 backdrop-blur-md bg-canvas/80 border-b border-border flex items-center justify-between z-50 px-6 text-ink">
      {/* Left */}
      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center px-3 py-1.5 bg-surface border border-east-muted rounded-md focus-within:border-east transition-all">
          <Search size={16} className="text-muted" />
          <input
            type="search"
            placeholder="Search news..."
            className="bg-transparent outline-none px-2 text-sm placeholder-muted focus:placeholder-east-muted w-40 md:w-64 text-ink"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex h-full items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button
            className="p-2 rounded hover:bg-surface text-muted hover:text-ink transition-all"
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <button
            className="p-2 rounded hover:bg-surface text-muted hover:text-ink transition-all"
            aria-label="Notifications"
          >
            <BellDot size={20} />
          </button>
          <Link
            href="/settings"
            className="hidden md:block p-2 rounded hover:bg-surface text-muted hover:text-ink transition-all"
            aria-label="Settings"
          >
            <Settings size={20} />
          </Link>
        </div>

        {/* User Account Menu Trigger Wrapper */}
        <div ref={userMenuRef} className="h-full flex items-center gap-3 border-l border-border pl-6 relative">
          <button
            type="button"
            className="flex items-center gap-3 group focus:outline-none"
            onClick={() => setIsUserMenuOpen((v) => !v)}
          >
            <div className="h-8 w-8 rounded-full bg-east flex items-center justify-center text-canvas text-sm font-medium transition-colors group-hover:bg-east-hover">
              {user?.username?.charAt(0).toUpperCase() || "G"}
            </div>
            <div className="hidden md:flex flex-col items-start">
              <p className="text-sm font-medium text-ink">
                {user ? user.username : "Guest"}
              </p>
              <p className="text-xs text-muted">{user ? user.email : ""}</p>
            </div>
            <ChevronDown
              size={16}
              className={`text-muted transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
            />
          </button>
          
          <Dropdown
            isOpen={isUserMenuOpen}
            setIsUserMenuOpen={setIsUserMenuOpen}
            logout={logout}
            username={user?.username || "Guest"}
          />
        </div>
      </div>
    </header>
  );
}

const ChevronDown = ({ className, size }: { className?: string; size: number }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

interface DropdownProps {
  isOpen: boolean;
  setIsUserMenuOpen: (value: boolean) => void;
  logout: () => void;
  username: string;
}

function Dropdown({ isOpen, setIsUserMenuOpen, logout, username }: DropdownProps) {
  const router = useRouter();

  const handleLogout = () => {
    try {
      logout();
      localStorage.removeItem("auth");
      sessionStorage.removeItem("auth");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (_) {}
    router.replace("/login");
  };

  return (
    <div
      role="menu"
      className={`absolute top-[calc(100%-4px)] right-0 w-52 sm:w-60 p-2 bg-canvas/95 backdrop-blur-md border border-border rounded-xl shadow-xl z-50 max-h-[70vh] overflow-hidden transition-all duration-150 origin-top-right ${
        isOpen
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="px-2 py-1.5 text-xs text-muted">
        Signed in as <span className="font-semibold text-east">{username}</span>
      </div>
      <div className="my-1 h-px bg-border" />
      <Link
        href="/profile"
        className="block w-full text-sm text-ink hover:bg-east-light hover:text-east-dark transition-colors rounded-md px-2 py-2"
        role="menuitem"
        onClick={() => setIsUserMenuOpen(false)}
      >
        Profile
      </Link>
      <Link
        href="/settings"
        className="block w-full text-sm text-ink hover:bg-east-light hover:text-east-dark transition-colors rounded-md px-2 py-2"
        role="menuitem"
        onClick={() => setIsUserMenuOpen(false)}
      >
        Settings
      </Link>
      <div className="my-1 h-px bg-border" />
      <button
        type="button"
        onClick={handleLogout}
        className="w-full text-south flex items-center justify-center rounded-md px-2 py-2 font-medium hover:bg-south-light transition-colors focus:outline-none focus:ring-2 focus:ring-east-muted"
        aria-label="Logout"
      >
        <LogOut size={16} className="mr-2" /> Log out
      </button>
    </div>
  );
}