
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { WalletProvider } from "@/components/WalletProvider";

import {
  LayoutDashboard,
  Package,
  Building2,
  Truck,
  Link2,
  ChartColumn,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

import {
  isAuthenticated,
  getCurrentUser,
  logout,
} from "@/lib/auth";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
  },
  {
    name: "Warehouses",
    href: "/dashboard/warehouses",
    icon: Building2,
  },
  {
    name: "Distributions",
    href: "/dashboard/distributions",
    icon: Truck,
  },
  {
    name: "Blockchain Records",
    href: "/dashboard/blockchain",
    icon: Link2,
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: ChartColumn,
  },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const user = getCurrentUser();

    setCurrentUser(user);
    setAuthChecked(true);
  }, [router]);

  // Load saved theme
  useEffect(() => {
    const savedTheme =
      localStorage.getItem("relieftrack-theme");

    const isDark = savedTheme === "dark";

    setDarkMode(isDark);

    document.documentElement.classList.toggle(
      "dark",
      isDark
    );

    setThemeLoaded(true);
  }, []);

  // Toggle theme
  function toggleTheme() {
    const nextDarkMode = !darkMode;

    setDarkMode(nextDarkMode);

    document.documentElement.classList.toggle(
      "dark",
      nextDarkMode
    );

    localStorage.setItem(
      "relieftrack-theme",
      nextDarkMode ? "dark" : "light"
    );
  }

  // Logout
  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // Wait until authentication is checked
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-700 dark:border-slate-700 dark:border-t-blue-400" />

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <WalletProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col bg-blue-950 text-white md:flex">

          {/* Logo and Brand */}
          <div className="border-b border-blue-900 px-6 py-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-950">
                <ShieldCheck
                  size={26}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  ReliefTrack
                </h1>

                <p className="text-xs text-blue-200">
                  Disaster Relief Management
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-6">

            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-blue-300">
              Main Menu
            </p>

            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-blue-800 font-semibold text-white shadow-sm"
                      : "text-blue-100 hover:bg-blue-900 hover:text-white"
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-blue-900 p-5">
            <p className="text-sm font-medium">
              ReliefTrack Prototype
            </p>

            <p className="mt-1 text-xs text-blue-300">
              Blockchain-Based Relief Distribution
            </p>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 md:px-8">

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Disaster Relief Management System
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                ReliefTrack
              </h2>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-3">

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                disabled={!themeLoaded}
                aria-label={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={
                  darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-yellow-300 dark:hover:bg-slate-700"
              >
                {darkMode ? (
                  <Sun
                    size={20}
                    strokeWidth={1.8}
                  />
                ) : (
                  <Moon
                    size={20}
                    strokeWidth={1.8}
                  />
                )}
              </button>

              {/* Administrator Profile */}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {currentUser?.username ||
                    "Administrator"}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser?.role ||
                    "System Admin"}
                </p>
              </div>

              {/* Profile Icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                A
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <LogOut
                  size={18}
                  strokeWidth={1.8}
                />

                <span className="hidden sm:inline">
                  Logout
                </span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-5 transition-colors duration-300 dark:bg-slate-950 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </WalletProvider>
  );
}

