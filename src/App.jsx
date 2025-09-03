import { UserCircle, Briefcase, Palette } from "lucide-react";
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import TopPanel from './components/TopPanel';
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

function App() {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {!isWelcomePage && <TopPanel />}
      <main
        className={`
          flex-grow flex flex-col
          ${!isWelcomePage ? 'pt-20' : 'pt-0'}
          ${isWelcomePage ? 'p-0' : 'p-4'}
        `}
      >
        <div className={`
          ${isWelcomePage ? "w-full" : "w-full max-w-7xl mx-auto"}
          flex-grow flex flex-col
        `}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/artist-profile/:artistId" element={<ArtistProfile />} />
            <Route path="/main-dashboard" element={<MainDashboard />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/artist-list" element={<ArtistList />} />
            <Route path="/artist-profile" element={<ArtistProfile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/register" element={<Register />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/upload-work" element={<ArtistUploadWork />} />
            <Route path="/order-process" element={<OrderProcess />} />
            <Route path="/product" element={<ProductDetails />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/artist-dashboard" element={<ArtistDashboard />} />
            <Route path="/feed" element={<VideoFeed />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700 text-gray-300 border-t border-gray-600 backdrop-blur-smborder-t border-gray-600 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Left Section: About & Team */}
          <div className="flex flex-col gap-8">
            {/* About Us */}
            <div className="bg-gray-800/40 p-6 rounded-2xl shadow-lg space-y-6 hover:shadow-xl transition-all duration-300">
              <h2 className="text-xl font-bold text-white mb-2">About Us</h2>

              {/* Vision */}
              <div className="border-l-4 border-yellow-400 pl-4">
                <p className="text-sm text-gray-300 italic leading-relaxed">
                  <b>Vision: </b>“To empower local artists by connecting them directly with customers on a single platform,
                  making art discovery, appreciation, and purchase seamless while fostering a vibrant creative community.”
                </p>
              </div>

              {/* Team */}
              <ul className="space-y-3 text-sm leading-relaxed">
                <li className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-white">Founder, CEO & CTO:</span>
                  <span className="text-gray-300">Abdullah Munawar Khan</span>
                </li>
                <li className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-white">Founder,CFO & CMO :</span>
                  <span className="text-gray-300">Ayush Ghojge</span>
                </li>
              </ul>
            </div>

            {/* Developer Highlight */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-yellow-400" />
                <p className="text-sm text-gray-400">About the Developer:</p>
              </div>
              <p className="font-semibold text-yellow-400 text-base ml-7">
                Abdullah Munawar Khan
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-gray-400 text-sm md:text-base font-medium">Connect with me:</span>
              <a
                href="https://www.linkedin.com/in/abdullah-munawar-khan-175a6b322"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                title="LinkedIn"
                className="flex items-center px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold text-center transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 
  .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 
  1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 
  1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 
  1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 
  0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/>
                </svg>
                LinkedIn
              </a>
              <a
                href="https://github.com/abdullahmunawarkhan"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                title="GitHub"
                className="flex items-center px-4 py-1 bg-gray-900 hover:bg-black rounded-lg text-white text-sm font-semibold text-center transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303
  3.438 9.8 8.205 11.387.6.113.82-.258.82-.577
  0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61
  -.546-1.387-1.333-1.757-1.333-1.757-1.089-.744.083-.729.083-.729
  1.205.084 1.838 1.236 1.838 1.236 1.07 1.834 2.809
  1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.334-5.467-5.93
  0-1.31.468-2.381 1.236-3.221-.135-.303-.54-1.523.105-3.176 0 0
  1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137
  3 .403 2.28-1.553 3.285-1.23 3.285-1.23.645 1.653.24 2.873
  .12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807
  5.625-5.479 5.921.429.37.823 1.102.823 2.222
  0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576
  C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>

                GitHub
              </a>
            </div>

          </div>

          {/* Right Section: Contact */}
          <div className="md:text-left text-center flex flex-col h-full gap-8 justify-between">
            <div className="flex flex-col sm:flex-row sm:gap-6 sm:items-center">
              {/* Left Side: Heading and Address */}
              <div className="sm:w-3/5 flex flex-col justify-center">
                <h2 className="text-lg font-bold text-white mb-3">Contact Us</h2>
                <div className="text-sm leading-relaxed space-y-3">
                  <p>
                    <span className="font-semibold">Address:</span> NMIET campus,
                    near Latis housing society, Talegaon Dabhade, Pune.
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span>{" "}
                    <span className="italic text-gray-400">artistryhub460@gmail.com</span>
                  </p>
                  <p className="flex flex-col">
                    <span>
                      <span className="font-semibold">Mobile Number:</span>{" "}
                      <span className="italic text-gray-400">+91 9922526531</span>
                    </span>
                    <span className="italic text-gray-400"> +91 7498890871</span>
                  </p>

                </div>

              </div>

              {/* Map */}
              <div className="sm:w-2/5 flex justify-center items-center">
                <a
                  href="https://maps.app.goo.gl/k42FcH4jt3BThurA8"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src="/images/location.png"
                    alt="Map preview of NMIET campus"
                    className="w-full h-40 object-cover rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                  />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-6 pb-6 pt-4">
          <p className="text-center text-gray-500 text-xs md:text-sm">
            &copy; 2025 <span className="text-yellow-400 font-semibold">ArtistryHub</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
