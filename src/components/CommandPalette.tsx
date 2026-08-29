import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Atom,
  BookOpen,
  Hexagon,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Problem } from "../types";
const actions = [
  [Atom, "Open Atlas", "/"],
  [Activity, "Open Dashboard", "/dashboard"],
  [BookOpen, "Browse Library", "/library"],
  [Plus, "Log a new mistake", "/problems/new"],
  [Hexagon, "Browse Taxonomy", "/taxonomy"],
  [Settings2, "Open Settings", "/settings"],
] as const;
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onOpenChange, open]);
  const { data, isFetching } = useQuery({
    queryKey: ["command-search", query],
    queryFn: () =>
      api<{ items: Problem[] }>(
        `/api/problems?q=${encodeURIComponent(query)}&limit=8`,
      ),
    enabled: query.trim().length > 1,
  });
  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
    setQuery("");
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="command-dialog">
          <Dialog.Title>Navigate the Atlas</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search saved problems or choose a destination. Results update as you
            type.
          </Dialog.Description>
          <div className="command-search">
            <Search size={18} />
            <input
              aria-label="Search saved problems or destinations"
              autoFocus
              placeholder="Search problems or jump to a view…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Dialog.Close aria-label="Close command palette">
              <X size={16} />
            </Dialog.Close>
          </div>
          <div className="command-results" aria-live="polite">
            {query.length < 2 &&
              actions.map(([Icon, label, path]) => (
                <button key={label} onClick={() => go(path)}>
                  <Icon size={17} />
                  <span>{label}</span>
                  <kbd>↵</kbd>
                </button>
              ))}
            {data?.items.map((problem) => (
              <button
                key={problem.id}
                onClick={() => go(`/problems/${problem.id}`)}
              >
                <i
                  className="signal-dot"
                  style={{
                    background: problem.primary_main.color ?? "#37d9ff",
                  }}
                />
                <span>
                  <b>{problem.title}</b>
                  <small>
                    {problem.primary_main.name} / {problem.primary_subtag.name}
                  </small>
                </span>
                <kbd>{problem.difficulty[0]}</kbd>
              </button>
            ))}
            {query.length > 1 && isFetching && (
              <div className="command-empty">Searching your local atlas…</div>
            )}
            {query.length > 1 && !isFetching && data?.items.length === 0 && (
              <div className="command-empty">
                No signal found. Log it as a new mistake.
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
