"use client";

import { useEffect, useMemo, useState } from "react";
import { addUserXp, getUserLevel, removeUserXp } from "@/services/levels.service";
import { getMembers } from "@/services/members.service";

type AdminMember = { id: string; username: string; displayName?: string; avatar?: string; role?: string };
type MemberLevel = { xp: number; level: number; levelName: string; progressPercent?: number };
type MembersResponse = { success: boolean; data?: { members?: AdminMember[]; users?: AdminMember[] }; members?: AdminMember[]; users?: AdminMember[]; message?: string };

function normalizeMembers(payload: MembersResponse): AdminMember[] {
  const raw: any[] = payload?.data?.members ?? payload?.data?.users ?? payload?.members ?? payload?.users ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((m: any) => {
    const id = m?.id ?? m?._id ?? m?.profile?.id ?? m?.userId;
    if (!id) return null;
    return { id: String(id), username: m?.username ?? m?.profile?.username ?? m?.discord?.username ?? "", displayName: m?.displayName ?? m?.profile?.displayName ?? m?.paxDei?.characterName ?? m?.discord?.username, avatar: m?.avatar ?? m?.profile?.avatar ?? undefined, role: m?.role ?? m?.profile?.role };
  }).filter(Boolean) as AdminMember[];
}
function nameOf(m: AdminMember) { return m.displayName || m.username || `Membre ${m.id.slice(0, 8)}`; }

