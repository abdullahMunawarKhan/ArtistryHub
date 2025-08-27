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
        .select('id, name, paintings_sold');
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
