import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Smartphone } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function MobileAppPrompt() {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // 1. Don't show if already in the native app
        if (Capacitor.isNativePlatform()) return;

        // 2. Check if mobile browser (simple regex)
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod/.test(ua);

        if (isMobile) {
            // 3. Show after a short delay (e.g. 2 seconds as requested)
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleOpenApp = () => {
        // Construct the Intent URL for Android
        // This uses Chrome's intent syntax to force-launch the app with the specific package name
        // If the app is installed, it launches. If not, it falls back to the browser (or Play Store if we set browser_fallback_url to market://)

        const currentHash = window.location.hash; // e.g., "#/artist-profile?id=123"
        // We want the intent to look like: https://scopebrush.vercel.app/#/...
        // But wrapped in intent:// syntax

        // The "host" part of the intent URI
        const host = "scopebrush.vercel.app";

        // For HashRouter, the path is technically just "/" usually, but we want to pass the full URL context
        // The intent URL structure:
        // intent://<host>/<path>#Intent;scheme=<scheme>;package=<package_name>;end;

        // Since our deep links are https://scopebrush.vercel.app, let's use that.

        // NOTE: For the intent to strictly match the filter <data android:scheme="https" android:host="scopebrush.vercel.app" />,
        // we set scheme=https and the part before #Intent as URL.

        // However, with hash routing, the hash is part of the fragment.
        // Chrome treats everything after #Intent; as the intent instruction.
        // So we need to be careful not to confuse the URL hash with the Intent hash.
        // Usually, we put the full URL in the S.browser_fallback_url or similar.

        // Let's try the standard Intent format
        const packageId = "com.scopebrush.app";
        const scheme = "https";

        // We need to encode the hash so it doesn't break the Intent parsing? 
        // Actually, usually, we just map it. 

        // Plan B: Simple "market" link fallback? No, user wants "Go to App".

        // Let's try this format which is robust for Android Chrome:
        const url = `intent://${host}/${currentHash}#Intent;scheme=${scheme};package=${packageId};S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`;

        window.location.href = url;
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-end justify-center pb-6 px-4 bg-black/20 backdrop-blur-[1px]">
            {/* The Popup Card */}
            <div className="
        pointer-events-auto
        bg-white rounded-2xl shadow-2xl 
        w-full max-w-sm 
        p-5
        animate-slideUp
        border border-gray-100
      ">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2.5 rounded-xl">
                            <Smartphone className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Open in App?</h3>
                            <p className="text-xs text-gray-500">For a better and faster experience</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="
              py-2.5 px-4 rounded-xl
              text-sm font-semibold text-gray-600
              bg-gray-100 hover:bg-gray-200
              transition-colors
            "
                    >
                        Continue here
                    </button>
                    <button
                        onClick={handleOpenApp}
                        className="
              py-2.5 px-4 rounded-xl
              text-sm font-bold text-white
              bg-gradient-to-r from-purple-600 to-blue-600
              hover:opacity-90
              shadow-lg shadow-blue-200
              transition-all
            "
                    >
                        Open App
                    </button>
                </div>
            </div>
        </div>
    );
}
