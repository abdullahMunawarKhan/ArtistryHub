import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { fetchLatestAppVersion, isVersionLower } from '../utils/appVersion';
import { ShieldCheck, Info, Download, CheckCircle2, AlertCircle } from 'lucide-react';

const Version = () => {
    const [currentVersion, setCurrentVersion] = useState('0.0.0');
    const [latestVersion, setLatestVersion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        const checkVersion = async () => {
            setLoading(true);
            try {
                // Check if running on native platform
                const native = Capacitor.isNativePlatform();
                setIsNative(native);

                // Get current version
                if (native) {
                    const info = await App.getInfo();
                    setCurrentVersion(info.version);
                } else {
                    // Fallback for web testing
                    setCurrentVersion('1.0.0');
                }

                // Get latest version from DB
                const latest = await fetchLatestAppVersion();
                setLatestVersion(latest);
            } catch (error) {
                console.error("Error checking version:", error);
            } finally {
                setLoading(false);
            }
        };

        checkVersion();
    }, []);

    const hasUpdate = latestVersion && isVersionLower(currentVersion, latestVersion.version_no);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-purple-100 transition-all duration-300 hover:shadow-2xl">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8 text-center relative">
                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2">
                        <ShieldCheck className="text-white w-6 h-6" />
                    </div>

                    <div className="inline-flex items-center justify-center shadow-inner w-24 h-24 bg-white/20 backdrop-blur-lg rounded-full mb-4 border border-white/30">
                        <img
                            src="/images/logo2.jpeg"
                            alt="ScopeBrush"
                            className="w-16 h-16 object-contain rounded-2xl shadow-lg"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">ScopeBrush</h1>
                    <p className="text-white/80 text-sm mt-1 font-medium">App Version Control</p>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 font-medium animate-pulse">Checking for updates...</p>
                        </div>
                    ) : (
                        <>
                            {/* Version Info Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Current</p>
                                    <p className="text-2xl font-bold text-gray-800">{currentVersion}</p>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center">
                                    <p className="text-xs text-purple-500 uppercase tracking-wider font-bold mb-1">Latest</p>
                                    <p className="text-2xl font-bold text-purple-800">
                                        {latestVersion ? latestVersion.version_no : '---'}
                                    </p>
                                </div>
                            </div>

                            {/* Status Message */}
                            <div className={`p-4 rounded-2xl flex items-start gap-4 ${hasUpdate
                                    ? 'bg-amber-50 border border-amber-200 text-amber-800'
                                    : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                }`}>
                                {hasUpdate ? (
                                    <AlertCircle className="w-6 h-6 flex-shrink-0 text-amber-500 mt-1" />
                                ) : (
                                    <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-emerald-500 mt-1" />
                                )}
                                <div>
                                    <p className="font-bold text-sm">
                                        {hasUpdate ? 'Update Available' : 'Up to Date'}
                                    </p>
                                    <p className="text-xs mt-1 leading-relaxed opacity-90">
                                        {hasUpdate
                                            ? `A new version of ScopeBrush (${latestVersion.version_no}) is available. Please update to enjoy latest features and bug fixes.`
                                            : 'You are using the latest version of ScopeBrush. Enjoy the best experience!'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            {hasUpdate ? (
                                <a
                                    href={latestVersion.version_url}
                                    className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                >
                                    <Download className="w-5 h-5" />
                                    Update App Now
                                </a>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-center cursor-not-allowed">
                                        Already Up to Date
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">Last checked: {new Date().toLocaleTimeString()}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Info */}
                <div className="bg-gray-50/50 p-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 justify-center text-gray-400">
                        <Info size={14} />
                        <span className="text-[10px] font-medium tracking-wide uppercase">
                            Environment: {isNative ? 'Mobile Application' : 'Web Browser'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Version;
