import type { VotingStatus } from "@/lib/types";

const LABELS: Record<VotingStatus, { className: string; label: string }> = {
  OPEN: { className: "badge badge-open", label: "Open" },
  FINISHED: { className: "badge badge-finished", label: "Finished" },
  DRAFT: { className: "badge badge-draft", label: "Draft" },
};

export function StatusBadge({ status }: { status: VotingStatus }) {
  const s = LABELS[status];
  return <span className={s.className}>{s.label}</span>;
}
