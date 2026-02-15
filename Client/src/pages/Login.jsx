import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../features/user/userSlice';
import { authAPI } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((state) => state.user);
  const urlError = searchParams.get('error');
  const displayError = error || (urlError ? decodeURIComponent(urlError) : null);

  useEffect(() => {
    if (urlError) {
      window.history.replaceState({}, '', '/login');
    }
  }, [urlError]);

  // Initialize TrueCaller SDK
  useEffect(() => {
    if (window.truecaller) {
      window.truecaller.init({
        appKey: import.meta.env.VITE_TRUECALLER_APP_KEY || 'test'
      });
    }
  }, []);

  const handleTruecallerLogin = () => {
    if (window.truecaller && window.truecaller.isUsable) {
      window.truecaller.getProfile(onTruecallerSuccess, onTruecallerError);
    } else {
      alert('TrueCaller is not available on this device');
    }
  };

  const onTruecallerSuccess = async (response) => {
    try {
      const profile = response.profile;
      const result = await authAPI.truecallerLogin({
        phone: profile.phoneNumber,
        name: profile.firstName || 'User',
        email: profile.email || `user_${profile.phoneNumber}@truecaller.com`
      });

      if (result.token) {
        const loginResult = await dispatch(loginUser({
          email: result.user.email,
          name: result.user.name,
          provider: 'truecaller'
        }));

        if (loginUser.fulfilled.match(loginResult)) {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('TrueCaller login failed:', error);
      alert('TrueCaller login failed: ' + (error.error || error.message));
    }
  };

  const onTruecallerError = (error) => {
    console.error('TrueCaller error:', error);
    alert('TrueCaller authentication failed');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({
      email,
      name: email.split('@')[0],
      provider: 'demo'
    }));

    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login to Logic Looper</h2>

        {displayError && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">
            {displayError}
          </div>
        )}

        {/* Google login first so it's always visible */}
        <button
          type="button"
          onClick={() => authAPI.googleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 mb-4"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* TrueCaller login */}
        <button
          type="button"
          onClick={handleTruecallerLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border-2 border-red-400 text-red-700 py-3 rounded-lg font-semibold hover:bg-red-50 hover:border-red-500 transition disabled:opacity-50 mb-4"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path fill="#FF0000" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
          </svg>
          Login with TrueCaller
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="flex-1 h-px bg-gray-200" aria-hidden />
          <span className="text-sm text-gray-500">or</span>
          <span className="flex-1 h-px bg-gray-200" aria-hidden />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter email (e.g. demo@test.com)"
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login / Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Use any email for a demo account, or sign in with Google.
        </p>
      </div>
    </div>
  );
};

export default Login;
