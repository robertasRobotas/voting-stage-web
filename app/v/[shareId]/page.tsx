import type { Metadata } from "next";
import { connectDb } from "@/server/db";
import { findByShareId } from "@/server/voting/voting.repository";
import { VotePageClient } from "./vote-client";

interface PageProps {
  params: Promise<{ shareId: string }>;
}

/** Board title/description in the tab and link previews when the link is shared. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const fallback: Metadata = { title: "Voting board" };
  try {
    // The API lives in this app, so read the board directly instead of making
    // an HTTP request back to ourselves.
    await connectDb();
    const voting = await findByShareId(shareId);
    if (!voting) return fallback;
    return {
      title: voting.title,
      description:
        voting.description ?? "Cast your Eurovision-style ballot on this voting board.",
    };
  } catch {
    return fallback;
  }
}

export default async function Page({ params }: PageProps) {
  const { shareId } = await params;
  return <VotePageClient shareId={shareId} />;
}
