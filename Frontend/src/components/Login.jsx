import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  /* Redirect if already logged‑in */
  useEffect(() => {
    if (localStorage.getItem("Login") === "success") navigate("/account");
  }, [navigate]);

  /* Simple front‑end validation */
  const isFormValid = () =>
    email.trim() !== "" && password.trim().length >= 6;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return setError("Enter a valid email & password (≥6 chars)");

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://127.0.0.1:8000/app/api/login-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        localStorage.setItem("Login", "success");
        localStorage.setItem("email", email);
        window.dispatchEvent(new Event("storage"));   // notify other tabs/components
        navigate("/account");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch {
      setError("Network error – please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-14 p-8 rounded-2xl shadow-lg bg-white">
      <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-center mt-4">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-700 font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}

export default Login;
