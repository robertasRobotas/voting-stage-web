"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { EUROVISION_POINTS, type EurovisionPoint, type VotingItem } from "@/lib/types";
import type { Allocation } from "./vote-client";

interface BallotProps {
  items: VotingItem[];
  value: Allocation;
  onChange: (next: Allocation) => void;
}

// Draggable id encodes where the chip currently lives. We need to know the
// source so onDragEnd can clear it from its old item before placing it on
// the new one.
function trayDragId(p: EurovisionPoint): string {
  return `tray:${p}`;
}
function itemDragId(itemId: string, p: EurovisionPoint): string {
  return `item:${itemId}:${p}`;
}
function parseDragId(
  id: string,
): { kind: "tray"; points: EurovisionPoint } | { kind: "item"; itemId: string; points: EurovisionPoint } | null {
  if (id.startsWith("tray:")) {
    return { kind: "tray", points: Number(id.slice(5)) as EurovisionPoint };
  }
  if (id.startsWith("item:")) {
    const rest = id.slice(5);
    const lastColon = rest.lastIndexOf(":");
    return {
      kind: "item",
      itemId: rest.slice(0, lastColon),
      points: Number(rest.slice(lastColon + 1)) as EurovisionPoint,
    };
  }
  return null;
}

function dropTargetId(target: "tray" | string): string {
  return target === "tray" ? "drop:tray" : `drop:item:${target}`;
}

