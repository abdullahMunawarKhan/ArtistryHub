import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Capacitor } from "@capacitor/core";

import { supabase } from '../utils/supabase';
import {
  Home,
  Users,
  ShoppingCart,
  PackageCheck,
  User,
  UserPlus,
  Sparkles,
  LayoutDashboard,
  Package,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import { UserRound, ChevronDown, Menu, X } from "lucide-react";
import { KeyRound, LogOut, Mail } from "lucide-react";

const FALLBACK_APK_URL =
  "https://efszsjxupcsdeqcisnfi.supabase.co/storage/v1/object/public/apk/ScopeBrush_v1.1.3.apk";

function TopPanel({ footerOpen, setFooterOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [artistProfile, setArtistProfile] = useState(null);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const [apkDownloadUrl, setApkDownloadUrl] = useState(FALLBACK_APK_URL);

  const navigate = useNavigate();
  const adminMenuRef = useRef();
  const loginDropdownRef = useRef();
  const profileMenuRef = useRef();
  const [showLoginToast, setShowLoginToast] = useState(false);

  // Auto-close after 2 seconds
  useEffect(() => {
    if (showLoginToast) {
      const timer = setTimeout(() => setShowLoginToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showLoginToast]);

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
    async function fetchLatestApk() {
      try {
        const { data, error } = await supabase
          .from('appversions')
          .select('version_url')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.version_url) {
          setApkDownloadUrl(data.version_url);
        } else {
          setApkDownloadUrl(FALLBACK_APK_URL);
        }
      } catch (err) {
        console.error('Failed to fetch APK URL', err);
        setApkDownloadUrl(FALLBACK_APK_URL);
      }
    }

    fetchLatestApk();
  }, []);


  useEffect(() => {
    function handleClickOutside(event) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) {
        setAdminMenuOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setLoginDropdownOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    if (adminMenuOpen || loginDropdownOpen || profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminMenuOpen, loginDropdownOpen, profileMenuOpen]);

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
      setShowLoginToast(true);
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
    <header
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      className="bg-white/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/20 shadow-ScopeBrush pl-2 pr-2"
    >
      <nav className="flex items-center justify-between px-2 md:px-4 py-2 w-full">
        {/* Left: Logo and Name, flush to left */}
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/images/logo2.jpeg" alt="ScopeBrush Logo" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold" style={{ color: '#D740A1' }}>ScopeBrush</span>
          </Link>

        </div>

        {/* Center: Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => navOrLogin('/feed')} className="nav-link">
            Explore Arts
          </button>
          <Link to="/main-dashboard" className="nav-link flex items-center gap-2">
            <Home size={18} />
            Home
          </Link>

          <Link to="/artist-list" className="nav-link flex items-center gap-2">
            <Users size={18} />
            Artists
          </Link>

          {!isAdmin && (
            <>
              {artistProfile && (
                <Link
                  to={`/artist-profile?id=${artistProfile.id}`}
                  className="nav-link flex items-center gap-2"
                >
                  <User size={18} />
                  My Profile
                </Link>
              )}

              {!artistProfile && (
                <button onClick={() => navOrLogin('/register')} className="nav-link flex items-center gap-2">
                  <Sparkles size={18} />
                  Become Artist
                </button>
              )}
              <button
                onClick={handleAboutUsClick}

                className="nav-link flex items-center gap-2"
              >
                About Us
              </button>
              <a
                href="https://efszsjxupcsdeqcisnfi.supabase.co/storage/v1/object/public/apk/ScopeBrush_v1.1.3.apk"
                download
                className="nav-link flex items-center gap-2"
              >
                Download App
              </a>
            </>
          )}

          {isAdmin && (
            <div className="relative" ref={adminMenuRef}>
              <button
                onClick={handleAdminDashboard}
                className="w-full text-left px-3 py-2 nav-link rounded-lg flex items-center gap-2"
              >
                <LayoutDashboard size={18} />
                Admin Dashboard
              </button>
            </div>
          )}



        </div>

        {/* Right: User icon and text, flush to right */}
        <div className="flex items-center flex-shrink-0 justify-end">
          {/* Cart + Orders → only on Laptop/Desktop */}
          <div className="hidden md:flex items-center gap-3 pr-3">
            <button onClick={() => navOrLogin('/cart')} className="nav-link flex items-center gap-2">
              <ShoppingCart size={24} />
            </button>

            <button onClick={() => navOrLogin('/orders')} className="nav-link flex items-center gap-4">
              <PackageCheck size={24} />
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4 pr-1">

            {user ? (
              <div className="relative" ref={profileMenuRef}>

                {/* Profile Button */}
                <button
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  className="flex items-center justify-center w-10 h-10
                   rounded-full bg-white/70 backdrop-blur-md 
                   border border-purple-300 shadow-md 
                   hover:shadow-lg hover:scale-105 transition-all"
                  aria-label="User profile menu"
                >
                  <UserRound size={22} className="text-purple-600" />
                </button>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div
                    className="absolute right-0 mt-3 w-60 bg-white backdrop-blur-2xl
             rounded-2xl shadow-2xl border border-white
             z-50 overflow-hidden animate-fadeIn"
                  >
                    {/* Header Section */}
                    <div className="px-4 py-4 text-sm border-b border-gray-200/60">
                      <p className="text-gray-500 text-xs">Signed in as</p>

                      <div className="flex items-center gap-2 mt-1 text-gray-900 break-words leading-snug">
                        <Mail size={16} className="text-purple-600" />
                        <span className="font-semibold">{user.email}</span>
                      </div>
                    </div>

                    {/* Reset Password */}
                    <button
                      onClick={() => navigate("/update-password")}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm 
               font-medium text-blue-600 hover:bg-blue-50/70 
               transition-all duration-150"
                    >
                      <KeyRound size={18} className="text-blue-600" />
                      Reset Password
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm 
               font-medium text-red-600 hover:bg-red-50/70 
               transition-all duration-150"
                    >
                      <LogOut size={18} className="text-red-600" />
                      Logout
                    </button>
                  </div>

                )}

              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate("/user-login")}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg 
                   bg-purple-600 text-white font-medium 
                   hover:bg-purple-700 shadow transition-all"
                >
                  Login
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X size={26} className="text-gray-700" />
              ) : (
                <Menu size={26} className="text-gray-700" />
              )}
            </button>

          </div>

        </div>

      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-lg">
          <div className="menu-container">
            <nav className="glass-menu">
              <ul className="menu-list">

                {/* Login & Signup (when no user) */}
                {!user && (
                  <>
                    <li>
                      <button
                        className="menu-item flex items-center justify-center gap-2 w-full text-center"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/user-login');
                        }}
                      >
                        <User size={18} />
                        Login
                      </button>
                    </li>

                    <li>
                      <button
                        className="menu-item flex items-center justify-center gap-2 w-full text-center"
                        onClick={() => {
                          setMenuOpen(false);
                          navigate('/signup');
                        }}
                      >
                        <UserPlus className="w-4 h-4" />
                        Sign Up
                      </button>
                    </li>
                  </>
                )}

                {/* Explore */}
                <li>
                  <button
                    className="menu-item flex items-center justify-center gap-2 w-full text-center"
                    onClick={() => {
                      setMenuOpen(false);
                      navOrLogin('/feed');
                    }}
                  >
                    <ImageIcon size={18} />
                    Explore
                  </button>
                </li>

                {/* Home */}
                <li>
                  <button
                    className="menu-item flex items-center justify-center gap-2 w-full text-center"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/main-dashboard');
                    }}
                  >
                    <Home size={18} />
                    Home
                  </button>
                </li>

                {/* Artists */}
                <li>
                  <button
                    className="menu-item flex items-center justify-center gap-2 w-full text-center"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/artist-list');
                    }}
                  >
                    <Users size={18} />
                    Artists
                  </button>
                </li>

                {/* User-Only Items */}
                {!isAdmin && (
                  <>
                    {/* Cart */}
                    <li>
                      <button
                        className="menu-item flex items-center justify-center gap-2 w-full text-center"
                        onClick={() => {
                          setMenuOpen(false);
                          navOrLogin('/cart');
                        }}
                      >
                        <ShoppingCart size={18} />
                        Cart
                      </button>
                    </li>

                    {/* Orders */}
                    <li>
                      <button
                        className="menu-item flex items-center justify-center gap-2 w-full text-center"
                        onClick={() => {
                          setMenuOpen(false);
                          navOrLogin('/orders');
                        }}
                      >
                        <Package size={18} />
                        Orders
                      </button>
                    </li>

                    {/* My Profile */}
                    {artistProfile ? (
                      <li>
                        <button
                          className="menu-item flex items-center justify-center gap-2 w-full text-center"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate(`/artist-profile?id=${artistProfile.id}`);
                          }}
                        >
                          <User size={18} />
                          My Profile
                        </button>
                      </li>
                    ) : (
                      <li>
                        <button
                          className="menu-item flex items-center justify-center gap-2 w-full text-center whitespace-nowrap"
                          onClick={() => {
                            setMenuOpen(false);
                            navOrLogin('/register');
                          }}
                        >
                          <Sparkles size={18} />
                          Become Artist
                        </button>
                      </li>
                    )}
                  </>
                )}

                {/* Admin */}
                {isAdmin && (
                  <li>
                    <button
                      className="menu-item flex items-center justify-center gap-2 w-full text-center"
                      onClick={() => {
                        setMenuOpen(false);
                        handleAdminDashboard();
                      }}
                    >
                      <LayoutDashboard size={18} />
                      Admin Dashboard
                    </button>
                  </li>
                )}

                {/* About */}
                <li>
                  <button
                    className="menu-item flex items-center justify-center gap-2 w-full text-center"
                    onClick={() => {
                      setMenuOpen(false);
                      handleAboutUsClick();
                    }}
                  >
                    About Us
                  </button>

                </li>
                {!Capacitor.isNativePlatform() && (
                  <li>
                    <a
                      href={apkDownloadUrl}
                      download
                      className="menu-item flex items-center justify-center gap-2 w-full text-center whitespace-nowrap"
                    >
                      Download App
                    </a>
                  </li>
                )}


              </ul>
            </nav>
          </div>
        </div>
      )}

      {showLoginToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 
                  bg-white/90 backdrop-blur-xl 
                  border border-purple-200 shadow-lg
                  rounded-xl px-4 py-3 z-50 w-[90%] max-w-md
                  flex items-center justify-between gap-3 animate-toastSlideDown">

          {/* Left side: Icon + Text */}
          <div className="flex items-center gap-3">
            <Info size={20} className="text-purple-600" />

            <p className="text-gray-800 text-sm font-medium">
              Please log in to use this feature.
            </p>
          </div>

          {/* Login Button */}
          <button
            onClick={() => navigate('/user-login')}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold 
                 bg-gradient-to-r from-purple-500 to-pink-500
                 hover:scale-[1.05] transition-all shadow"
          >
            Login
          </button>
        </div>
      )}

    </header>
  );


}

export default TopPanel;
