import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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
        setLoginError(error.message);
      } else if (data.user) {
        // Fetch user role
        const { data: userProfile, error: profileError } = await supabase
          .from('user')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !userProfile) {
          setLoginError('User profile not found.');
        } else if (userProfile.role !== 'admin') {
          setLoginError('You are not authorized to access the admin dashboard.');
          // Optionally log out user
          await supabase.auth.signOut();
        } else {
          navigate('/admin-dashboard');
        }
      } else {
        setLoginError('Login failed. Please try again.');
      }
    } catch (err) {
      setLoginError('Unexpected error. Please try again.');
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-sm glass-card backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-gradient-primary text-center mb-6">
          Admin Sign In
        </h2>

        <div className="space-y-4">
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
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
              type="button"
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
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
