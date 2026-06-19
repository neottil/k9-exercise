// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useAuth } from "../../contexts/AuthContext";
import { register } from "../../api/auth";
import { capitalize } from "../../utils/stringUtils";
import {
  checkPasswordRules,
  isPasswordValid,
  PASSWORD_RULE_LABELS,
} from "../../utils/passwordValidation";

const Register = () => {
  const { user, isLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
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

  const rules = checkPasswordRules(password);
  const passwordValid = isPasswordValid(rules);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError("La password non soddisfa i requisiti di sicurezza");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono");
      return;
    }

    setSubmitting(true);
    try {
      const message = await register(email, password, firstName, lastName);
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
      <Card sx={{ width: 380, p: 2 }}>
        <CardContent>
          <Box component="img" src="/logo-intero.png" alt="Logo" sx={{ width: 120, mx: "auto", display: "block", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3, textAlign: "center", fontWeight: "bold" }}>
            K9 Cross Training - Exercise
          </Typography>

          {successMessage ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
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
              <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="Nome"
                    value={firstName}
                    onChange={(e) => setFirstName(capitalize(e.target.value))}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Cognome"
                    value={lastName}
                    onChange={(e) => setLastName(capitalize(e.target.value))}
                    required
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  fullWidth
                />
                <Box>
                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    required
                    fullWidth
                  />
                  {(passwordFocused || password.length > 0) && (
                    <Box sx={{ mt: 1, pl: 0.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
                      {(Object.keys(PASSWORD_RULE_LABELS) as (keyof typeof PASSWORD_RULE_LABELS)[]).map((key) => (
                        <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          {rules[key]
                            ? <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "success.main" }} />
                            : <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: "text.disabled" }} />}
                          <Typography variant="caption" color={rules[key] ? "success.main" : "text.disabled"}>
                            {PASSWORD_RULE_LABELS[key]}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
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
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
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
