import { CreditCard } from 'lucide-react';
import { EmptyState } from '@/components/shared/states';

export function CompanySubscriptionCard() {
  return (
    <section className="surface p-5" aria-labelledby="sub-title">
      <h2 id="sub-title" className="mb-4 font-semibold">Suscripción</h2>
      <EmptyState compact icon={CreditCard} title="Sin suscripción registrada" description="La suscripción aparecerá aquí cuando se conecte ese módulo con la API." />
    </section>
  );
}
