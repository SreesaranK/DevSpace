import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>

      {/* Public routes */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Dashboard */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Project Details */}

      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />

      {/* Default route */}

      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

      {/* Any unknown route */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;