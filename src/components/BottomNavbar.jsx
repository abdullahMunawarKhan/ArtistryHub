import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, User, Users } from 'lucide-react';

const BottomNavbar = ({ setShowLoginToast, user, artistProfile }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navOrLogin = (path) => {
        if (user) {
            navigate(path);
        } else {
            setShowLoginToast(true);
        }
    };

    // Check if current path is active
    const isActive = (path) => location.pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-[100] bg-white/90 backdrop-blur-2xl border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 px-2">
                {/* Home */}
                <button
                    onClick={() => navigate('/main-dashboard')}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 outline-none focus:outline-none ${isActive('/main-dashboard') ? 'text-purple-600 scale-110' : 'text-gray-400'}`}
                >
                    <Home
                        size={22}
                        strokeWidth={isActive('/main-dashboard') ? 2.5 : 2}
                        fill={isActive('/main-dashboard') ? 'currentColor' : 'none'}
                        fillOpacity={isActive('/main-dashboard') ? 0.2 : 0}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
                    {isActive('/main-dashboard') && <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5 animate-pulse"></div>}
                </button>

                {/* Artists */}
                <button
                    onClick={() => navigate('/artist-list')}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 outline-none focus:outline-none ${isActive('/artist-list') ? 'text-purple-600 scale-110' : 'text-gray-400'}`}
                >
                    <Users
                        size={22}
                        strokeWidth={isActive('/artist-list') ? 2.5 : 2}
                        fill={isActive('/artist-list') ? 'currentColor' : 'none'}
                        fillOpacity={isActive('/artist-list') ? 0.2 : 0}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Artists</span>
                    {isActive('/artist-list') && <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5 animate-pulse"></div>}
                </button>

                {/* Cart */}
                <button
                    onClick={() => navOrLogin('/cart')}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 outline-none focus:outline-none ${isActive('/cart') ? 'text-purple-600 scale-110' : 'text-gray-400'}`}
                >
                    <div className="relative">
                        <ShoppingCart
                            size={22}
                            strokeWidth={isActive('/cart') ? 2.5 : 2}
                            fill={isActive('/cart') ? 'currentColor' : 'none'}
                            fillOpacity={isActive('/cart') ? 0.2 : 0}
                        />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cart</span>
                    {isActive('/cart') && <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5 animate-pulse"></div>}
                </button>

                {/* Profile (Artist only) */}
                {artistProfile && (
                    <button
                        onClick={() => navigate(`/artist-profile?id=${artistProfile.id}`)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 outline-none focus:outline-none ${location.pathname.includes('/artist-profile') ? 'text-purple-600 scale-110' : 'text-gray-400'}`}
                    >
                        <User
                            size={22}
                            strokeWidth={location.pathname.includes('/artist-profile') ? 2.5 : 2}
                            fill={location.pathname.includes('/artist-profile') ? 'currentColor' : 'none'}
                            fillOpacity={location.pathname.includes('/artist-profile') ? 0.2 : 0}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
                        {location.pathname.includes('/artist-profile') && <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5 animate-pulse"></div>}
                    </button>
                )}

                {/* Login (Only if not logged in) */}
                {!user && (
                    <button
                        onClick={() => navigate('/user-login')}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 outline-none focus:outline-none ${isActive('/user-login') ? 'text-purple-600 scale-110' : 'text-gray-400'}`}
                    >
                        <User
                            size={22}
                            strokeWidth={isActive('/user-login') ? 2.5 : 2}
                            fill={isActive('/user-login') ? 'currentColor' : 'none'}
                            fillOpacity={isActive('/user-login') ? 0.2 : 0}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Login</span>
                        {isActive('/user-login') && <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-0.5 animate-pulse"></div>}
                    </button>
                )}
            </div>
        </div>
    );
};

export default BottomNavbar;
