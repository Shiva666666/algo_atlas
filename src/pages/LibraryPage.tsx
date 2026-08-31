import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  BookOpen,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import type { TaxonomyResponse } from "../types";
import {fetchLibrarySelection,updateLibraryFilter} from '../librarySelection';
import '../librarySelection.css';

export function LibraryPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const searchTerm=params.get('q')??'';
  useEffect(()=>setQuery(searchTerm),[searchTerm]);
  const filterString = params.toString();
  const { data: taxonomy } = useQuery({
    queryKey: ["taxonomy"],
    queryFn: () => api<TaxonomyResponse>("/api/taxonomy"),
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ["problems", filterString],
    queryFn: () => fetchLibrarySelection(new URLSearchParams(filterString),api),
  });
  const update = (key: string, value: string) => {
    setParams(updateLibraryFilter(params,key,value));
  };
  const runSearch = (event: React.FormEvent) => {
    event.preventDefault();
    update("q", query);
  };
  return (
    <section className="page-scroll">
      <div className="page-heading library-heading">
        <div>
          <p className="eyebrow">
            <BookOpen size={13} /> PROBLEM ARCHIVE
          </p>
          <h2>Signal library</h2>
          <p>
            Search code, notes, titles, techniques, and every classification
            layer.
          </p>
        </div>
        <button
          className="primary-btn"
          onClick={() => navigate("/problems/new")}
        >
          <Plus size={16} /> LOG MISTAKE
        </button>
      </div>
      {(params.has('problem_id')||params.has('subtag_id')||params.has('taxonomy_id'))&&<div className="library-atlas-selection" role="status"><span><BookOpen size={16}/>{params.has('problem_id')?`Selected from atlas: ${data?.items[0]?.title??'problem'}`:`Atlas filter: ${taxonomy?.nodes.find(node=>node.id===(params.get('subtag_id')??params.get('taxonomy_id')))?.name??'selected classification'}`}</span><Link to="/library">Show all problems</Link></div>}
      <div className="library-tools panel">
        <form onSubmit={runSearch}>
          <Search size={17} />
          <input
            aria-label="Search problems"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes, code, title or pattern…"
          />
          <button type="submit">SEARCH</button>
        </form>
        <div className="filter-row">
          <span>
            <Filter size={13} /> FILTER SIGNAL
          </span>
          <select
            aria-label="Filter by domain"
            value={params.get("main_id") ?? ""}
            onChange={(e) => update("main_id", e.target.value)}
          >
            <option value="">All domains</option>
            {taxonomy?.main.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by difficulty"
            value={params.get("difficulty") ?? ""}
            onChange={(e) => update("difficulty", e.target.value)}
          >
            <option value="">All difficulty</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            aria-label="Filter by status"
            value={params.get("status") ?? ""}
            onChange={(e) => update("status", e.target.value)}
          >
            <option value="">All status</option>
            <option>Open</option>
            <option>Understood</option>
            <option>Resolved</option>
          </select>
          <button
            type="button"
            className="clear-filter"
            onClick={() => {
              setParams({});
              setQuery("");
            }}
          >
            RESET
          </button>
        </div>
      </div>
      <div className="library-table panel">
        <div className="table-header">
          <span>PROBLEM / CLASSIFICATION</span>
          <span>DIFFICULTY</span>
          <span>STATUS</span>
          <span>MISTAKES</span>
          <span>
            UPDATED <ArrowUpDown size={11} />
          </span>
          <i />
        </div>
        {isLoading && <div className="table-empty">SCANNING THE ARCHIVE…</div>}
        {error&&<div className="table-empty" role="alert">{error instanceof Error?error.message:'The selected problem could not be loaded.'} <Link to="/library">Return to all problems</Link></div>}
        {data?.items.map((problem) => (
          <button
            className="problem-row"
            key={problem.id}
            onClick={() => navigate(`/problems/${problem.id}`)}
          >
            <span className="problem-title">
              <i
                style={
                  {
                    "--domain": problem.primary_main.color ?? "#2de2e6",
                  } as React.CSSProperties
                }
              />
              <b>{problem.title}</b>
              <small>
                {problem.primary_main.name} <em>/</em>{" "}
                {problem.primary_subtag.name}
              </small>
            </span>
            <span
              className={`difficulty difficulty-${problem.difficulty.toLowerCase()}`}
            >
              {problem.difficulty}
            </span>
            <span className={`status status-${problem.status.toLowerCase()}`}>
              {problem.status}
            </span>
            <span className="mistake-count">× {problem.mistake_count}</span>
            <span className="updated">
              {new Date(problem.updated_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
            <ChevronRight size={15} />
          </button>
        ))}
        {data?.items.length === 0 && (
          <div className="empty-library">
            <Sparkles size={28} />
            <h3>No signals match this sector.</h3>
            <p>Clear the filters or log the mistake that should live here.</p>
            <button onClick={() => navigate("/problems/new")}>
              LOG A MISTAKE
            </button>
          </div>
        )}
      </div>
      <div className="library-footer">
        <span>{data?.total ?? 0} PROBLEMS INDEXED</span>
        <span>FTS5 / LOCAL SQLITE</span>
      </div>
    </section>
  );
}
