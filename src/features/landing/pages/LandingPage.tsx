import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { PresentationSection } from '../components/PresentationSection';
import { BenefitsSection } from '../components/BenefitsSection';
import { FeaturesSection } from '../components/FeaturesSection';
import { DgiiFlowSection } from '../components/DgiiFlowSection';
import { ApiSection } from '../components/ApiSection';
import { ModulesSection } from '../components/ModulesSection';
import { PlansSection } from '../components/PlansSection';
import { FaqSection } from '../components/FaqSection';
import { FinalCta } from '../components/FinalCta';

export function LandingPage() {
  const { hash } = useLocation();

  // La página se carga de forma diferida: al montarse, se desplaza al ancla solicitada.
  useEffect(() => {
    if (!hash) return;
    const id = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
    return () => window.clearTimeout(id);
  }, [hash]);

  useEffect(() => {
    document.title = 'LX e-CF · Facturación electrónica para República Dominicana';
  }, []);

  return (
    <>
      <HeroSection />
      <PresentationSection />
      <BenefitsSection />
      <FeaturesSection />
      <DgiiFlowSection />
      <ApiSection />
      <ModulesSection />
      <PlansSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
