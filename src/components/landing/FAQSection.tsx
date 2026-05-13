import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection() {
  const { t } = useTranslation();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = (t("landingFaq.items", { returnObjects: true }) as FAQItem[]) ?? [];
  const eyebrow = t("landingFaq.eyebrow");
  const heading = t("landingFaq.heading");

  // JSON-LD strukturerad data — gör att Google kan visa frågorna direkt i sökresultaten
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="relative z-10 py-20 md:py-32 px-5 md:px-8 bg-[hsl(225_30%_5%)]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 md:mb-16">
            <p className="text-sm uppercase tracking-widest text-[hsl(45_85%_55%)]/80 mb-3">
              Vanliga frågor
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
              Allt du undrar om Toddy
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-white/[0.02] transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base md:text-lg font-medium text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-white/70 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
