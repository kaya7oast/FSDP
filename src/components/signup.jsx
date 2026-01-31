import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
    const response = await fetch(`http://localhost:3000/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Automatically log them in after signup
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    }
       
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark p-4">
      <div className="w-full max-w-md bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-green-600">person_add</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Join the AgentOS neural network.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <input type="text" name="username" required placeholder="Name" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl outline-none dark:text-white" onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <input type="password" name="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl outline-none dark:text-white" onChange={handleChange} />
          </div>
          <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95">
            Create Account
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Already an user? <Link to="/" className="text-blue-600 font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;