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

			// Validation
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
				// Fetch admin credentials from 'admin' table
				const { data: adminData, error: adminError } = await supabase
					.from('admin')
					.select('id, email, password')
					.eq('email', email.trim().toLowerCase())
					.single();

				if (adminError || !adminData) {
					setLoginError('Admin not found or invalid email.');
				} else if (adminData.password !== password) {
					setLoginError('Incorrect password.');
				} else {
					// Successful admin login
					setTimeout(() => {
						navigate('/admin-dashboard');
					}, 1000);
				}
			} catch (err) {
				setLoginError('Unexpected error. Please try again.');
			}
			setIsLoggingIn(false);
		};


	return (
		<div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-yellow-100 to-pink-100 p-6 sm:p-8">
			<div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-2xl p-8 space-y-6">
				<div className="text-center space-y-2">
					<div className="flex justify-center">
						<div className="h-12 w-40 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-gray-900 font-extrabold text-xl shadow-lg">
							ArtistryHub
						</div>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 font-['Nova_Round',cursive]">Admin Login</h2>
					<p className="text-sm text-gray-600">Sign in as admin to manage artists and users</p>
				</div>

				<div className="space-y-1">
					<label className="block text-sm font-medium text-gray-700">Email Address</label>
					<input
						type="email"
						placeholder="Enter your admin email"
						aria-label="Admin Email Address"
						className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={isLoggingIn}
						onKeyPress={(e) => {
							if (e.key === 'Enter' && !isLoggingIn) {
								handleLogin();
							}
						}}
					/>
					{errorEmail && <p className="text-red-500 text-sm">{errorEmail}</p>}
				</div>

				<div className="space-y-1">
					<label className="block text-sm font-medium text-gray-700">Password</label>
					<div className="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							placeholder="Enter your password"
							aria-label="Password"
							className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 pr-12 transition-colors"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isLoggingIn}
							onKeyPress={(e) => {
								if (e.key === 'Enter' && !isLoggingIn) {
									handleLogin();
								}
							}}
						/>
						<button
							type="button"
							className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
							onClick={() => setShowPassword((prev) => !prev)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							tabIndex={-1}
						>
							{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
						</button>
					</div>
					{errorPassword && <p className="text-red-500 text-sm">{errorPassword}</p>}
				</div>

				{loginError && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-3">
						<p className="text-red-600 text-sm text-center">{loginError}</p>
					</div>
				)}

				<button
					onClick={handleLogin}
					disabled={isLoggingIn}
					className={`w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 py-3 rounded-lg font-semibold hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 shadow-lg ${
						isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'
					}`}
					aria-busy={isLoggingIn}
				>
					{isLoggingIn ? (
						<div className="flex items-center justify-center gap-2">
							<div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
							Logging in...
						</div>
					) : (
						'Sign In as Admin'
					)}
				</button>
			</div>
		</div>
	);
}

export default AdminLogin;
