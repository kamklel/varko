import Link from "next/link";
import { FaqAccordion } from "@/components/FaqAccordion";
import { ScrollHeroSequence } from "@/components/ScrollHeroSequence";

const BENEFITS = [
  {
    title: "Book by the hour",
    body: "Only pay for the time you actually need, from a couple of hours to all day.",
  },
  {
    title: "Fair, local pricing",
    body: "Prices are guided by what similar spots nearby charge, so no one gets overcharged.",
  },
  {
    title: "Any space works",
    body: "A driveway, a field, an empty lot — if it fits a car, it can earn.",
  },
  {
    title: "No back-and-forth",
    body: "See what's available, pick a time, and book instantly — no calls or messaging required.",
  },
];

const FAQ = [
  {
    q: "How is the price decided?",
    a: "Hosts set their own price. We show them what similar spots nearby charge and cap prices so they stay reasonable for the area.",
  },
  {
    q: "Can a listing fit more than one car?",
    a: "Yes. Hosts set a capacity when they list a space, and renters can book more than one spot at a time if they need to.",
  },
  {
    q: "What if my plans change?",
    a: "You can cancel any upcoming booking before it starts from your bookings page.",
  },
  {
    q: "Do I need to create an account to look around?",
    a: "You can search and browse listings without an account. You'll need one to book a spot or list your own.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <ScrollHeroSequence />

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
        <h2 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          How it works
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              1
            </div>
            <h3 className="mt-4 font-medium text-neutral-900 dark:text-neutral-100">
              Host lists a space
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              List a driveway, field, or empty lot. Set how many cars it fits
              and a price — guided by what similar spots nearby charge.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              2
            </div>
            <h3 className="mt-4 font-medium text-neutral-900 dark:text-neutral-100">
              Renter finds &amp; books
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Search for parking near you, pick a time window, and book
              instantly.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              3
            </div>
            <h3 className="mt-4 font-medium text-neutral-900 dark:text-neutral-100">
              Everybody wins
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Renters get somewhere safe to park, and hosts earn from space
              they weren&apos;t using anyway.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
          <h2 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Why Varko
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-lg border border-neutral-200 border-t-4 border-t-blue-600 bg-white p-5 dark:border-neutral-800 dark:border-t-blue-500 dark:bg-neutral-950"
              >
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{b.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
          <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Looking for parking?
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              New in the area or just don&apos;t want to circle the block?
              Search nearby, pick a time window, and book a spot in minutes.
            </p>
            <Link
              href="/search"
              className="mt-4 inline-block text-sm font-medium text-blue-600 underline dark:text-blue-400"
            >
              Find parking
            </Link>
          </div>
          <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Have space to spare?
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              A driveway, a field, an empty lot — list it, set a capacity and
              a price, and start earning from space you weren&apos;t using.
            </p>
            <Link
              href="/host/listings/new"
              className="mt-4 inline-block text-sm font-medium text-blue-600 underline dark:text-blue-400"
            >
              List your space
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
          <h2 className="text-center text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Common questions
          </h2>
          <div className="mt-8">
            <FaqAccordion items={FAQ} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 text-center sm:py-16">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Ready to get started?
        </h2>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/search"
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            Find parking
          </Link>
          <Link
            href="/host/listings/new"
            className="w-full rounded-lg border border-blue-600 bg-white px-6 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 sm:w-auto dark:bg-transparent dark:hover:bg-blue-950"
          >
            List your space
          </Link>
        </div>
      </section>
    </div>
  );
}
