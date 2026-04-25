import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

type Theme = "rh" | "rh-light";

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem("solis_theme");
    return stored === "rh" || stored === "rh-light" ? stored : "rh";
  } catch {
    return "rh";
  }
}

const NAV_LINKS = [
  { to: "/", label: "Market" },
  { to: "/cryptotracker", label: "Tracker" },
  { to: "/heatmap", label: "Heatmap" },
  { to: "/cryptonews", label: "News" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/converter", label: "Converter" },
  { to: "/community", label: "Community" },
  { to: "/about", label: "About" },
] as const;

function linkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? "font-semibold text-primary" : "";
}

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  // Apply theme to <html> on mount and change
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("solis_theme", theme);
  }, [theme]);

  // Close mobile menu on Escape keypress (WCAG 2.1 keyboard accessibility)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Close mobile menu when the viewport grows past the lg breakpoint
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "rh" ? "rh-light" : "rh"));
  }

  const isDark = theme === "rh";

  return (
    <header className="navbar bg-base-100 shadow-md px-4">
      {/* Brand */}
      <div className="navbar-start">
        <NavLink to="/" className="btn btn-ghost text-xl font-bold">
          Solis
        </NavLink>
      </div>

      {/* Desktop links */}
      <nav
        className="navbar-center hidden lg:flex"
        aria-label="Main navigation"
      >
        <ul className="menu menu-horizontal gap-1 px-1 text-sm">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} end={to === "/"} className={linkClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme toggle + mobile hamburger */}
      <div className="navbar-end flex items-center gap-2">
        {/* Theme toggle */}
        <button
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          className="btn btn-ghost btn-sm btn-square"
          onClick={toggleTheme}
        >
          {isDark ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Mobile hamburger */}
        <div className="lg:hidden">
          <div className="dropdown dropdown-end">
            <button
              tabIndex={0}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="btn btn-ghost btn-square"
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </button>

            <ul
              id="mobile-menu"
              hidden={!open}
              tabIndex={0}
              className="menu dropdown-content menu-sm z-1 mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
            >
              {NAV_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/"}
                    className={linkClass}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
