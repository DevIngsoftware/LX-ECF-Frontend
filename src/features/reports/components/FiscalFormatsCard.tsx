import { FileCheck2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FORMATS = [
  { code: '606', title: 'Formato 606', description: 'Envío de compras de bienes y servicios.' },
  { code: '607', title: 'Formato 607', description: 'Envío de ventas de bienes y servicios.' },
];

export function FiscalFormatsCard() {
  return (
    <section className="surface overflow-hidden" aria-labelledby="fiscal-formats-title">
      <div className="flex items-start justify-between gap-3 border-b p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><FileCheck2 className="h-4 w-4" aria-hidden /></span>
          <div>
            <h2 id="fiscal-formats-title" className="font-semibold">Formatos fiscales 606 / 607</h2>
            <p className="text-xs text-muted-foreground">Preparación de los formatos de envío de datos a la DGII.</p>
          </div>
        </div>
        <Badge variant="neutral" className="shrink-0">Preparado</Badge>
      </div>
      <ul className="divide-y">
        {FORMATS.map((f) => (
          <li key={f.code} className="flex items-center justify-between gap-3 p-5">
            <div className="min-w-0">
              <p className="font-medium">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.description}</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Lock /> Generar
            </Button>
          </li>
        ))}
      </ul>
      <p className="border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
        Disponible cuando el backend lo habilite. Revisa siempre los formatos antes de presentarlos ante la DGII.
      </p>
    </section>
  );
}
