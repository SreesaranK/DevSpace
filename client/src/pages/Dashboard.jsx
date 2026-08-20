function Dashboard() {
  const handleLogout = () => {
    localStorage.removeItem("token");

    window.location.reload();
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0f19",
        color: "#ffffff",
        padding: "40px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "50px",
        }}
      >
        <h1>DevSpace</h1>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid #374151",
            background: "#111827",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>

      <section>
        <h2>Welcome to DevSpace 👋</h2>

        <p
          style={{
            color: "#9ca3af",
            marginTop: "10px",
          }}
        >
          Your developer collaboration workspace.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginTop: "40px",
        }}
      >
        <div className="dashboard-card">
          <h3>💬 Chat</h3>
          <p>Real-time developer communication.</p>
        </div>

        <div className="dashboard-card">
          <h3>💻 Collaborative Coding</h3>
          <p>Code together in real time.</p>
        </div>

        <div className="dashboard-card">
          <h3>🤖 AI Assistant</h3>
          <p>Get help while you build.</p>
        </div>

        <div className="dashboard-card">
          <h3>👥 Community</h3>
          <p>Connect with other developers.</p>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;