import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Back = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{ top: 'calc(4.5rem + env(safe-area-inset-top))' }}
      className="fixed left-4 z-[9999] p-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group"
      aria-label="Go Back"
      title="Go Back"
    >
      <ArrowLeft className="w-6 h-6 text-gray-700 group-hover:text-purple-600 transition-colors" />
    </button>
  );
};

export default Back;
