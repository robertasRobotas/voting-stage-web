import type { Metadata } from "next";
import { config } from "@/lib/config";
import { VotePageClient } from "./vote-client";

interface PageProps {
  params: Promise<{ shareId: string }>;
}

/** Board title/description in the tab and link previews when the link is shared. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const fallback: Metadata = { title: "Voting board" };
  try {
    const res = await fetch(`${config.apiUrl}/votings/share/${shareId}`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return fallback;
    const json = (await res.json()) as {
      data?: { title?: string; description?: string };
    };
    if (!json.data?.title) return fallback;
    return {
      title: json.data.title,
      description:
        json.data.description ?? "Cast your Eurovision-style ballot on this voting board.",
    };
  } catch {
    return fallback;
  }
}

export default async function Page({ params }: PageProps) {
  const { shareId } = await params;
  return <VotePageClient shareId={shareId} />;
}
