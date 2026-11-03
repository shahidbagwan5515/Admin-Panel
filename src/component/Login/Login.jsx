import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import "./Login.css";

const API_URL = "http://localhost/Admin-Panel/dashboard/Backend/api/login.php";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Invalid email or password.");
        return;
      }

      const user = result.data;

      // Sidebar existing localStorage.user se user details read karta hai.
      localStorage.setItem("user", JSON.stringify(user));

      if (typeof onLogin === "function") {
        onLogin({
          ...user,
          rememberMe,
        });
      }

      navigate("/adminpanel", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="login-page">
      <Box className="login-card">
        <Typography component="h1" className="login-title">
          Login
        </Typography>

        <Typography className="login-subtitle">
          Log in to continue to your Admin Panel
        </Typography>

        <Box component="form" onSubmit={handleSubmit} className="login-form">
          <Typography component="label" className="login-label">
            Email Address
          </Typography>

          <TextField
            fullWidth
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="login-input"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Typography component="label" className="login-label">
            Password
          </Typography>

          <TextField
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="login-input"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <VisibilityOffOutlinedIcon />
                      ) : (
                        <VisibilityOutlinedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {error && (
            <Typography role="alert" color="error" className="login-error">
              {error}
            </Typography>
          )}

          <Box className="login-options">
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label="Remember me"
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="login-submit"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;
