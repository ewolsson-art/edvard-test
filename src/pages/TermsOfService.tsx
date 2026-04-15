import { AuthNavbar } from "@/components/AuthNavbar";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthNavbar />
      <main className="flex-1 pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">{t('termsPage.title')}</h1>
          <p className="text-muted-foreground text-sm mb-8">{t('termsPage.lastUpdated')}</p>

          {[
            { title: 's1Title', content: 's1Text' },
            { title: 's2Title', content: 's2Text' },
          ].map(s => (
            <section key={s.title} className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t(`termsPage.${s.title}`)}</h2>
              <p className="text-muted-foreground leading-relaxed">{t(`termsPage.${s.content}`)}</p>
            </section>
          ))}

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsPage.s3Title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4"><strong>{t('termsPage.s3Intro')}</strong></p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              {['s3i1','s3i2','s3i3','s3i4'].map(k => <li key={k}>{t(`termsPage.${k}`)}</li>)}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsPage.s4Title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('termsPage.s4Intro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              {['s4i1','s4i2','s4i3','s4i4'].map(k => <li key={k}>{t(`termsPage.${k}`)}</li>)}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsPage.s5Title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('termsPage.s5Intro')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              {['s5i1','s5i2','s5i3','s5i4'].map(k => <li key={k}>{t(`termsPage.${k}`)}</li>)}
            </ul>
          </section>

          {[
            { title: 's6Title', content: 's6Text' },
            { title: 's7Title', content: 's7Text' },
            { title: 's8Title', content: 's8Text' },
            { title: 's9Title', content: 's9Text' },
            { title: 's10Title', content: 's10Text' },
            { title: 's11Title', content: 's11Text' },
          ].map(s => (
            <section key={s.title} className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">{t(`termsPage.${s.title}`)}</h2>
              <p className="text-muted-foreground leading-relaxed">{t(`termsPage.${s.content}`)}</p>
            </section>
          ))}

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">{t('termsPage.s12Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('termsPage.s12Text')}{" "}
              <a href="mailto:support@friendly.se" className="text-primary hover:underline">support@friendly.se</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="py-3 px-4 border-t border-border/40 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t('termsPage.footerRights')}</span>
          <div className="flex items-center gap-4">
            <Link to="/integritet" className="hover:text-foreground transition-colors">{t('termsPage.footerPrivacy')}</Link>
            <span className="text-foreground">{t('termsPage.footerTerms')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
