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

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async () => {
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

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        // Check for existing user error message
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('user already exists')
        ) {
          setMessage({
            text: 'An account with this email already exists. Please login instead.',
            type: 'error',
          });
        } else {
          setMessage({ text: error.message, type: 'error' });
        }
        setLoading(false);
        return;
      }

      // In some cases, Supabase returns a user object with empty identities if account exists and confirmation needed
      if (data.user?.identities?.length === 0) {
        setMessage({
          text: 'An account with this email already exists. Please login instead.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      setMessage({
        text: '✅ Account created! Check your email to confirm, then log in.',
        type: 'success',
      });
      setTimeout(() => navigate('/main-dashboard'), 3000);
    } catch {
      setMessage({ text: 'An unexpected error occurred. Please try again.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-card backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-playfair text-gradient-primary text-center mb-6">
          Create Your Account
        </h2>

        {message.text && (
          <div
            className={`mb-4 text-center text-sm ${
              message.type === 'error' ? 'text-red-600' : 'text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="relative">
            <label className="form-label">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="relative">
            <label className="form-label">Confirm Password</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="form-input pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="btn-primary w-full py-3 font-semibold"
            type="button"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="text-center text-sm mt-4">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/user-login')}
              className="text-purple-600 hover:underline"
              type="button"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
