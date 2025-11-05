import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

// Visual StarRating for non-integer average
function StarRating({ value }) {
  const full = Math.floor(value || 0);
  const partial = Number(value) - full;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }} className="scale-75 sm:scale-100">
      {[...Array(full)].map((_, i) => (
        <svg key={`f-${i}`} width={20} height={20} viewBox="0 0 20 20" fill="#F59E0B" className="w-4 h-4 sm:w-5 sm:h-5">
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
        </svg>
      ))}
      {partial > 0 && (
        <svg width={20} height={20} viewBox="0 0 20 20" className="w-4 h-4 sm:w-5 sm:h-5">
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
        <svg key={`w-${i}`} width={20} height={20} viewBox="0 0 20 20" fill="#fff" stroke="#E5E7EB" className="w-4 h-4 sm:w-5 sm:h-5">
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
        </svg>
      ))}
    </span>
  );
}






function ArtistList() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filterTag, setFilterTag] = useState('All'); // 'All' or 'Following'
  const [followingIds, setFollowingIds] = useState([]); // user's following F
  const [searchTerm, setSearchTerm] = useState(''); // new state for search term
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [followLoading, setFollowLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      // Get authenticated user
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) {
        setUser(null);
        return;
      }
      // Fetch user profile from your user table using authUser.id
      const { data: profile } = await supabase
        .from('user')
        .select('*')
        .eq('id', authUser.id)
        .single();
      // Merge profile and auth data
      setUser({ ...authUser, ...profile });
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
  const handleFollowToggle = async (artistId) => {
    if (!user) {
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
      return;
    }

    setFollowLoading(prev => ({ ...prev, [artistId]: true }));

    try {
      const isCurrentlyFollowing = followingIds.includes(artistId);

      if (isCurrentlyFollowing) {
        // Unfollow logic
        const newFollowingIds = followingIds.filter(id => id !== artistId);

        // Update user's following list
        const { error: userError } = await supabase
          .from('user')
          .update({ following: newFollowingIds })
          .eq('id', user.id);

        if (userError) throw userError;

        // Decrease artist's followers count
        const { error: artistError } = await supabase.rpc(
          'decrement_followers',
          { artist_id: artistId }
        );

        if (artistError) throw artistError;

        // Update local state
        setFollowingIds(newFollowingIds);
        setArtists(prev =>
          prev.map(artist =>
            artist.id === artistId
              ? { ...artist, followers: Math.max(0, artist.followers - 1) }
              : artist
          )
        );

      } else {
        // Follow logic
        const newFollowingIds = [...followingIds, artistId];

        // Update user's following list
        const { error: userError } = await supabase
          .from('user')
          .update({ following: newFollowingIds })
          .eq('id', user.id);

        if (userError) throw userError;

        // Increase artist's followers count
        const { error: artistError } = await supabase.rpc(
          'increment_followers',
          { artist_id: artistId }
        );

        if (artistError) throw artistError;

        // Update local state
        setFollowingIds(newFollowingIds);
        setArtists(prev =>
          prev.map(artist =>
            artist.id === artistId
              ? { ...artist, followers: artist.followers + 1 }
              : artist
          )
        );
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // You might want to show an error message to the user here
    } finally {
      setFollowLoading(prev => ({ ...prev, [artistId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-2xl font-semibold text-gray-700 animate-pulse">
        fetching artist list
      </div>
    );
  }
  return (
    <div className="p-3 sm:p-8 bg-gray-100 min-h-[90vh]">
      {/* Heading + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
        <h1 className="text-xl sm:text-3xl font-bold text-gradient-primary">
          Artist Directory
        </h1>
        <input
          type="text"
          placeholder="Search artist by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 text-sm sm:text-base rounded-xl border border-gray-300 flex-1 sm:max-w-sm w-full"
        />
      </div>

      {/* Filter buttons */}
      <div className="mb-4 sm:mb-6 flex gap-2 sm:gap-3 overflow-x-auto pb-2">
        <button
          className={`px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl shadow whitespace-nowrap ${filterTag === 'All'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-blue-600 border border-blue-600'
            }`}
          onClick={() => setFilterTag('All')}
        >
          All
        </button>
        <button
          className={`px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl shadow whitespace-nowrap ${!user
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : filterTag === 'Following'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-600 border border-blue-600'
            }`}
          onClick={() => {
            if (!user) {
              setShowLoginMessage(true);
              setTimeout(() => setShowLoginMessage(false), 3000);
              return;
            }
            setFilterTag('Following');
          }}
        >
          Following ({followingIds.length})
        </button>
      </div>

      {/* Login popup */}
      {showLoginMessage && (
        <div className="fixed top-3 sm:top-5 right-3 sm:right-5 bg-red-100 border border-red-300 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg z-50 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 max-w-[90%] sm:max-w-md">
          <p className="text-xs sm:text-sm font-medium text-center sm:text-left">Please log in to follow artists!</p>
          <button
            onClick={() => navigate('/user-login')}
            className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            Login
          </button>
        </div>
      )}


      {/* Artist Cards */}
      <div className="grid gap-4 sm:gap-5 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredArtists.length === 0 ? (
          <div className="text-center text-gray-600 col-span-full py-8">
            <p className="text-base md:text-lg mb-3">
              {filterTag === 'Following'
                ? "You're not following any artists yet."
                : "No artists found matching your search."}
            </p>
            {filterTag === 'Following' && (
              <button
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                onClick={() => setFilterTag('All')}
              >
                View All Artists
              </button>
            )}
          </div>
        ) : (
          filteredArtists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => navigate(`/artist-profile?id=${artist.id}`)}
              className="relative bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col items-center text-center sm:text-left p-5"
            >
              {/* Profile Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-5 w-full">
                {/* Profile Image */}
                <img
                  src={artist.profile_image_url || '/default-avatar.jpg'}
                  alt={`${artist.name}'s profile`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-blue-500 shadow-md transform hover:scale-105 transition-transform duration-300 cursor-pointer"
                  loading="lazy"
                />

                {/* Artist Info */}
                <div className="flex flex-col justify-center mt-3 sm:mt-0 w-full sm:w-auto text-center sm:text-left">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors truncate">
                    {artist.name}
                  </h2>

                  {/* Location */}
                  <div className="flex justify-center sm:justify-start items-center gap-1 text-indigo-600 text-xs mt-1">
                    <svg
                      className="w-3 h-3 opacity-80"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium text-gray-700 truncate max-w-[150px] md:max-w-full">
                      {artist.location}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center sm:justify-start items-center gap-1.5 mt-1">
                    <div className="scale-90 sm:scale-100">
                      <StarRating value={artist.avg_rating || 0} />
                    </div>
                    <span className="text-xs text-gray-600">
                      {artist.avg_rating ? artist.avg_rating.toFixed(1) : 'No ratings'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full border-t border-gray-200 mt-4 mb-3"></div>

              {/* Follow + Follower Count Section */}
              <div className="flex flex-row justify-between items-center gap-3 w-full">
                {/* Follow Button */}
                <button
                  className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg shadow transition-all duration-200 flex items-center justify-center gap-2 ${followingIds.includes(artist.id)
                      ? 'bg-green-600 text-white hover:bg-red-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollowToggle(artist.id);
                  }}
                  disabled={followLoading[artist.id]}
                >
                  {followLoading[artist.id] ? (
                    <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
                  ) : followingIds.includes(artist.id) ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span>Follow</span>
                    </>
                  )}
                </button>

                {/* Follower Count */}
                <div className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-gray-50 border border-gray-300 text-gray-700 text-center">
                  {artist.followers || 0} followers
                </div>
              </div>
            </div>
          ))
        )}
      </div>


    </div>
  );

}

export default ArtistList;