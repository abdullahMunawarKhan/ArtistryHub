import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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

    // Validation
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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMsg(error.message || 'Failed to update password.');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        let role = 'user';
        if (user) {
          // Fetch user role from user table
          const { data: profile, error: profileError } = await supabase
            .from('user')
            .select('role')
            .eq('id', user.id)
            .single();
          if (!profileError && profile?.role) {
            role = profile.role;
          }
        }
        setSuccessMsg(`Password updated successfully! Redirecting ${role === 'admin' ? 'to admin' : 'to main'} dashboard...`);
        setTimeout(() => {
          navigate(role === 'admin' ? '/admin-dashboard' : '/main-dashboard');
        }, 3000);
      }
    } catch {
      setErrorMsg('Unexpected error, please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm glass-card backdrop-blur-lg p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-playfair text-gradient-primary text-center mb-6">
          Update Password
        </h2>

        {errorMsg && <p className="text-red-600 text-center mb-4">{errorMsg}</p>}
        {successMsg && <p className="text-green-700 text-center mb-4">{successMsg}</p>}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="relative">
            <label className="form-label">New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input pr-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <label className="form-label">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input pr-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 font-semibold"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdatePassword;
