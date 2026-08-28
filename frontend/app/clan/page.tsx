"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import clanTreeBackground from "./clan-tree-background.png";
import "./clan-tree.css";

type ClanRole = "REX" | "DUX_FOEDERIS" | "FRERE_JURE" | "SOEUR_JUREE" | "INITIE";
interface ClanNode { id:string; memberId:string; name:string; role:ClanRole; title?:string; portrait?:string|null; parentId?:string|null; displayOrder:number; active:boolean; }
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const labels:Record<ClanRole,string> = { REX:"Rex", DUX_FOEDERIS:"Dux Foederis", FRERE_JURE:"Frère Juré", SOEUR_JUREE:"Sœur Jurée", INITIE:"Initié du Pacte" };

function Card({ m, compact=false }:{m:ClanNode;compact?:boolean}) {
  return <Link href={`/membres/${m.memberId}`} className={`clan-member-card ${compact?"compact":""}`}>
    {m.portrait ? <img src={m.portrait} alt={`Portrait de ${m.name}`} className="portrait"/> : <div className="portrait placeholder">{m.name.charAt(0).toUpperCase()}</div>}
    <div className="member-info"><span className="role">{labels[m.role]}</span><strong>{m.name}</strong>{m.title&&<span className="title">{m.title}</span>}</div>
  </Link>;
}

export default function ClanPage(){
  const [members,setMembers]=useState<ClanNode[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [refreshing,setRefreshing]=useState(false);
  async function load(){try{setError("");setRefreshing(true);const r=await fetch(`${API_URL}/clan/tree`,{credentials:"include",cache:"no-store"});if(!r.ok)throw new Error(`Erreur serveur (${r.status})`);const p=await r.json();setMembers(p.data||[]);}catch(e){setError(e instanceof Error?e.message:"Impossible de charger le clan.");}finally{setLoading(false);setRefreshing(false);}}
  useEffect(()=>{load();},[]);
  const active=useMemo(()=>members.filter(m=>m.active),[members]);
  const rex=active.filter(m=>m.role==="REX").sort((a,b)=>a.displayOrder-b.displayOrder);
  const dux=active.filter(m=>m.role==="DUX_FOEDERIS").sort((a,b)=>a.displayOrder-b.displayOrder);
  const jures=active.filter(m=>m.role==="FRERE_JURE"||m.role==="SOEUR_JUREE").sort((a,b)=>a.displayOrder-b.displayOrder);
  const init=active.filter(m=>m.role==="INITIE").sort((a,b)=>a.displayOrder-b.displayOrder);
  return <main className="clan-page">
    <Image
      src={clanTreeBackground}
      alt=""
      fill
      priority
      sizes="100vw"
      className="clan-background"
      aria-hidden="true"
    />
    <div className="clan-background-overlay" aria-hidden="true" />
    <div className="clan-container">
    <header className="clan-header"><div><p className="eyebrow">LE PACTE DU CHÊNE</p><h1>Arbre du Clan</h1><p className="subtitle">Nos racines sont notre force, nos branches notre avenir.</p></div><button onClick={load} disabled={refreshing}>{refreshing?"Actualisation...":"Actualiser"}</button></header>
    {loading&&<section className="state">🌳<p>Les racines du Pacte prennent forme...</p></section>}
    {!loading&&error&&<section className="state error"><h2>Impossible de charger le clan</h2><p>{error}</p><button onClick={load}>Réessayer</button></section>}
    {!loading&&!error&&<>
      <section className="tree">
        {rex.length>0&&<div className="level rex">{rex.map(m=><Card key={m.id} m={m}/>)}</div>}
        {rex.length>0&&dux.length>0&&<div className="connector"/>}
        {dux.length>0&&<div className="level dux">{dux.map(m=><Card key={m.id} m={m}/>)}</div>}
        {dux.length>0&&jures.length>0&&<div className="connector"/>}
        {jures.length>0&&<><div className="section-title">❖ <span>Cercle des Jurés</span> ❖</div><div className="level">{jures.map(m=><Card key={m.id} m={m} compact/>)}</div></>}
        {jures.length>0&&init.length>0&&<div className="connector"/>}
        {init.length>0&&<><div className="section-title">◇ <span>Initiés du Pacte</span> ◇</div><div className="level initiates">{init.map(m=><Card key={m.id} m={m} compact/>)}</div></>}
        {active.length===0&&<div className="empty"><div>🌳</div><h2>Le chêne attend ses branches</h2><p>Aucun membre n'a encore été placé dans la hiérarchie.</p></div>}
      </section>
      <aside className="legend"><h2>Légende</h2>{(Object.keys(labels) as ClanRole[]).map(r=><div className="legend-row" key={r}><span>{r==="REX"?"♛":r==="DUX_FOEDERIS"?"⚔":r==="INITIE"?"◇":"❖"}</span>{labels[r]}</div>)}<hr/><p>Chaque carte est cliquable et mène directement à la fiche du membre.</p></aside>
      <section className="values"><div><b>UNITÉ</b><span>Chaque membre compte.</span></div><div><b>HONNEUR</b><span>Le Serment nous lie.</span></div><div><b>FORCE</b><span>Ensemble, nous sommes plus forts.</span></div><div><b>HÉRITAGE</b><span>Nos racines traversent les générations.</span></div></section>
    </>}
  </div></main>;
}
