import { notFound, redirect } from "next/navigation";

export default async function WelcomePage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  if (!/^\d{17,20}$/.test(guildId)) notFound();
  redirect(`/server-dashboard?welcome=${guildId}`);
}
