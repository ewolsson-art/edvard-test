import { AuthNavbar } from '@/components/AuthNavbar';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Handshake, Building2, GraduationCap, Heart, Mail, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Partners = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const partnerTypes = [
    { icon: Building2, titleKey: 'partnersPage.healthcareOrgs', descKey: 'partnersPage.healthcareOrgsDesc' },
    { icon: GraduationCap, titleKey: 'partnersPage.researchInstitutes', descKey: 'partnersPage.researchInstitutesDesc' },
    { icon: Heart, titleKey: 'partnersPage.userOrgs', descKey: 'partnersPage.userOrgsDesc' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AuthNavbar />
      
      <main className="flex-1 pt-20">
        <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-background via-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              <span className="text-primary">{t('partnersPage.heroTitle1')}</span>{t('partnersPage.heroTitle2')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('partnersPage.heroDescription')}
            </p>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-12 text-center">{t('partnersPage.whoWePartnerWith')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {partnerTypes.map((type) => (
                <div key={type.titleKey} className="glass-card p-8 text-center hover:shadow-lg transition-shadow">
                  <type.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{t(type.titleKey)}</h3>
                  <p className="text-muted-foreground">{t(type.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-display font-semibold mb-8 text-center">{t('partnersPage.whyPartner')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <Handshake className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{t('partnersPage.sharedVision')}</h3>
                <p className="text-muted-foreground text-sm">{t('partnersPage.sharedVisionDesc')}</p>
              </div>
              <div className="glass-card p-6">
                <Building2 className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{t('partnersPage.flexibleIntegrations')}</h3>
                <p className="text-muted-foreground text-sm">{t('partnersPage.flexibleIntegrationsDesc')}</p>
              </div>
              <div className="glass-card p-6">
                <GraduationCap className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{t('partnersPage.evidenceBased')}</h3>
                <p className="text-muted-foreground text-sm">{t('partnersPage.evidenceBasedDesc')}</p>
              </div>
              <div className="glass-card p-6">
                <Heart className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{t('partnersPage.userFocus')}</h3>
                <p className="text-muted-foreground text-sm">{t('partnersPage.userFocusDesc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-display font-semibold mb-8">{t('partnersPage.ourPartners')}</h2>
            <div className="glass-card p-12">
              <p className="text-muted-foreground mb-4">{t('partnersPage.partnersP1')}</p>
              <p className="text-sm text-muted-foreground">{t('partnersPage.partnersP2')}</p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 md:px-8 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display font-semibold mb-4">{t('partnersPage.contactTitle')}</h2>
            <p className="text-muted-foreground mb-6">{t('partnersPage.contactDescription')}</p>
            <Button onClick={() => navigate('/skapa-konto')} size="lg" className="gap-2">
              {t('partnersPage.contactButton')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Partners;
