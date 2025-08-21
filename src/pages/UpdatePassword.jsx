import React, { useState } from 'react';
import { supabase } from '../utils/supabase'; // Adjust if needed
import { useNavigate } from 'react-router-dom';

function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    setErrorMsg('');
    setSuccessMsg('');

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Both fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      // Supabase method for updating password for logged-in user
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to update password.');
      } else {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        let role = 'user';
        if (user) {
          // Fetch user role from Supabase profile table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          if (!profileError && profile && profile.role) {
            role = profile.role;
          }
        }
        setSuccessMsg(`Your password has been updated successfully! (${role === 'admin' ? 'Admin' : 'User'} account)`);
        setTimeout(() => {
          if (role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/main-dashboard');
          }
        }, 3000);
      }
    } catch (err) {
      setErrorMsg('Unexpected error, please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#8ec5fc] via-[#e0c3fc] to-[#f9f3f3] p-6 sm:p-8 mx-2 sm:mx-auto max-w-md sm:max-w-lg md:max-w-xl">
      {/* Background animations like login */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500 rounded-xl shadow-2xl transform rotate-12 blur-sm animate-bounce-slow z-0"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-pink-400 rounded-full shadow-xl blur-md transform scale-110 animate-float z-0"></div>
      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-yellow-300 rounded-full shadow-lg blur-sm animate-pulse z-0"></div>
      <div className="absolute bottom-1/4 left-10 w-14 h-14 bg-purple-400 rounded-3xl rotate-45 shadow-md animate-spin-slow z-0"></div>

      {/* Password Update Form */}
      <form
        onSubmit={handleUpdatePassword}
        className="z-10 w-full max-w-full bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-10 space-y-6"
        aria-label="Update Password Form"
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Update Your Password
        </h2>

        {(errorMsg || successMsg) && (
          <div
            className={`px-4 py-2 rounded-md text-center text-sm ${
              errorMsg
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}
            role="alert"
          >
            {errorMsg || successMsg}
          </div>
        )}

        {/* New Password */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            aria-label="New Password"
            className="w-full px-4 py-3 rounded-full bg-white/70 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition pr-12"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-600"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 3C5.455 3 1.868 6.69 1 10c.868 3.31 4.456 7 9 7 4.545 0 8.132-3.69 9-7-.868-3.31-4.455-7-9-7zM10 15a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M17.94 17.94A10.06 10.06 0 0110 21c-4.545 0-8.132-3.69-9-7a11.59 11.59 0 012.16-3.56" />
                <path d="M14.47 14.47a3 3 0 01-4.24-4.24" />
                <path d="M9.88 9.88A3 3 0 0114.47 14.47" />
              </svg>
            )}
          </button>
        </div>

        {/* Confirm Password */}
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm New Password"
          aria-label="Confirm New Password"
          className="w-full px-4 py-3 rounded-full bg-white/70 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-full font-semibold hover:scale-[1.02] transition shadow-lg ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-busy={loading}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}

export default UpdatePassword;
