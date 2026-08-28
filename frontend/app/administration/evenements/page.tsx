"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createClanEvent, deleteClanEvent, getAdminClanEvents, updateClanEvent,
  type ClanEvent, type ClanEventType, type ClanEventStatus,
} from "@/services/clan-events.service";

const types: ClanEventType[] = ["COLLECTE","COMBAT","CEREMONIE","REUNION","SORTIE","AUTRE"];
const labels: Record<ClanEventType,string> = {
  COLLECTE:"Collecte", COMBAT:"Combat", CEREMONIE:"Cérémonie",
  REUNION:"Réunion", SORTIE:"Sortie", AUTRE:"Autre",
};
const statusLabels: Record<ClanEventStatus,string> = {
  PUBLISHED:"Publié", CANCELLED:"Annulé", COMPLETED:"Terminé",
};

interface FormState {
  eventId:string; title:string; description:string; type:ClanEventType;
  startsAt:string; endsAt:string; location:string; discordChannel:string;
}
const empty:FormState = {eventId:"",title:"",description:"",type:"AUTRE",startsAt:"",endsAt:"",location:"",discordChannel:""};

function localInput(value?: string) {
  if (!value) return "";
  const d = new Date(value); if (Number.isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime()-offset*60000).toISOString().slice(0,16);
}

