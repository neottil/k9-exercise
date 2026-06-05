import { useState } from "react";
import { Navigate, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const { login, user, isLoading, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Card sx={{ width: 360, p: 2 }}>
        <CardContent>
          <Box component="img" src="/logo-intero.png" alt="Logo" sx={{ width: 120, mx: "auto", display: "block", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, textAlign: "center", fontWeight: "bold" }}>
            K9 Cross Training - Exercise
          </Typography>
          {sessionExpired && !error && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Sessione scaduta. Effettua nuovamente il login.
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" color="success" disabled={submitting} fullWidth>
              {submitting ? <CircularProgress size={22} color="inherit" /> : "Accedi"}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
            Non hai un account?{" "}
            <Link component={RouterLink} to="/register" color="success.main">
              Registrati
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
