import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [role, setRole] = useState('');
	const navigate = useNavigate();

	useEffect(() => {
		const checkAuth = async () => {
			const { data: { user } } = await supabase.auth.getUser();
			setUser(user);
			if (!user) {
				navigate('/admin-login');
				return;
			}
			// Fetch role from Supabase profile table
			const { data: profile, error } = await supabase
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single();
			if (!error && profile && profile.role === 'admin') {
				setRole('admin');
			} else {
				// Not admin, redirect to main dashboard
				navigate('/main-dashboard');
				return;
			}
			setLoading(false);
		};
		checkAuth();
	}, [navigate]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-yellow-100 to-pink-100">
				<div className="text-xl text-gray-700 font-bold animate-pulse">Loading Admin Dashboard...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 via-yellow-100 to-pink-100 p-8">
			<div className="max-w-4xl mx-auto bg-white/80 rounded-2xl shadow-2xl p-10 mt-10">
				<h1 className="text-4xl font-bold text-gradient mb-4 text-center">Admin Dashboard</h1>
				<p className="text-lg text-gray-700 text-center mb-8">Welcome, <span className="font-bold text-yellow-700">{user?.email}</span></p>
				<div className="divider-yellow" />
				{/* Future admin features will go here */}
				<div className="text-center text-gray-500 mt-10">Admin features coming soon...</div>
			</div>
		</div>
	);
}

export default AdminDashboard;
