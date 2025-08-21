import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function TopPanel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  // Fetch user session from Supabase on mount and on auth changes
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch user role from Supabase profile table
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!error && profile && profile.role) {
          setUserRole(profile.role);
        } else {
          setUserRole('');
        }
      } else {
        setUserRole('');
      }
    };
    getUser();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (!error && profile && profile.role) {
              setUserRole(profile.role);
            } else {
              setUserRole('');
            }
          });
      } else {
        setUserRole('');
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Admin Login logic
  const handleAdminLoginClick = (e) => {
    if (e.type === 'click') {
      setAdminMenuOpen((prev) => !prev); // Toggle on click
    }
  };

  // Hide admin menu on double click
  const handleAdminLoginDoubleClick = () => {
    setAdminMenuOpen(false);
  };

  // Optional: Hide admin menu when clicking outside
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

  // Navigation handlers
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
        {/* Menu for login options */}
        <div className="relative">
          <button
            onClick={handleAdminLoginClick}
            onDoubleClick={handleAdminLoginDoubleClick}
            onMouseEnter={() => !adminMenuOpen && setAdminMenuOpen(true)}
            className="text-yellow-400 px-3 py-1 rounded font-semibold hover:text-yellow-300"
          >
            Login
          </button>
          {adminMenuOpen && (
            <div
              ref={adminMenuRef}
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl text-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
            >
              {/* Always show extra user options, even if not logged in */}
              <div className="border-t border-yellow-100 mt-2 pt-2">
                <button
                  className="w-full px-5 py-3 text-left text-gray-700 hover:bg-yellow-50 transition text-base font-medium"
                  onClick={() => {
                    setAdminMenuOpen(false);
                    if (!user) {
                      navigate('/user-login');
                    } else {
                      navigate('/register');
                    }
                  }}
                >Register as Artist</button>
                <button
                  className="w-full px-5 py-3 text-left text-gray-700 hover:bg-yellow-50 transition text-base font-medium"
                  onClick={() => {
                    setAdminMenuOpen(false);
                    if (!user) {
                      navigate('/user-login');
                    } else {
                      navigate('/cart');
                    }
                  }}
                >Your Cart</button>
                <button
                  className="w-full px-5 py-3 text-left text-gray-700 hover:bg-yellow-50 transition text-base font-medium"
                  onClick={() => {
                    setAdminMenuOpen(false);
                    if (!user) {
                      navigate('/user-login');
                    } else {
                      navigate('/orders');
                    }
                  }}
                >Orders</button>
              </div>
              {!user ? (
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
              ) : (
                <>
                  <div className="px-5 py-4 bg-yellow-50 border-b border-yellow-100">
                    <div className="text-xs text-gray-500">Signed in as</div>
                    <div className="font-semibold text-gray-900 truncate text-xs break-all leading-tight" style={{ maxWidth: '170px' }}>
                      {user.email}
                    </div>
                  </div>
                  {/* Show dashboard based on role (admin/user) */}
                  {userRole === 'admin' && (
                    <button
                      onClick={() => {
                        setAdminMenuOpen(false);
                        navigate('/admin-dashboard');
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                    >
                      Admin Dashboard
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3 text-left hover:bg-red-50 transition text-base font-semibold text-red-600"
                  >
                    Logout
                  </button>
                </>
              )}
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
            <button
              className="self-end mr-4 mb-6"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button onClick={() => handleNav('/')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">Home</button>
            <button onClick={() => handleNav('/get-appointment')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">Get Appointment</button>
            <button onClick={() => handleNav('/contact-us')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">Contact Us</button>
            <button onClick={() => handleNav('/sample-bond-paper')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">Sample Bond Paper</button>
            <button onClick={() => handleNav('/current-rates')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">Check Current Rates</button>
            <button onClick={() => handleNav('/services')} className="text-gray-900 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left">Services Provided</button>
            {/* Admin menu for mobile */}
            <div className="border-t mt-4 pt-4">
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
              ) : (
                <>
                  <div className="px-6 py-2 text-xs text-gray-500">
                    Signed in as <span className="font-bold text-gray-900 break-all">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/admin-dashboard');
                    }}
                    className="text-yellow-600 px-6 py-3 text-lg font-semibold hover:bg-yellow-50 text-left"
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setMenuOpen(false);
                      navigate('/');
                    }}
                    className="text-red-600 px-6 py-3 text-lg font-semibold hover:bg-red-50 text-left"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default TopPanel;

