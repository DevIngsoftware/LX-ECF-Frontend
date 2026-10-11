import { useEffect, useState, type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Logo } from '@/components/shared/Logo';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { DemoBanner } from '@/components/shared/DemoBanner';
import { ChatWidget } from '@/features/chatbot/components/ChatWidget';
import { STORAGE_KEYS } from '@/constants/storage';
import { Sidebar, SidebarNav } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { CommandSearch } from './CommandSearch';
import type { NavGroup } from '../navigation';

interface AppShellProps {
  groups: NavGroup[];
  homeTo: string;
  rootLabel: string;
  badge?: string;
  headerActions?: ReactNode;
  sidebarFooter?: ReactNode;
  topNotice?: ReactNode;
  chatContext: 'tenant' | 'developer' | 'admin';
  showSearch?: boolean;
}

export function AppShell({ groups, homeTo, rootLabel, badge, headerActions, sidebarFooter, topNotice, chatContext, showSearch = true }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <>
      <DemoBanner />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow-elevated">
        Saltar al contenido
      </a>
      <div className="flex min-h-screen bg-background">
        <Sidebar groups={groups} homeTo={homeTo} badge={badge} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} footer={sidebarFooter} />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SheetTitle className="sr-only">Menú</SheetTitle>
            <div className="flex h-16 items-center border-b px-4">
              <Logo to={homeTo} badge={badge} />
            </div>
            <div className="scrollbar-thin h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
              <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} />
              {sidebarFooter && <div className="mt-6 border-t pt-4">{sidebarFooter}</div>}
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
              <Menu />
            </Button>
            <div className="lg:hidden">
              <Logo to={homeTo} compact />
            </div>
            <Breadcrumbs groups={groups} rootLabel={rootLabel} rootTo={homeTo} />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {showSearch && <CommandSearch groups={groups} />}
              <ThemeToggle />
              {headerActions}
            </div>
          </header>
          {topNotice}
          <main id="main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
      <ChatWidget context={chatContext} />
    </>
  );
}
