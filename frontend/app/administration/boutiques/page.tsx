"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Item { itemId: string; name: string; price: number; stock: number; enabled: boolean; }
interface Shop { shopId: string; name: string; description?: string; currencyId: string; enabled: boolean; items: Item[]; }

export default function AdministrationBoutiquesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [shopId, setShopId] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [currencyId, setCurrencyId] = useState("solidus");
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("-1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadShops() {
    try {
      setLoading(true); setError("");
      const response = await fetch(`${API_URL}/shops`);
      if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
      const payload = await response.json();
      setShops(payload?.data?.shops ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les boutiques.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadShops(); }, []);

  async function createShop(event: FormEvent) {
    event.preventDefault();
    try {
      setSaving(true); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/shops`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shopId.trim(), name: shopName.trim(), description: shopDescription.trim() || undefined, currencyId: currencyId.trim(), enabled: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || `Erreur serveur (${response.status})`);
      setSuccess(`La boutique « ${shopName.trim()} » a été créée.`);
      setShopId(""); setShopName(""); setShopDescription("");
      await loadShops();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la boutique.");
    } finally { setSaving(false); }
  }

  async function addItem(event: FormEvent) {
    event.preventDefault();
    if (!selectedShopId) { setError("Sélectionnez d'abord une boutique."); return; }
    try {
      setSaving(true); setError(""); setSuccess("");
      const response = await fetch(`${API_URL}/shops/${encodeURIComponent(selectedShopId)}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: itemId.trim(), name: itemName.trim(), description: itemDescription.trim() || undefined, price: Number(price), stock: Number(stock), enabled: true }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || `Erreur serveur (${response.status})`);
      setSuccess(`L'article « ${itemName.trim()} » a été ajouté.`);
      setItemId(""); setItemName(""); setItemDescription(""); setPrice("0"); setStock("-1");
      await loadShops();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter l'article.");
    } finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">Administration</p>
            <h1 className="mt-2 text-4xl font-bold">Gestion des boutiques</h1>
            <p className="mt-3 text-green-300">Créez les boutiques du Pacte et gérez leurs articles.</p>
          </div>
          <button onClick={loadShops} disabled={loading || saving} className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50">Actualiser</button>
        </header>

        {error && <div className="mb-6 rounded-lg border border-red-700 bg-red-950/40 p-4 text-red-300">{error}</div>}
        {success && <div className="mb-6 rounded-lg border border-green-700 bg-green-900/60 p-4 text-green-300">{success}</div>}

        <section className="mb-8 rounded-xl border border-green-800 bg-green-900/60 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Nouvelle boutique</p>
          <h2 className="mt-2 text-2xl font-bold">Créer une boutique</h2>
          <form onSubmit={createShop} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold text-green-300">Identifiant</span>
                <input value={shopId} onChange={e => setShopId(e.target.value)} placeholder="forge-du-chene" required className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
              <label><span className="mb-2 block text-sm font-semibold text-green-300">Nom</span>
                <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="Forge du Chêne" required className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-green-300">Description</span>
              <input value={shopDescription} onChange={e => setShopDescription(e.target.value)} placeholder="Équipement et artisanat du Pacte..." className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
            <div className="grid gap-5 md:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold text-green-300">Monnaie</span>
                <input value={currencyId} onChange={e => setCurrencyId(e.target.value)} required className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
              <button type="submit" disabled={saving} className="self-end rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50">{saving ? "Création..." : "Créer la boutique"}</button>
            </div>
          </form>
        </section>

        <section className="mb-8 rounded-xl border border-green-800 bg-green-900/60 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Article</p>
          <h2 className="mt-2 text-2xl font-bold">Ajouter un article</h2>
          <label className="mt-6 block"><span className="mb-2 block text-sm font-semibold text-green-300">Boutique</span>
            <select value={selectedShopId} onChange={e => setSelectedShopId(e.target.value)} className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500">
              <option value="">Sélectionner une boutique</option>
              {shops.map(shop => <option key={shop.shopId} value={shop.shopId}>{shop.name} ({shop.shopId})</option>)}
            </select>
          </label>
          <form onSubmit={addItem} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold text-green-300">Identifiant de l'article</span>
                <input value={itemId} onChange={e => setItemId(e.target.value)} placeholder="epee-fer" required className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
              <label><span className="mb-2 block text-sm font-semibold text-green-300">Nom</span>
                <input value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Épée de fer" required className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
            </div>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-green-300">Description</span>
              <input value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Une arme forgée par les artisans du Pacte." className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
            <div className="grid gap-5 md:grid-cols-2">
              <label><span className="mb-2 block text-sm font-semibold text-green-300">Prix</span>
                <input type="number" min="0" step="1" value={price} onChange={e => setPrice(e.target.value)} required className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" /></label>
              <label><span className="mb-2 block text-sm font-semibold text-green-300">Stock</span>
                <input type="number" min="-1" step="1" value={stock} onChange={e => setStock(e.target.value)} required className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none focus:border-amber-500" />
                <span className="mt-1 block text-xs text-green-500">-1 = stock illimité.</span></label>
            </div>
            <button type="submit" disabled={saving || !selectedShopId} className="rounded-lg bg-amber-600 px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50">{saving ? "Ajout..." : "Ajouter l'article"}</button>
          </form>
        </section>

        <section className="rounded-xl border border-green-800 bg-green-900/60 p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-amber-400">Base des boutiques</p><h2 className="mt-2 text-2xl font-bold">Boutiques existantes</h2></div>
            <span className="rounded-full bg-green-800 px-3 py-1 text-sm text-green-200">{shops.length} boutique{shops.length > 1 ? "s" : ""}</span></div>
          <div className="mt-6 space-y-4">
            {shops.length === 0 ? <div className="rounded-lg border border-green-800 p-6 text-center text-green-300">Aucune boutique n'a encore été créée.</div> :
              shops.map(shop => <div key={shop.shopId} className="rounded-lg border border-green-800 bg-green-950/40 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-amber-400">{shop.shopId}</p><h3 className="mt-1 text-xl font-bold">{shop.name}</h3><p className="mt-1 text-sm text-green-400">Monnaie : {shop.currencyId}</p></div>
                  <span className="text-sm text-green-300">{shop.items.length} article{shop.items.length > 1 ? "s" : ""}</span></div>
              </div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
