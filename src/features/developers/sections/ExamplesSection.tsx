import { CodeBlock } from '@/components/shared/CodeBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Callout, DocBlock, DocHeader } from '../components/doc-ui';

const CURL = `curl -X POST "https://{BASE_URL}/v1/ecf" \\
  -H "Authorization: Bearer $LX_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 3f6c1e0a-7d2b-4b8e-9a51-0c2f5e7d9a10" \\
  -d '{
    "tipoEcf": "E31",
    "comprador": { "rnc": "101000000", "razonSocial": "Cliente Ejemplo, S.R.L." },
    "tipoIngreso": "01",
    "tipoPago": "1",
    "items": [
      { "descripcion": "Servicio de ejemplo", "cantidad": 1, "precioUnitario": 1000.00, "itbis": 18 }
    ]
  }'`;

const JS = `// Node.js 18+ (ejecutar solo en el servidor)
import { randomUUID } from 'node:crypto';

const idempotencyKey = randomUUID(); // guárdalo junto a tu factura interna

const res = await fetch(\`\${process.env.LX_BASE_URL}/v1/ecf\`, {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.LX_TOKEN}\`,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  },
  body: JSON.stringify({
    tipoEcf: 'E31',
    comprador: { rnc: '101000000', razonSocial: 'Cliente Ejemplo, S.R.L.' },
    tipoIngreso: '01',
    tipoPago: '1',
    items: [{ descripcion: 'Servicio de ejemplo', cantidad: 1, precioUnitario: 1000.0, itbis: 18 }],
  }),
});

if (!res.ok) {
  const error = await res.json();
  throw new Error(\`\${error.code}: \${error.message}\`);
}
const ecf = await res.json();
console.log(ecf.encf, ecf.estadoDgii);`;

const JAVA = `// Java 11+ (java.net.http)
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

public class EmitirEcf {
  public static void main(String[] args) throws Exception {
    String idempotencyKey = UUID.randomUUID().toString();
    String body = """
      {
        "tipoEcf": "E31",
        "comprador": { "rnc": "101000000", "razonSocial": "Cliente Ejemplo, S.R.L." },
        "tipoIngreso": "01",
        "tipoPago": "1",
        "items": [
          { "descripcion": "Servicio de ejemplo", "cantidad": 1, "precioUnitario": 1000.00, "itbis": 18 }
        ]
      }
      """;

    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create(System.getenv("LX_BASE_URL") + "/v1/ecf"))
      .header("Authorization", "Bearer " + System.getenv("LX_TOKEN"))
      .header("Content-Type", "application/json")
      .header("Idempotency-Key", idempotencyKey)
      .POST(HttpRequest.BodyPublishers.ofString(body))
      .build();

    HttpResponse<String> response = HttpClient.newHttpClient()
      .send(request, HttpResponse.BodyHandlers.ofString());
    System.out.println(response.statusCode() + " " + response.body());
  }
}`;

const STATUS_CURL = `curl -X GET "https://{BASE_URL}/v1/ecf/{id}/estado" \\
  -H "Authorization: Bearer $LX_TOKEN"`;

export function ExamplesSection() {
  return (
    <>
      <DocHeader eyebrow="Referencia" title="Ejemplos de solicitudes" description="Emisión de un Crédito Fiscal Electrónico (E31) en distintos lenguajes." />

      <div className="mb-8">
        <Callout tone="warning" title="Ejemplo ilustrativo">
          Los campos y rutas pueden cambiar con la publicación de la especificación OpenAPI oficial. Ejecuta estas llamadas solo desde tu servidor.
        </Callout>
      </div>

      <DocBlock title="Emitir un comprobante">
        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="mb-3 w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="js">JavaScript</TabsTrigger>
            <TabsTrigger value="java">Java</TabsTrigger>
          </TabsList>
          <TabsContent value="curl">
            <CodeBlock lang="bash" title="cURL — Ejemplo ilustrativo" code={CURL} />
          </TabsContent>
          <TabsContent value="js">
            <CodeBlock lang="javascript" title="JavaScript — Ejemplo ilustrativo" code={JS} />
          </TabsContent>
          <TabsContent value="java">
            <CodeBlock lang="java" title="Java — Ejemplo ilustrativo" code={JAVA} />
          </TabsContent>
        </Tabs>
      </DocBlock>

      <DocBlock title="Consultar el estado" description="Consulta el estado DGII hasta obtener un resultado definitivo (aceptado, aceptado condicional o rechazado).">
        <CodeBlock lang="bash" title="cURL — Ejemplo ilustrativo" code={STATUS_CURL} />
      </DocBlock>
    </>
  );
}
