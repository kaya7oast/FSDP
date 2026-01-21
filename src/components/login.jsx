import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  // 1. Updated state to include email
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  const apiBase = import.meta.env.VITE_API_BASE_USERS;
  // Fallback to absolute path if Vite environment fails
  const fetchUrl = apiBase ? `${apiBase}/login` : "http://localhost:3000/users/login";

  try {
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // This 'identifier' matches your backend's $or search logic
        // It will check if this string exists as either a username OR an email
        identifier: formData.username || formData.email, 
        password: formData.password
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Identity storage for the "Welcome back" message
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('username', data.username);
      navigate('/dashboard');
    } else {
      // This triggers if Username/Email is wrong OR Password is wrong
      setError(data.message || 'Invalid credentials');
    }
  } catch (err) {
    setError('Connection error: Authentication server unreachable.');
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl p-8">
        
        {/* Logo and Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-blue-600">smart_toy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">AgentOS</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Welcome back</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <input
              type="text"
              name="username"
              required
              placeholder="Name"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white"
              onChange={handleChange}
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@gmail.com"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white"
              onChange={handleChange}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all dark:text-white"
              onChange={handleChange}
            />
          </div> 

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
          >
            Authenticate
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          New account? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;