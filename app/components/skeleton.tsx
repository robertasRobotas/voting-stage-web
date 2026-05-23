"use client";

import type { CSSProperties } from "react";

export function Skeleton({
  width = "100%",
  height = 16,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className="skeleton"
      style={{ width, height, borderRadius: radius, display: "inline-block", ...style }}
    />
  );
}

export function SkeletonRow({ lines = 3 }: { lines?: number }) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={14} width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}
