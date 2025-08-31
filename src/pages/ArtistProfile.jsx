import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

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

function ConfirmationModal({ visible, onConfirm, onCancel, message }) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        background: "rgba(0,0,0,0.6)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
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
  const [myEmail, setMyEmail] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [userRole, setUserRole] = useState("user");

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
        .select("id, name, mobile, email, profile_image_url, experience, location, user_id")
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
      const myUserId = userData?.user?.id;
      setMyEmail(userData?.user?.email || '');
      setIsOwner(myUserId && myUserId === artistData.user_id);

      // fetch role
      if (userData?.user) {
        const { data: roleData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userData.user.id)
          .single();
        if (roleData?.role) setUserRole(roleData.role);
      }

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
        .select("id, title, category, cost, image_urls, availability, rating, review, reviewer_email, shipment_status")
        .eq("artist_id", artistId);

      setArtworks(data || []);
      setLoadingArtworks(false);
      // force availability = false for sold items
      if (data) {
        for (const art of data) {
          if (art.shipment_status === "confirm" && art.availability !== false) {
            await supabase.from("artworks").update({ availability: false }).eq("id", art.id);
            art.availability = false;
          }
        }
      }

      setArtworks(data || []);
      setLoadingArtworks(false);
      if (data) {
        const delivered = data.filter(a => a.shipment_status === "delivered" && typeof a.rating === "number");
        if (delivered.length > 0) {
          const avg = delivered.reduce((sum, a) => sum + a.rating, 0) / delivered.length;
          setAverageRating(avg);
        }
        const revs = delivered.map(a => ({
          email: a.reviewer_email,
          rating: a.rating,
          review: a.review,
        }));
        setReviews(revs);
      }
    }
    fetchArtworks();
  }, [artistId]);
  function handleEditProduct(artwork) {
    if (!artwork?.id) {
      alert('Invalid artwork for editing');
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
      const { error } = await supabase
        .from("artworks")
        .update({ availability: newAvailability })
        .eq("id", confirmModal.artworkId);

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
    return <div>Loading artist information...</div>;
  }

  return (
    <div className="flex gap-6 max-w-7xl mx-auto p-6">
      {/* LEFT: ARTWORKS */}
      <div className="w-3/4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {isOwner ? "Your Artworks" : "Artworks by this artist"}
          </h2>
          <div className="flex space-x-2">
            {userRole === "artist" && (
              <button
                onClick={() => navigate("/upload-work")}
                className="px-4 py-2 border rounded bg-blue-500 text-white"
              >
                Add New Artwork
              </button>
            )}
            {(userRole === "artist" || userRole === "admin") && (
              <button
                onClick={() => navigate("/artist-dashboard")}
                className="px-4 py-2 border rounded bg-indigo-500 text-white"
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
            {artworks.map(artwork => (
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
                  <p className="font-bold">₹{artwork.cost}</p>
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
                          onToggleClick(artwork.id, artwork.availability !== false);
                        }}
                      />
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

      {/* RIGHT: ARTIST CARD */}
      <div className="w-1/4 bg-white rounded-2xl shadow-lg p-6 flex flex-col h-fit">
        {/* Edit profile */}
        {isOwner && (
          <div className="flex justify-end mb-3">
            <button
              onClick={() => navigate(`/register?edit=1&id=${artist.id}`)}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
            >
              Edit
            </button>
          </div>
        )}

        {/* Profile image */}
        <img
          src={artist.profile_image_url}
          alt={artist.name}
          className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
        />

        {/* Rating */}
        <div className="text-center mb-4">
          <StarRating value={averageRating} />
          <p className="text-xs text-slate-500">
            {averageRating > 0 ? `${averageRating.toFixed(2)} / 5` : "No ratings yet"}
          </p>
        </div>

        {/* Info */}
        <h2 className="text-lg font-bold text-center">{artist.name}</h2>
        <p className="text-sm text-slate-600 text-center">{artist.location}</p>

        {isOwner && (
          <div className="mt-3 text-sm">
            <p><strong>Mobile:</strong> {artist.mobile}</p>
            <p><strong>Email:</strong> {artist.email}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-3">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews yet.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {reviews.map((rev, i) => (
                <div key={i} className="border rounded-md p-2 text-sm">
                  <StarRating value={rev.rating} />
                  <p className="mt-1">{rev.review}</p>
                  {isOwner && (
                    <p className="text-xs text-slate-500 mt-1">By: {rev.email}</p>
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


