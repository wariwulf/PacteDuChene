import type { OrderStatus } from "@/services/factions.service";

const labels: Record<OrderStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  IN_PROGRESS: "En cours",
  READY: "Prête",
  COMPLETED: "Livrée",
  REFUSED: "Refusée",
  CANCELLED: "Annulée",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">{labels[status]}</span>;
}
