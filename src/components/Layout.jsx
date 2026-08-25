import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  Home as HomeIcon,
  Timer,
  Library,
  Bot,
  Users,
  Trophy,
  BarChart3,
  Menu,
  X,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { to: "/", label: "Início", icon: HomeIcon },
  { to: "/foco", label: "Cronômetro", icon: Timer },
  { to: "/tecnicas", label: "Biblioteca", icon: Library },
  { to: "/prompts", label: "IAs", icon: Bot },
  { to: "/salas", label: "Salas", icon: Users },
  { to: "/perfil", label: "Perfil", icon: Trophy },
  { to: "/dashboard", label: "Dados", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: SettingsIcon },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const nav = (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
              isActive
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`
          }
        >
          <Icon className="h-[15px] w-[15px] shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
          <BrandLogo size={32} />
          <div>
            <p className="text-[13px] font-medium tracking-tight text-foreground">
              Estudante Mentalista
            </p>
            <p className="text-[11px] text-muted-foreground">
              Memorização acelerada
            </p>
          </div>
        </div>
        <div className="mt-1 flex-1">{nav}</div>
        <div className="border-t border-border p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
          >
            <LogOut className="h-[15px] w-[15px] shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-1.5 hover:bg-secondary"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
          <BrandLogo size={28} />
          <span className="text-[13px] font-medium">Estudante Mentalista</span>
        </header>
        {mobileOpen && (
          <div className="border-b border-border bg-background py-2 md:hidden">
            {nav}
            <div className="mt-2 border-t border-border px-2 pt-2">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              >
                <LogOut className="h-[15px] w-[15px] shrink-0" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        )}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
