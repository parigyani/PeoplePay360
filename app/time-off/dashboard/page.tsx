import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TimeOffDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // A full dashboard can be implemented later. For now, redirect to requests list
  // or show a placeholder.
  redirect("/time-off/requests");
}
