"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  administrationNavigation,
  navigation,
  type NavigationItem,
} from "@/constants/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

function isAdminRole(role?: string) {
  const normalizedRole = String(role ?? "").toUpperCase();

  return ["ADMIN", "ADMINISTRATOR", "OWNER"].includes(normalizedRole);
}

function canAccess(item: NavigationItem, authenticated: boolean, admin: boolean) {
  if (item.access === "public") return true;
  if (item.access === "member") return authenticated;
  if (item.access === "admin") return admin;

  return false;
}

function canAccessAdministrationItem(
  item: NavigationItem,
  user: { role?: string; permissions?: string[] } | null
) {
  if (!user) return false;

  if (isAdminRole(user.role)) return true;

  if (item.adminOnly) return false;

  return item.permission
    ? hasPermission(user, item.permission)
    : false;
}

export default function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const visibleAdministrationNavigation = administrationNavigation.filter((item) =>
    canAccessAdministrationItem(item, user)
  );

  const admin = visibleAdministrationNavigation.length > 0;

  const visibleNavigation = navigation.filter((item) =>
    canAccess(item, isAuthenticated, admin)
  );

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    setAdminOpen(false);
    router.replace("/connexion");
  }

  function isActive(item: NavigationItem) {
    if (item.href === "/") {
      return pathname === "/";
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function closeMenus() {
    setMobileOpen(false);
    setAdminOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1711]/95 shadow-lg backdrop-blur-md">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center gap-4 px-4 py-2 sm:px-6">
        {/* Gauche : emblème + nom du Pacte */}
        <Link
          href={isAuthenticated ? "/espace-membre" : "/"}
          onClick={closeMenus}
          className="flex min-w-0 flex-1 items-center text-[#f3e8c8]"
          aria-label="Le Pacte du Chêne"
        >
          <img
            src="/images/member/arbre-pacte.png"
            alt=""
            aria-hidden="true"
            className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          />
          <span className="ml-2 truncate text-base font-bold sm:text-lg">
            Le Pacte du Chêne
          </span>
        </Link>

        {/* Centre : navigation principale */}
        <div className="hidden min-w-0 flex-none items-center justify-center gap-1 lg:flex">
            {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive(item)
                  ? "bg-[#b86b00] text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {admin && (
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => setAdminOpen((value) => !value)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  pathname.startsWith("/administration")
                    ? "bg-[#b86b00] text-white"
                    : "text-amber-400 hover:bg-white/10"
                }`}
              >
                Administration ▾
              </button>

              {adminOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-green-800 bg-[#0b1711] p-2 shadow-2xl">
                  {visibleAdministrationNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAdminOpen(false)}
                      className={`block rounded-md px-3 py-2 text-sm transition ${
                        isActive(item)
                          ? "bg-[#b86b00] text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Droite : identité + déconnexion + menu mobile */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-4">
          {!isLoading && isAuthenticated ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">
                  {user?.username ?? "Membre"}
                </p>
                <p className="text-xs uppercase tracking-wider text-amber-500">
                  {user?.role ?? "PLAYER"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-md border border-red-900/50 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-900/30 hover:text-red-300 sm:block"
              >
                Déconnexion
              </button>
            </>
          ) : !isLoading ? (
            <Link
              href="/connexion"
              className="hidden rounded-md bg-[#b86b00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d17c00] sm:block"
            >
              Connexion
            </Link>
          ) : null}

          <button
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-md border border-white/10 px-3 py-2 text-xl text-gray-200 hover:bg-white/10 lg:hidden"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-white/5 px-4 pb-4 lg:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {visibleNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                className={`rounded-md px-3 py-3 text-sm font-medium transition ${
                  isActive(item)
                    ? "bg-[#b86b00] text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {admin && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  Administration
                </p>

                {visibleAdministrationNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenus}
                    className={`block rounded-md px-3 py-3 text-sm transition ${
                      isActive(item)
                        ? "bg-[#b86b00] text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-md border border-red-900/50 px-3 py-3 text-left text-sm font-medium text-red-400 hover:bg-red-900/30"
              >
                Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
