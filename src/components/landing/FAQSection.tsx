import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Vad är Toddy?",
    answer:
      "Toddy är en digital stämningsdagbok byggd för dig som lever med bipolär sjukdom, depression eller andra former av psykisk ohälsa. Du loggar ditt mående, sömn, energi och mediciner — Toddy hjälper dig se mönster och dela datan med din läkare eller anhöriga.",
  },
  {
    question: "Vad kostar Toddy?",
    answer:
      "Toddy är gratis att använda. Vi tror på att verktyg för psykisk hälsa ska vara tillgängliga för alla. Om vi i framtiden lägger till premium-funktioner kommer grundfunktionerna alltid förbli gratis.",
  },
  {
    question: "Hur lång tid tar det att fylla i en dagbok?",
    answer:
      "Cirka 30 sekunder per dag. Vi har designat in-checkningen för att vara så snabb som möjligt — bara välj nivå för stämning, sömn och energi. Du kan lägga till fler detaljer om du vill, men det är aldrig krav.",
  },
  {
    question: "Är min data säker?",
    answer:
      "Ja. Vi krypterar all data, lagrar den inom EU och delar aldrig med tredje part utan ditt uttryckliga samtycke. Du kan när som helst exportera eller radera all din data permanent från inställningar.",
  },
  {
    question: "Kan min läkare se min data?",
    answer:
      "Bara om du själv väljer att dela. Du kan generera en rapport för en specifik tidsperiod och dela med din vårdgivare via en säker länk, eller bjuda in din läkare till en koppling där hen får kontinuerlig insyn.",
  },
  {
    question: "Funkar Toddy om jag inte har en diagnos?",
    answer:
      "Absolut. Du behöver ingen diagnos för att använda Toddy. Många använder det för att förstå sin egen rytm bättre, för att hantera ångest eller stress, eller för att samla data inför ett första läkarbesök.",
  },
  {
    question: "Kan anhöriga följa min utveckling?",
    answer:
      "Ja, om du själv bjuder in dem. Toddy har en speciell anhörigvy där en partner, förälder eller nära vän kan se ditt mående och få varningar om något ser oroande ut. Du bestämmer själv vilka detaljer som delas.",
  },
  {
    question: "Vad gör Toddy med min data?",
    answer:
      "Vi använder din data uteslutande för att ge dig insikter och funktionalitet i appen. Vi säljer aldrig data, visar aldrig reklam, och tränar aldrig externa AI-modeller på din data. Vill du veta mer — läs vår integritetspolicy.",
  },
];

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

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
