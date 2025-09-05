import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

// Visual StarRating for non-integer average
function StarRating({ value }) {
  const full = Math.floor(value || 0);
  const partial = Number(value) - full;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[...Array(full)].map((_, i) => (
        <svg key={`f-${i}`} width={24} height={24} viewBox="0 0 20 20" fill="#F59E0B">
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
        </svg>
      ))}
      {partial > 0 && (
        <svg width={24} height={24} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="partial-grad">
              <stop offset={`${partial * 100}%`} stopColor="#F59E0B" />
              <stop offset={`${partial * 100}%`} stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" fill="url(#partial-grad)" />
        </svg>
      )}
      {[...Array(5 - full - (partial > 0 ? 1 : 0))].map((_, i) => (
        <svg key={`w-${i}`} width={24} height={24} viewBox="0 0 20 20" fill="#fff" stroke="#E5E7EB">
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
        </svg>
      ))}
    </span>
  );
}




function ArtistFollowButton({ artistId, user, refreshArtistFollowers, stopPropagationHandler, onFollowChange }) {
  const [following, setFollowing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);


  // Load initial following status and followers count
  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setFollowing(false);
      } else {
        const { data: userData } = await supabase
          .from('user')
          .select('following')
          .eq('id', user.id)
          .single();

        setFollowing(userData?.following?.includes(artistId) ?? false);
      }

      const { data: artistData, error } = await supabase
        .from('artists')
        .select('followers')
        .eq('id', artistId)
        .single();

      if (!error && artistData) {
        setFollowersCount(artistData.followers || 0);
      }
    }
    fetchData();
  }, [user, artistId]);

  async function toggleFollow() {
    if (!user) {
      alert('Please login to follow an artist.');
      return;
    }
    if (processing) return;
    setProcessing(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('following')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      let currentFollowing = userData?.following || [];
      let updatedFollowing = [];
      let followersCountChange = 0;

      if (!following) {
        updatedFollowing = [...currentFollowing, artistId];
        followersCountChange = 1;
      } else {
        updatedFollowing = currentFollowing.filter(id => id !== artistId);
        followersCountChange = -1;
      }

      await supabase
        .from('user')
        .update({ following: updatedFollowing })
        .eq('id', user.id);

      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('followers')
        .eq('id', artistId)
        .single();

      if (artistError) throw artistError;

      const newFollowers = Math.max(0, (artistData.followers || 0) + followersCountChange);

      await supabase
        .from('artists')
        .update({ followers: newFollowers })
        .eq('id', artistId);

      setFollowing(!following);
      setFollowersCount(newFollowers);

      // Notify parent about follow status change for instant UI update
      if (onFollowChange) {
        onFollowChange(artistId, !following);
      }

      if (refreshArtistFollowers) refreshArtistFollowers();

    } catch (error) {
      alert('Failed to update follow status.');
      console.error('Follow toggle error:', error);
    }

    setProcessing(false);
  }


  return (
    <div className="flex items-center gap-4 my-2">
      {(user && user.role === 'user') && (
        <button
          onClick={(e) => {
            stopPropagationHandler?.(e);
            toggleFollow();
          }}
          onDoubleClick={(e) => {
            stopPropagationHandler?.(e);
            toggleFollow();
          }}
          disabled={processing}
          className={`px-5 py-2 text-sm font-bold rounded-xl shadow transition-all duration-300 focus:outline-none
          ${following
              ? 'bg-white text-blue-600 border-blue-300 border hover:bg-blue-50 active:bg-blue-100'
              : 'bg-blue-600 text-white border-blue-600 border hover:bg-blue-700 active:bg-blue-800'
            }`}
          style={{ minWidth: '110px', textAlign: 'center' }}
          title={following ? 'Unfollow artist' : 'Follow artist'}
        >
          {following ? 'Following' : 'Follow'}
        </button>
      )}
      <span
        className="text-sm font-semibold select-none whitespace-nowrap bg-gradient-to-r from-red-500 to-red-700 text-white px-3 py-1 rounded-full shadow border border-red-600"
        style={{ letterSpacing: '0.03em' }}
      >
        {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
      </span>
    </div>
  );

}

