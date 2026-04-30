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
      "Toddy är en stämningsdagbok byggd specifikt för dig som lever med bipolär sjukdom — typ I, typ II eller cyklotymi. Vi är inte en generell app för psykisk ohälsa. Allt — från mood-skalan med både uppvarvning och nedstämdhet, till sömn-, energi- och medicinspårning — är designat utifrån hur bipolära episoder ser ut och utvecklas över dagar och veckor. Du loggar dagligen och Toddy hjälper dig se mönster, fånga tidiga varningssignaler och dela datan med din läkare eller anhöriga.",
  },
  {
    question: "Vad kostar Toddy?",
    answer:
      "Toddy är gratis att använda. Vi tror att verktyg för att hantera bipolär sjukdom ska vara tillgängliga för alla som behöver dem. Om vi i framtiden lägger till premium-funktioner kommer grundfunktionerna alltid förbli gratis.",
  },
  {
    question: "Hur lång tid tar det att fylla i en dagbok?",
    answer:
      "Cirka 30 sekunder per dag. Vi har designat in-checkningen för att vara så snabb som möjligt — välj nivå för stämning (från kraftigt nedstämd till kraftigt uppvarvad), sömn och energi. Du kan lägga till fler detaljer om du vill, men det är aldrig krav. En check-in per dag räcker — bipolära episoder pågår över dagar och veckor, inte timmar.",
  },
  {
    question: "Är min data säker?",
    answer:
      "Ja. Vi krypterar all data, lagrar den inom EU och delar aldrig med tredje part utan ditt uttryckliga samtycke. Du kan när som helst exportera eller permanent radera all din data från inställningar.",
  },
  {
    question: "Kan min läkare se min data?",
    answer:
      "Bara om du själv väljer att dela. Du kan generera en rapport för en specifik tidsperiod och dela med din vårdgivare via en säker länk, eller bjuda in din läkare till en koppling där hen får kontinuerlig insyn — särskilt värdefullt vid uppföljning av medicin som litium eller lamotrigin, eller för att fånga episoder mellan besök.",
  },
  {
    question: "Funkar Toddy om jag inte har en diagnos?",
    answer:
      "Toddy är specifikt framtaget för bipolär sjukdom — inte för psykisk ohälsa generellt. Men du behöver inte ha en formell diagnos för att använda appen. Många använder Toddy för att samla data inför ett första läkarbesök eller för att utreda om mönstren i deras mående tyder på bipolaritet (till exempel typ II som ofta missas som unipolär depression). Söker du ett verktyg för enbart ångest eller stress utan misstanke om bipolaritet finns det andra appar som passar bättre.",
  },
  {
    question: "Kan anhöriga följa min utveckling?",
    answer:
      "Ja, om du själv bjuder in dem. Toddy har en speciell anhörigvy där en partner, förälder eller nära vän kan se ditt mående och få varningar om något ser oroande ut. Detta är extra viktigt vid bipolär sjukdom eftersom insiktsbristen vid uppvarvade episoder kan göra det svårt att själv märka när något håller på att gå överstyr — anhöriga ser ofta tecknen först. Du bestämmer själv vilka detaljer som delas.",
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
