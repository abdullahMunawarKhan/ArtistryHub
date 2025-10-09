import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setErrorEmail('');
    setErrorPassword('');
    setLoginError('');

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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Admin login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Please check your email and confirm your account before logging in.');
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Too many login attempts. Please wait a moment before trying again.');
        } else {
          setLoginError(error.message);
        }
      } else if (data.user) {
        // Fetch user role
        const { data: userProfile, error: profileError } = await supabase
          .from('user')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !userProfile) {
          setLoginError('User profile not found. Please contact system administrator.');
          await supabase.auth.signOut();
        } else if (userProfile.role !== 'efbv') {
          setLoginError('Access denied. You are not authorized to access the admin dashboard.');
          await supabase.auth.signOut();
        } else {
          // Success - redirect to admin dashboard
          navigate('/dshakfgadsj');
        }
      } else {
        setLoginError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error during admin login:', err);
      setLoginError('An unexpected error occurred. Please try again.');
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100 flex items-center justify-center p-3 sm:p-6">
      {/* Mobile-optimized container */}
      <div className="w-full max-w-xs sm:max-w-sm">
        {/* Main card - enhanced mobile styling */}
        <div className="bg-white/85 backdrop-blur-sm border border-white/30 shadow-2xl rounded-xl sm:rounded-2xl p-5 sm:p-8">

          {/* Header - Mobile optimized with admin branding */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Admin shield icon */}
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-600 to-gray-700 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent mb-1">
              Admin Portal
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">
              Sign In
            </h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-slate-500 to-gray-600 rounded-full mx-auto mt-3"></div>

            {/* Security notice */}
            <div className="mt-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs sm:text-sm text-amber-800 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Authorized Personnel Only
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4 sm:space-y-5">

            {/* Email field */}
            <div>
              <label htmlFor="admin-email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 ${errorEmail
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-300 bg-gray-50/50 focus:border-slate-400 focus:bg-white'
                  }`}
                placeholder="admin@example.com"
                autoComplete="email"
              />
              {errorEmail && (
                <p className="text-xs sm:text-sm text-red-600 mt-1 flex items-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorEmail}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="admin-password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 ${errorPassword
                      ? 'border-red-300 bg-red-50 focus:border-red-400'
                      : 'border-gray-300 bg-gray-50/50 focus:border-slate-400 focus:bg-white'
                    }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              {errorPassword && (
                <p className="text-xs sm:text-sm text-red-600 mt-1 flex items-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorPassword}
                </p>
              )}
            </div>

            {/* Login error */}
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs sm:text-sm text-red-700 text-center flex items-start justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {loginError}
                </p>
              </div>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 sm:py-3 px-4 sm:px-6 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoggingIn ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Access Admin Portal</span>
                </div>
              )}
            </button>

            {/* Footer - Back to user login */}
            <div className="text-center pt-2 sm:pt-4">
              <button
                type="button"
                onClick={() => navigate('/user-login')}
                className="text-xs sm:text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors hover:underline"
              >
                ← Back to User Login
              </button>
            </div>
          </form>
        </div>

        {/* Security footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure admin access protected by authentication
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;