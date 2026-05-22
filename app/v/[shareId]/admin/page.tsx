import { AdminPageClient } from "./admin-client";

export default async function Page({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  return <AdminPageClient shareId={shareId} />;
}
