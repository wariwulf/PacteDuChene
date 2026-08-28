"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  administrationNavigation,
  navigation,
  type NavigationItem,
} from "@/constants/navigation";

import { useAuth } from "@/contexts/AuthContext";

function isAdminRole(role?: string) {
  return ["ADMIN", "ADMINISTRATOR", "OWNER"].includes(
    String(role ?? "").toUpperCase()
  );
}

function canAccess(
  item: NavigationItem,
  authenticated: boolean,
  admin: boolean
) {
  if (item.access === "public") return true;
  if (item.access === "member") return authenticated;
  if (item.access === "admin") return admin;

  return false;
}

export default function GlobalNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const domainRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  const isAdmin = isAdminRole(user?.role);

  /*
   * Navigation publique
   */
  const publicNavigation = navigation.filter(
    (item) => item.access === "public"
  );

  /*
   * Navigation du domaine membre
   */
  const domainNavigation = navigation.filter(
    (item) => item.access === "member"
  );

  /*
   * Vérifie si une page est active.
   */
  const isActive = (item: NavigationItem) => {
    if (item.href === "/") {
      return pathname === "/";
    }

    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    );
  };

  /*
   * Le bouton "Mon domaine" doit être actif lorsqu'une
   * page membre est actuellement ouverte.
   */
  const isDomainActive = domainNavigation.some((item) =>
    isActive(item)
  );

  /*
   * Le bouton "Administration" doit être actif sur toutes
   * les pages d'administration.
   */
  const isAdministrationActive =
    pathname === "/administration" ||
    pathname.startsWith("/administration/");

  /*
   * Ferme tous les menus.
   */
  const closeMenus = () => {
    setMobileOpen(false);
    setDomainOpen(false);
    setAdminOpen(false);
  };

  /*
   * Déconnexion.
   */
  async function handleLogout() {
    try {
      await logout();
    } finally {
      closeMenus();
      router.replace("/connexion");
    }
  }

  /*
   * Ferme les dropdowns lorsque l'utilisateur clique
   * en dehors de ceux-ci ou appuie sur Échap.
   */
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        domainRef.current &&
        !domainRef.current.contains(target)
      ) {
        setDomainOpen(false);
      }

      if (
        adminRef.current &&
        !adminRef.current.contains(target)
      ) {
        setAdminOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDomainOpen(false);
        setAdminOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  /*
   * Ferme le menu mobile lors d'un changement de page.
   */
  useEffect(() => {
    setMobileOpen(false);
    setDomainOpen(false);
    setAdminOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08130d]/95 shadow-[0_8px_30px_rgba(0,0,0,.24)] backdrop-blur-xl">
      <nav
        aria-label="Navigation principale"
        className="mx-auto max-w-7xl px-3 sm:px-5 lg:px-6"
      >
        <div className="flex min-h-[68px] items-center justify-between gap-4">

          {/* ============================================================
              LOGO
          ============================================================ */}

          <Link
            href={isAuthenticated ? "/espace-membre" : "/"}
            onClick={closeMenus}
            className="group flex shrink-0 items-center gap-3"
            aria-label="Le Pacte du Chêne"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#c6a15b]/25 bg-[#23412f]/60 text-xl shadow-inner transition group-hover:border-[#c6a15b]/60 group-hover:bg-[#23412f]/90">
              🌳
            </span>

            <span className="hidden sm:block">
              <span className="block whitespace-nowrap text-[15px] font-bold uppercase tracking-[.08em] text-[#f5e8c8] transition group-hover:text-[#e2c98d] [font-family:var(--font-cinzel)]">
                Le Pacte du Chêne
              </span>

              <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[.22em] text-[#9eaa9f]">
                Héritiers du serment
              </span>
            </span>
          </Link>

          {/* ============================================================
              NAVIGATION DESKTOP
          ============================================================ */}

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">

            {/* ----------------------------------------------------------
                Navigation publique
            ---------------------------------------------------------- */}

            {publicNavigation.map((item) => {
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`
                    rounded-lg px-3 py-2 text-sm font-semibold
                    transition-all duration-200
                    ${
                      active
                        ? "bg-[#a77c36] text-[#fff8e8] shadow-[0_4px_16px_rgba(198,161,91,.16)]"
                        : "text-[#d7cfb4] hover:bg-white/[.06] hover:text-[#f5e8c8]"
                    }
                  `}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* ----------------------------------------------------------
                MON DOMAINE
            ---------------------------------------------------------- */}

            {isAuthenticated && (
              <div
                ref={domainRef}
                className="relative ml-1"
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={domainOpen}
                  onClick={() => {
                    setDomainOpen((value) => !value);
                    setAdminOpen(false);
                  }}
                  className={`
                    inline-flex items-center gap-2 rounded-lg
                    px-3 py-2 text-sm font-semibold
                    transition-all duration-200
                    ${
                      isDomainActive
                        ? "bg-[#a77c36] text-[#fff8e8] shadow-[0_4px_16px_rgba(198,161,91,.16)]"
                        : "text-[#d7cfb4] hover:bg-white/[.06] hover:text-[#f5e8c8]"
                    }
                  `}
                >
                  Mon domaine

                  <span
                    className={`
                      text-[10px] transition-transform duration-200
                      ${domainOpen ? "rotate-180" : ""}
                    `}
                  >
                    ▾
                  </span>
                </button>

                {domainOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-[#c6a15b]/25 bg-[#0b1711]/98 p-2 shadow-[0_18px_50px_rgba(0,0,0,.45)] backdrop-blur-xl"
                  >
                    <div className="px-3 pb-2 pt-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#c6a15b]">
                        Le domaine du Pacte
                      </p>

                      <p className="mt-1 text-xs text-[#9eaa9f]">
                        Votre espace au sein du Pacte
                      </p>
                    </div>

                    <div className="my-1 h-px bg-white/[.06]" />

                    {domainNavigation.map((item) => {
                      const active = isActive(item);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setDomainOpen(false)}
                          className={`
                            block rounded-xl px-3 py-2.5
                            text-sm font-medium
                            transition
                            ${
                              active
                                ? "bg-[#a77c36] text-[#fff8e8]"
                                : "text-[#d7cfb4] hover:bg-white/[.06] hover:text-[#f5e8c8]"
                            }
                          `}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------------
                ADMINISTRATION
            ---------------------------------------------------------- */}

            {isAdmin && (
              <div
                ref={adminRef}
                className="relative ml-1"
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={adminOpen}
                  onClick={() => {
                    setAdminOpen((value) => !value);
                    setDomainOpen(false);
                  }}
                  className={`
                    inline-flex items-center gap-2 rounded-lg
                    px-3 py-2 text-sm font-semibold
                    transition-all duration-200
                    ${
                      isAdministrationActive
                        ? "bg-[#a77c36] text-[#fff8e8]"
                        : "text-[#c6a15b] hover:bg-white/[.06] hover:text-[#e2c98d]"
                    }
                  `}
                >
                  Administration

                  <span
                    className={`
                      text-[10px] transition-transform duration-200
                      ${adminOpen ? "rotate-180" : ""}
                    `}
                  >
                    ▾
                  </span>
                </button>

                {adminOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-[#c6a15b]/25 bg-[#0b1711]/98 p-2 shadow-[0_18px_50px_rgba(0,0,0,.45)] backdrop-blur-xl"
                  >
                    <div className="px-3 pb-2 pt-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#c6a15b]">
                        Intendance du Pacte
                      </p>

                      <p className="mt-1 text-xs text-[#9eaa9f]">
                        Gestion et administration
                      </p>
                    </div>

                    <div className="my-1 h-px bg-white/[.06]" />

                    {administrationNavigation.map((item) => {
                      const active = isActive(item);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setAdminOpen(false)}
                          className={`
                            block rounded-xl px-3 py-2.5
                            text-sm font-medium
                            transition
                            ${
                              active
                                ? "bg-[#a77c36] text-[#fff8e8]"
                                : "text-[#d7cfb4] hover:bg-white/[.06] hover:text-[#f5e8c8]"
                            }
                          `}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================
              COMPTE
          ============================================================ */}

          <div className="flex shrink-0 items-center gap-2">

            {isLoading ? (
              <div className="hidden h-9 w-28 animate-pulse rounded-lg bg-white/[.06] sm:block" />
            ) : isAuthenticated ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="max-w-32 truncate text-sm font-semibold text-[#f5e8c8]">
                    {user?.username ?? "Membre"}
                  </p>

                  <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#c6a15b]">
                    {user?.role ?? "PLAYER"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden rounded-lg border border-[#7a2d2d]/60 bg-[#7a2d2d]/10 px-3 py-2 text-sm font-semibold text-[#e9a3a3] transition hover:bg-[#7a2d2d]/25 sm:block"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/connexion"
                className="rounded-lg border border-[#e2c98d]/35 bg-gradient-to-br from-[#a77c36] to-[#c6a15b] px-4 py-2.5 text-sm font-bold text-[#17130c] shadow-[0_5px_18px_rgba(198,161,91,.12)] transition hover:-translate-y-px hover:from-[#bd9148] hover:to-[#e2c98d]"
              >
                Connexion
              </Link>
            )}

            {/* ----------------------------------------------------------
                MOBILE
            ---------------------------------------------------------- */}

            <button
              type="button"
              aria-label={
                mobileOpen
                  ? "Fermer le menu"
                  : "Ouvrir le menu"
              }
              aria-expanded={mobileOpen}
              onClick={() => {
                setMobileOpen((value) => !value);
                setDomainOpen(false);
                setAdminOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[.03] text-lg text-[#f5e8c8] transition hover:border-[#c6a15b]/35 hover:bg-white/[.07] lg:hidden"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* ==============================================================
            MENU MOBILE
        ============================================================== */}

        {mobileOpen && (
          <div className="border-t border-white/[.07] pb-4 pt-3 lg:hidden">
            <div className="rounded-2xl border border-white/[.07] bg-[#0b1711]/80 p-2">

              {/* Navigation publique */}

              {publicNavigation.map((item) => {
                const active = isActive(item);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenus}
                    className={`
                      block rounded-xl px-3 py-3 text-sm font-semibold
                      transition
                      ${
                        active
                          ? "bg-[#a77c36] text-[#fff8e8]"
                          : "text-[#d7cfb4] hover:bg-white/[.06] hover:text-[#f5e8c8]"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Domaine */}

              {isAuthenticated && (
                <div className="mt-2 border-t border-white/[.07] pt-2">
                  <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#c6a15b]">
                    Mon domaine
                  </p>

                  {domainNavigation.map((item) => {
                    const active = isActive(item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenus}
                        className={`
                          block rounded-xl px-3 py-3
                          text-sm font-medium
                          transition
                          ${
                            active
                              ? "bg-[#a77c36] text-[#fff8e8]"
                              : "text-[#d7cfb4] hover:bg-white/[.06] hover:text-[#f5e8c8]"
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Administration */}

              {isAdmin && (
                <div className="mt-2 border-t border-white/[.07] pt-2">
                  <p className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[.22em] text-[#c6a15b]">
                    Administration
                  </p>

                  {administrationNavigation.map((item) => {
                    const active = isActive(item);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenus}
                        className={`
                          block rounded-xl px-3 py-3
                          text-sm font-medium
                          transition
                          ${
                            active
                              ? "bg-[#a77c36] text-[#fff8e8]"
                              : "text-[#d7cfb4] hover:bg-white/[.06] hover:text-[#f5e8c8]"
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Compte */}

              {isAuthenticated && (
                <div className="mt-2 border-t border-white/[.07] pt-2">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-[#f5e8c8]">
                      {user?.username ?? "Membre"}
                    </p>

                    <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[.2em] text-[#c6a15b]">
                      {user?.role ?? "PLAYER"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 block w-full rounded-xl border border-[#7a2d2d]/50 px-3 py-3 text-left text-sm font-semibold text-[#e9a3a3] transition hover:bg-[#7a2d2d]/20"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}