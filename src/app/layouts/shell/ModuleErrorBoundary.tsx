import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StateView } from '@/components/shared/states';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** Keeps the shell usable if a page or its lazy-loaded bundle fails to render. */
export class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('No se pudo mostrar el módulo', error, info);
  }

  render() {
    if (this.state.failed) {
      return <StateView
        icon={AlertTriangle}
        tone="danger"
        title="No se pudo mostrar esta página"
        description="Ocurrió un problema al cargar el módulo. Puedes recargarlo o abrir otra sección desde el menú."
        action={<Button type="button" onClick={() => window.location.reload()}>Recargar página</Button>}
      />;
    }
    return this.props.children;
  }
}
