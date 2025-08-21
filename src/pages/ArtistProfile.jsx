import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function ArtistProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const artistId = queryParams.get('id');

  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) {
      alert('No artist ID provided');
      navigate('/main-dashboard'); // Redirect if no id
      return;
    }

    const fetchArtist = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, mobile, email, profile_image_url')
        .eq('id', artistId)
        .single();

      if (error || !data) {
        alert('Failed to fetch artist info');
        navigate('/main-dashboard');
      } else {
        setArtist(data);
      }
      setLoading(false);
    };

    fetchArtist();
  }, [artistId, navigate]);

  if (loading) {
    return <div className="text-center py-20">Loading artist info...</div>;
  }

  if (!artist) {
    return null; // or an error message fallback
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg text-center">
      <img
        src={artist.profile_image_url || '/images/default-profile.png'}
        alt={artist.name}
        className="mx-auto w-32 h-32 rounded-full object-cover mb-4 shadow"
        onError={(e) => { e.target.src = '/images/default-profile.png'; }}
      />
      <h2 className="text-2xl font-bold mb-2">{artist.name}</h2>
      <p className="text-gray-700 mb-1"><strong>Mobile:</strong> {artist.mobile}</p>
      <p className="text-gray-700 mb-4"><strong>Email:</strong> {artist.email}</p>
      <button
        onClick={() => navigate(`/register?id=${artist.id}`)}
        className="px-6 py-2 bg-yellow-400 text-white rounded-lg font-semibold hover:bg-yellow-500 transition"
        >
        Edit Info
        </button>
    </div>
  );
}

export default ArtistProfile;
