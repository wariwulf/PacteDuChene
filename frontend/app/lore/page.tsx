import { Suspense } from "react";
import LorePageClient from "./LorePageClient";

export default function LorePage() {
  return (
    <Suspense
      fallback={
        <main className="pacte-lore-page">
          <div className="pacte-lore-status">
            Ouverture des archives...
          </div>
        </main>
      }
    >
      <LorePageClient />
    </Suspense>
  );
}