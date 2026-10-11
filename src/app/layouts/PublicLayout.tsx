import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Mail, Menu, Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ChatWidget } from '@/features/chatbot/components/ChatWidget';
import { useAuth } from '@/features/auth/auth-context';
import { COMPANY } from '@/constants/env';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Funcionalidades', href: '/#funcionalidades' },
  { label: 'DGII', href: '/#dgii' },
  { label: 'API', href: '/#api' },
  { label: 'Módulos', href: '/#modulos' },
  { label: 'Planes', href: '/#planes' },
  { label: 'Preguntas', href: '/#faq' },
];

function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const portal = user ? (user.portal === 'admin' ? ROUTES.admin.root : ROUTES.app.root) : null;

  return (
    <header className={cn('sticky top-0 z-40 transition-all duration-300', scrolled ? 'border-b bg-background/85 backdrop-blur-md' : 'bg-transparent')}>
      <div className="container flex h-16 items-center gap-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Secciones">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
          <NavLink to={ROUTES.developers.root} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Desarrolladores
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {portal ? (
            <Button asChild size="sm" className="hidden sm:inline-flex"><Link to={portal}>Ir a mi portal</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to={ROUTES.login}>Iniciar sesión</Link></Button>
              <Button asChild size="sm" className="hidden sm:inline-flex"><Link to={ROUTES.register}>Comenzar</Link></Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menú">
            <Menu />
          </Button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72">
          <SheetTitle className="mb-6"><Logo /></SheetTitle>
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">{l.label}</a>
            ))}
            <Link to={ROUTES.developers.root} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent">Desarrolladores</Link>
          </nav>
          <div className="mt-6 grid gap-2">
            {portal ? (
              <Button asChild><Link to={portal}>Ir a mi portal</Link></Button>
            ) : (
              <>
                <Button asChild variant="outline"><Link to={ROUTES.login}>Iniciar sesión</Link></Button>
                <Button asChild><Link to={ROUTES.register}>Comenzar</Link></Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}

function PublicFooter() {
  const year = new Date().getFullYear();
  const contacts = [
    COMPANY.website && { icon: Globe, label: 'Sitio web de LoadExpress', href: COMPANY.website },
    COMPANY.email && { icon: Mail, label: COMPANY.email, href: `mailto:${COMPANY.email}` },
    COMPANY.phone && { icon: Phone, label: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/\s/g, '')}` },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href: string }[];

  return (
    <footer className="border-t bg-card">
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-2">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Plataforma de facturación electrónica desarrollada por {COMPANY.legalName}, empresa tecnológica de {COMPANY.country}.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">Plataforma</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="/#funcionalidades" className="hover:text-foreground">Funcionalidades</a></li>
            <li><a href="/#planes" className="hover:text-foreground">Planes</a></li>
            <li><Link to={ROUTES.developers.root} className="hover:text-foreground">Portal de desarrolladores</Link></li>
            <li><Link to={ROUTES.login} className="hover:text-foreground">Iniciar sesión</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold">LoadExpress</p>
          {contacts.length ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {contacts.map((c) => (
                <li key={c.href}>
                  <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
                    <c.icon className="h-4 w-4" /> {c.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Los canales oficiales de contacto se publicarán aquí.</p>
          )}
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {year} {COMPANY.legalName} Todos los derechos reservados.</p>
          <p>LX e-CF · Hecho en {COMPANY.country}</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0 });
  }, [hash, pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <ChatWidget context="public" />
    </div>
  );
}
