import { useState, useEffect, useRef } from "react";
import { Icon } from "../components/shell/Icon";
import { MeetingRow } from "../components/MeetingRow";
import { useMeetingsPage } from "../queries/useMeetingsQuery";

const PAGE_SIZE = 10;

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-8 w-8 rounded-lg border border-border-strong bg-surface flex items-center justify-center text-secondary hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <Icon name="chevronLeft" size={14} />
      </button>
      <span className="text-[13px] text-secondary tabular-nums px-3">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="h-8 w-8 rounded-lg border border-border-strong bg-surface flex items-center justify-center text-secondary hover:bg-surface-hover transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <Icon name="chevronRight" size={14} />
      </button>
    </div>
  );
}

export function HistoryPage() {

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [transcriptFilter, setTranscriptFilter] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);

  const hasActiveFilters = !!(statusFilter || transcriptFilter);

  const prevFiltersRef = useRef({ q: "", status: "", transcript: "" });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const changed =
      prev.q !== debouncedQuery ||
      prev.status !== statusFilter ||
      prev.transcript !== transcriptFilter;
    if (changed && page !== 1) {
      setPage(1);
    }
    prevFiltersRef.current = {
      q: debouncedQuery,
      status: statusFilter,
      transcript: transcriptFilter,
    };
  }, [debouncedQuery, statusFilter, transcriptFilter, page]);

  const { data, isLoading: loading } = useMeetingsPage({
    page,
    limit: PAGE_SIZE,
    q: debouncedQuery || undefined,
    status: statusFilter || undefined,
    transcriptStatus: transcriptFilter || undefined,
  });

  const meetings = data?.meetings ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);


  const clearFilters = () => {
    setStatusFilter("");
    setTranscriptFilter("");
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[1240px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.025em] font-display text-foreground">
            Meeting History
          </h1>
          <p className="text-[13px] sm:text-[14px] text-secondary mt-1.5">
            Browse, search and download transcripts from past meetings.
          </p>
        </div>
        <button
          onClick={() => setFiltersVisible((v) => !v)}
          className={`h-8 px-[11px] rounded-lg border bg-surface font-medium text-[13px] inline-flex items-center gap-1.5 hover:bg-surface-hover transition-colors duration-150 ${
            hasActiveFilters
              ? "border-accent text-accent"
              : "border-border-strong text-foreground"
          }`}
        >
          <Icon name="filter" size={13} /> Filters
          {hasActiveFilters && (
            <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-5 sm:mt-6">
        <Icon
          name="search"
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 text-[14px] rounded-[10px] bg-surface border border-border-strong outline-none transition-all duration-150 focus:border-border-focused focus:shadow-[0_0_0_4px_rgba(0,0,0,0.04)] placeholder:text-tertiary"
          placeholder="Search meetings by title..."
        />
      </div>

      {/* Filter row */}
      {filtersVisible && (
        <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-border-strong bg-surface text-[13px] text-foreground outline-none cursor-pointer hover:bg-surface-hover transition-colors"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="ended">Ended</option>
          </select>
          <select
            value={transcriptFilter}
            onChange={(e) => setTranscriptFilter(e.target.value)}
            className="h-8 px-3 rounded-lg border border-border-strong bg-surface text-[13px] text-foreground outline-none cursor-pointer hover:bg-surface-hover transition-colors"
          >
            <option value="">All transcripts</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="none">No transcript</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-8 px-2.5 rounded-lg text-[12px] font-medium text-tertiary hover:text-foreground hover:bg-surface-hover transition-colors inline-flex items-center gap-1"
            >
              <Icon name="x" size={12} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <div className="mt-4 mb-3 text-[12px] text-tertiary">
          {total} meeting{total !== 1 ? "s" : ""} found
        </div>
      )}

      {/* Meeting list */}
      <div className="flex flex-col gap-2 mt-1">
        {loading && (
          <div className="text-[13px] text-tertiary py-8 text-center">
            Loading meetings...
          </div>
        )}

        {!loading && meetings.length === 0 && (
          <div className="bg-surface border border-border rounded-[14px] shadow-sm p-6 sm:p-10 flex flex-col items-center justify-center text-center min-h-[280px] sm:min-h-[360px]">
            <div className="w-12 h-12 rounded-xl bg-surface-hover border border-border flex items-center justify-center text-tertiary mb-4">
              <Icon name="history" size={22} />
            </div>
            <h3 className="text-[15px] font-semibold text-foreground font-display">
              {hasActiveFilters || debouncedQuery
                ? "No matching meetings"
                : "No meetings yet"}
            </h3>
            <p className="text-[13px] text-tertiary mt-2 max-w-[320px]">
              {hasActiveFilters || debouncedQuery
                ? "Try adjusting your search or filters."
                : "Meeting history with transcripts and download options will appear here."}
            </p>
          </div>
        )}

        {!loading &&
          meetings.map((m) => <MeetingRow key={m.id} m={m} />)}
      </div>

      {/* Pagination */}
      {!loading && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  );
}
