// src/components/TopPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function TopPanel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [artistProfile, setArtistProfile] = useState(null); // to track if user is artist

  const navigate = useNavigate();
  const adminMenuRef = useRef();

  // Fetch user and role and artist profile
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch role from 'users' table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profileError && profile && profile.role) {
          setUserRole(profile.role);
        } else {
          setUserRole('');
        }

        // Fetch artist profile to check if user is registered as artist
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('id')
          .eq('user_id', user.id) // assuming you have user_id field in artists referencing users
          .single();

        if (!artistError && artistData) {
          setArtistProfile(artistData);
        } else {
          setArtistProfile(null);
        }
      } else {
        setUserRole('');
        setArtistProfile(null);
      }
    };

    getUserData();

    // Listen for auth changes & refresh data
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        getUserData();
      } else {
        setUser(null);
        setUserRole('');
        setArtistProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleAdminLoginClick = (e) => {
    if (e.type === 'click') {
      setAdminMenuOpen((prev) => !prev);
    }
  };

  const handleAdminLoginDoubleClick = () => {
    setAdminMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
    }

    if (adminMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [adminMenuOpen]);

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleAdminDashboard = () => {
    setAdminMenuOpen(false);
    navigate('/admin-dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminMenuOpen(false);
    navigate('/');
  };

  // Helper to navigate or redirect to login if not signed in
  const navOrLogin = (path) => {
    if (user) {
      navigate(path);
    } else {
      navigate('/user-login');
    }
    setMenuOpen(false);
    setAdminMenuOpen(false);
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl fixed top-0 inset-x-0 z-50 border-b border-white/20 shadow-artistryhub">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="artistryhub-logo no-print">
          <span className="logo-icon">🎨</span>
          ArtistryHub
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/main-dashboard" className="nav-link">
            🏠 Home
          </Link>
          <Link to="/artist-list" className="nav-link">
            👨‍🎨 Artists
          </Link>
          
          {user && (
            <>
              <button onClick={() => navOrLogin('/cart')} className="nav-link">
                🛒 Cart
              </button>
              <button onClick={() => navOrLogin('/orders')} className="nav-link">
                📦 Orders
              </button>
              
              {artistProfile && (
                <Link to={`/artist-profile?id=${artistProfile.id}`} className="nav-link">
                  👤 My Profile
                </Link>
              )}
              
              {!artistProfile && (
                <button onClick={() => navOrLogin('/register')} className="nav-link">
                  ✨ Become Artist
                </button>
              )}
            </>
          )}

          {/* Admin Section */}
          {userRole === 'admin' && (
            <div className="relative" ref={adminMenuRef}>
              <button
                onClick={handleAdminLoginClick}
                onDoubleClick={handleAdminLoginDoubleClick}
                className="nav-link relative"
              >
                ⚙️ Admin
              </button>
              {adminMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 artistryhub-card p-2 space-y-1">
                  <button
                    onClick={handleAdminDashboard}
                    className="w-full text-left px-3 py-2 nav-link rounded-lg"
                  >
                    📊 Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 nav-link rounded-lg"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Auth Buttons */}
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome, {user.email?.split('@')[0]}
              </span>
              {userRole !== 'admin' && (
                <button onClick={handleLogout} className="btn-secondary">
                  Logout
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/user-login" className="btn-primary">
                Login
              </Link>
              <Link to="/signup" className="btn-outline">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="w-6 h-6 flex flex-col justify-center space-y-1">
            <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${menuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
            <span className={`block h-0.5 w-6 bg-gray-600 transition-opacity ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${menuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
          </div>
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-lg">
          <div className="px-6 py-4 space-y-4">
            <Link 
              to="/main-dashboard" 
              onClick={() => handleNav('/main-dashboard')}
              className="block nav-link py-2"
            >
              🏠 Home
            </Link>
            <Link 
              to="/artist-list" 
              onClick={() => handleNav('/artist-list')}
              className="block nav-link py-2"
            >
              👨‍🎨 Artists
            </Link>
            
            {user ? (
              <>
                <button 
                  onClick={() => navOrLogin('/cart')} 
                  className="block nav-link py-2 w-full text-left"
                >
                  🛒 Cart
                </button>
                <button 
                  onClick={() => navOrLogin('/orders')} 
                  className="block nav-link py-2 w-full text-left"
                >
                  📦 Orders
                </button>
                
                {artistProfile && (
                  <Link 
                    to={`/artist-profile?id=${artistProfile.id}`}
                    onClick={() => handleNav(`/artist-profile?id=${artistProfile.id}`)}
                    className="block nav-link py-2"
                  >
                    👤 My Profile
                  </Link>
                )}
                
                {!artistProfile && (
                  <button 
                    onClick={() => navOrLogin('/register')} 
                    className="block nav-link py-2 w-full text-left"
                  >
                    ✨ Become Artist
                  </button>
                )}
                
                {userRole === 'admin' && (
                  <button 
                    onClick={handleAdminDashboard}
                    className="block nav-link py-2 w-full text-left"
                  >
                    ⚙️ Admin Dashboard
                  </button>
                )}
                
                <button 
                  onClick={handleLogout} 
                  className="block btn-secondary w-full mt-4"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-3 pt-4">
                <Link 
                  to="/user-login" 
                  onClick={() => handleNav('/user-login')}
                  className="block btn-primary w-full text-center"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => handleNav('/signup')}
                  className="block btn-outline w-full text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default TopPanel;
