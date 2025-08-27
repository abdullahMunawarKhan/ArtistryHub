// src/pages/ArtistList.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, paintings_sold,location');
      if (!error && data) {
        setArtists(data);
      }
      setLoading(false);
    };
    fetchArtists();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading artists...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gradient-primary mb-6">
        Artist Directory
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className="glass-card backdrop-blur-sm p-4 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => navigate(`/artist-profile?id=${artist.id}`)}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {artist.name}
                      {/* Location with icon */}
        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{artist.location}</span>
        </div>
            </h2>
            <p className="text-gray-600">
              Paintings Sold: {artist.paintings_sold}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArtistList;
