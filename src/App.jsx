import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useLocation, Link, useNavigate } from 'react-router-dom';
import { UserCircle, Briefcase, Palette } from 'lucide-react';
import { Globe, Linkedin, Github } from "lucide-react";
import { MessageSquare } from "lucide-react";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import TopPanel from './components/TopPanel';
import Back from './components/Back';
import Welcome from './pages/Welcome';
import MainDashboard from './pages/MainDashboard';
import Signup from './pages/Signup';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import UpdatePassword from './pages/UpdatePassword';
import AdminDashboard from './pages/AdminDashboard';
import ArtistList from './pages/ArtistList';
import ArtistProfile from './pages/ArtistProfile';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import ArtistUploadWork from './pages/ArtistUploadWork';
import OrderProcess from './pages/OrderProcess';
import ProductDetails from './pages/ProductDetails';
import TrackOrder from './pages/TrackOrder';
import ArtistDashboard from './pages/ArtistDashboard';
import VideoFeed from './components/VideoFeed';
import Feedback from './pages/Feedback';
import ContactUs from './pages/ContactUs';
import PrivacyPolicies from './pages/PrivacyPolicies';
import TermsConditions from './pages/TermsCondition';
import ComingSoon from './pages/ComingSoon';
import Demo from './pages/Demo';
import Version from './pages/Version';
import { X, Info } from "lucide-react";
import AppUpdateChecker from "./components/AppUpdateChecker";
import { registerForPushNotifications } from "./utils/pushNotifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from './utils/supabase';
import BottomNavbar from './components/BottomNavbar';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import MobileAppPrompt from './components/MobileAppPrompt';


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [footerOpen, setFooterOpen] = useState(false);
  const isWelcomePage = location.pathname === '/';
  const isComingSoonPage = location.pathname === '/coming-soon';

  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [artistProfile, setArtistProfile] = useState(null);
  const [showLoginToast, setShowLoginToast] = useState(false);

  const footerRef = useRef(null)

  // Auto-close toast
  useEffect(() => {
    if (showLoginToast) {
      const timer = setTimeout(() => setShowLoginToast(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showLoginToast]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Fetch User & Profile Data
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        // Query unified 'user' table for role
        const { data: userProfile } = await supabase
          .from('user')
          .select('id, role')
          .eq('id', authUser.id)
          .single()

        if (userProfile) {
          setIsAdmin(userProfile.role === 'efbv');

          if (userProfile.role !== 'efbv') {
            const { data: artistData } = await supabase
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
    if (footerOpen) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }, [footerOpen])

  useEffect(() => {
    let backButtonListener;

    const setupBackListener = async () => {
      if (Capacitor.isNativePlatform()) {
        backButtonListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          // Check if we are on the root pages where we should exit
          if (location.pathname === '/' || location.pathname === '/main-dashboard') {
            const confirmExit = window.confirm("Do you want to exit the app?");
            if (confirmExit) {
              CapacitorApp.exitApp();
            }
          } else {
            // Go back in history
            navigate(-1);
          }
        });
      }
    };

    setupBackListener();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [location, navigate]);

  const onFooterTransitionEnd = (e) => {
    if (e.propertyName === 'height' && footerOpen) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    let listener;

    const setupListener = async () => {
      listener = await CapacitorApp.addListener(
        'appUrlOpen',
        async ({ url }) => {
          console.log('Deep link opened:', url);

          // Handle Auth Callback
          if (url.includes('auth/callback')) {
            const { data, error } = await supabase.auth.getSession();
            if (!error && data?.session) {
              navigate('/main-dashboard');
            }
            return;
          }

          // Handle General Deep Links (scopebrush.vercel.app)
          if (url.includes('scopebrush.vercel.app')) {
            // Split by hash first (HashRouter support)
            const hashParts = url.split('#');
            if (hashParts.length > 1) {
              const route = hashParts[1]; // e.g., "/artist-profile?id=123"
              if (route) {
                navigate(route);
              }
            } else {
              // Should not happen with HashRouter usually, but if clean link
              // e.g. https://scopebrush.vercel.app/artist-profile?id=123
              try {
                const urlObj = new URL(url);
                const path = urlObj.pathname + urlObj.search;
                if (path && path !== "/") {
                  navigate(path);
                }
              } catch (e) {
                console.error("Error parsing deep link", e);
              }
            }
          }
        }
      );
    };

    setupListener();

    return () => {
      listener?.remove(); // ✅ SAFE
    };
  }, [navigate]);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let subscription;

    const setup = async () => {
      subscription = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (notification) => {
          console.log("Notification tapped, app opened", notification);
        }
      );
    };

    setup();

    return () => {
      subscription?.remove(); // ✅ safe cleanup
    };
  }, []);



  return (

    <div className="min-h-[calc(100vh-46px)] flex flex-col">
      <ErrorBoundary>
        <AppUpdateChecker />
        <MobileAppPrompt />
        {!(isWelcomePage || isComingSoonPage) && (
          <TopPanel
            footerOpen={footerOpen}
            setFooterOpen={setFooterOpen}
            user={user}
            setUser={setUser}
            isAdmin={isAdmin}
            setIsAdmin={setIsAdmin}
            artistProfile={artistProfile}
            setArtistProfile={setArtistProfile}
            showLoginToast={showLoginToast}
            setShowLoginToast={setShowLoginToast}
          />
        )}

        {!isWelcomePage && <Back />}


        <main
          className={`
          flex-grow flex flex-col
          ${isWelcomePage ? 'p-0' : 'p-3 md:p-4'}
          ${!(isWelcomePage || isComingSoonPage) ? 'pb-20 md:pb-4' : ''}
        `}
          style={{
            paddingTop: !isWelcomePage ? 'calc(5rem + env(safe-area-inset-top))' : '0'
          }}
        >
          <div
            className={`
            ${'w-full'}
            flex-grow flex flex-col
          `}
          >
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/artist-profile/:artistId" element={<ArtistProfile />} />
              <Route path="/main-dashboard" element={<MainDashboard />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/user-login" element={<UserLogin />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/frtfgau84hfdja" element={<AdminLogin />} />
              <Route path="/dshakfgadsj" element={<AdminDashboard />} />
              <Route path="/artist-list" element={<ArtistList user={user} setShowLoginToast={setShowLoginToast} />} />
              <Route path="/artist-profile" element={<ArtistProfile />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/register" element={<Register />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/upload-work" element={<ArtistUploadWork />} />
              <Route path="/order-process" element={<OrderProcess />} />
              <Route path="/product" element={<ProductDetails />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="track-order/:trackingId" element={<TrackOrder />} />
              <Route path="/artist-dashboard" element={<ArtistDashboard />} />
              <Route path="/feed" element={<VideoFeed />} />
              <Route path="/feedback-form" element={<Feedback />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/privacy-policies" element={<PrivacyPolicies />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/sample-upload" element={<Demo />} />
              <Route path="/version" element={<Version />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>

        {/* LOGIN TOAST */}
        {showLoginToast && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                  bg-white/95 backdrop-blur-2xl 
                  border border-purple-200 shadow-2xl
                  rounded-2xl px-6 py-5 z-[200] w-[85%] max-w-sm
                  flex flex-col items-center justify-center gap-4 text-center animate-fadeIn">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-purple-600" />
              <p className="text-gray-800 text-sm font-medium">Please log in to use this feature.</p>
            </div>
            <button
              onClick={() => { setShowLoginToast(false); navigate('/user-login'); }}
              className="w-full py-3 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
            >
              Login
            </button>
          </div>
        )}

        {/* BOTTOM NAVIGATION BAR */}
        {!(isWelcomePage || isComingSoonPage) && (
          <BottomNavbar
            setShowLoginToast={setShowLoginToast}
            user={user}
            artistProfile={artistProfile}
          />
        )}

        {/* FIXED, COLLAPSIBLE FOOTER */}
        <div
          ref={footerRef}
          onTransitionEnd={onFooterTransitionEnd}
          className={`
          fixed bottom-0 left-0 w-full
          bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700
          text-gray-300 border-t border-gray-600 backdrop-blur-sm
          transition-all duration-300 ease-in-out
          ${footerOpen ? 'h-3/4 z-[110] opacity-100' : 'h-0 md:h-8 opacity-0 md:opacity-100 z-50'}
          ${footerOpen ? 'block' : 'hidden md:block'}
        `}
        >
          {/* Gray "handle" area always visible (h-8) */}
          <div
            className="h-8 bg-gray-700 flex items-center justify-center cursor-pointer relative"
            onClick={() => setFooterOpen(open => !open)}
          >
            {/* Center text */}
            {footerOpen ? (
              <span className="text-gray-400 text-sm md:text-base">▼</span>
            ) : (
              <span className="text-gray-400 text-sm md:text-base">▲ click here to see about us</span>
            )}

            {/* Right corner close button (UI only) */}
            {footerOpen && (
              <button
                className="absolute right-3 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation(); // prevent double toggle
                  setFooterOpen(false);
                }}
                aria-label="Close footer"
              >
                <X size={18} />
              </button>
            )}
          </div>


          {footerOpen && (
            <div className="h-full overflow-y-auto pb-8">
              <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Section: About & Developer */}
                <div className="flex flex-col gap-6">
                  {/* About Us */}
                  <div className="bg-gray-800/40 p-6 rounded-2xl shadow-lg space-y-6 hover:shadow-xl transition-all duration-300">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-2">About Us</h2>
                    <div className="border-l-4 border-yellow-400 pl-4">
                      <p className="text-xs md:text-sm text-gray-300 italic leading-relaxed">
                        <b>Vision: </b>"To empower local artists by connecting them directly with customers on a single
                        platform, making art discovery, appreciation, and purchase seamless while fostering a vibrant
                        creative community."
                      </p>
                    </div>
                    <ul className="space-y-3 text-xs md:text-sm leading-relaxed">
                      <li className="flex items-center gap-2">
                        <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                        <span className="font-semibold text-white">Founders:</span>
                        <span className="font-semibold text-yellow-400 text-sm md:text-base ml-7">
                          Abdullah Khan & Ayush Ghojge
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Developer Card */}
                  <div className="bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800 p-4 md:p-6 rounded-xl shadow-lg w-full mt-2">
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm md:text-base">About the Developer:</span>
                    </div>
                    <div className="mb-5 flex items-center gap-3 md:gap-4">
                      {/* Name */}
                      <span className="text-yellow-400 font-bold text-base md:text-lg whitespace-nowrap">
                        Abdullah Munawar Khan
                      </span>

                      {/* Portfolio Button */}
                      <a
                        href="https://abdullahmunawarkhan.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: '#64c2ec' }}
                        className="
      inline-flex items-center gap-2
      px-3 md:px-4 py-1
      rounded-full
      text-white text-xs md:text-sm font-semibold
      transition-all duration-300
      shadow-md hover:shadow-xl
      hover:scale-105 hover:bg-opacity-90
    "
                      >
                        <img
                          src="/images/profile.png"
                          alt="Profile"
                          className="w-5 h-5 md:w-6 md:h-6 rounded-full border border-white"
                        />
                        Portfolio
                      </a>
                    </div>


                    <div className="flex flex-wrap items-center gap-3">
                      {/* Label */}
                      <span className="text-gray-400 text-xs md:text-sm font-medium whitespace-nowrap">
                        Connect with me:
                      </span>

                      {/* LinkedIn */}
                      <a
                        href="https://www.linkedin.com/in/abdullah-munawar-khan-175a6b322"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn profile"
                        className="
      inline-flex items-center gap-1.5
      px-3 md:px-4 py-1
      bg-blue-600 hover:bg-blue-700
      rounded-full
      text-white text-xs md:text-sm font-semibold
      transition-all duration-300
      shadow-md hover:shadow-xl
      hover:scale-105
    "
                      >
                        <Linkedin size={14} />
                        LinkedIn
                      </a>

                      {/* GitHub */}
                      <a
                        href="https://github.com/abdullahmunawarkhan"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub profile"
                        className="
      inline-flex items-center gap-1.5
      px-3 md:px-4 py-1
      bg-gray-900 hover:bg-black
      rounded-full
      text-white text-xs md:text-sm font-semibold
      transition-all duration-300
      shadow-md hover:shadow-xl
      hover:scale-105
    "
                      >
                        <Github size={14} />
                        GitHub
                      </a>
                    </div>

                  </div>
                </div>

                {/* Right Section: Contact */}
                <div className="flex flex-col gap-8  pl-8">
                  <div className="sm:flex sm:gap-6 sm:items-center">
                    <div className="sm:w-3/5 flex flex-col justify-center">
                      <Link to="/contact-us" onClick={() => setFooterOpen(false)} className="text-base md:text-lg font-bold text-white mb-3">
                        Contact us :
                      </Link>
                      <p className="text-white font-semibold text-xs md:text-sm ml-7">
                        <span className="font-semibold">Address:</span> NMIET campus, near Latis housing society, Talegaon Dabhade, Pune.
                      </p>
                      <p className="text-white font-semibold text-xs md:text-sm ml-7">
                        <span className="font-semibold">Email:</span>{' '}
                        <span className="italic text-gray-400">scopebrush25@gmail.com</span>
                      </p>
                      <p className="text-white font-semibold text-xs md:text-sm ml-7">
                        <span className="font-semibold">Mobile:</span>{' '}
                        <span className="italic text-gray-400">+91 8180826531, +91 7498890871</span>
                      </p>
                    </div>
                    <div className="sm:w-2/5 flex justify-center items-center">
                      <a href="https://maps.app.goo.gl/k42FcH4jt3BThurA8" target="_blank" rel="noopener noreferrer">
                        <img
                          src="/images/location.png"
                          alt="Map preview"
                          className="w-full h-32 md:h-40 object-cover rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                        />
                      </a>
                    </div>
                  </div>
                  <div className="h-0.5 bg-gray-500"></div>
                  <div className="mt-0.5 flex items-center">
                    <div className="mb-2">
                      <h2 className="text-base md:text-xl font-bold text-gray-100 mb-0.5 inline-block">
                        Social Links :
                      </h2>
                      <div className="h-0.5 bg-pink-500 w-16 md:w-[100px]"></div>
                    </div>

                    <div className="pl-3 md:pl-6">
                      <a
                        href="https://www.instagram.com/scopebrush.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram profile"
                        className="
        inline-flex items-center justify-center
        w-9 h-9 md:w-12 md:h-12
        bg-pink-600 hover:bg-pink-700
        rounded-full text-white
        text-xs md:text-base font-semibold
        transition-all duration-300
        shadow-md hover:shadow-xl
        transform hover:scale-105
      "
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5 md:w-7 md:h-7"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5c2.35 0 4.25 1.9 4.25 4.25v8.5c0 2.35-1.9 4.25-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5c0-2.35 1.9-4.25 4.25-4.25zm8.75 1a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zM12 7a5 5 0 100 10 5 5 0 000-10zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  <div className="h-0.5 bg-gray-500"></div>
                  <div className="flex flex-col gap-1">
                    <Link
                      to="/feedback-form"
                      onClick={() => setFooterOpen(false)}
                      className="inline-flex items-center gap-2 px-3 md:px-4 py-2 text-gray decoration-gray-400 hover:transition duration-200 w-fit text-sm md:text-base"
                    >
                      <span>▼ click here to provide us your feedback</span>
                    </Link>
                    <Link
                      to="/privacy-policies"
                      onClick={() => setFooterOpen(false)}
                      className="inline-flex items-center gap-2 px-3 md:px-4 py-2 text-gray decoration-gray-400 hover:transition duration-200 w-fit text-sm md:text-base"
                    >
                      <span> ▼ see privacy policies</span>
                    </Link>
                    <Link
                      to="/terms-conditions"
                      onClick={() => setFooterOpen(false)}
                      className="inline-flex items-center gap-2 px-3 md:px-4 py-2 text-gray decoration-gray-400 hover:transition duration-200 w-fit text-sm md:text-base"
                    >
                      <span>▼ see terms and conditions</span>
                    </Link>
                  </div>




                </div>

                {/* Bottom Bar */}
                <div className="col-span-full border-t border-gray-700 mt-4 pt-1">
                  <p className="text-center text-gray-500 text-[11px] md:text-xs">
                    &copy; 2025 <span className="text-yellow-400 font-semibold">ScopeBrush</span>. All rights reserved.
                  </p>
                </div>
              </footer>
            </div>
          )
          }

        </div >

      </ErrorBoundary>
    </div>
  );
}

export default App;



