import { VotePageClient } from "./vote-client";

export default async function Page({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  return <VotePageClient shareId={shareId} />;
}
