"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import {
  adminInventory,
  adjustInventory,
  getShops,
  InventoryItem,
  Shop,
} from "@/services/shops.service";

type PendingAction = {
  item: InventoryItem;
  delta: 1 | -1;
};

export default function AdminInventory() {
  const [members, setMembers] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shopsLoaded, setShopsLoaded] = useState(false);

  useEffect(() => {
    void loadMembers();
    void loadShops();
  }, []);

  async function loadMembers() {
    try {
      const r = await apiFetch<any>("/users/admin");
      setMembers(r.data ?? []);
    } catch {
      setMembers([]);
    }
  }

  async function loadShops() {
    try {
      const data = await getShops();
      setShops(data);
    } catch {
      setShops([]);
    } finally {
      setShopsLoaded(true);
    }
  }

  async function load(id: string) {
    setSelected(id);

    if (!id) {
      setItems([]);
      return;
    }

    setLoading(true);

    try {
      const r = await adminInventory(id);
      setItems(r.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function openAdjust(item: InventoryItem, delta: 1 | -1) {
    setReason("");
    setPendingAction({ item, delta });
  }

  function closeAdjust() {
    if (saving) return;
    setPendingAction(null);
    setReason("");
  }

  async function confirmAdjust() {
    if (!pendingAction || saving) return;

    const cleanReason = reason.trim();

    if (cleanReason.length < 3) {
      return;
    }

    setSaving(true);

    try {
      await adjustInventory(
        selected,
        pendingAction.item.itemId,
        pendingAction.delta,
        cleanReason,
      );

      setPendingAction(null);
      setReason("");
      await load(selected);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Impossible de modifier l'inventaire.",
      );
    } finally {
      setSaving(false);
    }
  }

  function isShopItemActive(item: InventoryItem) {
    if (!shopsLoaded) return true;

    const shop = shops.find((entry) => entry.shopId === item.shopId);

    if (!shop) return false;

    return shop.items.some((shopItem) => shopItem.itemId === item.itemId);
  }

  const visible = members.filter((member) =>
    `${member.profile?.displayName ?? ""} ${
      member.profile?.username ?? ""
    } ${member.email ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const selectedMember = members.find((member) => member.id === selected);
  const selectedMemberName =
    selectedMember?.profile?.displayName ||
    selectedMember?.profile?.username ||
    selectedMember?.email ||
    "ce membre";

  const reasonIsValid = reason.trim().length >= 3;

  return (
    <main className="min-h-screen bg-green-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[.3em] text-amber-400">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-bold">Gestion des inventaires</h1>

        <p className="mt-3 max-w-3xl text-green-300">
          Consultez et ajustez les objets détenus par chaque membre. Toute
          modification doit être accompagnée d'un motif afin de conserver une
          trace claire des interventions administratives.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-xl bg-green-900/60 p-5">
            <h2 className="text-lg font-bold">Membres</h2>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un membre"
              className="mt-4 w-full rounded-lg bg-green-950 p-3 outline-none ring-1 ring-green-800 focus:ring-amber-500"
            />

            <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="rounded-lg bg-green-950/70 p-3 text-sm text-green-300">
                  Aucun membre trouvé.
                </p>
              ) : (
                visible.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => void load(member.id)}
                    className={`w-full rounded-lg p-3 text-left transition ${
                      selected === member.id
                        ? "bg-amber-700 text-white"
                        : "bg-green-950 hover:bg-green-900"
                    }`}
                  >
                    {member.profile?.displayName ||
                      member.profile?.username ||
                      member.email}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="rounded-xl bg-green-900/60 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Inventaire</h2>
                {selected && (
                  <p className="mt-1 text-sm text-green-300">
                    Inventaire de <span className="font-semibold text-white">{selectedMemberName}</span>
                  </p>
                )}
              </div>

              {selected && !loading && (
                <p className="text-sm text-green-400">
                  {items.length} article{items.length > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {!selected ? (
              <div className="mt-6 rounded-lg border border-dashed border-green-700 bg-green-950/50 p-8 text-center text-green-300">
                Sélectionnez un membre pour consulter son inventaire.
              </div>
            ) : loading ? (
              <p className="mt-6 text-green-300">Chargement...</p>
            ) : items.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-green-700 bg-green-950/50 p-8 text-center text-green-300">
                Aucun objet dans cet inventaire.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {items.map((item) => {
                  const active = isShopItemActive(item);

                  return (
                    <div
                      key={item.itemId}
                      className="rounded-lg bg-green-950/70 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold">{item.name}</p>

                          <p className="mt-1 text-xs text-green-400">
                            {item.shopId}
                          </p>

                          {!active && (
                            <p className="mt-2 inline-flex rounded-full border border-amber-700/60 bg-amber-950/40 px-2 py-1 text-xs font-semibold text-amber-300">
                              ⚠ Article retiré du catalogue
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="min-w-8 text-center text-lg font-semibold text-amber-300">
                            {item.quantity}
                          </span>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openAdjust(item, -1)}
                              disabled={saving}
                              title="Retirer un exemplaire"
                              className="rounded bg-red-900 px-3 py-1 text-lg font-bold transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              −
                            </button>

                            <button
                              type="button"
                              onClick={() => openAdjust(item, 1)}
                              disabled={saving}
                              title="Ajouter un exemplaire"
                              className="rounded bg-green-800 px-3 py-1 text-lg font-bold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {!active && (
                        <p className="mt-3 text-xs text-green-400">
                          Cet objet reste gérable dans l'inventaire même s'il
                          n'est plus disponible à l'achat dans la boutique.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {pendingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAdjust();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-green-700 bg-green-950 p-6 shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-[.2em] text-amber-400">
              Modification d'inventaire
            </p>

            <h2 className="mt-2 text-2xl font-bold">
              {pendingAction.delta < 0
                ? "Retirer un objet"
                : "Ajouter un objet"}
            </h2>

            <p className="mt-4 text-green-200">
              Vous allez{" "}
              <strong className="text-white">
                {pendingAction.delta < 0 ? "retirer" : "ajouter"} 1 exemplaire
              </strong>{" "}
              de <strong className="text-white">« {pendingAction.item.name} »</strong>{" "}
              dans l'inventaire de{" "}
              <strong className="text-white">{selectedMemberName}</strong>.
            </p>

            <div className="mt-5 rounded-lg border border-green-800 bg-green-900/50 p-4 text-sm text-green-300">
              <p>
                Quantité actuelle :{" "}
                <strong className="text-white">
                  {pendingAction.item.quantity}
                </strong>
              </p>
              <p className="mt-1">
                Nouvelle quantité :{" "}
                <strong className="text-white">
                  {Math.max(
                    0,
                    pendingAction.item.quantity + pendingAction.delta,
                  )}
                </strong>
              </p>
            </div>

            <label className="mt-5 block">
              <span className="font-semibold">Motif du changement</span>
              <span className="mt-1 block text-sm text-green-400">
                Obligatoire. Indiquez brièvement pourquoi cet objet est ajouté
                ou retiré.
              </span>

              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                autoFocus
                rows={3}
                placeholder={
                  pendingAction.delta < 0
                    ? "Ex. Objet attribué par erreur"
                    : "Ex. Récompense accordée au membre"
                }
                className="mt-3 w-full rounded-lg bg-green-900 p-3 outline-none ring-1 ring-green-700 placeholder:text-green-500 focus:ring-amber-500"
              />
            </label>

            {reason.length > 0 && !reasonIsValid && (
              <p className="mt-2 text-sm text-red-300">
                Le motif doit comporter au moins 3 caractères.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAdjust}
                disabled={saving}
                className="rounded-lg border border-green-700 px-5 py-2.5 font-semibold text-green-200 transition hover:border-green-500 hover:bg-green-900 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void confirmAdjust()}
                disabled={!reasonIsValid || saving}
                className={`rounded-lg px-5 py-2.5 font-semibold transition ${
                  pendingAction.delta < 0
                    ? "bg-red-800 hover:bg-red-700"
                    : "bg-green-700 hover:bg-green-600"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {saving
                  ? "Enregistrement..."
                  : pendingAction.delta < 0
                    ? "Retirer l'objet"
                    : "Ajouter l'objet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
