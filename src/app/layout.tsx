import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "QatarJobs — All Qatar job listings in one place",
    template: "%s | QatarJobs",
  },
  description:
    "Aggregated job classifieds for Qatar: fresh listings from multiple job boards, updated daily. Search by keyword, city, salary, and industry.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="inline-block h-6 w-6 rounded bg-[#8a1538]" aria-hidden />
              <span>
                Qatar<span className="text-[#8a1538]">Jobs</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Jobs
              </Link>
              <Link href="/admin" className="hover:text-slate-900">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
            <p>
              QatarJobs aggregates publicly listed jobs from multiple sources. Listings
              link back to the original posting; apply on the source site. Only jobs
              posted in the last 2 months are shown.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