export default function MemberLevelManager() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState("1");
  const [operation, setOperation] = useState<"ADD" | "REMOVE">("ADD");
  const [reason, setReason] = useState("");
  const [levels, setLevels] = useState<Record<string, MemberLevel>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadMembers() {
  try {
    setLoading(true);
    setError("");

    const loadedMembers = await getMembers();

    const normalizedMembers: AdminMember[] = loadedMembers.map((member) => ({
      id: member.profile.id,
      username: member.profile.username,
      displayName: member.profile.displayName,
      avatar: undefined,
      role: member.profile.role,
    }));

    setMembers(normalizedMembers);

    if (normalizedMembers.length === 0) {
      setError("Aucun membre n'a été trouvé.");
    }

    const levelEntries = await Promise.all(
      normalizedMembers.map(async (member) => {
        try {
          const level = await getUserLevel(member.id);
          return [member.id, level] as const;
        } catch {
          return null;
        }
      })
    );

    const map: Record<string, MemberLevel> = {};

    for (const entry of levelEntries) {
      if (entry) {
        map[entry[0]] = entry[1];
      }
    }

    setLevels(map);
  } catch (err) {
    console.error("Erreur chargement membres :", err);

    setError(
      err instanceof Error
        ? err.message
        : "Impossible de charger les membres."
    );
  } finally {
    setLoading(false);
  }
}
  useEffect(() => { void loadMembers(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => [m.displayName, m.username, m.id].filter(Boolean).some(v => String(v).toLowerCase().includes(q)));
  }, [members, search]);
  const allSelected = filtered.length > 0 && filtered.every(m => selectedIds.includes(m.id));

  function toggle(id: string) { setSelectedIds(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]); }
  function toggleAll() {
    const ids = filtered.map(m => m.id);
    setSelectedIds(cur => allSelected ? cur.filter(id => !ids.includes(id)) : Array.from(new Set([...cur, ...ids])));
  }

  async function applyXp() {
    const numericAmount = Math.floor(Number(amount));
    if (!selectedIds.length) return setError("Sélectionnez au moins un membre.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setError("Le montant d'XP doit être un entier supérieur à 0.");
    if (!reason.trim()) return setError("Une justification est obligatoire.");
    if (!window.confirm(`Vous allez ${operation === "ADD" ? "ajouter" : "retirer"} ${numericAmount.toLocaleString("fr-FR")} XP à ${selectedIds.length} membre(s).\n\nJustification : ${reason.trim()}\n\nConfirmer ?`)) return;

    try {
      setSaving(true); setError(""); setMessage("");
      let ok = 0; const failures: string[] = [];
      for (const id of selectedIds) {
        try {
          const payload: any = { amount: numericAmount, reason: reason.trim(), description: reason.trim(), source: "ADMIN" };
          if (operation === "ADD") await addUserXp(id, payload); else await removeUserXp(id, payload);
          ok++;
        } catch { failures.push(nameOf(members.find(m => m.id === id) ?? { id, username: "" })); }
      }
      await loadMembers(); setSelectedIds([]); setReason("");
      if (failures.length) setError(`${ok} opération(s) réussie(s). Échec pour : ${failures.join(", ")}.`);
      else setMessage(`${ok} membre(s) ont reçu la modification de ${numericAmount.toLocaleString("fr-FR")} XP.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Impossible d'appliquer la modification d'XP."); }
    finally { setSaving(false); }
  }

  return <section className="space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-500">Opération</p><h2 className="mt-1 text-2xl font-bold text-[#f2ead2]">Modifier l'expérience</h2><p className="mt-2 text-sm leading-6 text-emerald-300/75">Sélectionnez plusieurs membres et ajoutez ou retirez de l'XP en une seule opération. Les niveaux eux-mêmes ne sont pas modifiables ici.</p></div>
    {error && <div className="rounded-xl border border-red-900/80 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>}
    {message && <div className="rounded-xl border border-emerald-700/70 bg-emerald-950/40 p-4 text-sm text-emerald-200">{message}</div>}

    <div className="rounded-2xl border border-emerald-900/70 bg-[#061a10]/95 p-6 shadow-xl">
      <div className="grid gap-4 lg:grid-cols-2">
        {(["ADD", "REMOVE"] as const).map(op => <button key={op} type="button" onClick={() => setOperation(op)} className={`rounded-xl border p-5 text-left transition ${operation === op ? "border-amber-500 bg-amber-950/30" : "border-emerald-800 bg-[#071a12] hover:border-emerald-600"}`}><p className="text-lg font-bold text-[#f2ead2]">{op === "ADD" ? "Donner" : "Retirer"}</p><p className="mt-1 text-sm text-emerald-300">{op === "ADD" ? "Ajouter de l'expérience aux membres sélectionnés." : "Retirer de l'expérience aux membres sélectionnés."}</p></button>)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label><span className="mb-2 block text-sm font-semibold text-[#f2ead2]">XP par membre</span><input type="number" min={1} step={1} value={amount} onChange={e => setAmount(e.target.value)} className="w-full rounded-xl border border-emerald-800 bg-[#03150c] px-4 py-3 text-white outline-none focus:border-amber-500" /></label>
        <div className="rounded-xl border border-emerald-900 bg-[#03150c] p-4"><p className="text-xs uppercase tracking-[.18em] text-emerald-400">Sélection</p><p className="mt-1 text-2xl font-bold text-amber-400">{selectedIds.length}</p><p className="text-sm text-emerald-300">membre(s) sélectionné(s)</p></div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="block flex-1"><span className="mb-2 block text-sm font-semibold text-[#f2ead2]">Rechercher un membre</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Pseudo, nom..." className="w-full rounded-xl border border-emerald-800 bg-[#03150c] px-4 py-3 text-white outline-none focus:border-amber-500" /></label><button type="button" onClick={toggleAll} disabled={!filtered.length} className="rounded-xl border border-emerald-700 px-4 py-3 font-semibold text-emerald-100 hover:border-amber-500 hover:text-amber-300 disabled:opacity-40">{allSelected ? "Tout désélectionner" : "Sélectionner tout"}</button></div>
      <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-emerald-800 bg-[#03150c]">
        {loading ? <p className="p-6 text-center text-emerald-300">Chargement des membres…</p> : !filtered.length ? <p className="p-6 text-center text-emerald-300">Aucun membre trouvé.</p> : filtered.map(m => { const selected = selectedIds.includes(m.id); const level = levels[m.id]; return <label key={m.id} className={`flex cursor-pointer items-center gap-4 border-b border-emerald-900/70 p-4 transition last:border-b-0 ${selected ? "bg-amber-950/25" : "hover:bg-emerald-950/40"}`}><input type="checkbox" checked={selected} onChange={() => toggle(m.id)} className="h-5 w-5 accent-amber-500" />{m.avatar ? <img src={m.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950 text-amber-400">{nameOf(m).charAt(0).toUpperCase()}</div>}<div className="min-w-0 flex-1"><p className="truncate font-semibold text-white">{nameOf(m)}</p><p className="truncate text-xs text-emerald-400">@{m.username || m.id}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-amber-400">{(level?.xp ?? 0).toLocaleString("fr-FR")} XP</p><p className="text-xs text-emerald-500">Niveau {level?.level ?? "—"}</p></div></label> })}
      </div>
      <label className="mt-6 block"><span className="mb-2 block text-sm font-semibold text-[#f2ead2]">Justification</span><textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={500} rows={4} placeholder="Expliquez pourquoi cette opération est effectuée..." className="w-full resize-y rounded-xl border border-emerald-800 bg-[#03150c] px-4 py-3 text-white outline-none focus:border-amber-500" /><p className="mt-1 text-right text-xs text-emerald-500">{reason.length}/500</p></label>
      <div className="mt-5 rounded-xl border border-amber-800/70 bg-amber-950/20 p-4 text-sm text-amber-200">Vous allez <strong>{operation === "ADD" ? "ajouter" : "retirer"} {Number(amount || 0).toLocaleString("fr-FR")} XP</strong> à <strong>{selectedIds.length}</strong> membre(s).</div>
      <button type="button" onClick={() => void applyXp()} disabled={saving || loading || !selectedIds.length || !amount || !reason.trim()} className="mt-5 w-full rounded-xl border border-amber-500 bg-amber-700 px-5 py-3 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40">{saving ? "Application en cours..." : operation === "ADD" ? "Donner l'expérience" : "Retirer l'expérience"}</button>
    </div>
  </section>;
}
