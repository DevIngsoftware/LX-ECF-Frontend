import { KeyRound, ShieldCheck } from 'lucide-react';
import { CodeBlock } from '@/components/shared/CodeBlock';
import { Callout, DocBlock, DocHeader, InlineCode } from '../components/doc-ui';

const BEARER = `GET /v1/ecf HTTP/1.1
Host: {BASE_URL}
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json`;

const API_KEY = `curl -X POST "https://{BASE_URL}/v1/auth/token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "lx_test_XXXX",
    "apiSecret": "$LX_API_SECRET"
  }'`;

const TOKEN_RESPONSE = `{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}`;

const METHODS = [
  {
    icon: KeyRound,
    title: 'Credencial de API',
    text: 'Para integraciones servidor a servidor. Intercambia tu clave y secreto por un token de acceso de corta duración.',
  },
  {
    icon: ShieldCheck,
    title: 'Token Bearer (JWT)',
    text: 'Cada solicitud debe incluir el token en el encabezado Authorization. Renueva el token antes de su expiración.',
  },
];

export function AuthSection() {
  return (
    <>
      <DocHeader eyebrow="Comenzar" title="Autenticación" description="La API utiliza tokens Bearer (JWT) obtenidos a partir de una credencial de API de tu empresa." />

      <DocBlock>
        <div className="grid gap-4 sm:grid-cols-2">
          {METHODS.map((m) => (
            <div key={m.title} className="surface p-5">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <m.icon className="h-4 w-4" aria-hidden />
              </span>
              <h3 className="font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.text}</p>
            </div>
          ))}
        </div>
      </DocBlock>

      <DocBlock title="1. Obtener un token" description="Intercambia la credencial por un token de acceso desde tu servidor.">
        <CodeBlock lang="bash" title="cURL — Ejemplo ilustrativo" code={API_KEY} />
        <CodeBlock lang="json" title="Respuesta 200 — Ejemplo ilustrativo" code={TOKEN_RESPONSE} />
      </DocBlock>

      <DocBlock title="2. Usar el token" description="Incluye el token en cada solicitud.">
        <CodeBlock lang="http" title="HTTP" code={BEARER} />
        <p className="text-sm text-muted-foreground">
          Si el token expira o es inválido, la API responde <InlineCode>401 Unauthorized</InlineCode>. Solicita un nuevo token y repite la operación
          solo si es segura (consultas) o si usas el mismo <InlineCode>Idempotency-Key</InlineCode> (emisión).
        </p>
      </DocBlock>

      <DocBlock title="Buenas prácticas de seguridad">
        <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground marker:text-brand">
          <li>Guarda el secreto en un gestor de secretos o variable de entorno del servidor.</li>
          <li>Nunca incluyas el secreto en aplicaciones móviles, JavaScript del navegador ni repositorios de código.</li>
          <li>Usa credenciales distintas para pruebas y producción.</li>
          <li>Revoca de inmediato cualquier credencial que sospeches comprometida.</li>
        </ul>
        <Callout tone="warning" title="Flujo sujeto a confirmación">
          El endpoint de intercambio de token y su formato son ilustrativos hasta la publicación de la especificación OpenAPI oficial.
        </Callout>
      </DocBlock>
    </>
  );
}