export default function AdministrationEvenementsPage() {
  const [events,setEvents]=useState<ClanEvent[]>([]);
  const [form,setForm]=useState<FormState>(empty);
  const [editing,setEditing]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function load() {
    try { setLoading(true); setError(""); setEvents(await getAdminClanEvents()); }
    catch(e){setError(e instanceof Error?e.message:"Impossible de charger les événements.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[]);

  function edit(e:ClanEvent){
    setEditing(e.eventId);
    setForm({eventId:e.eventId,title:e.title,description:e.description??"",type:e.type,
      startsAt:localInput(e.startsAt),endsAt:localInput(e.endsAt),location:e.location??"",discordChannel:e.discordChannel??""});
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function reset(){setEditing(null);setForm(empty);}

  async function submit(ev:FormEvent){
    ev.preventDefault();
    if(!form.eventId.trim()||!form.title.trim()||!form.startsAt){setError("L'identifiant, le titre et la date de début sont obligatoires.");return;}
    try{
      setSaving(true);setError("");setMessage("");
      const data={title:form.title.trim(),description:form.description.trim(),type:form.type,
        startsAt:new Date(form.startsAt).toISOString(),endsAt:form.endsAt?new Date(form.endsAt).toISOString():undefined,
        location:form.location.trim(),discordChannel:form.discordChannel.trim()};
      if(editing){await updateClanEvent(editing,data);setMessage("Événement modifié.");}
      else{await createClanEvent({...data,eventId:form.eventId.trim(),status:"PUBLISHED"});setMessage("Événement créé.");}
      reset();await load();
    }catch(e){setError(e instanceof Error?e.message:"Impossible d'enregistrer l'événement.");}
    finally{setSaving(false);}
  }

  async function status(e:ClanEvent,s:ClanEventStatus){
    try{setError("");await updateClanEvent(e.eventId,{status:s});await load();}
    catch(err){setError(err instanceof Error?err.message:"Impossible de modifier le statut.");}
  }
  async function remove(e:ClanEvent){
    if(!window.confirm(`Supprimer « ${e.title} » et toutes ses réponses ?`))return;
    try{setError("");await deleteClanEvent(e.eventId);await load();}
    catch(err){setError(err instanceof Error?err.message:"Impossible de supprimer l'événement.");}
  }

  return <main className="min-h-screen bg-green-950 px-6 py-12 text-white">
    <div className="mx-auto max-w-6xl">
      <header className="mb-10"><p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-400">Administration</p>
        <h1 className="mt-2 text-4xl font-bold">Événements</h1>
        <p className="mt-3 text-green-300">Créez et gérez les rendez-vous du Pacte et leurs inscriptions.</p>
      </header>
      {error&&<div className="mb-6 rounded-xl border border-red-700 bg-red-950/40 p-5 text-red-300">{error}</div>}
      {message&&<div className="mb-6 rounded-xl border border-green-700 bg-green-900/50 p-5 text-green-300">{message}</div>}

      <form onSubmit={submit} className="mb-10 rounded-2xl border border-green-800 bg-green-900/50 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">{editing?"Modification":"Nouvel événement"}</p>
            <h2 className="mt-1 text-2xl font-bold">{editing?form.title||"Modifier l'événement":"Créer un événement"}</h2></div>
          {editing&&<button type="button" onClick={reset} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-200">Annuler</button>}
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[
            ["Identifiant","eventId","ex: grands-funebriers-2026-08-29"],
            ["Titre","title","Les grands Funébriers"],
            ["Lieu","location","Lyoness — Grand Chêne"],
            ["Salon Discord","discordChannel","#événements"],
          ].map(([label,key,placeholder])=><label key={key}><span className="mb-2 block text-sm font-semibold">{label}</span>
            <input disabled={key==="eventId"&&!!editing} value={form[key as keyof FormState] as string}
              onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder}
              className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none placeholder:text-green-600 focus:border-amber-500 disabled:opacity-50"/>
          </label>)}
          <label><span className="mb-2 block text-sm font-semibold">Type</span>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value as ClanEventType})}
              className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none">
              {types.map(t=><option key={t} value={t}>{labels[t]}</option>)}</select>
          </label>
          <label><span className="mb-2 block text-sm font-semibold">Début</span>
            <input type="datetime-local" value={form.startsAt} onChange={e=>setForm({...form,startsAt:e.target.value})}
              className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none"/></label>
          <label><span className="mb-2 block text-sm font-semibold">Fin</span>
            <input type="datetime-local" value={form.endsAt} onChange={e=>setForm({...form,endsAt:e.target.value})}
              className="w-full rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none"/></label>
          <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">Description</span>
            <textarea rows={5} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}
              className="w-full resize-y rounded-lg border border-green-700 bg-green-950 px-4 py-3 outline-none placeholder:text-green-600 focus:border-amber-500"
              placeholder="Déroulement, consignes, matériel..."/></label>
        </div>
        <button disabled={saving} className="mt-6 rounded-lg bg-amber-600 px-6 py-3 font-semibold hover:bg-amber-500 disabled:opacity-50">
          {saving?"Enregistrement...":editing?"Enregistrer les modifications":"Créer l'événement"}
        </button>
      </form>

      <section><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Calendrier</p><h2 className="mt-1 text-2xl font-bold">Tous les événements</h2></div>
        <button onClick={load} disabled={loading} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-200">Actualiser</button></div>
        {loading?<p className="text-green-300">Chargement...</p>:events.length===0?<div className="rounded-xl border border-green-800 bg-green-900/40 p-8 text-center text-green-300">Aucun événement enregistré.</div>:
        <div className="space-y-4">{events.map(e=><article key={e.eventId} className="rounded-xl border border-green-800 bg-green-900/50 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div>
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-amber-600/20 px-3 py-1 text-xs font-bold text-amber-300">{labels[e.type]}</span>
              <span className="rounded-full border border-green-700 px-3 py-1 text-xs text-green-300">{statusLabels[e.status]}</span></div>
            <h3 className="mt-3 text-xl font-bold">{e.title}</h3><p className="mt-1 text-sm text-green-400">{new Date(e.startsAt).toLocaleString("fr-FR")}{e.location?` · ${e.location}`:""}</p>
          </div><div className="flex flex-wrap gap-2">
            <button onClick={()=>edit(e)} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-200">Modifier</button>
            {e.status==="PUBLISHED"&&<><button onClick={()=>status(e,"CANCELLED")} className="rounded-lg border border-red-700 px-4 py-2 text-sm text-red-300">Annuler</button>
              <button onClick={()=>status(e,"COMPLETED")} className="rounded-lg border border-amber-700 px-4 py-2 text-sm text-amber-300">Terminer</button></>}
            {e.status==="CANCELLED"&&<button onClick={()=>status(e,"PUBLISHED")} className="rounded-lg border border-green-700 px-4 py-2 text-sm text-green-300">Republier</button>}
            <button onClick={()=>remove(e)} className="rounded-lg border border-red-900 px-4 py-2 text-sm text-red-400">Supprimer</button>
          </div></div>
        </article>)}</div>}
      </section>
    </div>
  </main>;
}
