// src/pages/UserLogin.jsx
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

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (resetStatus) {
      const timer = setTimeout(() => setResetStatus(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [resetStatus]);

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
      } else if (data.user) {
        navigate('/main-dashboard');
      } else {
        setLoginError('Login failed. Please try again.');
      }
    } catch (err) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-card backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-playfair text-gradient-primary text-center mb-6">
          Sign in to ArtistryHub
        </h2>

        {resetStatus && (
          <div className="mb-4 text-center text-sm text-purple-700">
            {resetStatus}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {errorEmail && (
              <p className="text-red-500 text-sm mt-1">{errorEmail}</p>
            )}
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
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
            {errorPassword && (
              <p className="text-red-500 text-sm mt-1">{errorPassword}</p>
            )}
          </div>

          {loginError && (
            <p className="text-red-600 text-center">{loginError}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="btn-primary w-full py-3 font-semibold"
          >
            {isLoggingIn ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="flex justify-between text-sm mt-2">
            <button
              onClick={() => setShowForgotModal(!showForgotModal)}
              className="text-purple-600 hover:underline"
            >
              Forgot Password?
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-purple-600 hover:underline"
            >
              Create Account
            </button>
          </div>

          {showForgotModal && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-700">
                Enter your registered email to receive a reset link.
              </p>
              <button
                onClick={handleResetPassword}
                disabled={isSending}
                className="btn-outline w-full py-2 font-medium"
              >
                {isSending ? 'Sending...' : 'Send Reset Email'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
