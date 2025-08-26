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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100">
        <div className="text-xl text-gray-700 font-bold animate-pulse">Loading artists...</div>
      </div>
    );
  }

  // Helper function to assign profile image circularly
  const getProfileImageSrc = (index) => {
    // there are 10 images named Profile1.png ... Profile10.png in /images folder
    const imageNumber = (index % 10) + 1;
    return `/images/Profile${imageNumber}.png`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 p-8">
      <h1 className="section-header text-center text-gradient mb-8">Meet Our Artists</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
        {artists.length === 0 ? (
          <div className="col-span-full text-center text-lg text-gray-500 py-10">No artists found.</div>
        ) : (
          artists.map((artist, idx) => (
            <div
              key={artist.id}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border border-yellow-200 hover:shadow-xl transition-all duration-300 cursor-pointer"
              style={{ minWidth: 260 }}
              onClick={() => navigate(`/artist-profile?id=${artist.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/artist-profile?id=${artist.id}`); }}
              title="Tap for more info"
            >
              {/* Profile Image - from local images folder */}
              <img
                src={getProfileImageSrc(idx)}
                alt={artist.name}
                className="w-24 h-24 rounded-full object-cover mb-3 border-4 border-yellow-300 shadow-lg bg-yellow-50"
                onError={e => {
                  e.currentTarget.src = '/images/Profile1.png';
                }}
              />

              {/* Name */}
              <h2 className="text-xl font-extrabold text-yellow-500 mb-1 tracking-wide">
                {artist.name}
              </h2>

              {/* Paintings sold */}
              <div className="mb-3">
                <span className="bg-green-50 text-green-700 font-semibold px-3 py-1 rounded-xl text-xs shadow">
                  Paintings Sold: {artist.paintings_sold ?? 0}
                </span>
              </div>

              {/* Tap for more info */}
              <span className="text-blue-600 hover:text-blue-700 text-sm font-semibold">Tap for more info →</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ArtistList;
