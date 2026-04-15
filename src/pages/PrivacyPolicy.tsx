import { AuthNavbar } from "@/components/AuthNavbar";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthNavbar />
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">{t('privacyPolicyPage.title')}</h1>
          <p className="text-muted-foreground text-sm mb-8">{t('privacyPolicyPage.lastUpdated')}</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s1Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('privacyPolicyPage.s1Text')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s2Title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('privacyPolicyPage.s2Intro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('privacyPolicyPage.s2i1')}</li>
              <li>{t('privacyPolicyPage.s2i2')}</li>
              <li>{t('privacyPolicyPage.s2i3')}</li>
              <li>{t('privacyPolicyPage.s2i4')}</li>
              <li>{t('privacyPolicyPage.s2i5')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s3Title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('privacyPolicyPage.s3Intro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('privacyPolicyPage.s3i1')}</li>
              <li>{t('privacyPolicyPage.s3i2')}</li>
              <li>{t('privacyPolicyPage.s3i3')}</li>
              <li>{t('privacyPolicyPage.s3i4')}</li>
              <li>{t('privacyPolicyPage.s3i5')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s4Title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('privacyPolicyPage.s4Intro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('privacyPolicyPage.s4i1')}</li>
              <li>{t('privacyPolicyPage.s4i2')}</li>
              <li>{t('privacyPolicyPage.s4i3')}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">{t('privacyPolicyPage.s4Footer')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s5Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('privacyPolicyPage.s5Text')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s6Title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('privacyPolicyPage.s6Intro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>{t('privacyPolicyPage.s6i1')}</li>
              <li>{t('privacyPolicyPage.s6i2')}</li>
              <li>{t('privacyPolicyPage.s6i3')}</li>
              <li>{t('privacyPolicyPage.s6i4')}</li>
              <li>{t('privacyPolicyPage.s6i5')}</li>
              <li>{t('privacyPolicyPage.s6i6')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s7Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('privacyPolicyPage.s7Text')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('privacyPolicyPage.s8Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacyPolicyPage.s8Text')}{" "}
              <a href="mailto:support@friendly.se" className="text-primary hover:underline">support@friendly.se</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="py-3 px-4 border-t border-border/40 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t('privacyPolicyPage.footerRights')}</span>
          <div className="flex items-center gap-4">
            <span className="text-foreground">{t('privacyPolicyPage.footerPrivacy')}</span>
            <Link to="/villkor" className="hover:text-foreground transition-colors">{t('privacyPolicyPage.footerTerms')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
