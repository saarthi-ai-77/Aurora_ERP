"use client";
import { Search, Bell, HelpCircle, Globe, Grid3X3 } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  title: string;
  breadcrumb?: string[];
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
}

export default function Topbar({ title, breadcrumb, searchPlaceholder, onSearch }: TopbarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (v: string) => {
    setQuery(v);
    onSearch?.(v);
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-5"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        height: "var(--topbar-height)",
      }}
    >
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3 pl-8 lg:pl-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--text-muted)" }}>⌂</span>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                <span style={{ color: "var(--text-muted)" }}>/</span>
                <span
                  style={{
                    color: i === breadcrumb.length - 1 ? "var(--text-primary)" : "var(--text-muted)",
                    fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
                  }}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        )}
        {!breadcrumb && (
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {title}
          </span>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-1">
        {/* Search */}
        {searchPlaceholder && (
          <div className="search-bar mr-2">
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              id="topbar-search"
              type="search"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        {/* Icon buttons matching the reference */}
        {[
          { id: "topbar-help",    Icon: HelpCircle,  label: "Help" },
          { id: "topbar-lang",    Icon: Globe,       label: "Language" },
          { id: "topbar-grid",    Icon: Grid3X3,     label: "Apps" },
        ].map(({ id, Icon, label }) => (
          <button
            key={id}
            id={id}
            className="p-2 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
            title={label}
            aria-label={label}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        {/* Notifications */}
        <button
          id="notifications-btn"
          className="relative p-2 rounded transition-colors"
          style={{ color: "var(--text-muted)" }}
          aria-label="Notifications"
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
            style={{ background: "var(--red)", fontSize: "9px", fontWeight: 700 }}
          >
            1
          </span>
        </button>
      </div>
    </header>
  );
}
