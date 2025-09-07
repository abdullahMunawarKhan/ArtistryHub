import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

// Visual StarRating for non-integer average
function StarRating({ value }) {
  const full = Math.floor(value || 0);
  const partial = Number(value) - full;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
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

function ConfirmationModal({ visible, onConfirm, onCancel, message }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", padding: 24, borderRadius: 10, maxWidth: 400, width: "90%" }}
      >
        <p style={{ marginBottom: 24 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button onClick={onCancel} style={{ padding: "8px 14px" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: "8px 14px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: 4 }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function ArtistFollowButton({ artistId, user, refreshArtistFollowers }) {
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
          

        setFollowing(userData?.following?.includes(artistId) ?? false);
      }

      const { data: artistData, error } = await supabase
        .from('artists')
        .select('followers')
        .eq('id', artistId)
        

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
            e.stopPropagation(); // ✅ Direct call
            toggleFollow();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation(); // ✅ Direct call
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


export default function ArtistProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const artistId = queryParams.get("id");

  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingArtist, setLoadingArtist] = useState(true);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false, artworkId: null, currentAvailability: true });
  const [myEmail, setMyEmail] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [userRole, setUserRole] = useState("user");
  const [user, setUser] = useState(null); // Add user state

  useEffect(() => {
    async function fetchArtistAndUser() {
      if (!artistId) {
        alert("No artist ID provided");
        navigate("/main-dashboard");
        return;
      }
      setLoadingArtist(true);
      const { data: artistData } = await supabase
        .from("artists")
        .select("id, name, mobile, email, profile_image_url, experience, location, user_id, followers")
        .eq("id", artistId)
        .single();
      setLoadingArtist(false);
      if (!artistData) {
        alert("Failed to fetch artist info");
        navigate("/main-dashboard");
        return;
      }
      setArtist(artistData);

      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData?.user;

      if (!authUser) {
        setUser(null);
        return;
      }

      // Fetch full profile info with role
      const { data: profile } = await supabase
        .from('user')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser({ ...authUser, ...profile }); // This ensures user.role exists

      const myUserId = authUser.id;
      setMyEmail(authUser.email || "");
      setIsOwner(myUserId && myUserId === artistData.user_id);

      if (profile?.role) setUserRole(profile.role);

    }

    fetchArtistAndUser();
  }, [artistId, navigate]);

  // fetch artworks + reviews
  useEffect(() => {
    if (!artistId) return;
    async function fetchArtworks() {
      setLoadingArtworks(true);
      const { data } = await supabase
        .from("artworks")
        .select("id, title, category, cost, image_urls, availability, rating, review, shipment_status")
        .eq("artist_id", artistId);

      setArtworks(data || []);
      setLoadingArtworks(false);
      if (data) {
        for (const art of data) {
          if (art.shipment_status === "confirm" && art.availability !== false) {
            await supabase.from("artworks").update({ availability: false }).eq("id", art.id);
            art.availability = false;
          }
        }
      }

      if (data) {
        const delivered = data.filter((a) => a.shipment_status === "delivered" && typeof a.rating === "number");
        if (delivered.length > 0) {
          const avg = delivered.reduce((sum, a) => sum + a.rating, 0) / delivered.length;
          setAverageRating(avg);
          // Add this block to store in Supabase
          const updateAvgRating = async () => {
            const { error } = await supabase.from("artists").update({ avg_rating: avg }).eq("id", artist.id);
            if (error) {
              console.error("Failed to update avg_rating:", error.message);
            }
          };
          updateAvgRating();
        }
        const revs = delivered.map((a) => ({
          rating: a.rating,
          review: a.review,
          email: a.email,
        }));
        setReviews(revs);
      }
    }
    fetchArtworks();
  }, [artistId]);

  function handleEditProduct(artwork) {
    if (!artwork?.id) {
      alert("Invalid artwork for editing");
      return;
    }
    navigate(`/upload-work?id=${artwork.id}`);
  }

  const onToggleClick = (artwork) => {
    if (artwork.shipment_status === "confirm") {
      alert("This product is already sold. Please add new artworks instead.");
      return;
    }
    setConfirmModal({ visible: true, artworkId: artwork.id, currentAvailability: artwork.availability !== false });
  };

  const confirmToggle = async () => {
    const newAvailability = !confirmModal.currentAvailability;
    setConfirmModal({ ...confirmModal, visible: false });
    try {
      const { error } = await supabase.from("artworks").update({ availability: newAvailability }).eq("id", confirmModal.artworkId);
      if (error) throw error;

      setArtworks((prev) =>
        prev.map((art) =>
          art.id === confirmModal.artworkId ? { ...art, availability: newAvailability } : art
        )
      );

      alert(`Availability updated to ${newAvailability ? "Yes" : "No"}`);
    } catch (err) {
      alert("Failed to update availability: " + err.message);
    }
  };


  if (loadingArtist) {
    return <div className="flex justify-center items-center h-screen text-2xl font-semibold text-gray-700 animate-pulse"
    >Loading artist information...</div>;
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-6 max-w-7xl mx-auto p-6">
      {/* ARTWORKS: Bottom on mobile, left on desktop */}
      <div className="w-full md:w-3/4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{isOwner ? "Your Artworks" : "Artworks by this artist"}</h2>
          <div className="flex gap-4 items-center mt-2">
            {isOwner && (
              <button
                onClick={() => navigate("/upload-work")}
                className="inline-flex items-center px-5 py-2 rounded-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-150"
              >
                <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Upload Artwork
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => navigate("/artist-dashboard")}
                className="inline-flex items-center px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-transform duration-150"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>

        {loadingArtworks ? (
          <p className="text-slate-600">Loading artworks...</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {artworks.length === 0 && <p className="text-slate-600">No artworks found.</p>}
            {artworks.map((artwork) => (
              <div key={artwork.id} className="bg-white rounded-xl border shadow p-3 relative cursor-pointer" onClick={() => navigate(`/product?id=${artwork.id}`)}>
                {/* Edit button */}
                {isOwner && (
                  <button
                    className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProduct(artwork);
                    }}
                  >
                    Edit
                  </button>
                )}

                {/* Artwork image */}
                <div className="w-full h-40 flex items-center justify-center overflow-hidden bg-slate-50 rounded">
                  <img src={artwork.image_urls?.[0]} alt={artwork.title} className="w-full h-full object-contain" />
                </div>

                {/* Info */}
                <div className="mt-2">
                  <h3 className="font-semibold">{artwork.title}</h3>
                  {!isOwner && <p className="text-sm text-slate-600">{artwork.category}</p>}
                  <p className="font-bold">₹{artwork.cost}</p>
                </div>

                {/* Toggle availability */}
                {isOwner && (
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={artwork.availability !== false} readOnly onClick={(e) => {
                        e.stopPropagation();
                        onToggleClick(artwork.id, artwork.availability !== false);
                      }} />
                      <span className={`${artwork.availability !== false ? "text-green-700" : "text-red-700"} font-semibold`}>
                        Availability: {artwork.availability !== false ? "Yes" : "No"}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ARTIST CARD: Top on mobile, right on desktop */}
      <div className="w-full md:w-1/4 bg-white rounded-2xl shadow-lg p-6 flex flex-col h-fit mb-6 md:mb-0">

        {/* Edit profile */}
        {isOwner && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate(`/register?edit=1&id=${artist.id}`)}
              className="px-4 py-1 bg-blue-600 hover:bg-blue-700 transition text-white rounded text-sm font-medium"
              aria-label="Edit Profile"
            >
              Edit
            </button>
          </div>
        )}

        {/* Profile image */}
        <img
          src={artist.profile_image_url}
          alt={artist.name}
          className="w-32 h-32 rounded-full object-cover mx-auto mb-6 border-2 border-gray-200"
          loading="lazy"
        />

        {/* Rating */}
        <div className="text-center mb-5">
          <StarRating value={averageRating} />
          <p className="text-xs text-gray-500 mt-1">
            {averageRating > 0 ? `${averageRating.toFixed(2)} / 5` : "No ratings yet"}
          </p>
        </div>

        {/* Info */}
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-1">{artist.name}</h2>
        <p className="text-sm text-gray-600 text-center mb-6">{artist.location}</p>

        {(isOwner || userRole === "efbv") && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm space-y-4 mx-auto w-full max-w-sm">
            <div>
              <p className="font-semibold text-xs text-black-500 font-medium mb-1">Mobile</p>
              <p className="text-gray-800 break-words">{artist.mobile}</p>
            </div>
            <div>
              <p className="font-semibold text-xs text-black-500 font-medium mb-1">Email</p>
              <p className="text-gray-800 break-words truncate">{artist.email}</p>
            </div>
          </div>
        )}

        {/* Follow button */}
        <div className="mt-6">
          <ArtistFollowButton
            artistId={artist.id}
            user={user}
            
          />

        </div>

        {/* Reviews */}
        <div className="mt-8 border-t border-gray-200 pt-5">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No reviews yet.</p>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {reviews.map((rev, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 text-sm bg-white shadow-sm"
                >
                  <StarRating value={rev.rating} />
                  <p className="mt-2 text-gray-700">{rev.review}</p>
                  {isOwner && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      By: {rev.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModal.visible}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
        message={`Are you sure you want to set availability to ${confirmModal.currentAvailability ? "No" : "Yes"}?`}
      />
    </div>
  );
}
