// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin-login');
        return;
      }
      setUserEmail(user.email);
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        navigate('/main-dashboard');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-700">Checking admin credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto glass-card backdrop-blur-lg p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-gradient-primary mb-4">
          Welcome, {userEmail}
        </h1>
        <p className="text-gray-600 mb-6">
          You have administrative access. Use the navigation menu to manage users,
          artists, and artworks.
        </p>
        {/* Future admin features: user management, analytics, content moderation, etc. */}
      </div>
    </div>
  );
}

export default AdminDashboard;
