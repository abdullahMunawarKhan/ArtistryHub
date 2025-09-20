// src/pages/Welcome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
function Welcome() {
  const navigate = useNavigate();

  // Navigate to dashboard when button is clicked
  const handleEnter = (event) => {
    if (event) event.stopPropagation();
    navigate("/main-dashboard");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/main_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-6 left-6 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-float"></div>
        <div className="absolute top-1/4 right-10 w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-bounce-slow"></div>
        <div className="absolute bottom-16 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-400/20 to-yellow-400/20 rounded-full animate-float"></div>
        <div className="absolute bottom-1/4 right-1/3 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400/20 to-purple-400/20 rounded-full animate-bounce-slow"></div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row items-start justify-between max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col justify-start items-center relative overflow-hidden w-full md:w-3/5">
          {/* Decorative Gradients */}
          <div className="absolute left-0 top-0 w-40 sm:w-56 h-40 sm:h-56 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full blur-2xl opacity-40" />
          <div className="absolute right-6 bottom-6 w-28 sm:w-36 h-28 sm:h-36 bg-gradient-to-br from-blue-400 to-purple-300 rounded-full blur-3xl opacity-30" />

          {/* Logo and Brand */}
          <div className="mb-6 text-center z-10 flex flex-row items-center justify-center">
            <motion.img
              src="/images/logo2.png"
              alt="ScopeBrush Logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-xl border-4 border-purple-400 mr-6"
            />
            <div className="flex flex-col items-start">
              <motion.div
                className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-2xl"
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

          {/* Hero Content */}
          <div className="flex flex-col items-center text-center md:w-full z-10 px-4">
            <h1 className="text-xl sm:text-4xl font-extrabold text-yellow-100 drop-shadow-xl mb-3">
              Where Artists & Customers Connect
            </h1>
            <p className="text-sm sm:text-lg text-slate-100 drop-shadow-lg mb-4 leading-relaxed font-medium">
              Discover beautiful artworks, showcase your creations, and build your artistic legacy. <br />
              <span className="text-yellow-200 font-semibold drop-shadow">
                Join a vibrant community
              </span>{" "}
              where creativity meets opportunity.
            </p>

            <button
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-pink-500 hover:to-purple-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full text-base sm:text-lg font-bold shadow-lg hover:scale-105 transform transition-all duration-200 drop-shadow"
              onClick={handleEnter}
            >
              Enter Gallery
            </button>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="flex flex-col gap-4 sm:gap-6 md:w-2/5 mx-auto md:mx-0 mt-6 md:mt-10 md:mr-10 w-full max-w-[95vw] z-10">
          {[
            { title: "Discover Art", desc: "Explore unique artworks from talented artists worldwide", bg: "/images/discover_art.png" },
            { title: "Showcase Talent", desc: "Display your artwork and build your artistic portfolio", bg: "/images/showcase_talent.png" },
            { title: "Connect & Create", desc: "Build meaningful connections in the art community", bg: "/images/connect_create.png" },
          ].map((f, i) => (
            <div
              key={i}
              className="relative p-4 sm:p-5 text-center rounded-[18px] shadow-[0_4px_16px_rgba(0,0,0,0.12)] bg-white/25 backdrop-blur-[8px] border border-white/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] group"
              style={{
                backgroundImage: `url('${f.bg}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <h3 className="font-['Montserrat'] font-bold text-lg sm:text-xl text-[#123147] mb-1 leading-tight">
                {f.title}
              </h3>
              <p className="font-['Poppins'] font-medium text-xs sm:text-base text-black leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/3 left-0 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 right-0 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-2xl"></div>
      </div>
    </div>
  );



}

export default Welcome;



