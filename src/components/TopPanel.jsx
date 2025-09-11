import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';


function TopPanel({ footerOpen, setFooterOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [artistProfile, setArtistProfile] = useState(null);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const adminMenuRef = useRef();
  const loginDropdownRef = useRef();
  const profileMenuRef = useRef();

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

  let clickTimeout = null;

  const handleAboutUsClick = () => {
    if (!footerOpen) {
      // Footer is closed: open it and scroll to it
      setFooterOpen(true);
      setTimeout(() => {
        const footer = document.querySelector('footer');
        if (footer) footer.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      // Footer is already open: close it
      setFooterOpen(false);
    }
  };





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
    setProfileMenuOpen(false);
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
    setProfileMenuOpen(false);
  };



  const scrollToFooter = () => {
    const footer = document.querySelector('footer');
    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/20 shadow-ScopeBrush">
      <nav className="flex items-center justify-between px-2 md:px-8 py-2 w-full">
        {/* Left: Logo and Name, flush to left */}
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/images/logo2.png" alt="ScopeBrush Logo" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold" style={{ color: '#D740A1' }}>ScopeBrush</span>
          </Link>

        </div>

        {/* Center: Desktop Navigation */}
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
          {!isAdmin && (
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
          )}
          {isAdmin && (
            <div className="relative" ref={adminMenuRef}>
              <button
                onClick={handleAdminDashboard}
                className="w-full text-left px-3 py-2 nav-link rounded-lg"
              >
                ⚙️📊 Admin Dashboard
              </button>
            </div>
          )}
          <button
            onClick={handleAboutUsClick}
            
            className="px-4 py-2 rounded-2xl text-gray-700 hover:text-white hover:bg-gray-700 transition-colors duration-300 shadow-sm"
          >
            About Us
          </button>

        </div>

        {/* Right: User icon and text, flush to right */}
        <div className="flex items-center flex-shrink-0 justify-end">
          <div className="flex items-center gap-2">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  className="flex flex-col items-center bg-transparent border-none cursor-pointer"
                  aria-label="User profile menu"
                  style={{ marginRight: 0 }}
                >
                  <img
                    src="/images/user_profile.png"
                    alt="Profile Icon"
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                  />
                  <span style={{ fontSize: '0.75rem', marginTop: '2px' }}>User</span>
                </button>
                {profileMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      width: 220,
                      padding: '0.5rem 1rem',
                      zIndex: 1000,
                    }}
                  >
                    <div style={{ marginBottom: 8, fontSize: '0.875rem' }}>
                      <div>Signed in as</div>
                      <div style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{user.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 relative">
                {/* Dropdown Login */}
                <div className="relative">
                  <button
                    onClick={() => setLoginDropdownOpen((prev) => !prev)}
                    className="btn-primary flex items-center gap-2 px-5 py-2"
                    type="button"
                  >
                    Login <span className="ml-1">▾</span>
                  </button>
                  {loginDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-40 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setLoginDropdownOpen(false);
                          navigate('/user-login');
                        }}
                        className="block w-full text-left px-4 py-3 hover:bg-purple-50 font-medium text-purple-700 transition"
                      >
                        User Login
                      </button>
                    </div>
                  )}
                </div>
                <Link
                  to="/signup"
                  className="btn-outline px-5 py-2 hover:border-purple-400 hover:text-purple-700 transition ml-2"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              style={{ marginLeft: 4, marginRight: 0 }} // Adjust spacing as needed
            >
              {/* Hamburger icon */}
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${menuOpen ? 'rotate-45 translate-y-1' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-gray-600 transition-opacity ${menuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${menuOpen ? '-rotate-45 -translate-y-1' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-lg">
          <div className="px-6 py-4 space-y-4">
            <button onClick={() => navOrLogin('/feed')} className="nav-link">
              Explore Arts
            </button>
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

            {!isAdmin && (
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
            )}
            {isAdmin && (
              <button
                onClick={handleAdminDashboard}
                className="block nav-link py-2 w-full text-left"
              >
                ⚙️ Admin Dashboard
              </button>
            )}
            <button
              onClick={handleAboutUsClick}
              
              className="px-4 py-2 rounded-2xl text-gray-700 hover:text-white hover:bg-gray-700 transition-colors duration-300 shadow-sm"
            >
              About Us
            </button>

          </div>
        </div>
      )}

      {/* Login Modal */}
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

