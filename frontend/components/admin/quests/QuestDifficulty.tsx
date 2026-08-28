export default function QuestDifficulty({ value, label = true }: { value: number; label?: boolean }) {
  const difficulty = Math.max(1, Math.min(5, Math.round(value || 1)));
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Difficulté ${difficulty} sur 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < difficulty ? "text-amber-400" : "text-white/20"}>★</span>
      ))}
      {label && <span className="ml-1 text-xs text-gray-400">{difficulty}/5</span>}
    </span>
  );
}
