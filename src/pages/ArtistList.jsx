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
        .select('id, name, experience, registered_at, paintings_sold, paintings (id, title, image_url)');
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
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border border-yellow-200 hover:shadow-xl transition-all duration-300"
              style={{ minWidth: 260 }}
            >
              {/* Profile Image - circular assignment */}
              <img
                src={getProfileImageSrc(idx)}
                alt={artist.name}
                className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-yellow-300 shadow-lg bg-yellow-50"
                onError={e => {
                  e.target.src = '/images/background.png';
                }}
              />

              {/* Name */}
              <h2 className="text-xl font-extrabold text-yellow-500 mb-1 tracking-wide">
                {artist.name}
              </h2>

              {/* Info Badges */}
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                <span className="bg-yellow-100 text-yellow-800 font-semibold px-3 py-1 rounded-xl text-xs shadow">
                  Experience: {artist.experience} yr
                </span>
                <span className="bg-green-50 text-green-700 font-semibold px-3 py-1 rounded-xl text-xs shadow">
                  Paintings Sold: {artist.paintings_sold}
                </span>
                <span className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-xl text-xs shadow">
                  Current paintings: {artist.paintings?.length || 0}
                </span>
              </div>

              {/* Gallery of paintings */}
              {artist.paintings && artist.paintings.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {artist.paintings.slice(0, 4).map(painting => (
                    <img
                      key={painting.id}
                      src={painting.image_url || '/images/background.png'}
                      alt={painting.title}
                      className="w-16 h-16 rounded-lg object-cover border border-yellow-200 shadow-md transition-transform hover:scale-105"
                      title={painting.title}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ArtistList;
