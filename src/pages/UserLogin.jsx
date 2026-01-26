import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Eye, EyeOff, Mail, Lock, ChevronRight, AlertCircle, CheckCircle2, Loader2, AppWindow } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="relative min-h-screen w-full flex items-start lg:items-center justify-center overflow-hidden">
      {/* Overlay for better overall depth */}


      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-8 lg:pt-6 pb-4 sm:pb-10 flex justify-center">
        {/* Main Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-900/20 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10"
        >
          {/* Left Side: Login Form */}
          <div
            className="
    p-5 sm:p-12 lg:p-16
    flex flex-col justify-center relative
    text-white lg:text-gray-900
    lg:bg-white
  "
          >
            {/* Background Image with Dark Overlay (ONLY mobile & tablet) */}
            <div className="absolute inset-0 -z-10 lg:hidden">
              <img
                src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&auto=format&fit=crop"
                alt="Artistic background"
                className="w-full h-full object-cover scale-110 opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/45 via-slate-900/40 to-slate-900/55" />

            </div>

            {/* Header for Mobile */}
            <div className="lg:hidden flex flex-col items-center mb-4">
              <div className="mb-6 text-center z-10 flex flex-row items-center justify-center">
                <motion.img
                  src="/images/logo2.jpeg"
                  alt="ScopeBrush Logo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-xl border-4 border-purple-400 mr-6"
                />
                <div className="flex flex-col items-start">
                  <motion.div
                    className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
                  >
                    ScopeBrush
                  </motion.div>
                  <motion.div
                    className="h-1 w-24 sm:w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-md mt-2"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              </div>
            </div>

            <div className="relative max-w-md mx-auto w-full px-4">
              {/* Header */}
              <div className="mb-5 px-5 py-4 rounded-2xl shadow-sm text-center">
                <h2 className="text-2xl font-bold text-white lg:text-gray-900">
                  Welcome Back
                </h2>
                <p className="text-xs text-white/70 lg:text-gray-500 mt-1">
                  Sign in to your artistic portal
                </p>
              </div>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {resetStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-4 px-4 py-3 rounded-xl bg-blue-500/20 lg:bg-blue-50 border border-blue-400/30 lg:border-blue-200 text-blue-200 lg:text-blue-700 text-sm"
                  >
                    <CheckCircle2 className="inline w-4 h-4 mr-2" />
                    {resetStatus}
                  </motion.div>
                )}

                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-4 px-4 py-3 rounded-xl bg-red-500/20 lg:bg-red-50 border border-red-400/30 lg:border-red-200 text-red-200 lg:text-red-700 text-sm"
                  >
                    <AlertCircle className="inline w-4 h-4 mr-2" />
                    {loginError}
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4"
              >
                {/* Email */}
                <label className="
  text-sm font-semibold
  flex items-center gap-2 mb-1
  text-white/95
  lg:text-gray-700
">
                  <Mail className="w-4 h-4 text-white lg:text-gray-500" />
                  Email Address
                </label>


                <div
                  className="
    px-4 py-3
    rounded-xl
    bg-slate-900/30 backdrop-blur-md
    border border-white/20
    lg:bg-white lg:border-gray-300 lg:backdrop-blur-0
    focus-within:lg:border-purple-500
    transition-colors duration-200
  "
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="
      w-full bg-transparent text-sm
      text-white placeholder:text-white/50
      lg:text-gray-900 lg:placeholder:text-gray-400

      outline-none focus:outline-none
      focus:ring-0 focus:shadow-none
    "
                  />
                </div>

                {/* Password */}
                <label className="
  text-sm font-semibold
  flex items-center gap-2 mb-1
  text-white/95
  lg:text-gray-700
">
                  <Lock className="w-4 h-4 text-white lg:text-gray-500" />
                  Password
                </label>

                <div
                  className="
    px-4 py-3 relative
    rounded-xl
    bg-slate-900/30 backdrop-blur-md
    border border-white/20
    lg:bg-white lg:border-gray-300 lg:backdrop-blur-0
    focus-within:lg:border-purple-500
    transition-colors duration-200
  "
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="
      w-full bg-transparent text-sm pr-10
      text-white placeholder:text-white/50
      lg:text-gray-900 lg:placeholder:text-gray-400

      outline-none focus:outline-none
      focus:ring-0 focus:shadow-none
    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="
      absolute right-4 top-1/2 -translate-y-1/2
      text-white/60 hover:text-white
      lg:text-gray-500 lg:hover:text-gray-700
    "
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(!showForgotModal)}
                    className="text-xs font-semibold text-blue-400 lg:text-purple-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Sign In Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={isLoggingIn}
                  className="
          w-full h-12 rounded-2xl
          bg-slate-900/90 text-white
          lg:bg-slate-900 lg:text-white
          font-bold flex items-center justify-center gap-2 shadow-lg
        "
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer */}
              <div className="mt-5 px-4 py-3 rounded-xl bg-slate-900/30 lg:bg-gray-50 border border-white/20 lg:border-gray-200 text-center">
                <p className="text-xs text-white/70 lg:text-gray-600">
                  Don&apos;t have an account yet?{" "}
                  <Link to="/signup" className="font-bold text-white lg:text-purple-600 hover:underline">
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>



          {/* Right Side: Artistic/Promotional Content (Moved to right for desktop) */}
          <div className="hidden lg:flex relative bg-slate-900 overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1200&auto=format&fit=crop"
                alt="Artistic background"
                className="w-full h-full object-cover opacity-60 scale-110 lg:animate-subtle-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            </div>

            <div className="relative z-10 p-12 flex flex-col justify-start gap-8 text-white">

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {/* Logo and Brand */}
                <div className="mb-6 text-center z-10 flex flex-row items-center justify-center">
                  <motion.img
                    src="/images/logo2.jpeg"
                    alt="ScopeBrush Logo"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-xl border-4 border-purple-400 mr-6"
                  />
                  <div className="flex flex-col items-start">
                    <motion.div
                      className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-2xl"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                    >
                      ScopeBrush
                    </motion.div>
                    <motion.div
                      className="h-1 w-24 sm:w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-md mt-2"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                      style={{ transformOrigin: "left" }}
                    />
                  </div>
                </div>
              </motion.div>

              <div className="space-y-6 max-w-xl">
                <motion.h2
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                  className="text-5xl md:text-6xl font-display font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.75)]"
                >
                  Elevate Your <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent italic drop-shadow-[0_6px_20px_rgba(168,85,247,0.9)]">
                    Creative Journey
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                  className="text-slate-200 text-lg md:text-xl max-w-md leading-relaxed drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]"
                >
                  Join the most exclusive gallery for digital and physical masterpieces.
                  Connect with world-class artists today.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 1 }}
                className="flex items-center gap-3 text-sm font-medium text-slate-400"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>
                  Join the founding community of independent artists
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes subtle-zoom {
          0% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
        .animate-subtle-zoom {
          animation: subtle-zoom 20s ease-in-out infinite;
        }
        .font-display {
          font-family: 'Playfair Display', serif;
        }
      `}} />
    </div>
  );
}

export default UserLogin;