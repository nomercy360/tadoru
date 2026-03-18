import { Link, Outlet, useNavigate, useLocation } from "react-router";
import { authClient } from "../lib/auth";

export function Layout() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  const linkCls = (path: string) =>
    `text-[13px] cursor-pointer transition-colors ${location.pathname === path ? "text-ink font-medium" : "text-ink-secondary hover:text-ink"}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-8 px-8 h-[52px] bg-paper border-b border-border">
        <Link to="/" className="text-[15px] font-medium text-ink no-underline flex items-center gap-1.5">
          辿る <span className="text-accent">Tadoru</span>
        </Link>
        <nav className="flex gap-6 flex-1">
          <Link to="/" className={linkCls("/")}>Dashboard</Link>
          <Link to="/add" className={linkCls("/add")}>Add Word</Link>
          <Link to="/review" className={linkCls("/review")}>Review</Link>
          <Link to="/frontier" className={linkCls("/frontier")}>Frontier</Link>
        </nav>
        {session && (
          <div className="ml-auto flex items-center gap-3 text-[13px] text-ink-secondary">
            <span>{session.user.email}</span>
            <button onClick={handleSignOut} className="bg-transparent border-none text-ink-secondary cursor-pointer text-[13px] hover:text-ink">
              Sign Out
            </button>
          </div>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
