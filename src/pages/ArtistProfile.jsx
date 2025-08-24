import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

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
        .select("id, title, category, cost, image_urls")
        .eq("artist_id", artistId);
      setArtworks(data || []);
      setLoadingArtworks(false);
    }
    fetchArtworks();
  }, [artistId]);

  if (loadingArtist) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold">Loading artist info...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl font-semibold text-red-500">Artist not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-pink-50 pt-8 px-4 flex flex-col items-center">
      {/* Artist info card at top, full width, side-by-side on desktop */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row md:items-center gap-6 mb-10">
        {/* Profile Image */}
        <div className="flex justify-center md:justify-start md:w-1/4">
          <img
            src={artist.profile_image_url || "/default-profile.png"}
            alt={artist.name}
            className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-yellow-400 object-cover"
          />
        </div>
        {/* Artist details */}
        <div className="flex-1 flex flex-col justify-center px-2">
          <h2 className="text-2xl font-extrabold text-yellow-700 mb-2">
            Location : {artist.location}
          </h2>
          <p className="text-base font-medium text-gray-700 mb-1">
            Experience: {artist.experience} yr{artist.experience !== 1 && "s"}
          </p>
          {isOwner && (
            <>
              <h3 className="text-lg font-bold mb-1">{artist.name}</h3>
              <p className="text-gray-500 text-sm mb-1">Mobile: {artist.mobile}</p>
              <p className="text-gray-500 text-sm mb-3">Email: {artist.email}</p>
              <button
                onClick={() => navigate(`/register?id=${artist.id}`)}
                className="mt-1 w-fit py-2 px-5 rounded-lg font-semibold text-white bg-yellow-400 hover:bg-yellow-500 text-sm"
              >Edit Info</button>
            </>
          )}
        </div>
      </div>

      {/* Artworks section */}
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-pink-600">
            Artworks by this Artist
          </h1>
          {isOwner && (
            <button
              onClick={() => navigate("/upload-work")}
              className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-6 rounded-lg font-semibold shadow-md text-sm"
            >
              Add More Artwork
            </button>
          )}
        </div>
        {loadingArtworks ? (
          <div className="text-center text-gray-500 mt-10">Loading artworks...</div>
        ) : artworks.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">No artworks uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center w-full max-w-xs">
                <img
                  src={artwork.image_urls?.[0] || "/default-artwork.png"}
                  alt={artwork.title}
                  className="w-full h-44 object-cover rounded mb-2"
                />
                <h3 className="font-semibold text-base mb-1">{artwork.title}</h3>
                <div className="text-yellow-700 font-bold mb-1">₹{artwork.cost}</div>
                <div className="capitalize text-gray-600 text-xs">{artwork.category}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
