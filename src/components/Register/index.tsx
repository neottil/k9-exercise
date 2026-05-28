import { useState } from "react";
import { Navigate, Link as RouterLink } from "react-router-dom";
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
import { register } from "../../api/auth";

const Register = () => {
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    setSubmitting(true);
    try {
      const message = await register(email, password);
      setSuccessMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante la registrazione");
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
          <Typography variant="h6" mb={3} textAlign="center" fontWeight="bold" color="text.secondary">
            K9 Cross Training - Exercise
          </Typography>

          {successMessage ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
              <Typography variant="body2" textAlign="center" color="text.secondary">
                <Link component={RouterLink} to="/login" color="success.main">
                  Torna al login
                </Link>
              </Typography>
            </>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
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
                  helperText="Minimo 8 caratteri"
                />
                <TextField
                  label="Conferma password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" color="success" disabled={submitting} fullWidth>
                  {submitting ? <CircularProgress size={22} color="inherit" /> : "Registrati"}
                </Button>
              </Box>
              <Typography variant="body2" textAlign="center" mt={2} color="text.secondary">
                Hai già un account?{" "}
                <Link component={RouterLink} to="/login" color="success.main">
                  Accedi
                </Link>
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
