import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async () => {
    setMessage({ text: '', type: '' });

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

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        return setMessage({ text: error.message, type: 'error' });
      }

      setMessage({ 
        text: '✅ Account created! Please check your email to confirm your account before logging in. Redirecting...', 
        type: 'success' 
      });
      setTimeout(() => navigate('/main-dashboard'), 3000);
    } catch (error) {
      setMessage({ text: 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8">
      {/* Artistic background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-xl shadow-2xl transform rotate-12 blur-sm animate-bounce-slow z-0"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-pink-400 rounded-full shadow-xl blur-md transform scale-110 animate-float z-0"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-yellow-300 rounded-full shadow-lg blur-sm animate-pulse z-0"></div>
        <div className="absolute bottom-1/4 left-10 w-14 h-14 bg-purple-400 rounded-3xl rotate-45 shadow-md animate-spin-slow z-0"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        

        {/* Signup Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 p-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-40 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-gray-900 font-extrabold text-xl shadow-lg">
              ArtistryHub
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white-900 font-['Nova_Round',cursive]">User Signup</h2>
          
        </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="space-y-6">
            {/* Message */}
            {message.text && (
              <div
                className={`px-4 py-3 rounded-xl text-sm flex items-center ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {message.text}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="form-input pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="form-input pr-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Sign In */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/user-login')}
                  className="text-purple-600 hover:text-purple-800 font-medium underline transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
