import type { Metadata } from "next";
import { SearchClient } from "@/components/SearchClient";

export const metadata: Metadata = {
  title: "Find parking near you",
  description:
    "Search for available parking spots near you on Varko. Book driveways, lots, and private parking by the hour, instantly.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return <SearchClient />;
}
