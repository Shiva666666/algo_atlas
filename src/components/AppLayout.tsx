import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Atom,
  BookOpen,
  Hexagon,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Analytics } from "../types";
import { CommandPalette } from "./CommandPalette";
const nav = [
  [Atom, "Atlas", "/"],
  [Activity, "Dashboard", "/dashboard"],
  [BookOpen, "Library", "/library"],
  [Hexagon, "Taxonomy", "/taxonomy"],
  [Settings2, "Settings & Sync", "/settings"],
] as const;
export function AppLayout() {
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => api<Analytics>("/api/analytics/overview"),
  });
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand-mark" to="/" aria-label="Algo Atlas home">
          <Atom size={23} />
          <i />
        </NavLink>
        <nav aria-label="Primary navigation">
          {nav.map(([Icon, label, path]) => (
            <NavLink
              end={path === "/"}
              to={path}
              key={label}
              aria-label={label}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-status" title="Local database">
          <span />
          <small>LOCAL</small>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <NavLink to="/" className="wordmark" aria-label="Algo Atlas home">
            <h1>
              ALGO <b>ATLAS</b>
            </h1>
          </NavLink>
          <button
            className="search"
            onClick={() => setCommandOpen(true)}
            aria-label="Search problems and navigate"
          >
            <Search className="search-icon" size={17} />
            <span>Search problems or jump to a view</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="top-actions">
            <button
              className="sync-pill"
              onClick={() => navigate("/settings")}
              aria-label={`${data?.summary.unsynced_files ?? 0} unsynced export files`}
            >
              <i /> {data?.summary.unsynced_files ?? 0} UNSYNCED
            </button>
            <button className="add" onClick={() => navigate("/problems/new")}>
              <Plus size={18} /> LOG MISTAKE
            </button>
          </div>
        </header>
        <Outlet />
      </main>
      <nav className="mobile-nav" aria-label="Primary navigation">
        {nav.map(([Icon, label, path]) => (
          <NavLink end={path === "/"} to={path} key={label} aria-label={label}>
            <Icon size={20} />
            <span>{label === "Settings & Sync" ? "Settings" : label}</span>
          </NavLink>
        ))}
      </nav>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
