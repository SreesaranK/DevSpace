import { useState } from "react";
import "../styles/auth.css";
import { registerUser } from "../services/api";
import { Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
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
      const data = await registerUser({
        name,
        username,
        email,
        password,
      });

      console.log("Registration successful:", data);

      setSuccess(data.message);

      // Clear form after successful registration
      setName("");
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Registration failed:", error);

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

          <h1>Create your account</h1>

          <p>
            Build. Collaborate. Ship together.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form">

          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">Name</label>

            <input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username</label>

            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>

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
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="auth-message auth-success">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        {/* Footer */}
        <p className="auth-footer">
  Already have an account?{" "}
  <Link to="/login">Login</Link>
</p>
      </div>
    </main>
  );
}

export default Register;