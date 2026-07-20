"use client";

import { useMemo, useState } from "react";
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
        {draggingPoints !== null ? <Chip points={draggingPoints} dragging /> : null}
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
    <div ref={setNodeRef} className={`tray${isOver ? " is-over" : ""}`}>
      <div className="small muted" style={{ marginBottom: 8 }}>
        Your points — drag one onto an item, or drop it back here to reclaim it.
      </div>
      <div className="row chip-tray" style={{ gap: 8, flexWrap: "wrap", minHeight: 44 }}>
        {EUROVISION_POINTS.map((p) =>
          remaining.includes(p) ? (
            <DraggableChip
              key={p}
              id={trayDragId(p)}
              points={p}
              hidden={draggingPoints === p}
            />
          ) : (
            <span key={p} aria-hidden className="chip-ghost">
              {p}
            </span>
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
    <li ref={setNodeRef} className={`item-row${highlight ? " is-target" : ""}`}>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" width={56} height={56} className="item-thumb" />
      )}
      <div style={{ flex: 1, fontWeight: 500 }}>{item.title}</div>

      <div className="row" style={{ gap: 8 }}>
        {assigned !== undefined ? (
          <DraggableChip
            id={itemDragId(item.id, assigned)}
            points={assigned}
            onClick={onRemove}
            title="Click to send back to the tray"
          />
        ) : (
          <PointPicker onPick={onPick} remaining={remaining} />
        )}
      </div>
    </li>
  );
}

/* ─────────────────── Chips ─────────────────── */

function chipClass(points: EurovisionPoint, opts?: { dragging?: boolean; hidden?: boolean }): string {
  let cls = "chip";
  if (points === 12) cls += " chip-top";
  if (opts?.dragging) cls += " is-dragging";
  if (opts?.hidden) cls += " is-hidden";
  return cls;
}

function Chip({ points, dragging }: { points: EurovisionPoint; dragging?: boolean }) {
  return <div className={chipClass(points, { dragging })}>{points}</div>;
}

function DraggableChip({
  id,
  points,
  onClick,
  title,
  hidden,
}: {
  id: string;
  points: EurovisionPoint;
  onClick?: () => void;
  title?: string;
  hidden?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <button
      type="button"
      ref={setNodeRef}
      onClick={onClick}
      title={title ?? `${points} points — drag onto an item`}
      aria-label={`${points} points`}
      className={chipClass(points, { hidden: hidden || isDragging })}
      {...listeners}
      {...attributes}
    >
      {points}
    </button>
  );
}

/* ─────────── Click fallback for mobile/keyboard users ─────────── */

function PointPicker({
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
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Assign points"
      >
        + Add points
      </button>
      {open && (
        <>
          {/* Invisible backdrop so a tap anywhere else closes the picker. */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "transparent",
              border: "none",
              cursor: "default",
              zIndex: 5,
            }}
          />
          <div
            className="card"
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              padding: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              zIndex: 6,
              minWidth: 228,
              boxShadow: "var(--shadow-md)",
            }}
          >
            {EUROVISION_POINTS.map((p) => {
              const available = remaining.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  disabled={!available}
                  onClick={() => {
                    onPick(p);
                    setOpen(false);
                  }}
                  className={available ? chipClass(p) : "chip-ghost"}
                  style={{ width: 38, height: 38, fontSize: 13, cursor: available ? "pointer" : "not-allowed" }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
