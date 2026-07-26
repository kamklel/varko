import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ListingForm } from "@/components/ListingForm";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <ListingForm />;
}
