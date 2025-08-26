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
        {/* Top profile card - horizontal */}
        <div className="flex gap-6 items-center">
          <img
            src={artist.profile_image_url}
            alt={artist.name}
            className="w-36 h-36 rounded-full object-cover shadow-md"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900 m-0">{artist.name}</h1>
              <StarRating value={4.5} />
            </div>
            <p className="text-slate-600 mt-1">
              Location : {artist.location}
            </p>
            {isOwner ? (
              <>
                <p className="text-slate-700"><b>Mobile:</b> {artist.mobile}</p>
                <p className="text-slate-700"><b>Email:</b> {artist.email}</p>
              </>
            ) : null}
            {isOwner && (
              <div className="flex gap-3 mt-3 flex-wrap">
                
                <button
                  onClick={() => navigate(`/register?edit=1&id=${artist.id}`)}
                  className="btn-secondary px-4 py-2"
                >
                  Edit Profile
                </button>
              </div>
            )}
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
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition p-3 cursor-pointer"
                onClick={() => navigate(`/product?id=${artwork.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/product?id=${artwork.id}`); }}
              >
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


