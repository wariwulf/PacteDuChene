import React from "react";

type Props = { className?: string };

export function OakIcon({ className = "" }: Props) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M32 58V31M32 42c-8-5-13-11-14-20M32 45c8-5 13-11 14-20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M18 29C9 27 6 21 10 14c7-1 12 3 12 10 0-8 5-13 12-14 3 8-1 15-10 18 8-2 15 1 19 8-8 4-16 1-21-5 2 8-2 14-10 17-4-8 0-14 6-19-8 2-14-1-17-8 7-5 14-2 17 4 0-8 4-13 10-16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
  </svg>;
}

export function BirdIcon({ className = "" }: Props) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M9 39c11-1 15-9 18-19 7 8 15 12 27 11-3 11-13 18-27 17-7 0-12-3-18-9Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M27 20c6-7 14-8 21-5-3 5-8 8-14 8M28 38c5-5 9-8 15-10M43 29l9-3-6 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="45" cy="17" r="1.7" fill="currentColor"/>
  </svg>;
}

export function ChurchIcon({ className = "" }: Props) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M8 54h48M13 54V29l19-14 19 14v25M24 54V38h16v16M32 15V7M27 11h10" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"/>
    <path d="M18 31h5v7h-5zM41 31h5v7h-5z" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>;
}

export function CrownIcon({ className = "" }: Props) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M15 23l8 9 9-16 9 16 8-9-3 25H18l-3-25Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M20 42h24M24 48h16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>;
}

export function QuillIcon({ className = "" }: Props) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M13 52c10-2 20-9 29-20 6-7 9-15 8-22-7-1-15 2-22 8-11 9-17 20-15 34Z" fill="none" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M15 50L49 15M25 39l-7-1M31 33l-7-3M38 26l-6-4M45 20l-5-4" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>;
}

export function MapIcon({ className = "" }: Props) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M9 13l15-5 16 5 15-5v43l-15 5-16-5-15 5V13Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
    <path d="M24 8v43M40 13v43M32 22l2 5 5 1-4 4 1 6-4-3-5 3 1-6-4-4 5-1 3-5Z" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>;
}

export function KnotIcon({ className = "" }: Props) {
  return <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <path d="M32 9c8 0 14 6 14 14 0 5-3 9-7 11 7 1 12 7 12 14 0 8-6 14-14 14-5 0-9-3-11-7-1 4-6 7-11 7-8 0-14-6-14-14 0-5 3-9 7-11-4-2-7-6-7-11 0-8 6-14 14-14 5 0 10 3 11 7 2-4 6-7 11-7Z" fill="none" stroke="currentColor" strokeWidth="2.3"/>
    <path d="M20 20c7 4 17 20 24 24M44 20c-7 4-17 20-24 24" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>;
}

export const LORE_CATEGORIES = [
  { id: "Histoire", label: "Histoire", icon: OakIcon, accent: "green" },
  { id: "Traditions", label: "Traditions", icon: BirdIcon, accent: "red" },
  { id: "Institutions", label: "Institutions", icon: ChurchIcon, accent: "blue" },
  { id: "Personnages", label: "Personnages", icon: CrownIcon, accent: "purple" },
  { id: "Chroniques", label: "Chroniques", icon: QuillIcon, accent: "brown" },
  { id: "Territoires", label: "Territoires", icon: MapIcon, accent: "teal" },
  { id: "Autre", label: "Autre", icon: KnotIcon, accent: "slate" },
] as const;

export function getCategory(category: string) {
  return LORE_CATEGORIES.find(
    (item) => item.id.toLowerCase() === category.toLowerCase()
  ) ?? LORE_CATEGORIES[6];
}
