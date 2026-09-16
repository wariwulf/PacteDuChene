"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  administrationNavigation,
  navigation,
  type NavigationItem,
} from "@/constants/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import { getCurrentMember } from "@/services/members.service";

function isAdminRole(role?: string) {
  const normalizedRole = String(role ?? "").toUpperCase();

  return ["ADMIN", "ADMINISTRATOR", "OWNER"].includes(normalizedRole);
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

  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
  } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<
    "pacte" | "activities" | "economy" | null
  >(null);

  /*
   * ---------------------------------------------------------------
   * AVATAR DU MEMBRE
   * ---------------------------------------------------------------
   *
   * L'interface MemberProfile actuelle ne déclare pas "avatar",
   * alors que l'API peut déjà le retourner.
   *
   * On le récupère depuis /members/me sans modifier le contrat
   * existant de members.service.ts.
   */
  const [memberAvatar, setMemberAvatar] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMemberAvatar() {
      if (!isAuthenticated || !user) {
        setMemberAvatar(null);
        return;
      }

      try {
        const member = await getCurrentMember();

        if (cancelled) return;

        /*
         * Le backend retourne le portrait dans profile.avatar,
         * mais ce champ n'est pas encore présent dans l'interface
         * TypeScript MemberProfile.
         */
        const profileWithAvatar = member.profile as typeof member.profile & {
          avatar?: string | null;
        };

        setMemberAvatar(profileWithAvatar.avatar || null);
      } catch (error) {
        if (cancelled) return;

        console.warn(
          "Impossible de récupérer le portrait du membre :",
          error
        );

        setMemberAvatar(null);
      }
    }

    loadMemberAvatar();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const visibleAdministrationNavigation =
    administrationNavigation.filter((item) =>
      canAccessAdministrationItem(item, user)
    );

  const admin = visibleAdministrationNavigation.length > 0;

  const visibleNavigation = navigation.filter((item) =>
    canAccess(item, isAuthenticated, admin)
  );

  // Navigation regroupée pour garder la barre principale légère.
  // Les éléments eux-mêmes viennent toujours de constants/navigation.
  const publicNavigation = visibleNavigation.filter(
    (item) => item.access === "public"
  );

  const pacteNavigation = visibleNavigation.filter((item) =>
    ["/clan", "/factions", "/espace-membre/personnage"].includes(item.href)
  );

  const activitiesNavigation = visibleNavigation.filter((item) =>
    [
      "/espace-membre/quetes",
      "/espace-membre/exploits",
      "/espace-membre/evenements",
    ].includes(item.href)
  );

  const economyNavigation = visibleNavigation.filter((item) =>
    [
      "/espace-membre/inventaire",
      "/boutiques",
      "/espace-membre/commandes",
    ].includes(item.href)
  );

  function isGroupActive(items: NavigationItem[]) {
    return items.some((item) => isActive(item));
  }

  async function handleLogout() {
    await logout();

    setMobileOpen(false);
    setAdminOpen(false);
    setUserMenuOpen(false);
    setOpenMenu(null);
    setMemberAvatar(null);

    router.replace("/connexion");
  }

  function isActive(item: NavigationItem) {
    if (item.href === "/") {
      return pathname === "/";
    }

    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    );
  }

  function closeMenus() {
    setMobileOpen(false);
    setAdminOpen(false);
    setUserMenuOpen(false);
    setOpenMenu(null);
  }

  const username = user?.username ?? "Membre";
  const role = user?.role ?? "PLAYER";
  const userInitial = username.charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1711]/95 shadow-lg backdrop-blur-md">
      <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center gap-4 px-4 py-2 sm:px-6">

        {/* =========================================================
            GAUCHE : EMBLÈME + NOM DU PACTE
        ========================================================= */}

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

        {/* =========================================================
            CENTRE : NAVIGATION PRINCIPALE
        ========================================================= */}

        <div className="hidden min-w-0 flex-none items-center justify-center gap-1 lg:flex">

          {/* Navigation publique : toujours visible */}
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenus}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive(item)
                  ? "bg-[#b86b00] text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Le Pacte */}
          {pacteNavigation.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu((value) =>
                    value === "pacte" ? null : "pacte"
                  );
                  setAdminOpen(false);
                  setUserMenuOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={openMenu === "pacte"}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isGroupActive(pacteNavigation)
                    ? "bg-[#b86b00] text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                Le Pacte
                <span className="ml-1 text-xs">
                  {openMenu === "pacte" ? "▲" : "▼"}
                </span>
              </button>

              {openMenu === "pacte" && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-green-800 bg-[#0b1711] p-2 shadow-2xl shadow-black/40">
                  {pacteNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className={`block rounded-md px-3 py-2.5 text-sm transition ${
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

          {/* Activités */}
          {activitiesNavigation.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu((value) =>
                    value === "activities" ? null : "activities"
                  );
                  setAdminOpen(false);
                  setUserMenuOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={openMenu === "activities"}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isGroupActive(activitiesNavigation)
                    ? "bg-[#b86b00] text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                Activités
                <span className="ml-1 text-xs">
                  {openMenu === "activities" ? "▲" : "▼"}
                </span>
              </button>

              {openMenu === "activities" && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-green-800 bg-[#0b1711] p-2 shadow-2xl shadow-black/40">
                  {activitiesNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className={`block rounded-md px-3 py-2.5 text-sm transition ${
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

          {/* Économie */}
          {economyNavigation.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setOpenMenu((value) =>
                    value === "economy" ? null : "economy"
                  );
                  setAdminOpen(false);
                  setUserMenuOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={openMenu === "economy"}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isGroupActive(economyNavigation)
                    ? "bg-[#b86b00] text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                Économie
                <span className="ml-1 text-xs">
                  {openMenu === "economy" ? "▲" : "▼"}
                </span>
              </button>

              {openMenu === "economy" && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-green-800 bg-[#0b1711] p-2 shadow-2xl shadow-black/40">
                  {economyNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className={`block rounded-md px-3 py-2.5 text-sm transition ${
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

          {/* Administration */}
          {admin && (
            <div className="relative ml-1">
              <button
                type="button"
                onClick={() => {
                  setAdminOpen((value) => !value);
                  setUserMenuOpen(false);
                  setOpenMenu(null);
                }}
                aria-haspopup="menu"
                aria-expanded={adminOpen}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  pathname.startsWith("/administration")
                    ? "bg-[#b86b00] text-white"
                    : "text-amber-400 hover:bg-white/10"
                }`}
              >
                Administration
                <span className="ml-1 text-xs">
                  {adminOpen ? "▲" : "▼"}
                </span>
              </button>

              {adminOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-green-800 bg-[#0b1711] p-2 shadow-2xl shadow-black/40">
                  {visibleAdministrationNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
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

        {/* =========================================================
            DROITE : UTILISATEUR + MENU MOBILE
        ========================================================= */}

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">

          {!isLoading && isAuthenticated ? (
            <div className="relative">

              {/* =====================================================
                  BOUTON UTILISATEUR
              ===================================================== */}

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((value) => !value);
                  setAdminOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition ${
                  userMenuOpen
                    ? "border-amber-600 bg-white/10"
                    : "border-white/10 hover:border-amber-700/60 hover:bg-white/5"
                }`}
              >

                {/* -------------------------------------------------
                    AVATAR
                ------------------------------------------------- */}

                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-700/60 bg-[#071a11]">

                  {memberAvatar ? (
                    <img
                      src={memberAvatar}
                      alt={`Portrait de ${username}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-amber-300">
                      {userInitial}
                    </span>
                  )}

                </div>

                {/* -------------------------------------------------
                    NOM + RÔLE
                ------------------------------------------------- */}

                <div className="hidden min-w-0 text-left sm:block">
                  <p className="max-w-[120px] truncate text-sm font-semibold text-white">
                    {username}
                  </p>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-500">
                    {role}
                  </p>
                </div>

                {/* -------------------------------------------------
                    FLÈCHE
                ------------------------------------------------- */}

                <svg
                  className={`h-4 w-4 shrink-0 text-emerald-300 transition-transform ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01-.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>

              </button>

              {/* =====================================================
                  MENU UTILISATEUR
              ===================================================== */}

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-emerald-800 bg-[#071a11] shadow-2xl shadow-black/50"
                >

                  {/* -------------------------------------------------
                      EN-TÊTE
                  ------------------------------------------------- */}

                  <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-700/60 bg-[#0b2418]">

                      {memberAvatar ? (
                        <img
                          src={memberAvatar}
                          alt=""
                          aria-hidden="true"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-amber-300">
                          {userInitial}
                        </span>
                      )}

                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {username}
                      </p>

                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-500">
                        {role}
                      </p>
                    </div>

                  </div>

                  {/* -------------------------------------------------
                      ACTIONS DU COMPTE
                  ------------------------------------------------- */}

                  <div className="p-2">
                    <Link
                      href="/discord"
                      onClick={closeMenus}
                      role="menuitem"
                      className="block rounded-lg px-3 py-2.5 text-sm text-emerald-100 transition hover:bg-white/10 hover:text-white"
                    >
                      Discord
                    </Link>
                  </div>

                  {/* -------------------------------------------------
                      DÉCONNEXION
                  ------------------------------------------------- */}

                  <div className="border-t border-white/10 p-2">

                    <button
                      type="button"
                      onClick={handleLogout}
                      role="menuitem"
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-950/40 hover:text-red-300"
                    >
                      Déconnexion
                    </button>

                  </div>

                </div>
              )}
            </div>
          ) : !isLoading ? (
            <Link
              href="/connexion"
              className="hidden rounded-md bg-[#b86b00] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d17c00] sm:block"
            >
              Connexion
            </Link>
          ) : null}

          {/* =========================================================
              MENU MOBILE
          ========================================================= */}

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
              setAdminOpen(false);
              setUserMenuOpen(false);
              setOpenMenu(null);
            }}
            className="rounded-md border border-white/10 px-3 py-2 text-xl text-gray-200 transition hover:bg-white/10 lg:hidden"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>

        </div>
      </div>

      {/* ===========================================================
          MENU MOBILE
      =========================================================== */}

      {mobileOpen && (
        <div className="border-t border-white/5 px-4 pb-4 lg:hidden">

          <div className="flex flex-col gap-1 pt-2">

            {publicNavigation.map((item) => (
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

            {pacteNavigation.length > 0 && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  Le Pacte
                </p>
                {pacteNavigation.map((item) => (
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

            {activitiesNavigation.length > 0 && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  Activités
                </p>
                {activitiesNavigation.map((item) => (
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

            {economyNavigation.length > 0 && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-500">
                  Économie
                </p>
                {economyNavigation.map((item) => (
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

            {/* Administration mobile */}

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

            {/* Déconnexion mobile */}

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-md border border-red-900/50 px-3 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-red-900/30 hover:text-red-300"
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