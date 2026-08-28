import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LegacySuccessDetailPage({ params }: Props) {
  await params;
  redirect("/espace-membre/exploits");
}
