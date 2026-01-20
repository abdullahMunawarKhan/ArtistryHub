import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Paintbrush, Presentation, Sparkles } from "lucide-react";

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async () => {
    if (loading || animate) return; // Prevent multiple clicks

    setMessage({ text: '', type: '' });

    // Validation
    if (!email || !password || !confirmPassword) {
      return setMessage({ text: 'All fields are required.', type: 'error' });
    }
    if (!isValidEmail(email)) {
      return setMessage({ text: 'Invalid email format.', type: 'error' });
    }
    if (password.length < 6) {
      return setMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
    }
    if (password !== confirmPassword) {
      return setMessage({ text: 'Passwords do not match.', type: 'error' });
    }

    setAnimate(true);

    setTimeout(async () => {
      setAnimate(false);
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/user-login'
          }
        });

        if (error) {
          setAnimate(false);

          if (
            error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('user already exists')
          ) {
            return setMessage({
              text: 'An account with this email already exists. Please login instead.',
              type: 'error',
            });
          }

          return setMessage({ text: error.message, type: 'error' });
        }

        if (data.user) {
          await supabase.from('user').upsert(
            [{
              id: data.user.id,
              email: email.trim().toLowerCase(),
              role: 'user',
            }],
            { onConflict: 'id' }
          );
        }

        if (data.user?.identities?.length === 0) {
          return setMessage({
            text: 'An account with this email already exists. Please login instead.',
            type: 'error',
          });
        }

        setMessage({
          text: '✅ Account created! Check your email to confirm, then log in.',
          type: 'success',
        });

        setTimeout(() => navigate('/user-login'), 3000);

      } catch (err) {
        console.error(err);
        setMessage({ text: 'An unexpected error occurred.', type: 'error' });
      } finally {
        setAnimate(false);
        setLoading(false);
      }

    }, 100);
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
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1">
              Create Your
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Account
            </h2>
            <div className="w-12 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-auto mt-3"></div>
          </div>

          {/* Status message */}
          {message.text && (
            <div className={`mb-4 p-3 border rounded-lg text-xs sm:text-sm text-center ${message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
              }`}>
              <div className="flex items-center justify-center">
                {message.type === 'error' ? (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {message.text}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-4 sm:space-y-5">

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white"
                placeholder="you@example.com"
                autoComplete="email"
              />
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
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white"
                  placeholder="••••••••"
                  autoComplete="new-password"
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
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base rounded-lg sm:rounded-xl border-2 border-gray-200 bg-gray-50/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex space-x-1">
                  <div className={`flex-1 h-1 rounded-full ${password.length >= 6 ? 'bg-green-400' : 'bg-gray-200'
                    }`}></div>
                  <div className={`flex-1 h-1 rounded-full ${password.length >= 8 && /[A-Z]/.test(password) ? 'bg-green-400' : 'bg-gray-200'
                    }`}></div>
                  <div className={`flex-1 h-1 rounded-full ${password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-green-400' : 'bg-gray-200'
                    }`}></div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span className={password.length >= 6 ? 'text-green-600' : ''}>
                    ✓ 6+ chars
                  </span>
                  <span className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Uppercase
                  </span>
                  <span className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                    ✓ Number
                  </span>
                </div>
              </div>
            )}

            {/* Password match indicator */}
            {confirmPassword && (
              <div className="flex items-center space-x-2 text-xs">
                {password === confirmPassword ? (
                  <>
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-500">Passwords don't match</span>
                  </>
                )}
              </div>
            )}

            {/* Sign up button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 px-4 sm:px-6 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                'Sign Up'
              )}

            </button>

            {/* Footer link */}
            <div className="text-center pt-2 sm:pt-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/user-login')}
                  className="text-amber-600 hover:text-amber-800 font-medium transition-colors hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Additional info for mobile */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      {/* <SignupAnimation show={animate} /> */}
    </div>
  );
}

function ShineParticles() {
  const spots = [
    "-20 -30",   // Top-left of center
    "40 -25",    // Top-right
    "-35 10",    // Left side
    "45 15",     // Right side
    "-10 35",    // Bottom-left
    "20 38"      // Bottom-right
  ];

  return (
    <>
      {spots.map(([x, y], index) => (
        <Sparkles
          key={index}
          size={20}
          className={`
            absolute text-yellow-300 opacity-80 animate-shine
          `}
          style={{
            transform: `translate(${x}px, ${y}px)`
          }}
        />
      ))}
    </>
  );
}

function SignupAnimation({ show }) {
  return (
    <div
      className={`
        fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]
        flex items-center justify-center
        transition-opacity duration-500
        ${show ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
    >

      {/* ✨ Magical Shine Particles (around center) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <ShineParticles />
      </div>

      {/* 🖼 Board (middle layer) */}
      <Presentation
        size={180}
        className={`
          absolute text-amber-400 drop-shadow-lg
          transition-all duration-[2000ms] ease-out
          z-20
          ${show
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"}
        `}
      />

      {/* 🎨 Brush (top layer) */}
      <Paintbrush
        size={180}
        className={`
          absolute text-pink-500 drop-shadow-xl
          transition-all duration-[2000ms] ease-out
          z-30
          ${show
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"}
        `}
      />
    </div>
  );
}



export default Signup;