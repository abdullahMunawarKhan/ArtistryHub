import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from "react-dom";
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
import { KeyRound, LogOut, Mail, Download } from "lucide-react";

const FALLBACK_APK_URL =
  "https://efszsjxupcsdeqcisnfi.supabase.co/storage/v1/object/public/apk/ScopeBrush_v9_1769533296653.apk";

function TopPanel({
  footerOpen,
  setFooterOpen,
  user,
  setUser,
  isAdmin,
  setIsAdmin,
  artistProfile,
  setArtistProfile,
  showLoginToast,
  setShowLoginToast
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  const [apkDownloadUrl, setApkDownloadUrl] = useState(FALLBACK_APK_URL);

  const [showDownloadPopup, setShowDownloadPopup] = useState(false);

  const navigate = useNavigate();
  const adminMenuRef = useRef();
  const loginDropdownRef = useRef();
  const profileMenuRef = useRef();

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
        // setLoginDropdownOpen(false); // Removed as it was a prop/state we might not need here
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    if (adminMenuOpen || profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminMenuOpen, profileMenuOpen]);


  const handleAboutUsClick = () => {
    if (!footerOpen) {
      setFooterOpen(true);
      setTimeout(() => {
        const footer = document.querySelector('footer');
        if (footer) footer.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      setFooterOpen(false);
    }
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
    setProfileMenuOpen(false);
  };

  return (
    <header
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      className="bg-white/90 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/20 shadow-ScopeBrush pl-2 pr-2"
    >
      <nav className="flex items-center justify-between px-2 md:px-4 py-2 w-full">
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/images/logo_4.png" alt="ScopeBrush Logo" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold" style={{ color: '#D740A1' }}>ScopeBrush</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => navOrLogin('/feed')} className="nav-link">Explore Arts</button>
          <Link to="/main-dashboard" className="nav-link flex items-center gap-2">
            <Home size={18} /> Home
          </Link>
          <Link to="/artist-list" className="nav-link flex items-center gap-2">
            <Users size={18} /> Artists
          </Link>

          {!isAdmin && (
            <>
              {artistProfile && (
                <Link to={`/artist-profile?id=${artistProfile.id}`} className="nav-link flex items-center gap-2">
                  <User size={18} /> My Profile
                </Link>
              )}
              {!artistProfile && (
                <button onClick={() => navOrLogin('/register')} className="nav-link flex items-center gap-2">
                  <Sparkles size={18} /> Become Artist
                </button>
              )}
              <button onClick={handleAboutUsClick} className="nav-link flex items-center gap-2">About Us</button>
              {Capacitor.isNativePlatform() ? (
                <button onClick={() => navigate('/version')} className="nav-link flex items-center gap-2">
                  <Info size={18} /> App Version
                </button>
              ) : (
                <button onClick={() => setShowDownloadPopup(true)} className="nav-link flex items-center gap-2">
                  <Download size={18} /> Download App
                </button>
              )}
            </>
          )}

          {isAdmin && (
            <div className="relative" ref={adminMenuRef}>
              <button onClick={handleAdminDashboard} className="w-full text-left px-3 py-2 nav-link rounded-lg flex items-center gap-2">
                <LayoutDashboard size={18} /> Admin Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center flex-shrink-0 justify-end">
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
                <button
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-purple-300 shadow-md hover:shadow-lg hover:scale-105 transition-all"
                  aria-label="User profile menu"
                >
                  <UserRound size={22} className="text-purple-600" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-white backdrop-blur-2xl rounded-2xl shadow-2xl border border-white z-50 overflow-hidden animate-fadeIn">
                    <div className="px-4 py-4 text-sm border-b border-gray-200/60">
                      <p className="text-gray-500 text-xs">Signed in as</p>
                      <div className="flex items-center gap-2 mt-1 text-gray-900 break-words leading-snug">
                        <Mail size={16} className="text-purple-600" />
                        <span className="font-semibold">{user.email}</span>
                      </div>
                    </div>
                    <button onClick={() => navigate("/update-password")} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-blue-600 hover:bg-blue-50/70 transition-all duration-150">
                      <KeyRound size={18} className="text-blue-600" /> Reset Password
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50/70 transition-all duration-150">
                      <LogOut size={18} className="text-red-600" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <button onClick={() => navigate("/user-login")} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 shadow transition-all">
                  Login
                </button>
              </div>
            )}

            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X size={26} className="text-gray-700" /> : <Menu size={26} className="text-gray-700" />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-lg">
          <div className="menu-container">
            <nav className="glass-menu">
              <ul className="menu-list">
                {!user && (
                  <>
                    <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); navigate('/user-login'); }}><User size={18} /> Login</button></li>
                    <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); navigate('/signup'); }}><UserPlus className="w-4 h-4" /> Sign Up</button></li>
                  </>
                )}
                <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); navOrLogin('/feed'); }}><ImageIcon size={18} /> Explore</button></li>


                {!isAdmin && (
                  <>

                    <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); navOrLogin('/orders'); }}><Package size={18} /> Orders</button></li>
                    {artistProfile ? (
                      <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); navigate(`/artist-profile?id=${artistProfile.id}`); }}><User size={18} /> My Profile</button></li>
                    ) : (
                      <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); navOrLogin('/register'); }}><Sparkles size={18} /> Become Artist</button></li>
                    )}
                  </>
                )}

                {isAdmin && (
                  <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); handleAdminDashboard(); }}><LayoutDashboard size={18} /> Admin Dashboard</button></li>
                )}
                <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); handleAboutUsClick(); }}>About Us</button></li>
                {Capacitor.isNativePlatform() ? (
                  <li><button className="menu-item flex items-center justify-center gap-2 w-full" onClick={() => { setMenuOpen(false); navigate('/version'); }}><Info size={18} /> App Version</button></li>
                ) : (
                  <li>
                    <button
                      onClick={() => { setMenuOpen(false); setShowDownloadPopup(true); }}
                      className="menu-item flex items-center justify-center gap-2 w-full"
                    >
                      <Download size={18} /> Download App
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
      )}
      {showDownloadPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-ScopeBrush w-full max-w-xs md:max-w-sm p-6 transform scale-100 transition-all animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-50 p-4 rounded-full mb-4 ring-4 ring-purple-50/50">
                <Download size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Download App</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Download the app on your Android phone for the best experience.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDownloadPopup(false)}
                  className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <a
                  href={apkDownloadUrl}
                  download
                  onClick={() => setShowDownloadPopup(false)}
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-center transition-all shadow-lg shadow-purple-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  Continue
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

export default TopPanel;
