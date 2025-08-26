import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function TopPanel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [artistProfile, setArtistProfile] = useState(null); // to track if user is artist
  const navigate = useNavigate();

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
          .eq('user_id', user.id)  // assuming you have user_id field in artists referencing users
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

  const adminMenuRef = useRef();
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
    <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
      {/* Logo */}
      <div className="text-2xl font-bold font-['Nova_Round',cursive] select-none">
        ArtistryHub
      </div>

      {/* Desktop nav */}
      <nav className="hidden md:flex gap-6 ml-8 flex-wrap items-center">
        <button onClick={() => handleNav('/main-dashboard')} className="text-white px-3 py-1 rounded font-semibold hover:text-yellow-400">Home</button>
        <button onClick={() => handleNav('/artist-list')} className="text-white px-3 py-1 rounded font-semibold hover:text-yellow-400">See Artist</button>

        {/* Always show these buttons but redirect to login if not authenticated */}
        <button
          className="text-white px-3 py-1 rounded font-semibold hover:text-yellow-400"
          onClick={() => navOrLogin(artistProfile ? `/artist-profile?id=${artistProfile.id}` : '/register')}
        >
          {user && artistProfile ? 'Artist Profile' : 'Register as Artist'}
        </button>

        <button
          className="text-white px-3 py-1 rounded font-semibold hover:text-yellow-400"
          onClick={() => navOrLogin('/cart')}
        >
          Your Cart
        </button>

        <button
          className="text-white px-3 py-1 rounded font-semibold hover:text-yellow-400"
          onClick={() => navOrLogin('/orders')}
        >
          Orders
        </button>

        {/* Menu for login options */}
        <div className="relative">
          <button
            onClick={handleAdminLoginClick}
            onDoubleClick={handleAdminLoginDoubleClick}
            onMouseEnter={() => !adminMenuOpen && setAdminMenuOpen(true)}
            className="text-yellow-400 px-3 py-1 rounded font-semibold hover:text-yellow-300"
          >
            {user ? 'User Menu' : 'Login'}
          </button>
          {adminMenuOpen && (
            <div
              ref={adminMenuRef}
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl text-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
            >
              <div className="border-t border-yellow-100 mt-2 pt-2">
                {user ? (
                  <>
                    <div className="px-5 pb-2 text-xs text-gray-500 break-words">
                      <span className="font-semibold text-gray-700">Signed in:</span>
                      <div className="mt-1 text-gray-600 break-words">
                        {user.email}
                      </div>
                    </div>
                    {userRole === 'admin' && (
                      <button
                        className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                        onClick={handleAdminDashboard}
                      >
                        Admin Dashboard
                      </button>
                    )}
                    <button
                      className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setAdminMenuOpen(false);
                        navigate('/user-login');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                    >
                      Login as User
                    </button>
                    <button
                      onClick={() => {
                        setAdminMenuOpen(false);
                        navigate('/admin-login');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                    >
                      Login as Admin
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hamburger for mobile */}
      <button
        className="md:hidden flex items-center justify-center w-10 h-10 rounded hover:bg-gray-800 transition"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex md:hidden">
          <div className="ml-auto w-64 bg-white h-full shadow-xl flex flex-col pt-8">
            <button className="self-end mr-4 mb-6" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button onClick={() => handleNav('/main-dashboard')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">Home</button>
            <button onClick={() => handleNav('/artist-list')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">See Artist</button>

            {/* Always show these buttons but redirect to login if not authenticated */}
            <button
              className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left"
              onClick={() => {
                setMenuOpen(false);
                if (user) {
                  if (artistProfile) navigate(`/artist-profile?id=${artistProfile.id}`);
                  else navigate('/register');
                } else {
                  navigate('/user-login');
                }
              }}
            >
              {user && artistProfile ? 'Artist Profile' : 'Register as Artist'}
            </button>
            <button
              className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left"
              onClick={() => {
                setMenuOpen(false);
                navOrLogin('/cart');
              }}
            >
              Your Cart
            </button>
            <button
              className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left"
              onClick={() => {
                setMenuOpen(false);
                navOrLogin('/orders');
              }}
            >
              Orders
            </button>

            {!user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/admin-login');
                }}
                className="text-yellow-600 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left"
              >
                Admin Login
              </button>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}

export default TopPanel;
