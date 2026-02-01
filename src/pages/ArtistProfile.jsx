import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { Pencil, Share2, } from "lucide-react";
import { MapPin } from "lucide-react";
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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

function ArtistProfileShare({ artistId }) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://scopebrush.vercel.app/#/artist-profile?id=${artistId}`;

  const handleShare = async () => {
    const shareText = artist?.name
      ? `Check out the amazing artwork by ${artist.name} on ScopeBrush!`
      : 'Take a look at this artist’s profile on ScopeBrush!';

    // 1️⃣ Native Capacitor share (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Check out this artist',
        text: shareText,
        url: profileUrl,
        dialogTitle: 'Share Artist Profile',
      });
      return;
    }

    // 2️⃣ Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this artist',
          text: shareText,
          url: profileUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
      return;
    }

    // 3️⃣ Clipboard fallback
    try {
      await navigator.clipboard.writeText(`${shareText} ${profileUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Copy failed. Please copy manually:\n' + profileUrl);
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label="Share Profile"
      title="Share Profile"
      className="
        flex items-center gap-1.5
        px-4 py-1.5
        rounded-full
        bg-blue-500 hover:bg-blue-600
        text-white
        font-medium
        shadow-sm
        transition
        text-xs sm:text-sm
      "
    >
      <Share2 className="w-3.5 h-3.5" />
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}

function PriceDisplay({ cost }) {
  const originalPrice = Math.round(cost * 1.15); // 15% increase
  const discountPercent = 15;

  return (
    <div>
      <div style={{ fontSize: "12px", color: "#555" }}>M.R.P - </div>
      <span
        style={{
          textDecoration: "line-through",
          color: "#888",
          marginRight: 8,
        }}
      >
        ₹{originalPrice}
      </span>
      <span
        style={{
          color: "green",
          fontWeight: 500,
          marginRight: 8,
        }}
      >
        ({discountPercent}% off)
      </span>
      <span style={{ fontWeight: "bold" }}>₹{cost}</span>
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
  const [isOpen, setIsOpen] = useState(false);
  const [followingIds, setFollowingIds] = useState([]); // user's following F
  const [followLoading, setFollowLoading] = useState({});
  const [showLoginMessage, setShowLoginMessage] = useState(false);

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

      const { data: followData, error: followErr } = await supabase
        .from('user')
        .select('following')
        .eq('id', authUser.id)
        .single();
      if (!followErr && followData?.following) {
        setFollowingIds(followData.following);
      }
    }

    fetchArtistAndUser();
  }, [artistId, navigate]);
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
      // In handleFollowToggle’s try/catch, after setFollowLoading
      if (isCurrentlyFollowing) {
        setArtist(prev => ({ ...prev, followers: Math.max(prev.followers - 1, 0) }));
      } else {
        setArtist(prev => ({ ...prev, followers: prev.followers + 1 }));
      }

    }
  };
  // fetch artworks + reviews
  useEffect(() => {
    if (!artistId) return;

    async function fetchArtworks() {
      setLoadingArtworks(true);

      // Fetch artworks for the artist without shipment_status
      const { data: artworksData, error: artworkError } = await supabase
        .from("artworks")
        .select("id, title, category, cost, image_urls, availability, rating, review")
        .eq("artist_id", artistId);

      if (artworkError) {
        console.error("Failed to fetch artworks:", artworkError.message);
        setLoadingArtworks(false);
        return;
      }

      if (!artworksData || artworksData.length === 0) {
        setArtworks([]);
        setLoadingArtworks(false);
        setAverageRating(0);
        setReviews([]);
        return;
      }

      // Extract artwork ids
      const artworkIds = artworksData.map((art) => art.id);

      // Fetch orders related to these artworks to get shipment_status
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("artwork_id, shipment_status")
        .in("artwork_id", artworkIds);

      if (ordersError) {
        console.error("Failed to fetch orders:", ordersError.message);
        setLoadingArtworks(false);
        return;
      }

      // Map orders by artwork_id
      const ordersMap = {};
      if (ordersData) {
        ordersData.forEach((order) => {
          ordersMap[order.artwork_id] = order.shipment_status;
        });
      }

      // Merge shipment_status from orders into artworks
      const artworksWithStatus = artworksData.map((art) => ({
        ...art,
        shipment_status: ordersMap[art.id] || null,
      }));

      // Update availability in artworks if shipment_status is 'confirm'
      for (const art of artworksWithStatus) {
        if (art.shipment_status === "confirm" && art.availability !== false) {
          // Update availability in DB and locally
          await supabase
            .from("artworks")
            .update({ availability: false })
            .eq("id", art.id);
          art.availability = false;
        }
      }

      setArtworks(artworksWithStatus);
      setLoadingArtworks(false);

      // Filter artworks for delivered/shipped with ratings to calculate average
      const delivered = artworksWithStatus.filter(
        (a) =>
          (a.shipment_status === "delivered" || a.shipment_status === "shipped") &&
          typeof a.rating === "number"
      );

      if (delivered.length > 0) {
        const avg =
          delivered.reduce((sum, a) => sum + a.rating, 0) / delivered.length;
        setAverageRating(avg);

        // Update average rating in artists table
        const { error } = await supabase
          .from("artists")
          .update({ avg_rating: avg })
          .eq("id", artistId);
        if (error) {
          console.error("Failed to update avg_rating:", error.message);
        }
      } else {
        setAverageRating(0);
      }

      // Set reviews from artworks with delivered/shipped and ratings
      const revs = artworksWithStatus
        .filter(
          (a) =>
            (a.shipment_status === "delivered" || a.shipment_status === "shipped") &&
            typeof a.rating === "number"
        )
        .map((a) => ({
          rating: a.rating,
          review: a.review,
        }));

      setReviews(revs);
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
    <div className="flex flex-col md:flex-row gap-6 w-full p-6">
      {/* ARTIST CARD: Top on mobile, LEFT on desktop (25% width) - MOVED TO FIRST POSITION */}
      {/* ARTIST CARD */}
      <div
        className="
    relative w-full md:w-1/4 
    bg-white rounded-2xl shadow-md 
    p-4 md:p-5 
    flex flex-col 
    h-fit mb-4 transition-all duration-300 hover:shadow-xl
  "
      >

        {/* TOP ROW — Share + Edit (same on all screens) */}
        <div className="flex items-center justify-between mb-3">
          <ArtistProfileShare artistId={artist.id} />
          {isOwner && (
            <button
              onClick={() => navigate(`/register?edit=1&id=${artist.id}`)}
              className="
          flex items-center gap-2
          px-3 py-1.5 
          bg-blue-600 hover:bg-blue-700
          text-white rounded-full text-xs
          transition-all duration-200 shadow-md
        "
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>


        {/* MOBILE HORIZONTAL ROW: IMAGE LEFT + NAME + RATING */}
        <div className="flex md:hidden items-center gap-4 mb-1">
          <img
            src={artist.profile_image_url}
            alt={artist.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-sm"
          />

          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-gray-900">{artist.name}</h2>

            {/* Rating (keep with name) */}
            <div className="mt-1">
              <StarRating value={averageRating} />
              <p className="text-xs text-gray-500">
                {averageRating > 0 ? `${averageRating.toFixed(2)} / 5` : "No ratings yet"}
              </p>
            </div>
          </div>
        </div>

        <div className="md:hidden mb-3 flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-indigo-600" />
          <span className="text-xs text-gray-600 leading-none inline-block">
            {artist.location}
          </span>
        </div>

        {/* DESKTOP — keep your original vertical layout */}
        <div className="hidden md:flex flex-col items-center">
          <img
            src={artist.profile_image_url}
            alt={artist.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md mb-2"
          />

          <StarRating value={averageRating} />
          <p className="text-xs text-gray-500 mb-2">
            {averageRating > 0 ? `${averageRating.toFixed(2)} / 5` : "No ratings yet"}
          </p>

          <h2 className="text-lg font-semibold text-gray-900">{artist.name}</h2>
          <div className="md:hidden mb-3 pl-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <p className="text-xs text-gray-600">{artist.location}</p>
          </div>
        </div>

        {/* CONTACT INFO (same on all screens) */}
        {(isOwner || userRole === "efbv") && (
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 shadow-sm mb-3">
            <div className="flex justify-between text-xs text-gray-800">
              <span className="font-semibold text-gray-600">Mobile:</span>
              <span className="truncate">{artist.mobile}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-800 mt-1">
              <span className="font-semibold text-gray-600">Email:</span>
              <span className="truncate">{artist.email}</span>
            </div>
          </div>
        )}

        {/* FOLLOW + FOLLOWERS */}
        <div className="flex justify-between items-center gap-3 mt-1 pt-2 border-t border-gray-100">

          <button
            className={`flex-1 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${followingIds.includes(artist.id)
              ? "bg-green-600 text-white hover:bg-red-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            onClick={(e) => {
              e.stopPropagation();
              handleFollowToggle(artist.id);
            }}
            disabled={followLoading[artist.id]}
          >
            {followingIds.includes(artist.id) ? "Following" : "Follow"}
          </button>

          <div className="flex-1 px-4 py-2 text-xs md:text-sm font-medium bg-gray-50 border border-gray-300 rounded-lg text-center">
            {artist.followers || 0} followers
          </div>
        </div>

        {/* REVIEWS */}
        <div className="mt-3 border-t border-gray-200 pt-2">
          <h3 className="font-semibold text-gray-900 mb-1 text-sm">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No reviews yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {reviews.map((rev, i) => (
                <div key={i} className="border rounded-md p-2 text-xs bg-white shadow-sm">
                  <StarRating value={rev.rating} />
                  <p className="mt-1 text-gray-700">{rev.review}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>




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
          <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
              {artworks.length === 0 && <p className="text-slate-600">No artworks found.</p>}
              {artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="bg-white rounded-xl border shadow p-3 relative cursor-pointer"
                  onClick={() => navigate(`/product?id=${artwork.id}`)}
                >
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
                    <img
                      src={artwork.image_urls?.[0]}
                      alt={artwork.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="mt-2">
                    <h3 className="font-semibold">{artwork.title}</h3>
                    {!isOwner && <p className="text-sm text-slate-600">{artwork.category}</p>}
                    <PriceDisplay cost={artwork.cost} />
                  </div>

                  {/* Toggle availability */}
                  {isOwner && (
                    <div className="mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={artwork.availability !== false}
                          readOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleClick(artwork);
                          }}
                        />
                        <span
                          className={`${artwork.availability !== false
                            ? "text-green-700"
                            : "text-red-700"
                            } font-semibold`}
                        >
                          Availability: {artwork.availability !== false ? "Yes" : "No"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmModal.visible}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
        message={`Are you sure you want to set availability to ${confirmModal.currentAvailability ? "No" : "Yes"
          }?`}
      />
    </div>
  );

}



