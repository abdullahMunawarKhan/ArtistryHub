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

function App() {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/';

  return (
    <div className="relative min-h-screen bg-cover bg-center flex flex-col">
      {!isWelcomePage && <TopPanel />}
      <main
        className={`
          flex-grow
          ${!isWelcomePage ? 'pt-20' : 'pt-0'}  /* 16 * 4 = 64px padding */
          ${isWelcomePage ? 'p-0' : 'p-4'}
        `}
      >
        <div className={isWelcomePage ? "w-full" : "w-full max-w-7xl mx-auto"}>
          <Routes>
            <Route path="/" element={<Welcome />} />
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
          </Routes>
        </div>
      </main>

      {/* Footer */}
<footer className="mt-auto bg-gradient-to-t from-gray-900 via-gray-800 to-gray-700 text-gray-300 border-t border-gray-600 backdrop-blur-sm">
  <div className="max-w-7xl mx-auto px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
    
    {/* Left Section: Developer Info */}
    <div className="md:text-left text-center flex flex-col gap-2">
      <span className="text-sm font-semibold text-white-800 tracking-wide">About the Developer : </span>
        <span className="font-semibold text-yellow-400">Abdullah Munawar Khan</span>
      <span className="text-gray-500 text-xs md:text-sm mt-1">&copy; 2025 ArtistryHub. All rights reserved.</span>
    </div>
    
    {/* Right Section: Social Links */}
    <div className="flex justify-center md:justify-end gap-4">
      <span className="flex flex-wrap items-center justify-center md:justify-start gap-1 text-gray-400 text-sm md:text-base font-medium">
        Connect with me:
      </span>
      <a
        href="https://www.linkedin.com/in/abdullah-munawar-khan-175a6b322"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn profile"
        title="LinkedIn"
        className="flex items-center px-2 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold transition-all duration-150 shadow"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-2 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 ..."/>
        </svg>
        LinkedIn
      </a>
      <a
        href="https://github.com/abdullahmunawarkhan"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub profile"
        title="GitHub"
        className="flex items-center px-2 py-2 bg-gray-900 hover:bg-black rounded-lg text-white text-sm font-semibold transition-all duration-150 shadow"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .5C5.73.5.98 5.25 ..."/>
        </svg>
        GitHub
      </a>
    </div>
  </div>
</footer>


    </div>
  );
}

export default App;
