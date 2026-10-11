import { ExternalLink, FileCheck2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FORMATS = [
  { code: '606', title: 'Formato 606', description: 'Compras y gastos que correspondan. La generación requiere datos fiscales adicionales de cada operación.' },
  { code: '607', title: 'Formato 607', description: 'Los e-CF emitidos no se remiten en este formato. Puede aplicar a ventas no electrónicas autorizadas.' },
];

export function FiscalFormatsCard() {
  return (
    <section className="surface overflow-hidden" aria-labelledby="fiscal-formats-title">
      <div className="flex items-start justify-between gap-3 border-b p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><FileCheck2 className="h-4 w-4" aria-hidden /></span>
          <div>
            <h2 id="fiscal-formats-title" className="font-semibold">Formatos fiscales 606 / 607</h2>
            <p className="text-xs text-muted-foreground">Alcance según las operaciones de tu empresa.</p>
          </div>
        </div>
        <Badge variant="neutral" className="shrink-0">En preparación</Badge>
      </div>
      <ul className="divide-y">
        {FORMATS.map((f) => (
          <li key={f.code} className="flex items-center justify-between gap-3 p-5">
            <div className="min-w-0">
              <p className="font-medium">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </div>
            {f.code === '606' ? <Button variant="outline" size="sm" disabled><Lock /> Generar</Button> : <Badge variant="neutral">No aplica a e-CF</Badge>}
          </li>
        ))}
      </ul>
      <p className="border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
        La DGII recibe los e-CF emitidos mediante XML. Consulta sus{' '}
        <a className="inline-flex items-center gap-0.5 font-medium underline" href="https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Preguntas%20frecuentes/Generales/Preguntas%20Frecuentes%20e-CF%20Generales.pdf" target="_blank" rel="noopener noreferrer">
          preguntas frecuentes <ExternalLink className="h-3 w-3" aria-hidden />
        </a>{' '}antes de presentar formatos.
      </p>
    </section>
  );
}
