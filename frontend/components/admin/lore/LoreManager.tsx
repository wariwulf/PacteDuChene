"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LORE_CATEGORIES } from "@/components/lore/LoreIcons";
import type { LoreEntry } from "@/components/lore/LoreLibraryTypes";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type FormState = {
  title: string;
  category: string;
  summary: string;
  content: string;
  enabled: boolean;
  order: number;
};

const emptyForm: FormState = {
  title: "",
  category: "Histoire",
  summary: "",
  content: "",
  enabled: true,
  order: 0,
};

async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload?.success === false) {
    throw new Error(
      payload?.message || `Erreur serveur (${response.status})`
    );
  }

  return payload;
}

export default function LoreManager() {
  const [entries, setEntries] = useState<LoreEntry[]>([]);
  const [selected, setSelected] = useState<LoreEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Toutes");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadLore() {
    try {
      setLoading(true);
      setError("");
      const payload = await apiRequest("/lore?includeDisabled=true");
      setEntries(Array.isArray(payload?.data?.lore) ? payload.data.lore : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger le lore."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLore();
  }, []);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...entries]
      .filter((entry) =>
        categoryFilter === "Toutes"
          ? true
          : entry.category.toLowerCase() === categoryFilter.toLowerCase()
      )
      .filter((entry) =>
        !query
          ? true
          : [entry.title, entry.category, entry.summary]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(query))
      )
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "fr"));
  }, [entries, search, categoryFilter]);

  function editEntry(entry: LoreEntry) {
    setSelected(entry);
    setForm({
      title: entry.title,
      category: entry.category,
      summary: entry.summary || "",
      content: entry.content,
      enabled: entry.enabled,
      order: entry.order,
    });
    setMessage("");
    setError("");
  }

  function newEntry() {
    setSelected(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setError("Le titre et le contenu sont obligatoires.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const body = {
        title: form.title.trim(),
        category: form.category,
        summary: form.summary.trim() || undefined,
        content: form.content,
        enabled: form.enabled,
        order: Number(form.order) || 0,
      };

      const payload = selected
        ? await apiRequest(`/lore/${encodeURIComponent(selected.loreId)}`, {
            method: "PATCH",
            body: JSON.stringify(body),
          })
        : await apiRequest("/lore", {
            method: "POST",
            body: JSON.stringify(body),
          });

      const saved = payload?.data?.lore as LoreEntry | undefined;

      setMessage(selected ? "Chronique modifiée." : "Chronique créée.");
      if (saved) {
        setEntries((current) => {
          const without = current.filter((entry) => entry.loreId !== saved.loreId);
          return [...without, saved];
        });
        setSelected(saved);
      }

      if (!selected) setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer la chronique."
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(entry: LoreEntry) {
    if (!window.confirm(`Supprimer « ${entry.title} » ?`)) return;

    try {
      setError("");
      setMessage("");
      await apiRequest(`/lore/${encodeURIComponent(entry.loreId)}`, {
        method: "DELETE",
      });

      setEntries((current) =>
        current.filter((item) => item.loreId !== entry.loreId)
      );

      if (selected?.loreId === entry.loreId) newEntry();
      setMessage("Chronique supprimée.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer la chronique."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#07110b] text-[#edf2e8]">
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.3em] text-[#c6a15b]">
              Administration · Bibliothèque
            </p>
            <h1 className="mt-2 text-4xl font-bold">Gestion du Lore</h1>
            <p className="mt-2 max-w-2xl text-[#a9b9aa]">
              Gérez les chroniques, leur classement et leur visibilité.
              Les identifiants techniques sont gérés automatiquement par le système.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/lore"
              className="rounded-lg border border-[#304536] bg-[#102117] px-5 py-3 font-semibold text-[#d7e2d4] hover:border-[#c6a15b]"
            >
              Voir la bibliothèque
            </Link>
            <button
              type="button"
              onClick={newEntry}
              className="rounded-lg bg-[#b48735] px-5 py-3 font-bold text-[#fff8e8] hover:bg-[#c59a4d]"
            >
              + Nouvelle chronique
            </button>
          </div>
        </header>

        {(error || message) && (
          <div
            className={`mb-6 rounded-lg border p-4 ${
              error
                ? "border-red-800 bg-red-950/30 text-red-300"
                : "border-green-800 bg-green-950/30 text-green-300"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
          <section className="rounded-2xl border border-[#263b2c] bg-[#0d1b13] p-5 shadow-2xl">
            <div className="mb-5 flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une chronique..."
                className="min-w-0 flex-1 rounded-lg border border-[#304536] bg-[#08130d] px-4 py-3 text-sm outline-none focus:border-[#c6a15b]"
              />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-lg border border-[#304536] bg-[#08130d] px-4 py-3 text-sm outline-none focus:border-[#c6a15b]"
              >
                <option>Toutes</option>
                {LORE_CATEGORIES.map((category) => (
                  <option key={category.id}>{category.label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="rounded-xl border border-[#263b2c] bg-[#08130d] p-8 text-center text-[#9eb09f]">
                Chargement de la bibliothèque...
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#3b5140] p-10 text-center text-[#9eb09f]">
                Aucune chronique trouvée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-[#304536] text-xs uppercase tracking-wider text-[#7f947f]">
                    <tr>
                      <th className="px-3 py-3">Titre</th>
                      <th className="px-3 py-3">Catégorie</th>
                      <th className="px-3 py-3">Ordre</th>
                      <th className="px-3 py-3">État</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr
                        key={entry.loreId}
                        className="border-b border-[#1d3023] transition hover:bg-[#112318]"
                      >
                        <td className="px-3 py-4">
                          <button
                            type="button"
                            onClick={() => editEntry(entry)}
                            className="text-left font-semibold text-[#f0eadb] hover:text-[#c6a15b]"
                          >
                            {entry.title}
                          </button>
                        </td>
                        <td className="px-3 py-4 text-[#aabdac]">{entry.category}</td>
                        <td className="px-3 py-4 text-[#aabdac]">{entry.order}</td>
                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              entry.enabled
                                ? "bg-green-950 text-green-300"
                                : "bg-slate-900 text-slate-400"
                            }`}
                          >
                            {entry.enabled ? "Visible" : "Masquée"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => editEntry(entry)}
                              className="rounded-md border border-[#5a4a27] px-3 py-2 text-[#d4b66d] hover:bg-[#2a2415]"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => removeEntry(entry)}
                              className="rounded-md border border-red-900 px-3 py-2 text-red-300 hover:bg-red-950/50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#263b2c] bg-[#0d1b13] p-5 shadow-2xl">
            <div className="mb-6 border-b border-[#263b2c] pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c6a15b]">
                {selected ? "Modifier" : "Nouvelle entrée"}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {selected ? selected.title : "Créer une chronique"}
              </h2>
            </div>

            <form onSubmit={save} className="space-y-5">
              <Field label="Titre *">
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Ex. L'origine du Pacte du Chêne"
                  className="admin-input"
                  required
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Catégorie *">
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="admin-input"
                  >
                    {LORE_CATEGORIES.map((category) => (
                      <option key={category.id}>{category.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Ordre d'affichage">
                  <input
                    type="number"
                    value={form.order}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order: Number(event.target.value),
                      }))
                    }
                    className="admin-input"
                  />
                </Field>
              </div>

              <Field label="Résumé">
                <textarea
                  value={form.summary}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  rows={3}
                  className="admin-input resize-y"
                  placeholder="Quelques lignes visibles dans la bibliothèque..."
                />
              </Field>

              <Field label="Contenu *">
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  rows={15}
                  className="admin-input resize-y leading-7"
                  placeholder="Rédigez la chronique..."
                  required
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#263b2c] bg-[#08130d] p-4">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      enabled: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#b48735]"
                />
                <span>
                  <span className="block font-semibold">Visible au public</span>
                  <span className="text-xs text-[#7f947f]">
                    La chronique apparaîtra dans la bibliothèque.
                  </span>
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={newEntry}
                  className="rounded-lg border border-[#304536] px-5 py-3 font-semibold hover:bg-[#14251a]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#b48735] px-6 py-3 font-bold text-white hover:bg-[#c59a4d] disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border: 1px solid #304536;
          border-radius: 0.5rem;
          background: #08130d;
          padding: 0.75rem 1rem;
          color: #edf2e8;
          outline: none;
        }
        .admin-input:focus {
          border-color: #c6a15b;
          box-shadow: 0 0 0 1px #c6a15b;
        }
        .admin-input::placeholder {
          color: #566958;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#9eb09f]">
        {label}
      </span>
      {children}
    </label>
  );
}
