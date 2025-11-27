import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { loginWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // If already logged in, go to account page
  if (currentUser) {
    navigate("/account");
  }

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate("/account");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-slate-900">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to FSDP</h1>
        <p className="text-slate-500 mb-6">Sign in to manage your AI Agents</p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}