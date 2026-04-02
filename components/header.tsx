"use client";

import Link from "next/link";
import { Menu, Shield, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";

import { cn } from "@/lib/utils";
import { NAV_CATEGORIES, type NavCategory } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
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
}: {
  category: NavCategory;
  isActive: boolean;
}) {
  return (
    <div
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
  const headerRef = useRef<HTMLElement>(null);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Convert Easy</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 relative"
          onMouseLeave={() => setActiveDropdownId(null)}
        >
          {NAV_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="relative"
              onMouseEnter={() => setActiveDropdownId(category.id)}
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
              />
            </div>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Convert Easy
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <Accordion type="single" collapsible className="w-full">
                  {NAV_CATEGORIES.map((category) => (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="text-sm">
                        <span className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          {category.label}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-1 pl-6">
                          {category.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                              onClick={() => setMobileOpen(false)}
                            >
                              <item.icon className="h-4 w-4" />
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
