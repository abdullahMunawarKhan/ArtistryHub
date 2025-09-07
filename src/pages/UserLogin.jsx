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
        // Check if user has profile, if not create it
        await ensureUserProfile(user);
        navigate('/main-dashboard');
      }
    };

    checkAndRedirectUser();

    // Listen for auth state changes
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

  // Helper function to ensure user profile exists
  const ensureUserProfile = async (user) => {
    try {
      console.log('Ensuring user profile for:', user.id);
      
      // First check if profile exists
      const { data: existingProfile, error: selectError } = await supabase
        .from('user')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking profile:', selectError);
        return null;
      }

      if (existingProfile) {
        console.log('Profile exists:', existingProfile);
        return existingProfile;
      }

      // Profile doesn't exist, create it
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

      // Ensure user profile exists and get role
      const userProfile = await ensureUserProfile(data.user);
      
      if (!userProfile) {
        // If profile creation failed, try a different approach
        console.log('Profile creation failed, attempting alternative method...');
        
        // Try to create profile without RLS (this might work if there's a policy issue)
        try {
          // First disable RLS temporarily for this operation if needed
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
          // Set default profile
          const userProfile = { role: 'user' };
        } catch (fallbackError) {
          console.error('Fallback profile creation failed:', fallbackError);
          setLoginError('Profile creation failed. Please try logging in again or contact support.');
          setIsLoggingIn(false);
          return;
        }
      }

      // Check role and redirect accordingly
      if (userProfile && userProfile.role === 'efbv') {
        await supabase.auth.signOut(); // Sign out admin users
        setLoginError('Please use the admin login page to sign in.');
        setIsLoggingIn(false);
        return;
      }

      // Success - redirect to dashboard
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
    <div className="min-h-[90vh] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-card backdrop-blur-lg p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-playfair text-gradient-primary text-center mb-6">
          Sign in to ArtistryHub
        </h2>

        {resetStatus && (
          <div className="mb-4 text-center text-sm text-purple-700">
            {resetStatus}
          </div>
        )}

        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mb-4 text-center text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: {debugInfo}
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

          <div className="flex justify-between text-sm mt-2">
            <button
              onClick={() => setShowForgotModal(!showForgotModal)}
              className="text-purple-600 hover:underline"
              type="button"
            >
              Forgot Password?
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-purple-600 hover:underline"
              type="button"
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
                type="button"
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
