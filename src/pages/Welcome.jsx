// src/pages/Welcome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  // Navigate to dashboard when button is clicked
  const handleEnter = () => {
    navigate("/main-dashboard");
  };

  return (
    <div
      className="fixed inset-0 w-full h-full bg-black overflow-hidden z-40"
      style={{
        backgroundImage: "url('/images/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Artistic overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-pink-800/70 to-transparent" />

      {/* Floating artistic elements (paint palette + brush + canvas) */}
      <div className="absolute top-20 left-10 w-16 h-16 opacity-20 animate-float">
        <svg viewBox="0 0 64 64" fill="currentColor" className="text-pink-400 drop-shadow-lg">
          <path d="M32 2C15.4 2 2 14 2 28c0 10.5 8.7 19 19.5 19h3.7c1.1 0 2 .9 2 2 0 4.1 3.3 7.5 7.5 7.5 13.2 0 27.3-10 27.3-26C62 14 48.6 2 32 2zM17 25a3 3 0 110-6 3 3 0 010 6zm10-8a3 3 0 110-6 3 3 0 010 6zm14-1a3 3 0 110-6 3 3 0 010 6zm6 11a3 3 0 110-6 3 3 0 010 6z" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-10 w-20 h-20 opacity-20 animate-float" style={{ animationDelay: "2s" }}>
        <svg viewBox="0 0 64 64" fill="currentColor" className="text-purple-400 drop-shadow-lg">
          <path d="M48 2L16 34l-6 20 20-6 32-32zM26 42l-6 2 2-6 22-22 4 4-22 22z" />
        </svg>
      </div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 opacity-10 animate-float" style={{ animationDelay: "1s" }}>
        <svg viewBox="0 0 64 64" fill="currentColor" className="text-yellow-400 drop-shadow-lg">
          <rect x="10" y="10" width="44" height="32" rx="6" />
        </svg>
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="text-center text-white animate-fade-in-up">
          <h1 className="text-5xl sm:text-6xl font-bold drop-shadow-lg mb-4 text-gradient">ArtistryHub</h1>
          <p className="text-xl sm:text-2xl text-pink-200 font-medium drop-shadow-lg mb-8">
            Where Artists & Customers Connect<br />
            <span className="text-yellow-200">Discover, Connect, Create</span>
          </p>
          <button
            onClick={handleEnter}
            className="btn-primary px-8 py-4 text-lg rounded-full shadow-construction-lg hover:scale-105 transition-all duration-300 welcome-glow"
            aria-label="Enter ArtistryHub"
          >
            Enter Your Art World 🎨
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}

export default Welcome;