export function Ballot({ items, value, onChange }: BallotProps) {
  const [draggingPoints, setDraggingPoints] = useState<EurovisionPoint | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const used = useMemo(() => {
    const m = new Set<EurovisionPoint>();
    for (const v of Object.values(value)) if (v !== undefined) m.add(v);
    return m;
  }, [value]);

  const remaining = useMemo(
    () => EUROVISION_POINTS.filter((p) => !used.has(p)),
    [used],
  );

  function placeOnItem(itemId: string, points: EurovisionPoint) {
    const next: Allocation = { ...value };
    // Clear this point value from anywhere it currently lives.
    for (const id of Object.keys(next)) {
      if (next[id] === points) delete next[id];
    }
    next[itemId] = points;
    onChange(next);
  }

  function removeFromItem(itemId: string) {
    const next = { ...value };
    delete next[itemId];
    onChange(next);
  }

  function handleDragStart(e: DragStartEvent) {
    const src = parseDragId(String(e.active.id));
    if (src) setDraggingPoints(src.points);
  }

  function handleDragEnd(e: DragEndEvent) {
    setDraggingPoints(null);
    if (!e.over) return;
    const src = parseDragId(String(e.active.id));
    if (!src) return;
    const overId = String(e.over.id);
    if (overId === dropTargetId("tray")) {
      if (src.kind === "item") removeFromItem(src.itemId);
      return;
    }
    if (overId.startsWith("drop:item:")) {
      const targetItemId = overId.slice("drop:item:".length);
      if (src.kind === "item" && src.itemId === targetItemId) return; // no-op
      placeOnItem(targetItemId, src.points);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Tray remaining={remaining} draggingPoints={draggingPoints} />

      <ul className="stack" style={{ listStyle: "none", gap: 10, marginTop: 12 }}>
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            assigned={value[item.id]}
            onRemove={() => removeFromItem(item.id)}
            onPick={(p) => placeOnItem(item.id, p)}
            remaining={remaining}
          />
        ))}
      </ul>

      {/* Floating preview that follows the pointer while dragging. */}
      <DragOverlay dropAnimation={null}>
        {draggingPoints !== null ? <ChipVisual points={draggingPoints} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/* ─────────────────── Tray ─────────────────── */

function Tray({
  remaining,
  draggingPoints,
}: {
  remaining: readonly EurovisionPoint[];
  draggingPoints: EurovisionPoint | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropTargetId("tray") });

  return (
    <div
      ref={setNodeRef}
      style={{
        border: `2px dashed ${isOver ? "var(--primary)" : "var(--border)"}`,
        borderRadius: 12,
        padding: 12,
        background: isOver ? "rgba(225, 29, 72, 0.05)" : "var(--background)",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div className="small muted" style={{ marginBottom: 8 }}>
        Points tray — drag onto an item, drop back here to remove
      </div>
      <div className="row" style={{ gap: 8, flexWrap: "wrap", minHeight: 48 }}>
        {EUROVISION_POINTS.map((p) =>
          remaining.includes(p) ? (
            <DraggableChip
              key={p}
              id={trayDragId(p)}
              points={p}
              invisibleWhileDragging={draggingPoints === p}
            />
          ) : (
            <ChipPlaceholder key={p} points={p} />
          ),
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Item row ─────────────────── */

function ItemRow({
  item,
  assigned,
  onRemove,
  onPick,
  remaining,
}: {
  item: VotingItem;
  assigned: EurovisionPoint | undefined;
  onRemove: () => void;
  onPick: (p: EurovisionPoint) => void;
  remaining: readonly EurovisionPoint[];
}) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: dropTargetId(item.id),
  });

  // Highlight only when the dragged chip would actually change something.
  const draggedSrc = active ? parseDragId(String(active.id)) : null;
  const wouldChange = !!draggedSrc && !(draggedSrc.kind === "item" && draggedSrc.itemId === item.id);
  const highlight = isOver && wouldChange;

  return (
    <li
      ref={setNodeRef}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 10,
        borderRadius: 10,
        border: `1px solid ${highlight ? "var(--primary)" : "var(--border)"}`,
        background: highlight ? "rgba(225, 29, 72, 0.06)" : "var(--background)",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          width={56}
          height={56}
          style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
        />
      )}
      <div style={{ flex: 1, fontWeight: 500 }}>{item.title}</div>

      <div className="row" style={{ gap: 8 }}>
        {assigned !== undefined ? (
          <DraggableChip
            id={itemDragId(item.id, assigned)}
            points={assigned}
            onClick={onRemove}
            title="Click to send back to tray"
          />
        ) : (
          <ClickToPickMenu
            onPick={onPick}
            remaining={remaining}
          />
        )}
      </div>
    </li>
  );
}

/* ─────────────────── Chips ─────────────────── */

const CHIP_SIZE = 44;

function chipStyle(points: EurovisionPoint, opts?: { dragging?: boolean; faded?: boolean }): CSSProperties {
  const top = points === 12;
  return {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    userSelect: "none",
    cursor: "grab",
    background: top ? "var(--accent)" : "var(--card)",
    color: top ? "#111" : "var(--foreground)",
    border: `1px solid ${top ? "#eab308" : "var(--border)"}`,
    boxShadow: opts?.dragging
      ? "0 8px 24px rgba(0,0,0,0.18)"
      : "0 1px 2px rgba(0,0,0,0.06)",
    transform: opts?.dragging ? "scale(1.05) rotate(-2deg)" : undefined,
    opacity: opts?.faded ? 0 : 1,
    transition: "box-shadow 0.15s, transform 0.15s",
    touchAction: "none",
  };
}

function ChipVisual({ points, dragging }: { points: EurovisionPoint; dragging?: boolean }) {
  return <div style={chipStyle(points, { dragging })}>{points}</div>;
}

function DraggableChip({
  id,
  points,
  onClick,
  title,
  invisibleWhileDragging,
}: {
  id: string;
  points: EurovisionPoint;
  onClick?: () => void;
  title?: string;
  invisibleWhileDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onClick}
      title={title ?? `${points} points — drag onto an item`}
      aria-label={`${points} points`}
      {...listeners}
      {...attributes}
      style={{
        ...chipStyle(points, { faded: invisibleWhileDragging || isDragging }),
        border: "none",
        padding: 0,
      }}
    >
      {points}
    </button>
  );
}

function ChipPlaceholder({ points }: { points: EurovisionPoint }) {
  return (
    <div
      aria-hidden
      style={{
        width: CHIP_SIZE,
        height: CHIP_SIZE,
        borderRadius: CHIP_SIZE / 2,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 15,
        color: "var(--muted)",
        border: "1px dashed var(--border)",
        opacity: 0.5,
        textDecoration: "line-through",
      }}
    >
      {points}
    </div>
  );
}

/* ─────────────────── Click fallback for mobile/keyboard users ─────────────────── */

function ClickToPickMenu({
  remaining,
  onPick,
}: {
  remaining: readonly EurovisionPoint[];
  onPick: (p: EurovisionPoint) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-ghost small"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Assign points"
      >
        + Add points
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            padding: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            zIndex: 5,
            minWidth: 220,
          }}
          onMouseLeave={() => setOpen(false)}
        >
          {EUROVISION_POINTS.map((p) => {
            const available = remaining.includes(p);
            return (
              <button
                key={p}
                type="button"
                disabled={!available}
                onClick={() => {
                  if (!available) return;
                  onPick(p);
                  setOpen(false);
                }}
                style={{
                  ...chipStyle(p),
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  border: "none",
                  padding: 0,
                  cursor: available ? "pointer" : "not-allowed",
                  opacity: available ? 1 : 0.35,
                  textDecoration: available ? "none" : "line-through",
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