function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterTag, setFilterTag] = useState('All'); // 'All' or 'Following'
  const [followingIds, setFollowingIds] = useState([]); // user's following F
  const [searchTerm, setSearchTerm] = useState(''); // new state for search term
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchUserFollowing() {
      if (!user) {
        setFollowingIds([]);
        return;
      }
      const { data: userData, error } = await supabase
        .from('user')
        .select('following')
        .eq('id', user.id)
        .single();
      if (!error && userData?.following) {
        setFollowingIds(userData.following);
      } else {
        setFollowingIds([]);
      }
    }
    fetchUserFollowing();
  }, [user]);

  useEffect(() => {
    const fetchArtists = async () => {
      const { data, error } = await supabase
        .from('artists')
        .select('id, name, paintings_sold, location, profile_image_url, avg_rating, followers');
      if (!error && data) {
        setArtists(data);
      }
      setLoading(false);
    };
    fetchArtists();
  }, []);

  // Filter artists based on filterTag
  const filteredArtists = artists
    .filter(artist => filterTag === 'All' || followingIds.includes(artist.id))
    .filter(artist =>
      artist.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading artists...</div>
      </div>
    );
  }
  function handleFollowChange(artistId, isFollowing) {
    setFollowingIds((prev) => {
      if (isFollowing) {
        return prev.includes(artistId) ? prev : [...prev, artistId];
      } else {
        return prev.filter(id => id !== artistId);
      }
    });
  }

  function handleFollowChange(artistId, isFollowing) {
    setFollowingIds((prev) => {
      if (isFollowing) {
        return prev.includes(artistId) ? prev : [...prev, artistId];
      } else {
        return prev.filter(id => id !== artistId);
      }
    });
  }

  return (
    <div className="p-8 bg-gray-100 min-h-[90vh]">
      <div className="flex items-center mb-6 space-x-4">
        <h1 className="text-3xl font-bold text-gradient-primary">Artist Directory</h1>
        <input
          type="text"
          placeholder="Search artist by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 rounded-xl border border-gray-300 max-w-sm flex-grow"
        />
      </div>


      {/* Filter buttons */}
      <div className="mb-6 flex gap-4">
        <button
          className={`px-5 py-2 rounded-xl shadow ${filterTag === 'All'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border border-blue-600'
            }`}
          onClick={() => setFilterTag('All')}
        >
          All
        </button>
        <button
          className={`px-5 py-2 rounded-xl shadow ${filterTag === 'Following'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border border-blue-600'
            }`}
          onClick={() => setFilterTag('Following')}
          disabled={!user} // Optionally disable if no user logged in
          title={!user ? 'Login to see followed artists' : ''}
        >
          Following
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredArtists.length === 0 ? (
          <div className="text-center text-gray-600 col-span-full">
            {filterTag === 'Following'
              ? 'No artists followed yet.'
              : 'No artists found.'}
          </div>
        ) : (
          filteredArtists.map((artist) => (
            <div
              key={artist.id}
              className="bg-white glass-card backdrop-blur-md shadow-2xl p-6 rounded-2xl cursor-pointer border border-slate-100 hover:shadow-3xl transition-all duration-200"
              onClick={() => navigate(`/artist-profile?id=${artist.id}`)}
            >
              <div className="flex flex-col items-center">
                <img
                  src={artist.profile_image_url}
                  alt={`${artist.name}'s profile`}
                  className="w-24 h-24 rounded-full object-cover shadow ring-4 ring-blue-100 mb-3"
                  loading="lazy"
                />
                <h2 className="text-2xl font-bold text-gray-900 mt-3 mb-1 text-center">
                  {artist.name}
                </h2>
                <div className="flex items-center gap-2 text-blue-500 mt-2 mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium text-slate-700">{artist.location}</span>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  <span className="font-semibold">Paintings Sold:</span> {artist.paintings_sold}
                </p>
                <div className="mt-2">
                  <StarRating value={artist.avg_rating} />
                </div>
                {/* Pass stopPropagation to the follow button to prevent redirect */}
                <ArtistFollowButton
                  artistId={artist.id}
                  user={user}
                  stopPropagationHandler={(e) => e.stopPropagation()}
                  onFollowChange={handleFollowChange}
                />

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ArtistList;
