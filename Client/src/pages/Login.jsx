import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, guestLogin } from '../features/user/userSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return;
    }

    const result = await dispatch(loginUser({
      email: email.trim(),
      name: email.split('@')[0],
      provider: 'demo'
    }));

    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const handleGuestLogin = async () => {
    const result = await dispatch(guestLogin());
    if (guestLogin.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm border border-blue-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧠 Logic Looper</h1>
          <p className="text-gray-600">Daily Logic Puzzles & Streaks</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">Demo mode: Enter any email to create/sync account</p>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '🔄 Logging in...' : '📧 Login / Register'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-200 transition disabled:opacity-50"
        >
          👤 Play as Guest (Offline)
        </button>

        <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
          <strong>Guest Mode:</strong> Play offline, no sync. Data stored locally.
          <br />
          <strong>Login:</strong> Sync progress online, continue on other devices.
        </p>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-900">
            ✨ <strong>Features:</strong> Daily puzzles, streak tracking, activity heatmap, and offline support!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
