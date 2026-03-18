import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { authClient } from "../lib/auth";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message || "Sign in failed");
      return;
    }
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-paper">
      <div className="w-full max-w-[360px] p-12 px-8 bg-white border border-border rounded-2xl">
        <h1 className="text-4xl font-normal text-center mb-0.5">辿る</h1>
        <p className="text-center text-ink-secondary text-sm mb-7">Sign in to Tadoru</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-3.5 py-2.5 border border-border-medium rounded-lg text-sm bg-paper text-ink outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-3.5 py-2.5 border border-border-medium rounded-lg text-sm bg-paper text-ink outline-none focus:border-accent"
          />
          {error && <p className="text-grade-again text-[13px] text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1.5 py-2.5 px-5 bg-ink text-white border-none rounded-lg text-sm font-medium cursor-pointer hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-4 text-[13px] text-ink-secondary">
          Don't have an account? <Link to="/signup" className="text-accent no-underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
