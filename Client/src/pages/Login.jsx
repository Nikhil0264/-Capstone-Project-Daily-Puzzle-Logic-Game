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
        appKey: import.meta.env.VITE_TRUECALLER_APP_KEY,
        // Frontend URL for the SDK callback
        appLink: import.meta.env.VITE_TRUECALLER_DOMAIN || 'https://capstone-project-daily-puzzle-logic-sand.vercel.app'
      });
      console.log('[TrueCaller] SDK initialized with appKey:', import.meta.env.VITE_TRUECALLER_APP_KEY ? 'present' : 'missing');
    } else {
      console.warn('[TrueCaller] TrueCaller SDK not loaded');
    }
  }, []);

  const handleTruecallerLogin = () => {
    console.log('[TrueCaller] Login button clicked');

    if (!window.truecaller) {
      console.error('[TrueCaller] SDK not loaded');
      alert('TrueCaller SDK not loaded. Please refresh the page.');
      return;
    }

    if (!window.truecaller.isUsable) {
      console.warn('[TrueCaller] Not usable on this device/browser');
      alert('TrueCaller is not available on this device. Please use Google login or email instead.');
      return;
    }

    console.log('[TrueCaller] Initiating authentication');
    const options = {
      countryCode: ['+91', '+1', '+44', '+91'], // Support multiple countries
      skipInitScreen: false,
      firstName: true,
      lastName: false,
      accessToken: true,
      requestNonce: Math.random().toString(36).substring(7),
      successCallback: onTruecallerSuccess,
      failureCallback: onTruecallerError
    };

    try {
      window.truecaller.getProfile(options);
    } catch (err) {
      console.error('[TrueCaller] Error calling getProfile:', err);
      alert('TrueCaller error: ' + err.message);
    }
  };

  const onTruecallerSuccess = async (response) => {
    try {
      if (!response || !response.profile) {
        throw new Error('Invalid TrueCaller response');
      }

      const profile = response.profile;
      const accessToken = response.accessToken;

      console.log('[TrueCaller] Profile received:', { phone: profile.phoneNumber, name: profile.firstName });
      console.log('[TrueCaller] Access token present:', !!accessToken);

      const result = await authAPI.truecallerLogin({
        accessToken,
        phone: profile.phoneNumber || profile.phone,
        name: profile.firstName || 'TrueCaller User',
        email: profile.email || `tc_${(profile.phoneNumber || profile.phone || 'user')}@truecaller.com`
      });

      console.log('[TrueCaller] Backend response received');

      if (result && result.token) {
        const loginResult = await dispatch(loginUser({
          email: result.user.email,
          name: result.user.name,
          provider: 'truecaller'
        }));

        if (loginUser.fulfilled.match(loginResult)) {
          navigate('/dashboard');
        }
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('[TrueCaller] Login failed:', error);
      alert('TrueCaller login failed: ' + (error.error || error.message || 'Unknown error'));
    }
  };

  const onTruecallerError = (error) => {
    console.error('[TrueCaller] Authentication error:', error);
    if (error && error.message) {
      alert('TrueCaller error: ' + error.message);
    } else if (typeof error === 'string') {
      alert('TrueCaller error: ' + error);
    } else {
      alert('TrueCaller authentication failed or was cancelled');
    }
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
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* TrueCaller login */}
        <button
          type="button"
          onClick={handleTruecallerLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 mb-4 shadow-md"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            {/* TrueCaller-style phone icon */}
            <path d="M17 10.5V7c0 .55.45 1 1 1h.5c.83 0 1.5.67 1.5 1.5v2c0 .55-.45 1-1 1h-.5c-.55 0-1 .45-1 1V17c0 2.21-1.79 4-4 4s-4-1.79-4-4v-6.5H6c-.55 0-1 .45-1 1v.5c0 .83-.67 1.5-1.5 1.5h-2c-.55 0-1-.45-1-1v-.5C.5 9.67 1.17 9 2 9h2V7c0-2.21 1.79-4 4-4s4 1.79 4 4v3.5h1z" />
          </svg>
          <span>Login with TrueCaller</span>
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
