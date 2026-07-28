import { redirect } from "next/navigation";

export default function MeetingsCreatedPage() {
  redirect("/dashboard?tab=meetings-created");
}
