import { ExternalLink, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ENV } from '@/constants/env';

function documentationUrls() {
  if (!ENV.apiBaseUrl) return null;
  try {
    const base = new URL(ENV.apiBaseUrl, window.location.origin);
    const root = base.pathname.replace(/\/v1\/?$/, '').replace(/\/$/, '');
    const specification = `${base.origin}${root}/v3/api-docs/desarrolladores`;
    const swagger = new URL(`${root}/swagger-ui/index.html`, base.origin);
    swagger.searchParams.set('url', `${root}/v3/api-docs/desarrolladores`);
    return { specification, swagger: swagger.toString() };
  } catch {
    return null;
  }
}

export function SwaggerLinks() {
  const urls = documentationUrls();
  if (!urls) return <p className="text-sm text-muted-foreground">Configura la URL de la API para abrir Swagger desde este portal.</p>;

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <a href={urls.swagger} target="_blank" rel="noopener noreferrer"><ExternalLink /> Abrir Swagger de integraciones</a>
      </Button>
      <Button asChild variant="outline">
        <a href={urls.specification} target="_blank" rel="noopener noreferrer"><FileJson /> Ver OpenAPI JSON</a>
      </Button>
    </div>
  );
}
