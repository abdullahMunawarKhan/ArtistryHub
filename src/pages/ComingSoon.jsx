import React, { useState, useEffect } from 'react';
import {
    Search,
    Upload,
    ShoppingCart,
    Users,
    TrendingUp,
    Eye,
    Star,
    MessageSquare,
    Share2,
    Shield,
    Smartphone,
    Award,
} from 'lucide-react';
import { motion } from 'framer-motion';

const ComingSoon = () => {
    const [timeLeft, setTimeLeft] = useState({
        days: 7,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { days: prev.days, hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
                } else if (prev.hours > 0) {
                    return { days: prev.days, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                } else if (prev.days > 0) {
                    return { days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                }
                clearInterval(timer);
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const features = [
        {
            icon: <Search className="w-6 h-6 text-blue-600" />,
            title: 'Art Discovery',
            description:
                'Browse and discover unique artworks from talented artists worldwide with advanced search filters',
        },
        {
            icon: <Upload className="w-6 h-6 text-green-600" />,
            title: 'Artist Portfolio',
            description:
                'Upload, showcase and manage your artwork portfolio with professional presentation tools',
        },
        {
            icon: <ShoppingCart className="w-6 h-6 text-indigo-600" />,
            title: 'Secure Shopping Cart',
            description: 'Easy-to-use shopping cart with secure payment processing and order tracking',
        },
        {
            icon: <Users className="w-6 h-6 text-teal-600" />,
            title: 'Artist Directory',
            description:
                'Connect with artists, view profiles, ratings, followers, and location-based discovery',
        },
        {
            icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
            title: 'Artist Dashboard',
            description:
                'Comprehensive analytics, earnings tracking, and performance insights for artists',
        },
        {
            icon: <Eye className="w-6 h-6 text-pink-600" />,
            title: 'Order Tracking',
            description: 'Real-time order processing and tracking system for both buyers and sellers',
        },
        {
            icon: <Star className="w-6 h-6 text-yellow-600" />,
            title: 'Rating System',
            description:
                'Community-driven ratings and reviews to help discover quality artworks and artists',
        },
        {
            icon: <MessageSquare className="w-6 h-6 text-red-600" />,
            title: 'Feedback System',
            description:
                'Direct communication between artists and customers with built-in feedback tools',
        },
        {
            icon: <Share2 className="w-6 h-6 text-pink-500" />,
            title: 'Social Sharing',
            description:
                'Share artist profiles and artworks across social platforms to expand reach',
        },
        {
            icon: <Shield className="w-6 h-6 text-gray-800" />,
            title: 'Secure Platform',
            description: 'Multi-level authentication with user, artist, and admin access controls',
        },
        {
            icon: <Smartphone className="w-6 h-6 text-blue-800" />,
            title: 'Mobile App',
            description: 'Native Android app with full platform functionality for on-the-go access',
        },
        {
            icon: <Award className="w-6 h-6 text-orange-600" />,
            title: 'Professional Tools',
            description: 'PDF generation, chart analytics, and advanced portfolio management features',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br  overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-1000"></div>
                <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse delay-2000"></div>
            </div>

            <div className="relative z-10 text-black">
                {/* Header */}
                <header className="container mx-auto px-6 py-8">
                    <div className="flex items-center justify-center mb-8">
                        {/* Logo and Brand */}
                        <div className="mb-6 text-center z-10 flex flex-row items-center justify-center">
                            <motion.img
                                src="/images/logo2.jpeg"
                                alt="ScopeBrush Logo"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-xl border-4 border-purple-400 mr-6"
                            />
                            <div className="flex flex-col items-start">
                                <motion.div
                                    className="text-3xl sm:text-5xl font-extrabold text-indigo-500 drop-shadow-2xl"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                                >
                                    ScopeBrush
                                </motion.div>
                                <motion.div
                                    className="h-1 w-24 sm:w-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-md mt-2"
                                    initial={{ opacity: 0, scaleX: 0 }}
                                    animate={{ opacity: 1, scaleX: 1 }}
                                    transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                                    style={{ transformOrigin: "left" }}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-6">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-black">
                            Coming Soon
                        </h2>
                        <p className="text-xl md:text-2xl text-black/80 mb-8 max-w-3xl mx-auto">
                            Where Artists & Customers Connect – The ultimate e-commerce marketplace for discovering,
                            showcasing, and purchasing unique artworks from talented artists worldwide.
                        </p>

                        {/* Countdown Timer */}
                        <div className="flex justify-center space-x-6 mb-12">
                            {Object.entries(timeLeft).map(([unit, value]) => (
                                <div key={unit} className="text-center">
                                    <div className="bg-white rounded-lg p-4 min-w-[80px] border border-gray-200">
                                        <div className="text-3xl font-bold">{value}</div>
                                        <div className="text-sm capitalize">{unit}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="mb-16">
                        <h3 className="text-3xl font-bold text-center mb-12 text-black">
                            Platform Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition transform hover:-translate-y-1"
                                >
                                    <div className="mb-4">{feature.icon}</div>
                                    <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* What to Expect */}
                    <div className="mb-16">
                        <h3 className="text-3xl font-bold text-center mb-12 text-black">
                            What to Expect
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center hover:shadow-lg transition">
                                <Users className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                                <div className="text-3xl font-bold mb-2">Artists</div>
                                <div className="text-gray-700">Connect with talented creators</div>
                            </div>
                            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center hover:shadow-lg transition">
                                <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <div className="text-3xl font-bold mb-2">Artworks</div>
                                <div className="text-gray-700">Discover unique creations</div>
                            </div>
                            <div className="bg-white rounded-xl p-8 border border-gray-200 text-center hover:shadow-lg transition">
                                <ShoppingCart className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                                <div className="text-3xl font-bold mb-2">Secure Marketplace</div>
                                <div className="text-gray-700">Safe and easy transactions</div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ComingSoon;
