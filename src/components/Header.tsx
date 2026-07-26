import Link from "next/link";
import { auth } from "@/lib/auth";
import { HeaderClient } from "@/components/HeaderClient";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/70 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-950/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="lowercase text-lg font-bold text-blue-600 dark:text-blue-400"
        >
          Varko
        </Link>
        <HeaderClient isLoggedIn={!!session?.user} userName={session?.user?.name ?? undefined} />
      </div>
    </header>
  );
}
