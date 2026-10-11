import { Fragment } from 'react';
import { Check, Minus } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CAPABILITIES, ROLE_META, ROLES } from './roles';

export function RolesMatrix() {
  return (
    <section className="surface overflow-hidden">
      <div className="border-b p-5">
        <h2 className="font-semibold">Roles y permisos</h2>
        <p className="text-sm text-muted-foreground">Referencia de lo que puede hacer cada rol. La autorización final la aplica el servidor.</p>
      </div>

      <div className="grid gap-3 border-b p-5 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((r) => (
          <div key={r} className="rounded-xl border bg-background/50 p-3">
            <StatusBadge label={ROLE_META[r].label} tone={ROLE_META[r].tone} />
            <p className="mt-2 text-xs text-muted-foreground">{ROLE_META[r].description}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th scope="col" className="px-5 py-3 text-left font-medium text-muted-foreground">Permiso</th>
              {ROLES.map((r) => (
                <th key={r} scope="col" className="px-3 py-3 text-center font-medium text-muted-foreground">{ROLE_META[r].label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPABILITIES.map((g) => (
              <Fragment key={g.group}>
                <tr className="border-b bg-muted/20">
                  <th colSpan={ROLES.length + 1} scope="colgroup" className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.group}</th>
                </tr>
                {g.items.map((it) => (
                  <tr key={it.label} className="border-b last:border-0">
                    <th scope="row" className="px-5 py-2.5 text-left font-normal">{it.label}</th>
                    {ROLES.map((r) => (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {it.roles.includes(r) ? (
                          <Check className="mx-auto h-4 w-4 text-success" aria-label="Permitido" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="No permitido" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
