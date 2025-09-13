import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

// import { HashRouter as Router } from "react-router-dom";
// instead of BrowserRouter


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
          .eq('id', user.id);

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
        .eq('id', user.id);

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
    <div className="flex items-center gap-3 my-2 w-full">
      {/* Show follow button only if user is NOT the artist */}
      {!(user && String(user.id) === String(artistId)) && (
        <button
          onClick={e => { e.stopPropagation(); toggleFollow(); }}
          onDoubleClick={e => { e.stopPropagation(); toggleFollow(); }}
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

      {/* Followers count always visible */}
      <span
        className="text-sm font-semibold select-none whitespace-nowrap bg-gradient-to-r from-red-500 to-red-700 text-white px-3 py-1 rounded-full shadow border border-red-600 ml-0"
        style={{ letterSpacing: '0.03em' }}
      >
        {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
      </span>
    </div>
  );

}


function ArtistProfileShare({ artistId }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${window.location.origin}/#/artist-profile?id=${artistId}`;

  const handleShare = async () => {
    // Native share on supported devices
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this artist",
          text: "Take a look at this artist’s profile!",
          url: profileUrl,
        });
      } catch (err) {
        console.error("Share canceled or failed", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Copy failed", err);
        alert("Could not copy link. Please copy manually: " + profileUrl);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow transition text-sm sm:text-base"
        aria-label="Share Profile"
      >
        {/* Heroicon: Arrow turn-up-right (looks like classic Share arrow) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 20 20"
          className="w-5 h-5"
        >
          <path d="M15.707 5.293a1 1 0 0 0-1.414 0L10 9.586V7a1 1 0 1 0-2 0v6a1 1 0 0 0 1 1h6a1 1 0 1 0 0-2h-2.586l4.293-4.293a1 1 0 0 0 0-1.414z" />
        </svg>
        <span>Share</span>
      </button>

    </>

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
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="flex flex-col gap-3 mb-4">
          {isOwner && (
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/upload-work")}
                className="flex items-center px-3 sm:px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-md hover:scale-105 hover:shadow-lg transition-transform duration-200 text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Upload
              </button>

              <button
                onClick={() => navigate("/artist-dashboard")}
                className="flex items-center px-3 sm:px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105 transition-transform duration-200 text-sm sm:text-base"
              >
                Dashboard
              </button>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {isOwner ? "Your Artworks" : "Artworks by this artist"}
          </h2>
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
                  <h3 className="font-se      mibold">{artwork.title}</h3>
                  {!isOwner && <p className="text-sm text-slate-600">{artwork.category}</p>}
                  <p className="font-bold">₹{artwork.cost}</p>
                </div>

                {/* Toggle availability */}
                {isOwner && (
                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={artwork.availability !== false} readOnly onClick={(e) => {
                        e.stopPropagation();
                        onToggleClick(artwork)

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
      <div className="relative w-full md:w-1/4 bg-white rounded-2xl shadow-lg p-4 sm:p-6 pt-16 sm:pt-20 flex flex-col h-fit mb-6 md:mb-0">
        <div className="absolute top-4 left-0 w-full px-4 flex items-center justify-between">
          <ArtistProfileShare artistId={artist.id} />

          {isOwner && (
            <button
              onClick={() => navigate(`/register?edit=1&id=${artist.id}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow transition text-sm sm:text-base"
              aria-label="Edit Profile"
            >
              {/* Heroicon: Pencil */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.651-1.651a1.875 1.875 0 112.652 2.652L10.582 16.071a4.5 4.5 0 01-1.897 1.13l-2.685.805.805-2.685a4.5 4.5 0 011.13-1.897l10.927-10.937z"
                />
              </svg>
              <span className="hidden xs:inline">Edit</span>
            </button>
          )}
        </div>
        {/* Profile image */}
        <img
          src={artist.profile_image_url}
          alt={artist.name}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mx-auto mb-4 sm:mb-6 border-2 border-gray-200"
          loading="lazy"
        />

        {/* Rating */}
        <div className="text-center mb-4 sm:mb-5">
          <StarRating value={averageRating} />
          <p className="text-xs text-gray-500 mt-1">
            {averageRating > 0 ? `${averageRating.toFixed(2)} / 5` : "No ratings yet"}
          </p>
        </div>

        {/* Info */}
        <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-900 mb-1">{artist.name}</h2>
        <p className="text-xs sm:text-sm text-gray-600 text-center mb-4 sm:mb-6">{artist.location}</p>

        {(isOwner || userRole === "efbv") && (
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm space-y-3 sm:space-y-4 mx-auto w-full max-w-xs">
            <div>
              <p className="font-semibold text-[11px] sm:text-xs text-black-500 mb-1">Mobile</p>
              <p className="text-gray-800 break-words text-sm">{artist.mobile}</p>
            </div>
            <div>
              <p className="font-semibold text-[11px] sm:text-xs text-black-500 mb-1">Email</p>
              <p className="text-gray-800 break-words truncate text-sm">{artist.email}</p>
            </div>
          </div>
        )}

        {/* Follow button */}
        <ArtistFollowButton artistId={artist.id} user={user} />

        {/* Reviews */}
        <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4 sm:pt-5">
          <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-base sm:text-lg">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500 italic">No reviews yet.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-h-48 sm:max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {reviews.map((rev, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-2 sm:p-3 text-xs sm:text-sm bg-white shadow-sm"
                >
                  <StarRating value={rev.rating} />
                  <p className="mt-1 sm:mt-2 text-gray-700">{rev.review}</p>
                  {isOwner && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 italic">
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




