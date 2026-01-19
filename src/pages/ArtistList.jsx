import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { MapPin } from "lucide-react";

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
              className="
    w-full bg-white border border-gray-200 rounded-3xl shadow-md 
    hover:shadow-lg transition-all duration-300 cursor-pointer
    p-4 flex items-center gap-4
    sm:p-5 sm:gap-6
  "
            >

              {/* PROFILE IMAGE */}
              <img
                src={artist.profile_image_url || '/default-avatar.jpg'}
                alt="profile"
                className="
      w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
      rounded-full object-cover border-2 border-blue-500 flex-shrink-0
    "
              />

              {/* RIGHT SIDE CONTENT */}
              <div className="flex flex-col flex-1">

                {/* NAME */}
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900">
                  {artist.name}
                </h2>

                {/* LOCATION */}
                <div className="flex items-center gap-1 text-gray-600 text-xs sm:text-sm mt-1">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                  <span>{artist.location}</span>
                </div>

                {/* RATING */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="scale-75 sm:scale-90 md:scale-100 origin-left">
                    <StarRating value={artist.avg_rating || 0} />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600">
                    {artist.avg_rating ? artist.avg_rating.toFixed(1) : "No ratings"}
                  </span>
                </div>

                {/* BUTTONS */}
                <div className="flex items-center gap-3 sm:gap-4 mt-3">

                  {/* FOLLOW BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowToggle(artist.id);
                    }}
                    disabled={followLoading[artist.id]}
                    className={`
          px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm 
          font-medium border rounded-lg shadow-sm 
          transition-all duration-200
          ${followingIds.includes(artist.id)
                        ? "bg-green-600 text-white border-green-700 hover:bg-green-700"
                        : "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                      }
        `}
                  >
                    {followingIds.includes(artist.id) ? "Following" : "Follow"}
                  </button>

                  {/* FOLLOWERS COUNT */}
                  <div
                    className="
          px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium 
          bg-gray-100 border border-gray-300 rounded-lg text-gray-700
        "
                  >
                    {artist.followers || 0} followers
                  </div>

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