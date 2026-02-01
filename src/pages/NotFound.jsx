import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="space-y-6 max-w-md">
                {/* Illustration or Icon */}
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse opacity-50"></div>
                    <div className="relative flex items-center justify-center w-full h-full bg-white rounded-full shadow-lg border-4 border-purple-50">
                        <span className="text-4xl font-bold text-purple-600">404</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Page Not Found</h1>
                    <p className="text-gray-600">
                        Oops! The page you are looking for might have been removed, renamed, or is temporarily unavailable.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 shadow-lg shadow-purple-200 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Home Page
                    </button>
                </div>
            </div>
        </div>
    );
}
