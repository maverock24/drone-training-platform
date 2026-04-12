"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Brain,
  Factory,
  Database,
  Cpu,
  Flame,
  Menu,
  GraduationCap,
  BookOpen,
  BookText,
  Wrench,
  Library,
  LogIn,
  LogOut,
  User,
  Sparkles,
  NotebookPen,
} from "lucide-react";
import { useProgress } from "@/lib/progress-context";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const publicNavItems = [
  { href: "/", label: "Home", icon: GraduationCap },
  { href: "/news", label: "News", icon: BookOpen },
  { href: "/domains", label: "Domains", icon: Sparkles },
  { href: "/glossary", label: "Glossary", icon: BookText },
  { href: "/hardware", label: "Hardware", icon: Wrench },
  { href: "/resources", label: "Resources", icon: Library },
];

const authNavItems = [
  { href: "/", label: "Home", icon: GraduationCap },
  { href: "/news", label: "News", icon: BookOpen },
  { href: "/tracks/ai-engineer", label: "AI Engineer", icon: Brain },
  { href: "/tracks/mlops-engineer", label: "MLOps", icon: Factory },
  { href: "/tracks/data-engineer", label: "Data Engineer", icon: Database },
  { href: "/tracks/edge-ai", label: "Edge AI", icon: Cpu },
  { href: "/grand-project", label: "Grand Project", icon: Flame },
  { href: "/domains", label: "Domains", icon: Sparkles },
  { href: "/glossary", label: "Glossary", icon: BookText },
  { href: "/hardware", label: "Hardware", icon: Wrench },
  { href: "/resources", label: "Resources", icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const { getFlightHours, getGlobalRank } = useProgress();
  const navItems = user ? authNavItems : publicNavItems;

  const handleLogout = async () => {
    await logout();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-3">
            <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-cyan-600">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="hidden text-lg font-bold tracking-tight sm:inline">
                Drone<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-cyan-500">AI</span> Academy
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <>
                <Link href="/diary">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <NotebookPen className="h-4 w-4" />
                    <span className="hidden sm:inline">Diary</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.username}</span>
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="gap-1.5 text-sm">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
              </Link>
            )}
          </div>

          <SheetContent side="left" className="w-72">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="mt-8 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "font-semibold"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="mt-4 border-t border-border/40 pt-4">
                {loading ? null : user ? (
                  <>
                    <Badge variant="secondary" className="mb-3 w-full justify-center font-mono bg-cyan-950/30 text-cyan-400 border-cyan-800 pointer-events-none">
                      {getFlightHours().toFixed(1)} Hrs • {getGlobalRank().split(" ")[0]}
                    </Badge>
                    <Link href="/profile" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                        <User className="h-5 w-5" />
                        {user.username}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3"
                      onClick={() => { handleLogout(); setOpen(false); }}
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="default" className="w-full justify-start gap-3">
                      <LogIn className="h-5 w-5" />
                      Login
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
