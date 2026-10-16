"use client";

import Link from "next/link";
import {
  Menu,
  Shield,
  ChevronDown,
  ChevronRight,
  Github,
  Code2,
  Monitor,
  LifeBuoy,
  Sparkles,
  Home,
  Sun,
  Moon,
  Palette,
  Check,
} from "lucide-react";
import { useState, useRef } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { NAV_CATEGORIES, type NavCategory } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import dynamic from "next/dynamic";

const SupportDialog = dynamic(
  () => import("@/components/support-dialog").then((m) => m.SupportDialog),
  {
    ssr: false,
    loading: () => (
      <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1.5 text-sm">
        Support
      </Button>
    ),
  }
);
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function NavDropdownContent({
  category,
  isActive,
  onMouseEnter,
  onMouseLeave,
}: {
  category: NavCategory;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "absolute top-full left-0 z-50 mt-1.5 overflow-hidden rounded-md border bg-popover p-2 text-popover-foreground shadow-md",
        "w-[400px] md:w-[500px]",
        isActive && "animate-dropdown-in"
      )}
      style={{
        visibility: isActive ? "visible" : "hidden",
        opacity: isActive ? 1 : 0,
      }}
    >
      <div className="grid gap-1 md:grid-cols-2">
        {category.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex select-none items-start gap-3 rounded-md p-3 leading-none no-underline outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground focus:outline-none"
            )}
          >
            <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1">
              <div className="text-sm font-medium leading-none">
                {item.label}
              </div>
              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { theme, setTheme } = useTheme();

  const handleMouseEnter = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdownId(id);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdownId(null);
    }, 100);
  };

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/15 group-hover:ring-primary/40">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight whitespace-nowrap text-foreground leading-none">
              Convert <span className="text-primary">Easy</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium hidden sm:block leading-none mt-1">
              Privacy-First Tools
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 relative"
          onMouseLeave={handleMouseLeave}
        >
          {NAV_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(category.id)}
            >
              <button
                className={cn(
                  "group inline-flex h-9 w-max items-center justify-center gap-1.5 rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  activeDropdownId === category.id && "bg-accent/50 text-accent-foreground"
                )}
              >
                <category.icon className="h-4 w-4" />
                {category.label}
                <ChevronDown
                  className={cn(
                    "relative top-[1px] ml-1 size-3 transition-transform duration-300",
                    activeDropdownId === category.id && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              <NavDropdownContent
                category={category}
                isActive={activeDropdownId === category.id}
                onMouseEnter={() => handleMouseEnter(category.id)}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="GitHub repos"
                className="size-9 text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/programadorisgod/convert-easy-frontend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Monitor className="h-4 w-4" />
                  Frontend
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/programadorisgod/convert-easy-api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Code2 className="h-4 w-4" />
                  Backend
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <SupportDialog />
          <ThemeToggle />

          {/* Mobile Menu Drawer */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden size-9 text-muted-foreground hover:text-foreground"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[88vw] sm:w-[400px] max-w-[420px] p-0 flex flex-col h-full bg-background/98 backdrop-blur-xl border-l"
            >
              {/* Drawer Header */}
              <SheetHeader className="p-4 sm:p-5 border-b bg-muted/20">
                <div className="flex items-center justify-between pr-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <SheetTitle className="text-base font-bold leading-tight">
                        Convert <span className="text-primary">Easy</span>
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground">
                        Privacidad y velocidad sin registro
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium shrink-0">
                    Gratis
                  </Badge>
                </div>
              </SheetHeader>

              {/* Scrollable Categories & Tools */}
              <div className="flex-1 overflow-y-auto px-4 pt-3 pb-8 space-y-4">
                {/* Quick Navigation Home */}
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl border bg-card/60 p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Página Principal</div>
                      <div className="text-xs text-muted-foreground">Subir y convertir archivos</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>

                {/* Categories Accordion */}
                <div>
                  <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Herramientas por categoría
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-2 pb-2">
                    {NAV_CATEGORIES.map((category) => (
                      <AccordionItem
                        key={category.id}
                        value={category.id}
                        className="rounded-xl border bg-card/40 px-3 py-0.5 border-border/60 last:border-b last:border-border/60 transition-colors data-[state=open]:bg-card data-[state=open]:border-primary/30"
                      >
                        <AccordionTrigger className="hover:no-underline py-2.5 items-center [&>svg]:translate-y-0">
                          <div className="flex items-center gap-2.5 text-left min-w-0">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                              <category.icon className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {category.label}
                            </span>
                            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted/60 text-[11px] font-semibold text-muted-foreground tabular-nums leading-none">
                              {category.items.length}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3 pt-1">
                          <div className="flex flex-col gap-1.5 pl-1 border-t border-border/30 pt-2">
                            {category.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-start gap-2.5 rounded-lg p-2 transition-all hover:bg-accent/70 hover:translate-x-0.5 group"
                                onClick={() => setMobileOpen(false)}
                              >
                                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  <item.icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                                    <span>{item.label}</span>
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                    {item.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>

              {/* Drawer Footer with Actions */}
              <div className="border-t bg-muted/20 p-4 space-y-3 shrink-0">
                {/* Support trigger inside drawer */}
                <SupportDialog
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-between rounded-xl h-10 px-3 bg-card/60 hover:bg-card border-border/70"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <LifeBuoy className="h-4 w-4 text-primary" />
                        Centro de Soporte
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  }
                />

                {/* Theme Selector */}
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-1.5">
                  <span className="text-xs font-medium text-muted-foreground pl-2">Tema:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                        theme === "light"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      Claro
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                        theme === "dark"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      Oscuro
                    </button>
                    <button
                      onClick={() => setTheme("blue")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                        theme === "blue"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Palette className="h-3.5 w-3.5" />
                      Azul
                    </button>
                  </div>
                </div>

                {/* GitHub Links & Security note */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    Borrado automático TTL
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/programadorisgod/convert-easy-frontend"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      Frontend
                    </a>
                    <span>•</span>
                    <a
                      href="https://github.com/programadorisgod/convert-easy-api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                    >
                      Backend
                    </a>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
