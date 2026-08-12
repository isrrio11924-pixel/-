import {
  STATUS_LABEL,
  TAG_LABEL,
  TEMPERATURE_LABEL,
  getStatusLabel,
  isPresetStatus,
  type SelectionStatus,
  type StruggleTag,
  type Temperature,
} from "@/lib/types";

export function StatusBadge({ status }: { status: SelectionStatus }) {
  const isOffer = status === "offer";
  const isDown = status === "declined" || status === "rejected";
  const isCustom = !isPresetStatus(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        isOffer
          ? "border-[var(--moss)] bg-[var(--moss-soft)] text-[var(--moss)]"
          : isDown
          ? "border-[var(--line)] bg-transparent text-[var(--slate)] line-through"
          : isCustom
          ? "border-[var(--gold)] bg-[var(--gold-soft)]/30 text-[var(--ink-soft)]"
          : "border-[var(--line)] bg-white text-[var(--ink-soft)]"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

const TEMP_STYLE: Record<Temperature, { dot: string; text: string }> = {
  good: { dot: "bg-[var(--moss)]", text: "text-[var(--moss)]" },
  unsure: { dot: "bg-[var(--gold)]", text: "text-[var(--gold)]" },
  urgent: { dot: "bg-[var(--berry)]", text: "text-[var(--berry)]" },
};

export function TemperatureTag({ temp }: { temp: Temperature }) {
  const style = TEMP_STYLE[temp];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {TEMPERATURE_LABEL[temp]}
    </span>
  );
}

export function TagChip({ tag }: { tag: StruggleTag }) {
  return (
    <span className="inline-flex items-center rounded border border-[var(--line)] bg-[var(--paper)] px-2 py-0.5 text-[11px] text-[var(--ink-soft)]">
      #{TAG_LABEL[tag]}
    </span>
  );
}
