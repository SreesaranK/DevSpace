import { useState } from "react";
import "../styles/auth.css";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await loginUser({
        email,
        password,
      });

      // Store JWT through AuthContext
      login(data.token);

      console.log("Login successful:", data);

      setSuccess(data.message || "Login successful");

    } catch (error) {
      console.error("Login failed:", error);

      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="brand">DevSpace</div>

          <h1>Welcome back</h1>

          <p>
            Sign in to continue to DevSpace.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="auth-message auth-success">
              {success}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* Footer */}
        <p className="auth-footer">
  Don't have an account?{" "}
  <Link to="/register">Create one</Link>
</p>
      </div>
    </main>
  );
}

export default Login;