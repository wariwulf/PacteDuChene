"use client";

import { useParams } from "next/navigation";
import QuestEditor from "@/components/admin/quests/QuestEditor";

export default function ModifierQuetePage() {
  const params = useParams();
  return <QuestEditor questId={String(params.questId ?? "")} />;
}
