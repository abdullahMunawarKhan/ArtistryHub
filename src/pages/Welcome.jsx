// src/pages/Welcome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {motion} from "framer-motion";
function Welcome() {
  const navigate = useNavigate();

  // Navigate to dashboard when button is clicked
  const handleEnter = (event) => {
    if (event) event.stopPropagation();
    navigate("/main-dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-ScopeBrush relative overflow-hidden" onClick={() => navigate("/main-dashboard")}>
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-float"></div>
        <div className="absolute top-1/4 right-20 w-16 h-16 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-bounce-slow"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-pink-400/20 to-yellow-400/20 rounded-full animate-float"></div>
        <div className="absolute bottom-1/4 right-1/3 w-14 h-14 bg-gradient-to-br from-yellow-400/20 to-purple-400/20 rounded-full animate-bounce-slow"></div>
      </div>

      {/* Main content */}
      <div className="flex flex-col md:flex-row items-start justify-between max-w-7xl mx-auto px-6 py-12">
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-100 relative overflow-hidden">
          {/* Decorative Gradients */}
          <div className="absolute left-0 top-0 w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full blur-2xl opacity-40" />
          <div className="absolute right-10 bottom-10 w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-300 rounded-full blur-3xl opacity-30" />

          {/* Logo and Brand */}
          

          {/* Logo and Brand */}
          <div className="mb-12 text-center z-10 flex flex-col items-center justify-center">
            <motion.img
              src="/images/logo2.png"
              alt="ScopeBrush Logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-28 w-28 rounded-full shadow-xl border-4 border-purple-400 transition-transform duration-300 hover:scale-110 hover:shadow-2xl"
            />
            <motion.div
              className="ScopeBrush-logo text-7xl font-extrabold leading-relaxed pb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-800 drop-shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            >
              ScopeBrush
            </motion.div>
            <motion.div
              className="h-1.5 w-40 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full shadow-md"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
              style={{ transformOrigin: "center" }}
            />
          </div>


          {/* Hero Content */}
          <div className="flex flex-col items-center text-center md:w-[60vw] z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 mb-6 drop-shadow-xl">
              Where Artists & Customers Connect
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-7 leading-relaxed font-medium">
              Discover beautiful artworks, showcase your creations, and build your artistic legacy.<br />
              <span className="text-purple-600 font-semibold">Join a vibrant community</span> where creativity meets opportunity.
            </p>
            <button
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:scale-105 transform transition-all duration-200"
              onClick={handleEnter}
            >
              Enter Gallery
            </button>

          </div>
        </div>


        {/* Feature highlights on the right side */}
        <div className="md:w-1/3 flex flex-col gap-8">
          <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Discover Art</h3>
            <p className="text-slate-600">Explore unique artworks from talented artists worldwide</p>
          </div>
          <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-4xl mb-4">👨‍🎨</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Showcase Talent</h3>
            <p className="text-slate-600">Display your artwork and build your artistic portfolio</p>
          </div>
          <div className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Connect & Create</h3>
            <p className="text-slate-600">Build meaningful connections in the art community</p>
          </div>
        </div>


        {/*Stats section*/}
        {/* <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient-primary">500+</div>
            <div className="text-sm text-slate-600">Artists</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient-primary">2K+</div>
            <div className="text-sm text-slate-600">Artworks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient-primary">1K+</div>
            <div className="text-sm text-slate-600">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient-primary">50+</div>
            <div className="text-sm text-slate-600">Countries</div>
          </div>
        </div> */}
      </div>

      {/* Footer */}


      {/* Additional decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default Welcome;
