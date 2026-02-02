import { AuthNavbar } from "@/components/AuthNavbar";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthNavbar />
      
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">
            Integritetspolicy
          </h1>
          
          <p className="text-muted-foreground text-sm mb-8">
            Senast uppdaterad: 2 februari 2025
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduktion</h2>
            <p className="text-muted-foreground leading-relaxed">
              Friendly ("vi", "oss", "vår") värnar om din integritet. Denna integritetspolicy 
              förklarar hur vi samlar in, använder, lagrar och skyddar dina personuppgifter 
              när du använder vår tjänst för mående-uppföljning.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Vilka uppgifter vi samlar in</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Vi samlar in följande typer av uppgifter:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Kontouppgifter:</strong> E-postadress, namn och profilinformation</li>
              <li><strong>Hälsodata:</strong> Mående-registreringar, sömnkvalitet, matvanor, träning och medicineringsloggar</li>
              <li><strong>Diagnosinformation:</strong> Information om diagnoser du väljer att registrera</li>
              <li><strong>Kommunikation:</strong> Meddelanden mellan dig och din vårdgivare (om du aktiverar denna funktion)</li>
              <li><strong>Teknisk data:</strong> IP-adress, enhetstyp och användningsmönster</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Hur vi använder dina uppgifter</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Dina uppgifter används för att:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Tillhandahålla och förbättra vår tjänst</li>
              <li>Generera personliga insikter om ditt mående</li>
              <li>Möjliggöra delning av data med vårdgivare du godkänner</li>
              <li>Skicka påminnelser och notifikationer (om du aktiverar detta)</li>
              <li>Analysera användningsmönster för att förbättra tjänsten</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Delning av uppgifter</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Vi delar dina uppgifter endast i följande fall:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Med ditt samtycke:</strong> När du aktivt väljer att dela data med vårdgivare eller anhöriga</li>
              <li><strong>Tjänsteleverantörer:</strong> Med parter som hjälper oss att driva tjänsten (t.ex. molntjänster)</li>
              <li><strong>Rättsliga krav:</strong> Om det krävs enligt lag eller myndighetsföreskrift</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Vi säljer aldrig dina personuppgifter till tredje part.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Datasäkerhet</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vi använder branschstandard säkerhetsåtgärder för att skydda dina uppgifter, 
              inklusive kryptering vid överföring och lagring, säker autentisering och 
              regelbundna säkerhetsgranskningar. All hälsodata lagras inom EU i enlighet 
              med GDPR.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Dina rättigheter</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Enligt GDPR har du rätt att:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Begära tillgång till dina personuppgifter</li>
              <li>Begära rättelse av felaktiga uppgifter</li>
              <li>Begära radering av dina uppgifter</li>
              <li>Invända mot behandling av dina uppgifter</li>
              <li>Begära dataportabilitet</li>
              <li>Återkalla ditt samtycke när som helst</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Lagring och radering</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vi lagrar dina uppgifter så länge du har ett aktivt konto. Du kan när som helst 
              radera ditt konto via profilinställningarna, vilket permanent tar bort all 
              din data från våra system.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              Om du har frågor om denna integritetspolicy eller hur vi hanterar dina 
              personuppgifter, kontakta oss på:{" "}
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
            <span className="text-foreground">Integritetspolicy</span>
            <Link to="/villkor" className="hover:text-foreground transition-colors">
              Användarvillkor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
