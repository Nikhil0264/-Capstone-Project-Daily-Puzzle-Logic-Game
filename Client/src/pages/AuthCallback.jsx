import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthToken } from "../services/api";
import { loadUserStats } from "../features/user/userSlice";

/**
 * Handles OAuth callback (e.g. Google). Reads token from URL, stores it, then redirects to dashboard.
 */
export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    console.log("[AuthCallback] Processing OAuth callback", { token: token ? "present" : "missing", error });

    if (error) {
      console.error("[AuthCallback] OAuth error:", error);
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (!token) {
      console.error("[AuthCallback] No token in URL");
      navigate("/login?error=Missing+token", { replace: true });
      return;
    }

    console.log("[AuthCallback] Token received, setting auth and loading stats");
    setAuthToken(token);
    dispatch(loadUserStats()).then(() => {
      console.log("[AuthCallback] User stats loaded, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
    }).catch((err) => {
      console.error("[AuthCallback] Failed to load user stats:", err);
      navigate("/dashboard", { replace: true });
    });
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="animate-spin text-4xl mb-2">🧠</div>
      <p className="text-gray-600 font-semibold">Signing you in...</p>
    </div>
  );
}
