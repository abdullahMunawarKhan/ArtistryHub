import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function TopPanel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [artistProfile, setArtistProfile] = useState(null);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);


  const navigate = useNavigate();
  const adminMenuRef = useRef();
  const loginDropdownRef = useRef();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        // Query unified 'user' table for role and email
        const { data: userProfile, error: profileError } = await supabase
          .from('user')
          .select('id, email, role')
          .eq('id', authUser.id)
          .single()

        if (profileError || !userProfile) {
          setIsAdmin(false);
          setArtistProfile(null);
        } else {
          setIsAdmin(userProfile.role === 'efbv');

          if (userProfile.role === 'efbv') {
            setArtistProfile(null);
          } else {
            // Fetch artist profile for normal users only
            const { data: artistData, error: artistError } = await supabase
              .from('artists')
              .select('id')
              .eq('user_id', authUser.id)
              .single()

            setArtistProfile(artistData || null);
          }
        }
      } else {
        setIsAdmin(false);
        setArtistProfile(null);
      }
    };

    getUserData();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        getUserData();
      } else {
        setUser(null);
        setIsAdmin(false);
        setArtistProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);





  useEffect(() => {
    function handleClickOutside(event) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setLoginDropdownOpen(false);
      }
    }

    if (adminMenuOpen || loginDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminMenuOpen, loginDropdownOpen]);

  const handleNav = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleAdminDashboard = () => {
    setAdminMenuOpen(false);
    navigate('/dshakfgadsj');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAdminMenuOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const navOrLogin = (path) => {
    if (user) {
      navigate(path);
    } else {
      setShowLoginModal(true);
    }
    setMenuOpen(false);
    setAdminMenuOpen(false);
    setLoginDropdownOpen(false);
  };



  return (
    <header className="bg-white/90 backdrop-blur-xl fixed top-0 inset-x-0 z-50 border-b border-white/20 shadow-artistryhub py-1">

      <nav className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between min-h-[46px]">
        {/* Logo */}
        <Link to="/" className="artistryhub-logo no-print">

          ArtistryHub
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => navOrLogin('/feed')} className="nav-link">
            Explore Arts
          </button>

          <Link to="/main-dashboard" className="nav-link">
            🏠 Home
          </Link>
          <Link to="/artist-list" className="nav-link">
            👨‍🎨 Artists
          </Link>


          <>
            <button onClick={() => navOrLogin('/cart')} className="nav-link">
              🛒 Cart
            </button>
            <button onClick={() => navOrLogin('/orders')} className="nav-link">
              📦 Orders
            </button>

            {artistProfile && (
              <Link to={`/artist-profile?id=${artistProfile.id}`} className="nav-link">
                👤 <br />My Profile
              </Link>
            )}

            {!artistProfile && (
              <button onClick={() => navOrLogin('/register')} className="nav-link">
                ✨ Become Artist
              </button>
            )}
          </>



          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome, {user.email?.split('@')[0]}
              </span>

              <button onClick={handleLogout} className="btn-secondary ">
                Logout
              </button>

            </div>
          ) : (
            <div className="flex items-center gap-2 relative">

              <div className="relative">
                <button
                  onClick={() => { setLoginDropdownOpen(false); navigate('/user-login'); }}
                  className="btn-primary flex items-center gap-2 px-5 py-2"
                  type="button"
                >
                  Login <span className="ml-1">▾</span>
                </button>

              </div>
              <Link
                to="/signup"
                className="btn-outline px-5 py-2 hover:border-purple-400 hover:text-purple-700 transition ml-2"
              >
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
            <span
              className={`block h-0.5 w-6 bg-gray-600 transition-transform ${menuOpen ? 'rotate-45 translate-y-1' : ''
                }`}
            ></span>
            <span
              className={`block h-0.5 w-6 bg-gray-600 transition-opacity ${menuOpen ? 'opacity-0' : ''
                }`}
            ></span>
            <span
              className={`block h-0.5 w-6 bg-gray-600 transition-transform ${menuOpen ? '-rotate-45 -translate-y-1' : ''
                }`}
            ></span>
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
                </>


                <button onClick={handleLogout} className="block btn-secondary w-full mt-4">
                  Logout
                </button>
              </>
            ) : (
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setLoginDropdownOpen(false);
                    navigate('/user-login');
                  }}
                  className="block btn-primary w-full text-center"
                >
                  Login
                </button>

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
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <h2 className="text-lg font-bold mb-4">Please Login</h2>
            <p className="mb-6">Login to use this feature.</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setShowLoginModal(false);
                navigate('/main-dashboard'); // redirect on modal close
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}


    </header>
  );
}

export default TopPanel;
