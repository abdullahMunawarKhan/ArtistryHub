import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Eye, EyeOff, Mail, Lock, ChevronRight, AlertCircle, CheckCircle2, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

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
    if (loading) return;

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
      const redirectTo = Capacitor.isNativePlatform()
        ? 'scopebrush://auth/callback'
        : window.location.origin + '/user-login';

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
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
        text: 'Account created! Please check your email to confirm your account.',
        type: 'success',
      });

      setTimeout(() => navigate('/user-login'), 4000);

    } catch (err) {
      console.error(err);
      setMessage({ text: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Overlay for depth */}


      <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-1 sm:pt-4 lg:pt-6 pb-4 sm:pb-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-900/20 backdrop-blur-3xl rounded-[32px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10"
        >
          {/* Left Side: Artistic Content */}
          <div className="hidden lg:flex relative bg-slate-900 overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="/images/login.png"
                alt="Artistic inspiration"
                className="w-full h-full object-cover opacity-60 scale-110 lg:animate-subtle-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            </div>

            <div className="relative z-10 p-12 flex flex-col justify-start gap-8 text-white">

              <motion.div
                initial={{ opacity: 0, x: -20 }}
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
                  Start Your <br />
                  <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent italic drop-shadow-[0_6px_20px_rgba(245,158,11,0.6)]">
                    Masterpiece
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                  className="text-slate-200 text-lg md:text-xl max-w-md leading-relaxed drop-shadow-[0_4px_14px_rgba(0,0,0,0.6)]"
                >
                  Create an account to begin your journey in the world's most vibrant art marketplace. Collect, sell, and dream.
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

          {/* Right Side: Signup Form */}
          <div
            className="
    p-5 sm:p-12 lg:p-16
    flex flex-col justify-center relative
    text-white lg:text-gray-900
    lg:bg-white
  "
          >
            {/* Background Image (ONLY mobile & tablet) */}
            <div className="absolute inset-0 -z-10 lg:hidden">
              <img
                src="/images/login.png"
                alt="Artistic background"
                className="w-full h-full object-cover scale-110 opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/45 via-slate-900/40 to-slate-900/55" />
            </div>

            {/* Mobile Header */}
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
                    transition={{ delay: 0.3, duration: 0.6 }}
                  >
                    ScopeBrush
                  </motion.div>
                  <motion.div
                    className="h-1 w-24 sm:w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-2"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              </div>
            </div>

            <div className="relative max-w-md mx-auto w-full px-4">
              {/* Header */}
              <div className="mb-5 px-5 py-4 rounded-2xl text-center">
                <h2 className="text-2xl font-bold text-white lg:text-gray-900">
                  Create Account
                </h2>
                <p className="text-xs text-white/70 lg:text-gray-500 mt-1">
                  Sign up to explore original art
                </p>
              </div>

              {/* Status Messages */}
              <AnimatePresence mode="wait">
                {message.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`
            mb-4 px-4 py-3 rounded-xl text-sm border
            ${message.type === "error"
                        ? "bg-red-500/20 lg:bg-red-50 border-red-400/30 lg:border-red-200 text-red-200 lg:text-red-700"
                        : "bg-green-500/20 lg:bg-green-50 border-green-400/30 lg:border-green-200 text-green-200 lg:text-green-700"
                      }
          `}
                  >
                    {message.type === "error"
                      ? <AlertCircle className="inline w-4 h-4 mr-2" />
                      : <CheckCircle2 className="inline w-4 h-4 mr-2" />
                    }
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSignup();
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

                <div className="px-4 py-3 rounded-xl bg-slate-900/30 border border-white/20 lg:bg-white lg:border-gray-300 focus-within:lg:border-purple-500 transition-colors">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="
            w-full bg-transparent text-sm
            text-white placeholder:text-white/50
            lg:text-gray-900 lg:placeholder:text-gray-400
            outline-none focus:outline-none focus:ring-0 focus:shadow-none
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

                <div className="px-4 py-3 rounded-xl relative bg-slate-900/30 border border-white/20 lg:bg-white lg:border-gray-300 focus-within:lg:border-purple-500 transition-colors">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="
            w-full bg-transparent text-sm pr-10
            text-white placeholder:text-white/50
            lg:text-gray-900 lg:placeholder:text-gray-400
            outline-none focus:outline-none focus:ring-0 focus:shadow-none
          "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 lg:text-gray-500 hover:opacity-80"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <label className="
  text-sm font-semibold
  flex items-center gap-2 mb-1
  text-white/95
  lg:text-gray-700
">
                  <UserPlus className="w-4 h-4 text-white lg:text-gray-500" />
                  Confirm Password
                </label>

                <div className="px-4 py-3 rounded-xl relative bg-slate-900/30 border border-white/20 lg:bg-white lg:border-gray-300 focus-within:lg:border-purple-500 transition-colors">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="
            w-full bg-transparent text-sm pr-10
            text-white placeholder:text-white/50
            lg:text-gray-900 lg:placeholder:text-gray-400
            outline-none focus:outline-none focus:ring-0 focus:shadow-none
          "
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 lg:text-gray-500 hover:opacity-80"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Submit */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-2xl bg-amber-600 text-white font-bold shadow-lg"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </motion.button>
              </form>

              {/* Footer */}
              <div className="mt-5 px-4 py-3 rounded-xl bg-slate-900/30 lg:bg-gray-50 border border-white/20 lg:border-gray-200 text-center">
                <p className="text-xs text-white/70 lg:text-gray-600">
                  Already a member?{" "}
                  <Link to="/user-login" className="font-bold text-white lg:text-purple-600 hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
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

export default Signup;