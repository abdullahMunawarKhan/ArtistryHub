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
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirectUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await ensureUserProfile(user);
        navigate('/main-dashboard');
      }
    };

    checkAndRedirectUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await ensureUserProfile(session.user);
        navigate('/main-dashboard');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (resetStatus) {
      const timer = setTimeout(() => setResetStatus(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [resetStatus]);

  const ensureUserProfile = async (user) => {
    try {
      console.log('Ensuring user profile for:', user.id);

      const { data: existingProfile, error: selectError } = await supabase
        .from('user')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking profile:', selectError);
        return null;
      }

      if (existingProfile) {
        console.log('Profile exists:', existingProfile);
        return existingProfile;
      }

      console.log('Creating new profile for user:', user.id);
      const { data: newProfile, error: insertError } = await supabase
        .from('user')
        .upsert([
          {
            id: user.id,
            email: user.email,
            role: 'user'
          }
        ], {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create profile:', insertError);
        throw insertError;
      }

      console.log('Profile created successfully:', newProfile);
      return newProfile;
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
      return null;
    }
  };

  const handleLogin = async () => {
    setErrorEmail('');
    setErrorPassword('');
    setLoginError('');
    setDebugInfo('');

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          setLoginError('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          setLoginError('Please check your email and confirm your account before logging in.');
        } else if (error.message.includes('Too many requests')) {
          setLoginError('Too many login attempts. Please wait a moment before trying again.');
        } else {
          setLoginError(error.message);
        }
        setDebugInfo(`Error: ${error.message}`);
        setIsLoggingIn(false);
        return;
      }

      if (!data.user) {
        setLoginError('Login failed. Please try again.');
        setIsLoggingIn(false);
        return;
      }

      console.log('Login successful for user:', data.user.id);
      setDebugInfo('Login successful, checking profile...');

      const userProfile = await ensureUserProfile(data.user);

      if (!userProfile) {
        console.log('Profile creation failed, attempting alternative method...');

        try {
          const { error: directInsertError } = await supabase
            .from('user')
            .insert([{
              id: data.user.id,
              email: data.user.email,
              role: 'user'
            }]);

          if (directInsertError) {
            console.error('Direct insert also failed:', directInsertError);
            setLoginError('Unable to create user profile. Please contact support.');
            setIsLoggingIn(false);
            return;
          }

          console.log('Profile created via direct insert');
        } catch (fallbackError) {
          console.error('Fallback profile creation failed:', fallbackError);
          setLoginError('Profile creation failed. Please try logging in again or contact support.');
          setIsLoggingIn(false);
          return;
        }
      }

      if (userProfile && userProfile.role === 'efbv') {
        await supabase.auth.signOut();
        setLoginError('Please use the admin login page to sign in.');
        setIsLoggingIn(false);
        return;
      }

      setDebugInfo('Login completed successfully!');
      navigate('/main-dashboard');

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
        setResetStatus(`❌ ${error.message}`);
      } else {
        setResetStatus('✅ Check your email to reset your password.');
      }
    } catch {
      setResetStatus('❌ Failed to send reset email. Try again.');
    }
    setIsSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 
                flex items-start justify-center 
                pt-10 sm:pt-10 px-3 sm:px-6">
      {/* Mobile-optimized container */}
      <div className="w-full max-w-xs sm:max-w-md">
        {/* Main card - enhanced mobile styling */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl rounded-xl sm:rounded-2xl p-5 sm:p-8">

          {/* Header - Mobile optimized */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              Sign in to
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ScopeBrush
            </h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-3"></div>
          </div>

          {/* Status messages */}
          {resetStatus && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm text-blue-700 text-center">
              {resetStatus}
            </div>
          )}

          {debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="mb-4 text-center text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Debug: {debugInfo}
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4 sm:space-y-5">

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errorEmail
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-gray-200 bg-gray-50/50 focus:border-blue-400 focus:bg-white'
                  }`}
                placeholder="you@example.com"
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
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${errorPassword
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-200 bg-gray-50/50 focus:border-blue-400 focus:bg-white'
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
              className="w-full py-2.5 sm:py-3 px-4 sm:px-6 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoggingIn ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Footer Links */}
            <div className="w-full flex flex-col items-center justify-center gap-3 pt-6">

              {/* Forgot Password */}
              <button
                type="button"
                onClick={() => setShowForgotModal(!showForgotModal)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
              >
                Forgot Password?
              </button>

              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="flex flex-col items-center leading-tight transition-all duration-300"
              >
                <p className="text-xs sm:text-sm text-gray-600">
                  New to ScopeBrush?
                </p>

                <span
                  className="underline mt-1 text-base tracking-wide font-semibold
               bg-gradient-to-r from-purple-500 to-pink-500 
               bg-clip-text text-transparent 
               hover:from-purple-600 hover:to-pink-600"
                >
                  Create Account
                </span>
              </button>



            </div>



            {/* Forgot password section */}
            {showForgotModal && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                <p className="text-xs sm:text-sm text-gray-700">
                  Enter your registered email to receive a reset link.
                </p>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isSending}
                  className="w-full py-2 sm:py-2.5 px-4 text-xs sm:text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 transition-all duration-200"
                >
                  {isSending ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Email'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;