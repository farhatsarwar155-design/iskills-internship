import { redirect } from "next/navigation";

export default function MeetingsJoiningPage() {
  redirect("/dashboard?tab=meetings-joining");
}
