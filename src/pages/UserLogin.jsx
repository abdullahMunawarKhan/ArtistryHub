import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStatus, setResetStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const navigate = useNavigate();

  

  
  const handleLogin = async () => {
    setErrorEmail('');
    setErrorPassword('');
    setLoginError('');
    setDebugInfo('');

    // Validation
    if (!email) {
      setErrorEmail('Email is required.');
      return;
    }
    
    if (!isValidEmail(email)) {
      setErrorEmail('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrorPassword('Password is required.');
      return;
    }

    if (password.length < 6) {
      setErrorPassword('Password must be at least 6 characters long.');
      return;
    }

    setIsLoggingIn(true);
    setDebugInfo('Attempting to sign in...');

    try {
      console.log('Attempting login with:', { email, passwordLength: password.length });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        
        if (error.message === 'Invalid login credentials') {
          setLoginError('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Please check your email and confirm your account before logging in.');
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Too many login attempts. Please wait a moment before trying again.');
        } else {
          setLoginError(`Login failed: ${error.message}`);
        }
        
        setDebugInfo(`Error: ${error.message} (Code: ${error.status})`);
      } else if (data?.user) {
        console.log('Login successful:', data.user);
        setDebugInfo('Login successful! Redirecting...');
        setLoginError('');

        // Set user role as 'user' in Supabase if not already set
        // This assumes you have a 'role' column in your 'users' table
        const userId = data.user.id;
        try {
          // Check if role is already set
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
          if (!profileError && (!profile || !profile.role)) {
            // Set role to 'user'
            await supabase.from('users').upsert({ id: userId, role: 'user' });
          }
        } catch (err) {
          console.warn('Could not set user role:', err);
        }

        // Small delay to show success message
        setTimeout(() => {
          navigate('/main-dashboard');
        }, 1000);
      } else {
        setLoginError('Login failed. Please try again.');
        setDebugInfo('No user data received');
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setLoginError('An unexpected error occurred. Please try again.');
      setDebugInfo(`Unexpected error: ${err.message}`);
    }

    setIsLoggingIn(false);
  };

  const handleResetPassword = async () => {
    setResetStatus('');
    setIsSending(true);

    if (!email) {
      setResetStatus('⚠ Please enter your email first.');
      setIsSending(false);
      return;
    }

    if (!isValidEmail(email)) {
      setResetStatus('⚠ Please enter a valid email address.');
      setIsSending(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        if (error.message.toLowerCase().includes('user') || error.message.toLowerCase().includes('invalid')) {
          setResetStatus('❌ Account not found with this email.');
        } else {
          setResetStatus(`❌ Failed to send reset email: ${error.message}`);
        }
      } else {
        setResetStatus('✅ Check your email to reset your password.');
      }
    } catch (err) {
      console.error('Password reset unexpected error:', err);
      setResetStatus('❌ Failed to send reset email. Try again.');
    }

    setIsSending(false);
  };

  // Auto-dismiss reset alert after 4 secs
  useEffect(() => {
    if (resetStatus) {
      const timer = setTimeout(() => setResetStatus(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [resetStatus]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8">
      {/* Construction-themed background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Construction equipment silhouettes */}
        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-5">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-yellow-400">
            <path d="M20,80 L80,80 L80,60 L60,40 L40,40 L20,60 Z M30,40 L30,20 L70,20 L70,40"/>
          </svg>
        </div>
        
        <div className="absolute top-10 right-10 w-24 h-24 opacity-5">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-yellow-400">
            <circle cx="50" cy="50" r="40"/>
            <rect x="30" y="30" width="40" height="40" rx="5"/>
          </svg>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-2xl p-8 space-y-6">
        {/* Header with construction branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-40 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-gray-900 font-extrabold text-xl shadow-lg">
              ArtistryHub
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-['Nova_Round',cursive]">User Login</h2>
          <p className="text-sm text-gray-600">sign-in to explore more features</p>
        </div>

        {/* Debug Info (only show in development) */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-xs font-mono">{debugInfo}</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            placeholder="Enter your email"
            aria-label="Email Address"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoggingIn || isSending}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoggingIn) {
                handleLogin();
              }
            }}
          />
          {errorEmail && <p className="text-red-500 text-sm">{errorEmail}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              aria-label="Password"
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-12 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn || isSending}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoggingIn) {
                  handleLogin();
                }
              }}
            />
            <button
              type="button"
              className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errorPassword && <p className="text-red-500 text-sm">{errorPassword}</p>}
        </div>

        {/* Error Message */}
        {loginError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm text-center">{loginError}</p>
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoggingIn || isSending}
          className={`w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 shadow-lg ${
            isLoggingIn || isSending ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'
          }`}
          aria-busy={isLoggingIn}
        >
          {isLoggingIn ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
              Logging in...
            </div>
          ) : (
            'Sign In to Dashboard'
          )}
        </button>

        {/* Forgot Password */}
        <div className="text-center">
          <button
            onClick={() => setShowForgotModal(true)}
            className="text-sm text-gray-600 hover:text-yellow-600 underline transition-colors"
            disabled={isLoggingIn || isSending}
          >
            Forgot your password?
          </button>
        </div>
        {/* Sign Up */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="text-purple-600 hover:text-purple-800 font-medium underline transition-colors"
                >
                  Sign up here
                </button>
              </p>
            </div>
        </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative">
            <button
              aria-label="Close reset password modal"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              onClick={() => {
                setShowForgotModal(false);
                setResetStatus('');
              }}
            >
              ×
            </button>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded bg-yellow-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Reset Your Password</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Enter your registered email address. We'll send you a secure link to reset your password.
              </p>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  aria-label="Reset email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSending}
                />

                <button
                  onClick={handleResetPassword}
                  disabled={!email || isSending}
                  className={`w-full bg-yellow-500 text-gray-900 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors ${
                    !email || isSending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>

              {resetStatus && (
                <div
                  className={`mt-4 px-4 py-3 rounded-lg text-sm text-center ${
                    resetStatus.startsWith('✅')
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                  role="alert"
                  aria-live="polite"
                >
                  {resetStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserLogin;


