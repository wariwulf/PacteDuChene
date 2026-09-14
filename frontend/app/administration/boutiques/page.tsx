"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createShopItem,
  deleteShopItem,
  getAdminNotifications,
  getAdminPurchase,
  getAdminPurchases,
  getShops,
  markNotificationRead,
  type Shop,
  type ShopItem,
  type ShopPurchase,
  type Notification,
  updateShopItem,
  uploadShopItemImage,
} from "@/services/shops.service";
import { getPaxDeiItem, searchPaxDeiItems, type PaxDeiItem } from "@/services/paxdei.service";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const FIXED_SHOP_IDS = [
  "comptoir-des-racines",
  "forge-du-chene",
  "tresor-du-serment",
] as const;

const blank = {
  itemId: "",
  paxDeiItemId: "",
  name: "",
  imageUrl: "",
  description: "",
  externalUrl: "",
  tier: 1,
  price: 0,
  stock: 0,
  currencyId: "bronze",
  purchaseLimit: "",
  purchaseLimitWindowHours: "24",
};

function slugifyItemName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function generateItemId(name: string, shop?: Shop) {
  const base = slugifyItemName(name) || "article";
  const existing = new Set(shop?.items.map((current) => current.itemId) ?? []);

  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function mediaUrl(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function AdminBoutiquesContent() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selected, setSelected] = useState("");
  const [item, setItem] = useState<any>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [purchases, setPurchases] = useState<ShopPurchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paxDeiSearch, setPaxDeiSearch] = useState("");
  const [paxDeiResults, setPaxDeiResults] = useState<PaxDeiItem[]>([]);
  const [paxDeiSearching, setPaxDeiSearching] = useState(false);
  const searchParams = useSearchParams();

  async function load() {
    try {
      setError("");
      setShops(await getShops());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (searchParams.get("notifications") !== "1") return;

    setHistoryOpen(true);
    void (async () => {
      try {
        const [notificationData, purchaseData] = await Promise.all([
          getAdminNotifications(),
          getAdminPurchases(100),
        ]);
        setNotifications(notificationData.notifications);
        setPurchases(purchaseData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Impossible de charger le journal des achats.");
      }
    })();
  }, [searchParams]);

  function resetItemForm(shopId = selected) {
    const shop = shops.find((current) => current.shopId === shopId);

    setItem({
      ...blank,
      currencyId: shop?.currencyId ?? "bronze",
    });
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setLimitEnabled(false);
    setPaxDeiSearch("");
    setPaxDeiResults([]);
  }

  function selectShop(shop: Shop) {
    setSelected(shop.shopId);
    setItem({ ...blank, currencyId: shop.currencyId });
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setLimitEnabled(false);
    setPaxDeiSearch("");
    setPaxDeiResults([]);
    setError("");
    setMsg("");
  }

  function selectImage(file: File | undefined) {
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  async function searchPaxDeiCatalog() {
    const query = paxDeiSearch.trim();
    if (!query) {
      setPaxDeiResults([]);
      return;
    }

    try {
      setPaxDeiSearching(true);
      setError("");
      setPaxDeiResults(await searchPaxDeiItems(query, 20));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de rechercher les objets Pax Dei.");
    } finally {
      setPaxDeiSearching(false);
    }
  }

  async function selectPaxDeiItem(paxItem: PaxDeiItem) {
    setPaxDeiResults([]);
    setPaxDeiSearch(paxItem.name);
    setError("");

    // On applique immédiatement les données du catalogue afin que la sélection
    // reste utilisable même si la récupération de la page Gaming.Tools échoue.
    setItem((current: any) => ({
      ...current,
      paxDeiItemId: paxItem.itemId,
      itemId: paxItem.itemId,
      name: paxItem.name,
      imageUrl: paxItem.imageUrl ?? "",
      externalUrl: paxItem.externalUrl ?? "",
    }));
    setImageFile(null);
    setImagePreview(mediaUrl(paxItem.imageUrl));

    try {
      const detail = await getPaxDeiItem(paxItem.itemId);
      const metadata = detail.metadata ?? {};
      const description = typeof metadata.description === "string"
        ? metadata.description
        : "";
      const tier = Number(metadata.tier);

      setItem((current: any) => ({
        ...current,
        paxDeiItemId: detail.itemId,
        itemId: detail.itemId,
        name: detail.name || current.name,
        imageUrl: detail.imageUrl || current.imageUrl || "",
        externalUrl: detail.externalUrl || current.externalUrl || "",
        description: description || current.description || "",
        tier: tier >= 1 && tier <= 5 ? tier : current.tier,
      }));

      setImagePreview(mediaUrl(detail.imageUrl || paxItem.imageUrl));
    } catch (e) {
      // Les données de base sont déjà appliquées : on ne bloque pas la création
      // de l'article si Gaming.Tools est temporairement indisponible.
      console.warn("Impossible de récupérer les détails Pax Dei", e);
    }
  }

  async function removeItem(shopId: string, itemId: string, itemName: string) {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${itemName} » de cette boutique ?\n\nLes achats déjà réalisés resteront dans l'historique.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMsg("");
      await deleteShopItem(shopId, itemId);
      if (editing === itemId && selected === shopId) resetItemForm(shopId);
      setMsg(`L'article « ${itemName} » a été supprimé de la boutique.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de supprimer l'article.");
    }
  }

  async function openPurchase(purchaseId: string, notificationId?: string) {
    try {
      setError("");
      const detail = await getAdminPurchase(purchaseId);
      setSelectedPurchase(detail);
      if (notificationId) {
        await markNotificationRead(notificationId);
        setNotifications((current) =>
          current.filter((notification) => notification._id !== notificationId),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger le détail de l'achat.");
    }
  }

  async function openHistory() {
    try {
      setHistoryOpen(true);
      setError("");
      const [notificationData, purchaseData] = await Promise.all([
        getAdminNotifications(),
        getAdminPurchases(100),
      ]);
      setNotifications(notificationData.notifications);
      setPurchases(purchaseData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger le journal des achats.");
    }
  }

  async function saveItem(e: React.FormEvent) {
    e.preventDefault();

    if (!selected) {
      setError("Sélectionnez une boutique.");
      return;
    }

    if (!editing && !item.paxDeiItemId) {
      setError("Sélectionnez un objet Pax Dei avant de créer l'article.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMsg("");

      const currentShop = orderedShops.find(
        (shop) => shop.shopId === selected,
      );

      const data = {
        ...item,
        itemId: editing
          ? editing
          : item.paxDeiItemId || generateItemId(item.name, currentShop),
        paxDeiItemId: item.paxDeiItemId || undefined,
        price: Number(item.price),
        stock: Number(item.stock),
        tier: Number(item.tier),
        purchaseLimit:
          limitEnabled && item.purchaseLimit !== ""
            ? Number(item.purchaseLimit)
            : undefined,
        purchaseLimitWindowHours:
          limitEnabled && item.purchaseLimit !== ""
            ? Number(item.purchaseLimitWindowHours)
            : undefined,
      };

      let savedItem: ShopItem;

      if (editing) {
        const result = await updateShopItem(selected, editing, data);
        savedItem = result.item;
        setMsg("Article modifié.");
      } else {
        const result = await createShopItem(selected, data);
        savedItem = result.item;
        setMsg("Article créé.");
      }

      if (imageFile) {
        await uploadShopItemImage(selected, savedItem.itemId, imageFile);
        setMsg(editing ? "Article et image modifiés." : "Article et image ajoutés.");
      }

      resetItemForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setSaving(false);
    }
  }

  const orderedShops = FIXED_SHOP_IDS
    .map((id) => shops.find((shop) => shop.shopId === id))
    .filter(Boolean) as Shop[];

  const selectedShop = orderedShops.find(
    (shop) => shop.shopId === selected,
  );

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[.3em] text-amber-400">
            Administration
          </p>
          <h1 className="mt-2 text-4xl font-bold">Gestion des boutiques</h1>
          <p className="mt-3 max-w-3xl text-green-200">
            Les trois comptoirs du Pacte sont fixes. Vous pouvez uniquement
            gérer leurs articles, leurs images, leurs stocks et leurs limites
            d'achat.
          </p>
        </header>

        {error && (
          <div className="mb-5 rounded-lg bg-red-950 p-4 text-red-200">
            {error}
          </div>
        )}

        {msg && (
          <div className="mb-5 rounded-lg bg-green-900 p-4 text-green-200">
            {msg}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-amber-700/40 bg-[#0b2116]/90 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Journal du comptoir</p>
              <h2 className="mt-2 text-2xl font-bold">Achats et notifications</h2>
              <p className="mt-2 text-sm text-green-300">
                Consultez les commandes récentes et ouvrez une notification pour voir le membre, l'article, la quantité et le montant payé.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void openHistory()}
              className="rounded-lg border border-amber-700/50 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-900/20"
            >
              {historyOpen ? "Actualiser le journal" : "Ouvrir le journal"}
            </button>
          </div>

          {historyOpen && (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.15fr]">
              <div className="rounded-xl border border-green-800 bg-green-950/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-green-100">Notifications</h3>
                  <span className="text-xs text-green-500">{notifications.length} notification(s)</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-green-800 p-4 text-sm text-green-500">Aucune notification.</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification._id}
                        type="button"
                        onClick={() => notification.purchaseId && void openPurchase(notification.purchaseId, notification._id)}
                        className={`w-full rounded-lg border p-3 text-left transition ${notification.readBy?.length ? "border-green-900 bg-green-950/40" : "border-amber-700/50 bg-amber-950/20 hover:bg-amber-950/30"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <strong className="text-green-100">🛒 {notification.title}</strong>
                          <span className="text-xs text-green-500">{new Date(notification.createdAt).toLocaleString("fr-FR")}</span>
                        </div>
                        <p className="mt-1 text-sm text-green-300">{notification.message}</p>
                        <p className="mt-2 text-xs text-amber-400">{notification.readBy?.length ? "Lue — ouvrir le détail" : "Nouvelle — ouvrir le détail"}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-green-800 bg-green-950/60 p-4">
                <h3 className="font-semibold text-green-100">Historique des achats</h3>
                <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                  {purchases.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-green-800 p-4 text-sm text-green-500">Aucun achat enregistré.</p>
                  ) : purchases.map((purchase) => (
                    <button
                      key={purchase._id}
                      type="button"
                      onClick={() => void openPurchase(purchase._id)}
                      className="w-full rounded-lg border border-green-900 bg-green-950/70 p-3 text-left hover:border-amber-700/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-green-100">{purchase.itemName}</p>
                          <p className="text-sm text-green-400">{purchase.quantity} unité{purchase.quantity > 1 ? "s" : ""} · {purchase.shopId}</p>
                        </div>
                        <strong className="text-amber-300">{purchase.totalPrice} {purchase.currencyId}</strong>
                      </div>
                      <p className="mt-1 text-xs text-green-600">{new Date(purchase.createdAt).toLocaleString("fr-FR")}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedPurchase && (
            <div className="mt-5 rounded-xl border border-amber-700/50 bg-amber-950/15 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[.2em] text-amber-400">Détail de la commande</p>
                  <h3 className="mt-1 text-xl font-bold text-green-100">{selectedPurchase.purchase.itemName}</h3>
                </div>
                <button type="button" onClick={() => setSelectedPurchase(null)} className="text-sm text-green-400 hover:text-green-200">Fermer</button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div><p className="text-xs uppercase text-green-600">Membre</p><p className="mt-1 font-semibold text-green-100">{selectedPurchase.user?.username ?? selectedPurchase.purchase.userId}</p></div>
                <div><p className="text-xs uppercase text-green-600">Boutique</p><p className="mt-1 font-semibold text-green-100">{selectedPurchase.shop?.name ?? selectedPurchase.purchase.shopId}</p></div>
                <div><p className="text-xs uppercase text-green-600">Quantité</p><p className="mt-1 font-semibold text-green-100">{selectedPurchase.purchase.quantity}</p></div>
                <div><p className="text-xs uppercase text-green-600">Montant</p><p className="mt-1 font-semibold text-amber-300">{selectedPurchase.purchase.totalPrice} {selectedPurchase.purchase.currencyId}</p></div>
              </div>
              <p className="mt-4 text-xs text-green-600">Achat effectué le {new Date(selectedPurchase.purchase.createdAt).toLocaleString("fr-FR")}. ID : {selectedPurchase.purchase._id}</p>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-green-800 bg-green-900/60 p-6">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">
            Les trois comptoirs
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {orderedShops.map((shop) => (
              <button
                key={shop.shopId}
                type="button"
                onClick={() => selectShop(shop)}
                className={`rounded-xl border p-5 text-left transition ${
                  selected === shop.shopId
                    ? "border-amber-500 bg-green-950"
                    : "border-green-800 bg-green-950/50 hover:border-amber-700"
                }`}
              >
                <p className="text-xs uppercase tracking-wider text-amber-400">
                  {shop.currencyId}
                </p>
                <h2 className="mt-2 text-xl font-bold">{shop.name}</h2>
                <p className="mt-3 text-sm leading-6 text-green-300">
                  {shop.description}
                </p>
                <p className="mt-4 text-xs text-green-500">
                  {shop.items.length} article
                  {shop.items.length > 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-green-800 bg-green-900/60 p-6">
          <h2 className="text-2xl font-bold">
            {editing ? "Modifier l'article" : "Ajouter un article"}
          </h2>

          <p className="mt-2 text-sm text-green-300">
            {selectedShop
              ? `Boutique sélectionnée : ${selectedShop.name}`
              : "Choisissez d'abord l'une des trois boutiques."}
          </p>

          <form onSubmit={saveItem} className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2 rounded-xl border border-amber-700/50 bg-green-950/70 p-4">
              <label className="block text-sm font-semibold text-amber-300">
                Boutique
              </label>
              <select
                value={selected}
                onChange={(e) => {
                  const shop = orderedShops.find(
                    (current) => current.shopId === e.target.value,
                  );
                  if (shop) selectShop(shop);
                }}
                disabled={saving}
                className="mt-2 w-full rounded-lg bg-green-950 p-3"
              >
                <option value="">Choisir une boutique...</option>
                {orderedShops.map((shop) => (
                  <option key={shop.shopId} value={shop.shopId}>
                    {shop.name} — {shop.currencyId === "bronze"
                      ? "Bronze"
                      : shop.currencyId === "argent"
                        ? "Argent"
                        : "Solidus"}
                  </option>
                ))}
              </select>
              {selectedShop ? (
                <div className="mt-3 rounded-lg border border-green-800 bg-green-900/40 p-3">
                  <p className="text-sm font-semibold text-green-100">
                    {selectedShop.name}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-green-300">
                    {selectedShop.description}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    Prix en {selectedShop.currencyId === "bronze"
                      ? "Bronze"
                      : selectedShop.currencyId === "argent"
                        ? "Argent"
                        : "Solidus"}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-green-500">
                  La boutique détermine automatiquement la monnaie utilisée pour le prix de l'article.
                </p>
              )}
            </div>

            <div className="md:col-span-2 rounded-lg border border-amber-700/50 bg-green-950/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-300">Objet Pax Dei</p>
                  <p className="mt-1 text-xs leading-5 text-green-400">
                    Recherchez un objet dans le catalogue synchronisé depuis Gaming.Tools. Son identifiant, son nom et son image seront repris automatiquement.
                  </p>
                </div>
                {item.paxDeiItemId && (
                  <span className="rounded bg-green-900 px-2 py-1 font-mono text-xs text-amber-300">
                    {item.paxDeiItemId}
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={paxDeiSearch}
                  onChange={(e) => setPaxDeiSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void searchPaxDeiCatalog(); } }}
                  placeholder="Rechercher : lingot, cuir, bois..."
                  disabled={saving || !!editing}
                  className="w-full rounded-lg bg-green-900 p-3"
                />
                <button
                  type="button"
                  onClick={() => void searchPaxDeiCatalog()}
                  disabled={saving || paxDeiSearching || !!editing}
                  className="rounded-lg bg-amber-600 px-4 py-2 font-semibold disabled:opacity-40"
                >
                  {paxDeiSearching ? "..." : "Rechercher"}
                </button>
              </div>

              {paxDeiResults.length > 0 && (
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {paxDeiResults.map((paxItem) => (
                    <button
                      key={paxItem.itemId}
                      type="button"
                      onClick={() => void selectPaxDeiItem(paxItem)}
                      className="flex w-full items-center gap-3 rounded-lg border border-green-800 bg-green-900/60 p-3 text-left hover:border-amber-600"
                    >
                      {paxItem.imageUrl ? (
                        <img src={mediaUrl(paxItem.imageUrl)} alt="" className="h-12 w-12 rounded object-contain bg-black/20" />
                      ) : (
                        <div className="h-12 w-12 rounded border border-green-800 bg-green-950" />
                      )}
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-green-100">{paxItem.name}</strong>
                        <span className="font-mono text-xs text-green-500">{paxItem.itemId}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {item.paxDeiItemId && (
                <div className="mt-3 rounded-lg border border-green-800 bg-green-900/40 p-3">
                  <p className="text-sm font-semibold text-green-100">{item.name}</p>
                  <p className="mt-1 text-xs text-green-400">Identifiant Pax Dei : <span className="font-mono">{item.paxDeiItemId}</span></p>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-green-800 bg-green-950/60 p-4">
              <p className="text-sm font-semibold text-green-200">
                Nom de l'article
              </p>
              <p className="mt-2 text-sm text-green-300">
                Ce nom est fourni par le catalogue Pax Dei. Il ne peut pas être modifié séparément pour un nouvel article.
              </p>
              <div className="mt-3 rounded-lg bg-green-900/50 px-3 py-2 text-sm text-amber-300">
                {item.name || "Sélectionnez un objet Pax Dei ci-dessus"}
              </div>
            </div>

            <div className="rounded-lg border border-green-800 bg-green-950 p-4">
              <p className="mb-2 text-sm font-semibold text-green-200">
                Image de l'article
              </p>

              {imagePreview ? (
                <div className="mb-3 overflow-hidden rounded-lg border border-green-800 bg-black/20">
                  <img
                    src={imagePreview}
                    alt="Aperçu de l'article"
                    className="h-40 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="mb-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-green-800 text-sm text-green-500">
                  Aucune image sélectionnée
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={saving}
                onChange={(e) => selectImage(e.target.files?.[0])}
                className="block w-full text-sm text-green-300 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-amber-500"
              />
              <p className="mt-2 text-xs text-green-500">
                JPG, PNG ou WebP · 5 Mo maximum.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-green-200">
                URL de l'image (optionnelle)
              </label>
              <input
                value={item.imageUrl}
                onChange={(e) => {
                  setItem({ ...item, imageUrl: e.target.value });
                  if (!imageFile) setImagePreview(mediaUrl(e.target.value));
                }}
                placeholder="https://..."
                disabled={saving}
                className="w-full rounded-lg bg-green-950 p-3"
              />
              <p className="mt-2 text-xs leading-5 text-green-500">
                Facultatif. Utile si l'image est déjà hébergée ailleurs. Si vous chargez un fichier depuis votre ordinateur, celui-ci sera utilisé en priorité.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-green-200">
                Lien externe (optionnel)
              </label>
              <input
                value={item.externalUrl}
                onChange={(e) => setItem({ ...item, externalUrl: e.target.value })}
                placeholder="https://..."
                disabled={saving}
                className="w-full rounded-lg bg-green-950 p-3"
              />
              <p className="mt-2 text-xs leading-5 text-green-500">
                Facultatif. Permet d'envoyer le membre vers une page externe liée à l'article, par exemple une page d'événement ou de réservation.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-green-200">
                Description (optionnelle)
              </label>
              <textarea
                value={item.description}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
                placeholder="Décrivez brièvement l'article et son utilité..."
                disabled={saving}
                className="w-full rounded-lg bg-green-950 p-3"
                rows={4}
              />
              <p className="mt-2 text-xs text-green-500">
                Texte présenté aux membres pour expliquer ce qu'ils achètent.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-200">
                Niveau de l'article
              </label>
              <select
                value={item.tier}
                onChange={(e) => setItem({ ...item, tier: Number(e.target.value) })}
                disabled={saving}
                className="mt-2 w-full rounded-lg bg-green-950 p-3"
              >
                <option value="1">Tier I — courant</option>
                <option value="2">Tier II — peu courant</option>
                <option value="3">Tier III — rare</option>
                <option value="4">Tier IV — très rare</option>
                <option value="5">Tier V — exceptionnel</option>
              </select>
              <p className="mt-1 text-xs text-green-500">
                Sert à classer les articles selon leur niveau de rareté ou d'importance.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-200">
                Monnaie
              </label>
              <div className="mt-2 rounded-lg border border-green-800 bg-green-950 p-3 text-green-100">
                {selectedShop
                  ? selectedShop.currencyId === "bronze"
                    ? "Bronze"
                    : selectedShop.currencyId === "argent"
                      ? "Argent"
                      : "Solidus"
                  : "Choisissez d'abord une boutique"}
              </div>
              <p className="mt-1 text-xs text-green-500">
                La monnaie est imposée par la boutique et ne peut pas être modifiée ici.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-200">
                Prix
              </label>
              <input
                type="number"
                min="0"
                value={item.price}
                onChange={(e) => setItem({ ...item, price: e.target.value })}
                placeholder="ex. 25"
                required
                disabled={saving}
                className="mt-2 w-full rounded-lg bg-green-950 p-3"
              />
              <p className="mt-1 text-xs text-green-500">
                Montant demandé pour une unité de l'article.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-green-200">
                Stock disponible
              </label>
              <input
                type="number"
                min="-1"
                value={item.stock}
                onChange={(e) => setItem({ ...item, stock: e.target.value })}
                placeholder="ex. 100"
                required
                disabled={saving}
                className="mt-2 w-full rounded-lg bg-green-950 p-3"
              />
              <p className="mt-1 text-xs text-green-500">
                Nombre d'unités disponibles. Utilisez <strong>-1</strong> pour un stock illimité.
              </p>
            </div>

            <div className="md:col-span-2 rounded-lg border border-green-800 bg-green-950/60 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={limitEnabled}
                  onChange={(e) => setLimitEnabled(e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 accent-amber-600"
                />
                <span className="font-semibold text-green-100">
                  Limiter les achats de cet article
                </span>
              </label>
              <p className="mt-2 text-xs leading-5 text-green-500">
                Facultatif. Désactivé, chaque membre peut acheter l'article sans limite d'achat spécifique.
              </p>

              {limitEnabled && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-green-200">
                      Quantité maximale par membre
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.purchaseLimit}
                      onChange={(e) =>
                        setItem({ ...item, purchaseLimit: e.target.value })
                      }
                      placeholder="ex. 2"
                      required={limitEnabled}
                      disabled={saving}
                      className="mt-2 w-full rounded-lg bg-green-950 p-3"
                    />
                    <p className="mt-1 text-xs text-green-500">
                      Nombre maximum d'unités qu'un même membre peut acheter.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-green-200">
                      Période de limitation
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.purchaseLimitWindowHours}
                      onChange={(e) =>
                        setItem({
                          ...item,
                          purchaseLimitWindowHours: e.target.value,
                        })
                      }
                      placeholder="ex. 24"
                      required={limitEnabled}
                      disabled={saving}
                      className="mt-2 w-full rounded-lg bg-green-950 p-3"
                    />
                    <p className="mt-1 text-xs text-green-500">
                      Durée en heures pendant laquelle cette limite s'applique.
                    </p>
                  </div>

                  <div className="md:col-span-2 rounded-lg border border-green-800 bg-green-900/30 p-3 text-sm text-green-300">
                    <strong className="text-green-100">Exemple :</strong> avec une limite de 2 et une période de 24 heures, un membre pourra acheter au maximum 2 unités toutes les 24 heures.
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={!selected || saving}
                className="rounded-lg bg-amber-600 px-5 py-3 font-semibold disabled:opacity-40"
              >
                {saving
                  ? "Enregistrement..."
                  : editing
                    ? "Enregistrer les modifications"
                    : "Ajouter l’article"}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={() => resetItemForm()}
                  disabled={saving}
                  className="rounded-lg border border-green-700 px-5 py-3 font-semibold text-green-200 disabled:opacity-50"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-4">
          {orderedShops.map((shop) => (
            <article
              key={shop.shopId}
              className="rounded-xl border border-green-800 bg-green-900/50 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-amber-400">
                    {shop.currencyId}
                  </p>
                  <h3 className="mt-1 text-xl font-bold">{shop.name}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => selectShop(shop)}
                  className="text-amber-300"
                >
                  Gérer les articles
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {shop.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-green-800 p-4 text-sm text-green-400">
                    Aucun article dans cette boutique.
                  </div>
                ) : (
                  shop.items.map((i) => (
                    <div
                      key={i.itemId}
                      className="flex flex-wrap items-center gap-3 rounded-lg bg-green-950/70 p-3"
                    >
                      {i.imageUrl ? (
                        <img
                          src={mediaUrl(i.imageUrl)}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded border border-green-800 bg-green-900/50" />
                      )}

                      <span className="min-w-[180px] flex-1">
                        {i.name} · Tier {[
                          "",
                          "I",
                          "II",
                          "III",
                          "IV",
                          "V",
                        ][i.tier]}
                      </span>

                      <span className="text-sm text-green-300">
                        {i.price} {i.currencyId} · Stock {i.stock < 0 ? "∞" : i.stock}
                      </span>

                      <button
                        type="button"
                        onClick={() => void removeItem(shop.shopId, i.itemId, i.name)}
                        className="text-red-300 hover:text-red-200"
                      >
                        Supprimer
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelected(shop.shopId);
                          setEditing(i.itemId);
                          setItem({
                            ...i,
                            paxDeiItemId: i.paxDeiItemId ?? "",
                            purchaseLimit: i.purchaseLimit ?? "",
                            purchaseLimitWindowHours:
                              i.purchaseLimitWindowHours ?? "24",
                          });
                          setImageFile(null);
                          setImagePreview(mediaUrl(i.imageUrl));
                          setPaxDeiSearch(i.name);
                          setPaxDeiResults([]);
                          setLimitEnabled(
                            i.purchaseLimit !== undefined &&
                              i.purchaseLimit !== null,
                          );
                          setError("");
                          setMsg("");
                        }}
                        className="text-amber-300"
                      >
                        Modifier
                      </button>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

export default function AdminBoutiques() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm text-green-300">Chargement de la gestion des boutiques…</p>
          </div>
        </main>
      }
    >
      <AdminBoutiquesContent />
    </Suspense>
  );
}
