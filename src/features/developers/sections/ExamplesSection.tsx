import { CodeBlock } from '@/components/shared/CodeBlock';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Callout, DocBlock, DocHeader } from '../components/doc-ui';
import { EMIT_REQUEST } from './reference-data';

const CURL = `curl -X POST "https://{BASE_URL}/v1/api-client/facturas" \\
  -H "Authorization: Bearer $LX_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 3f6c1e0a-7d2b-4b8e-9a51-0c2f5e7d9a10" \\
  -d '${EMIT_REQUEST}'`;

const JS = `// Node.js 18+; ejecutar desde tu servidor
import { randomUUID } from 'node:crypto';

const idempotencyKey = randomUUID(); // conservar junto a la factura interna
const response = await fetch(\`\${process.env.LX_BASE_URL}/v1/api-client/facturas\`, {
  method: 'POST',
  headers: {
    Authorization: \`Bearer \${process.env.LX_ACCESS_TOKEN}\`,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  },
  body: JSON.stringify({
    tipoEcf: 'E31',
    rncComprador: '101123456',
    razonSocialComprador: 'Cliente de prueba',
    tipoIngresos: '01',
    tipoPago: '1',
    items: [{ descripcion: 'Servicio de ejemplo', indicadorBienServicio: '2',
      cantidad: 1, precioUnitario: 1000, descuento: 0, tasaItbis: 18 }],
  }),
});
if (!response.ok) throw new Error(await response.text());
const invoice = await response.json();
console.log(invoice.encf, invoice.dgiiStatus);`;

const JAVA = `// Java 17+ (java.net.http)
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.UUID;

public class CrearEcf {
  public static void main(String[] args) throws Exception {
    String body = """
      ${EMIT_REQUEST}
      """;
    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create(System.getenv("LX_BASE_URL") + "/v1/api-client/facturas"))
      .header("Authorization", "Bearer " + System.getenv("LX_ACCESS_TOKEN"))
      .header("Content-Type", "application/json")
      .header("Idempotency-Key", UUID.randomUUID().toString())
      .POST(HttpRequest.BodyPublishers.ofString(body))
      .build();
    HttpResponse<String> response = HttpClient.newHttpClient()
      .send(request, HttpResponse.BodyHandlers.ofString());
    System.out.println(response.statusCode() + " " + response.body());
  }
}`;

const STATUS_CURL = `curl -X GET "https://{BASE_URL}/v1/api-client/facturas/{eNcf}/estado" \\
  -H "Authorization: Bearer $LX_ACCESS_TOKEN"`;

export function ExamplesSection() {
  return (
    <>
      <DocHeader eyebrow="Referencia" title="Ejemplos de solicitudes" description="Creación de un Crédito Fiscal Electrónico (E31) en distintos lenguajes." />
      <div className="mb-8">
        <Callout tone="info" title="Antes de crear">
          Obtén un token técnico con tu API Key y API Secret, configura la secuencia E31 y los datos fiscales de la empresa. Crear el comprobante no lo envía a la DGII: usa POST /v1/api-client/facturas/{'{eNcf}'}/enviar después de revisarlo.
        </Callout>
      </div>
      <DocBlock title="Crear un comprobante">
        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="mb-3 w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="curl">cURL</TabsTrigger>
            <TabsTrigger value="js">JavaScript</TabsTrigger>
            <TabsTrigger value="java">Java</TabsTrigger>
          </TabsList>
          <TabsContent value="curl"><CodeBlock lang="bash" title="cURL" code={CURL} /></TabsContent>
          <TabsContent value="js"><CodeBlock lang="javascript" title="JavaScript" code={JS} /></TabsContent>
          <TabsContent value="java"><CodeBlock lang="java" title="Java" code={JAVA} /></TabsContent>
        </Tabs>
      </DocBlock>
      <DocBlock title="Consultar el estado" description="Después de enviar el comprobante, consulta el estado DGII con el e-NCF; la API usa internamente el track ID recibido.">
        <CodeBlock lang="bash" title="cURL" code={STATUS_CURL} />
      </DocBlock>
    </>
  );
}
