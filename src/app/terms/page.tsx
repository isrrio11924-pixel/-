import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";
import { TERMS_OF_SERVICE } from "@/lib/legal-content";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="font-display text-lg text-[var(--ink)]">
          航路
        </Link>
        <div className="mt-6">
          <LegalDoc content={TERMS_OF_SERVICE} />
        </div>
      </div>
    </div>
  );
}
