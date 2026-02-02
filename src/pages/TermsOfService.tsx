import { AuthNavbar } from "@/components/AuthNavbar";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthNavbar />
      
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">
            Användarvillkor
          </h1>
          
          <p className="text-muted-foreground text-sm mb-8">
            Senast uppdaterad: 2 februari 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Godkännande av villkor</h2>
            <p className="text-muted-foreground leading-relaxed">
              Genom att använda Friendly ("Tjänsten") godkänner du dessa användarvillkor. 
              Om du inte godkänner villkoren, vänligen avstå från att använda Tjänsten. 
              Friendly tillhandahålls av Friendly AB.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Tjänstens syfte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Friendly är ett digitalt verktyg för att hjälpa användare att följa och 
              förstå sitt mående över tid. Tjänsten är utformad som ett komplement till, 
              inte en ersättning för, professionell medicinsk rådgivning, diagnos eller 
              behandling.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Medicinskt ansvarsfriskrivning</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong>Viktigt:</strong> Friendly är inte en medicinsk tjänst och ersätter 
              inte professionell vård.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>AI-genererade insikter är endast informativa och ska inte ses som medicinsk rådgivning</li>
              <li>Kontakta alltid sjukvården vid akuta symtom eller försämring av ditt mående</li>
              <li>Vid nödsituation, ring 112 eller kontakta närmaste akutmottagning</li>
              <li>Rådgör alltid med din läkare innan du gör förändringar i din medicinering</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Användarkonto</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              För att använda Tjänsten behöver du skapa ett konto. Du ansvarar för att:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Ange korrekt och aktuell information</li>
              <li>Hålla dina inloggningsuppgifter konfidentiella</li>
              <li>Omedelbart meddela oss vid misstänkt obehörig åtkomst</li>
              <li>All aktivitet som sker via ditt konto</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Användarnas skyldigheter</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Du förbinder dig att:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Använda Tjänsten i enlighet med gällande lagar och dessa villkor</li>
              <li>Inte dela ditt konto med andra</li>
              <li>Inte försöka manipulera eller störa Tjänstens funktion</li>
              <li>Inte använda Tjänsten för olagliga eller skadliga ändamål</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Delning med vårdgivare</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tjänsten erbjuder möjlighet att dela din data med vårdgivare och anhöriga. 
              Du har full kontroll över vilken information som delas och kan när som helst 
              ändra eller återkalla ditt samtycke. Notera att vårdgivare som tar emot din 
              data har ett eget ansvar att hantera den i enlighet med gällande 
              sekretesslagstiftning.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Immateriella rättigheter</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tjänsten och allt innehåll, inklusive men inte begränsat till design, logotyper, 
              text och programvara, tillhör Friendly AB och är skyddat av upphovsrätt och 
              andra immateriella rättigheter. Du får inte kopiera, modifiera eller distribuera 
              något av detta utan vårt skriftliga godkännande.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Ansvarsbegränsning</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tjänsten tillhandahålls "i befintligt skick". Vi garanterar inte att Tjänsten 
              kommer att vara felfri, oavbruten eller uppfylla alla dina behov. I den 
              utsträckning lagen tillåter ansvarar vi inte för indirekta skador, 
              följdskador eller förlorad data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Ändringar av villkoren</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vi förbehåller oss rätten att uppdatera dessa villkor. Vid väsentliga 
              ändringar kommer vi att meddela dig via e-post eller genom ett meddelande 
              i Tjänsten. Fortsatt användning efter sådana ändringar utgör godkännande 
              av de nya villkoren.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Uppsägning</h2>
            <p className="text-muted-foreground leading-relaxed">
              Du kan när som helst avsluta ditt konto via profilinställningarna. Vi 
              förbehåller oss rätten att stänga av eller avsluta konton som bryter mot 
              dessa villkor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Tillämplig lag</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dessa villkor regleras av svensk lag. Tvister som uppstår i anslutning 
              till dessa villkor ska avgöras av svensk allmän domstol.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              Om du har frågor om dessa användarvillkor, kontakta oss på:{" "}
              <a href="mailto:support@friendly.se" className="text-primary hover:underline">
                support@friendly.se
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-4 border-t border-border/40 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2025 Friendly. Alla rättigheter förbehållna.</span>
          <div className="flex items-center gap-4">
            <Link to="/integritet" className="hover:text-foreground transition-colors">
              Integritetspolicy
            </Link>
            <span className="text-foreground">Användarvillkor</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
