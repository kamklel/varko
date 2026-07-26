"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/actions";
import { ThemeToggle } from "@/components/ThemeToggle";

const linkClass =
  "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100";

export function HeaderClient({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean;
  userName?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <nav className="hidden items-center gap-4 text-sm sm:flex">
          <Link href="/search" className={linkClass}>
            Find parking
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/host/listings" className={linkClass}>
                Host
              </Link>
              <Link href="/bookings" className={linkClass}>
                My bookings
              </Link>
              <span className="text-neutral-300 dark:text-neutral-700">|</span>
              <span className="text-neutral-500 dark:text-neutral-400">{userName}</span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-200/60 px-4 py-3 sm:hidden dark:border-neutral-800/60">
          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/search" className={linkClass} onClick={() => setMenuOpen(false)}>
              Find parking
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/host/listings" className={linkClass} onClick={() => setMenuOpen(false)}>
                  Host
                </Link>
                <Link href="/bookings" className={linkClass} onClick={() => setMenuOpen(false)}>
                  My bookings
                </Link>
                <div className="border-t border-neutral-200/60 pt-3 dark:border-neutral-800/60">
                  <p className="text-neutral-500 dark:text-neutral-400">{userName}</p>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="mt-2 text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-center text-white hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
