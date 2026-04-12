import type { Metadata } from "next";
import { NewsDesk } from "@/components/news-briefing";

export const metadata: Metadata = {
  title: "Drone News Desk | DroneAI Academy",
  description:
    "Verified drone news across the EU, the United States, and Canada, curated for operators, trainees, and enterprise teams.",
};

export default function NewsPage() {
  return <NewsDesk />;
}
