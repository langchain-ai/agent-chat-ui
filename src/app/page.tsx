import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect root URL to workbench view (home)
  redirect("/workbench/map");
}
