import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchLatestAppVersion, isVersionLower } from '../utils/appVersion';
import {
    ShieldCheck,
    Info,
    Download,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Sparkles,
    Smartphone,
    Globe
} from 'lucide-react';

const Version = () => {
    const [currentVersion, setCurrentVersion] = useState('0.0.0');
    const [latestVersion, setLatestVersion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNative, setIsNative] = useState(false);
    const [lastChecked, setLastChecked] = useState(new Date());

    const checkVersion = async () => {
        setLoading(true);
        try {
            const native = Capacitor.isNativePlatform();
            setIsNative(native);

            if (native) {
                const info = await App.getInfo();
                setCurrentVersion(info.version);
            } else {
                setCurrentVersion('1.0.0');
            }

            const latest = await fetchLatestAppVersion();
            setLatestVersion(latest);
            setLastChecked(new Date());
        } catch (error) {
            console.error("Error checking version:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkVersion();
    }, []);

    const hasUpdate = latestVersion && isVersionLower(currentVersion, latestVersion.version_no);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="relative min-h-[80vh] flex items-center justify-center p-4 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-pink-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-lg"
            >
                <div className="relative bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden">

                    {/* Premium Header */}
                    <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-10 pt-12 text-center text-white">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="absolute top-6 right-8 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20"
                        >
                            <ShieldCheck size={20} />
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="inline-block relative mb-6"
                        >
                            <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full" />
                            <div className="relative w-28 h-28 bg-white p-3 rounded-3xl shadow-2xl flex items-center justify-center">
                                <img
                                    src="/images/logo_4.png"
                                    alt="ScopeBrush Logo"
                                    className="w-full h-full object-contain rounded-2xl"
                                />
                            </div>
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-4xl font-black tracking-tight mb-2">
                            ScopeBrush
                        </motion.h1>
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/10 backdrop-blur-sm rounded-full text-xs font-bold uppercase tracking-widest text-white/90 border border-white/10">
                            <Sparkles size={12} className="text-yellow-300" />
                            Systems Intelligence
                            <Sparkles size={12} className="text-yellow-300" />
                        </motion.div>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-8 md:p-10 -mt-6 rounded-t-[2.5rem] bg-white relative z-10 transition-all duration-500">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-16 flex flex-col items-center justify-center"
                                >
                                    <div className="relative">
                                        <div className="w-16 h-16 border-[5px] border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                                        Synchronizing Data...
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-8"
                                >
                                    {/* Version Comparison Dashboard */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="group bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center transition-all hover:shadow-xl hover:shadow-slate-200"
                                        >
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Installed</span>
                                            <span className="text-3xl font-black text-slate-800 tracking-tighter group-hover:text-indigo-600 transition-colors">
                                                {currentVersion}
                                            </span>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full mt-2" />
                                        </motion.div>

                                        <motion.div
                                            whileHover={{ y: -5 }}
                                            className="group bg-purple-50 p-6 rounded-[2rem] border border-purple-100 flex flex-col items-center justify-center transition-all hover:shadow-xl hover:shadow-purple-200"
                                        >
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Latest Version</span>
                                            <span className="text-3xl font-black text-purple-700 tracking-tighter group-hover:text-purple-600 transition-colors">
                                                {latestVersion ? latestVersion.version_no : '---'}
                                            </span>
                                            <div className="w-1 h-1 bg-purple-300 rounded-full mt-2" />
                                        </motion.div>
                                    </div>

                                    {/* Intelligence Alert */}
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`p-6 rounded-3xl flex items-start gap-5 shadow-sm overflow-hidden relative ${hasUpdate
                                            ? 'bg-amber-50/50 border border-amber-200/50 text-amber-900 shadow-amber-100'
                                            : 'bg-emerald-50/50 border border-emerald-200/50 text-emerald-900 shadow-emerald-100'
                                            }`}
                                    >
                                        <div className={`mt-1 p-2 rounded-2xl ${hasUpdate ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                            {hasUpdate ? <AlertCircle className="w-6 h-6 text-amber-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-black tracking-tight mb-1">
                                                {hasUpdate ? 'Optimization Available' : 'Infrastructure Verified'}
                                            </h3>
                                            <p className="text-sm leading-relaxed font-medium opacity-80">
                                                {hasUpdate
                                                    ? `Accelerate your experience with version ${latestVersion.version_no}. New neural optimizations and features detected.`
                                                    : 'Your application node is fully optimized and running the latest architecture.'}
                                            </p>
                                        </div>
                                        {/* Background Pulse */}
                                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${hasUpdate ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                    </motion.div>

                                    {/* Call to Action */}
                                    <div className="space-y-4 pt-2">
                                        {hasUpdate ? (
                                            <motion.a
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                href={latestVersion.version_url}
                                                className="flex items-center justify-center gap-3 w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[1.8rem] font-black text-lg shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] transition-all"
                                            >
                                                <Download className="w-6 h-6" />
                                                Upgrade Node
                                            </motion.a>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-full flex items-center justify-center gap-3 py-5 bg-slate-100 text-slate-400 rounded-[1.8rem] font-black text-lg cursor-not-allowed">
                                                    <CheckCircle2 size={24} />
                                                    Systems Nominal
                                                </div>
                                                <motion.button
                                                    whileHover={{ rotate: 180 }}
                                                    transition={{ duration: 0.5 }}
                                                    onClick={checkVersion}
                                                    className="p-3 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-purple-600 transition-colors"
                                                >
                                                    <RefreshCw size={20} />
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Technical Metadata Footer */}
                    <div className="bg-slate-50/80 backdrop-blur-sm px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-slate-400">
                            {isNative ? <Smartphone size={16} /> : <Globe size={16} />}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                {isNative ? 'Proprietary Hardware' : 'Universal Browser Interface'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                            <Info size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-wider">
                                Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Secondary Bottom Tag */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-50"
                >
                    &copy; 2026 ScopeBrush Neural Core • V{currentVersion}
                </motion.p>
            </motion.div>
        </div>
    );
};

export default Version;

