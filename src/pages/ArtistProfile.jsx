import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

function StarRating({ value }) {
  const full = Math.floor(value || 0);
  const half = (value || 0) % 1 >= 0.25;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[...Array(full)].map((_, i) => (
        <svg key={`f-${i}`} width={16} height={16} viewBox="0 0 20 20" fill="#F59E0B"><polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7"/></svg>
      ))}
      {half && (
        <svg width={16} height={16} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-grad-ap">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" fill="url(#half-grad-ap)"/>
        </svg>
      )}
      {[...Array(5 - full - (half ? 1 : 0))].map((_, i) => (
        <svg key={`e-${i}`} width={16} height={16} viewBox="0 0 20 20" fill="#E5E7EB"><polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7"/></svg>
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
  const [loadingArtist, setLoadingArtist] = useState(true);
  const [loadingArtworks, setLoadingArtworks] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ visible: false, artworkId: null, currentAvailability: true });
  const [myEmail, setMyEmail] = useState('');

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
    }
    fetchArtistAndUser();
  }, [artistId, navigate]);

  useEffect(() => {
    if (!artistId) return;
    async function fetchArtworks() {
      setLoadingArtworks(true);
      const { data } = await supabase
        .from("artworks")
        .select("id, title, category, cost, image_urls, availability")
        .eq("artist_id", artistId);
      setArtworks(data || []);
      setLoadingArtworks(false);
    }
    fetchArtworks();
  }, [artistId]);

  // Toggle Availability - open confirm modal
  const onToggleClick = (artworkId, currentAvailability) => {
    setConfirmModal({ visible: true, artworkId, currentAvailability });
  };

function handleEditProduct(artwork) {
  if (!artwork?.id) {
    alert('Invalid artwork for editing');
    return;
  }
  navigate(`/upload-work?id=${artwork.id}`);
}

  // Confirm availability change and update DB + local state
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
    <>
      <div className="max-w-5xl mx-auto my-8 p-6 bg-white rounded-2xl shadow-construction">
        {/* Top profile card - enhanced horizontal layout */}
<div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-3xl p-8 shadow-xl border border-white/50 backdrop-blur-sm">
  <div className="flex gap-8 items-start">
    {/* Profile image with enhanced styling */}
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <img
          src={artist.profile_image_url}
          alt={artist.name}
          className="w-44 h-44 rounded-full object-cover shadow-2xl ring-4 ring-white/80 ring-offset-4 ring-offset-transparent"
        />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
      </div>
      
      {/* Rating section with enhanced design */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/60 text-center min-w-[180px]">
        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Artist Rating</p>
        <div className="flex justify-center mb-2">
          <StarRating value={4.5} />
        </div>
        <p className="text-xs text-slate-500 font-medium">4.5 out of 5 stars</p>
      </div>
    </div>

    {/* Artist information with enhanced layout */}
    <div className="flex-1 space-y-6">
      {/* Name and main info */}
      <div className="space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-900 bg-clip-text text-transparent leading-tight">
          {artist.name}
        </h1>
        
        {/* Location with icon */}
        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{artist.location}</span>
        </div>
      </div>

      {/* Contact info for owners */}
      {isOwner && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40 space-y-2">
          <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider mb-3">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Mobile</p>
                <p className="font-semibold text-slate-700">{artist.mobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Email</p>
                <p className="font-semibold text-slate-700 truncate">{artist.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action button for owners */}
      {isOwner && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => navigate(`/register?edit=1&id=${artist.id}`)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Edit Profile
          </button>
        </div>
      )}
    </div>
  </div>
</div>

        {/* Artworks section header */}
        <div className="flex items-center justify-between mt-10 mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {isOwner ? 'Your Artworks' : 'Artworks by this artist'}
          </h2>
          {isOwner && (
            <button onClick={() => navigate('/upload-work')} className="btn-outline px-4 py-2">Upload Artwork</button>
          )}
        </div>

        {/* Artworks grid */}
        {loadingArtworks ? (
          <p className="text-slate-600">Loading artworks...</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {artworks.length === 0 && (
              <p className="text-slate-600">No artworks found.</p>
            )}
            {artworks.map(artwork => (
              <div
                key={artwork.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition p-3 cursor-pointer relative"
                onClick={() => navigate(`/product?id=${artwork.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/product?id=${artwork.id}`); }}
              >
                {isOwner && (
                  <button
                    className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded"
                    onClick={(e) => {
                    e.stopPropagation();
                    handleEditProduct(artwork);
                    }}>
                    Edit
                  </button>
                )}
                <div className="w-full h-40 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden">
                  <img
                    src={artwork.image_urls && artwork.image_urls[0]}
                    alt={artwork.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-slate-900 text-base">{artwork.title}</h3>
                  {!isOwner && (
                    <p className="italic text-slate-600 text-sm">{artwork.category}</p>
                  )}
                  <p className="font-bold text-slate-900">₹{artwork.cost}</p>
                </div>
                {isOwner && (
                  <div className="mt-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={artwork.availability === false ? false : true}
                        readOnly
                        onClick={(e) => { e.stopPropagation(); onToggleClick(artwork.id, artwork.availability === false ? false : true); }}
                        onKeyDown={(e) => { e.stopPropagation(); }}
                      />
                      <span className={`${(artwork.availability === false ? false : true) ? 'text-green-700' : 'text-red-700'} font-semibold`}>
                        Availability: {(artwork.availability === false ? false : true) ? 'Yes' : 'No'}
                      </span>
                    </label>
                     
                   
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        visible={confirmModal.visible}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
        message={`Are you sure you want to set availability to ${confirmModal.currentAvailability ? 'No' : 'Yes'}?`}
      />
    </>
  );
}


