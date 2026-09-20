import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = "Voting Stage — vote on anything, Eurovision-style";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

/** Social card shown when a link to the site is shared. Built once at build time. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#171310",
          color: "#faf5ee",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, color: "#e9b44c", letterSpacing: 2 }}>
          {SITE_NAME.toUpperCase()}
        </div>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.08, marginTop: 18 }}>
          Vote on anything like it&apos;s Eurovision.
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 24, color: "#cbbfae" }}>
          Add contenders. Share one link. Douze points decides.
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 52 }}>
          {POINTS.map((p) => (
            <div
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 78,
                height: 78,
                borderRadius: 39,
                fontSize: 34,
                fontWeight: 700,
                background: p === 12 ? "#e11d48" : "#2a231d",
                color: p === 12 ? "#ffffff" : "#faf5ee",
                border: p === 12 ? "none" : "2px solid #4a3f35",
              }}
            >
              {p}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
