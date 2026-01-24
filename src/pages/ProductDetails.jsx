import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Share } from '@capacitor/share';
import { useRef } from "react";
import {
  Heart,
  Share2,
  X,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";
import ImageViewer from "../components/ImageViewer";

function StarRating({ value }) {
  const full = Math.floor(value || 0);
  const half = (value || 0) % 1 >= 0.25;

  return (
    <span className="inline-flex items-center gap-1">
      {[...Array(full)].map((_, i) => (
        <svg key={i} width={14} height={14} viewBox="0 0 20 20" fill="#F59E0B">
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
        </svg>
      ))}
      {half && (
        <svg width={14} height={14} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-grad">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <polygon
            fill="url(#half-grad)"
            points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7"
          />
        </svg>
      )}
      {[...Array(5 - full - (half ? 1 : 0))].map((_, i) => (
        <svg key={i} width={14} height={14} viewBox="0 0 20 20" fill="#E5E7EB">
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
        </svg>
      ))}
    </span>
  );
}

function ArtworkShareButton({ artworkId }) {
  const [copied, setCopied] = useState(false);
  const url = `https://scopebrush.vercel.app/#/product?id=${artworkId}`;

  const handleShare = async () => {
    // Capacitor native share (Android / iOS)
    if (window.Capacitor?.isNativePlatform()) {
      await Share.share({
        title: 'Check out this artwork',
        text: 'Have a look at this artwork on ScopeBrush',
        url,
        dialogTitle: 'Share Artwork',
      });
      return;
    }

    // Web Share API
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Check out this artwork', url });
      } catch { }
      return;
    }

    // Clipboard fallback
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
        ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}
      `}
    >
      <Share2 size={18} />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}


function PriceDisplay({ cost }) {
  const original = Math.round(cost * 1.15);

  return (
    <div className="text-sm md:text-base mt-1">
      <div className="text-xs text-slate-500">M.R.P</div>
      <span className="line-through text-slate-500 mr-1">₹{original}</span>
      <span className="text-green-600 font-medium mr-1">(15% off)</span>
      <span className="font-bold text-lg">₹{cost}</span>
    </div>
  );
}

/* ===========================================================
   MAIN PRODUCT PAGE
=========================================================== */

export default function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const id = params.get("id");

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [user, setUser] = useState(null);
  const [likedArtworks, setLikedArtworks] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [artistArtworks, setArtistArtworks] = useState([]);
  const [relatedArtworks, setRelatedArtworks] = useState([]);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  /* ===========================================================
       FETCH ARTWORK
  =========================================================== */
  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth?.user || null);

      if (!id) return navigate('/main-dashboard');
      setLoading(true);

      const { data, error } = await supabase
        .from("artworks")
        .select(`id,title,category,cost,description,material,image_urls,artist_id,
                availability,artists(id,name,avg_rating),video_url,liked_count,
                actual_length,actual_height`)
        .eq("id", id);

      if (!error) {
        setArtwork(Array.isArray(data) ? data[0] : data);
      }

      // preload user likes
      if (auth?.user) {
        const { data: u } = await supabase
          .from("user")
          .select("liked_artworks")
          .eq("id", auth.user.id);

        const liked = u?.[0]?.liked_artworks || [];
        setLikedArtworks(liked);
        setIsLiked(liked.includes(id));

        const { data: cartRow } = await supabase
          .from("cart")
          .select("id")
          .eq("user_id", auth.user.id)
          .eq("artwork_id", id);

        setInCart(cartRow?.length > 0);
      }

      if (data?.[0]?.category) {
        const { data: rel } = await supabase
          .from("artworks")
          .select("id,title,cost,image_urls,artist_id,artists(name,avg_rating)")
          .eq("category", data[0].category)
          .neq("id", id)
          .limit(12);
        setRelatedArtworks(rel || []);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  /* ===========================================================
      FETCH ARTIST ARTWORKS
  =========================================================== */
  useEffect(() => {
    async function loadArtist() {
      if (!artwork?.artist_id) return;
      const { data } = await supabase
        .from("artworks")
        .select("id,title,cost,image_urls")
        .eq("artist_id", artwork.artist_id)
        .neq("id", artwork.id)
        .limit(10);

      setArtistArtworks(data || []);
    }
    loadArtist();
  }, [artwork]);

  /* ===========================================================
      LIKE / CART ACTIONS
  =========================================================== */

  async function toggleLike(a) {
    if (!user) return alert("Please login to like artworks.");

    const currentlyLiked = likedArtworks.includes(a.id);
    const updated = currentlyLiked
      ? likedArtworks.filter((i) => i !== a.id)
      : [...likedArtworks, a.id];

    setIsLiked(!currentlyLiked);
    setLikedArtworks(updated);

    setArtwork((prev) => ({
      ...prev,
      liked_count: currentlyLiked ? prev.liked_count - 1 : prev.liked_count + 1,
    }));

    await supabase.from("user").update({ liked_artworks: updated }).eq("id", user.id);
    await supabase
      .from("artworks")
      .update({ liked_count: currentlyLiked ? a.liked_count - 1 : a.liked_count + 1 })
      .eq("id", a.id);
  }

  async function addToCart() {
    if (!user) return navigate("/user-login");

    await supabase.from("cart").insert([{ user_id: user.id, artwork_id: artwork.id }]);
    setInCart(true);
    alert("Added to cart!");
  }

  function buyNow() {
    if (!artwork.availability) return alert("Not available right now.");
    navigate('/order-process', {
      state: { artworkId: artwork.id, artistId: artwork.artist_id }
    });
  }

  /* ===========================================================
      LOADING + ERROR UI
  =========================================================== */
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-xl animate-pulse">
        Loading...
      </div>
    );

  if (!artwork)
    return (
      <div className="flex justify-center items-center h-screen text-xl text-red-500">
        Artwork not found.
      </div>
    );

  /* ===========================================================
      UI STARTS HERE
  =========================================================== */

  const images = Array.isArray(artwork.image_urls)
    ? artwork.image_urls
    : [artwork.image_urls];

  const current = images[idx];
  const isAvailable = !!artwork.availability;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">

        {/* LEFT: GALLERY */}
        <div className="bg-white border rounded-xl p-3">
          <div
            className="w-full h-72 md:h-96 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden cursor-zoom-in"
            onClick={() => setViewerOpen(true)}
          >
            {current ? (
              <img src={current} className="w-full h-full object-contain" />
            ) : (
              <div className="text-slate-500">No Image</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border ${idx === i ? "border-blue-500" : "border-slate-200"
                    }`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-lg md:text-2xl font-semibold">{artwork.title}</h1>

            {/* LIKE BUTTON */}
            <button
              onClick={() => toggleLike(artwork)}
              className="flex items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <Heart
                size={24}
                className={isLiked ? "text-red-500 fill-red-500" : "text-slate-400"}
              />
              <span className="text-sm">{artwork.liked_count || 0}</span>
            </button>
          </div>

          <div className="text-sm text-slate-600 mb-1">
            Category: <span className="font-medium">{artwork.category}</span>
          </div>

          <div className="text-sm text-slate-600 mb-1">
            Material: <span className="font-medium">{artwork.material || "N/A"}</span>
          </div>

          <div className="text-sm text-slate-600">
            Dimensions:{" "}
            <span className="font-medium">
              {artwork.actual_length} cm (L)
            </span>{" "}
            ×{" "}
            <span className="font-medium">
              {artwork.actual_height} cm (H)
            </span>
          </div>

          {/* ARTIST */}
          <div className="text-sm md:text-base mt-3 flex items-center gap-3">
            <button
              className="text-blue-600 hover:underline"
              onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}
            >
              {artwork.artists?.name}
            </button>
            <StarRating value={artwork.artists?.avg_rating} />
          </div>

          {/* PRICE */}
          <PriceDisplay cost={artwork.cost} />

          <p className="mt-2 text-sm md:text-base">
            Availability:{" "}
            <span className={isAvailable ? "text-green-600" : "text-red-600"}>
              {isAvailable ? "Yes" : "No"}
            </span>
          </p>

          <p className="mt-3 text-sm md:text-base leading-relaxed">
            {artwork.description}
          </p>

          {/* BUTTONS */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={buyNow}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Buy Now
            </button>

            {inCart ? (
              <button
                onClick={() => navigate("/cart")}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm"
              >
                View Cart
              </button>
            ) : (
              <button
                onClick={addToCart}
                className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm hover:bg-slate-300"
              >
                Add to Cart
              </button>
            )}

            {artwork.video_url && (
              <button
                onClick={() => setShowVideo(true)}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-50"
              >
                Creation Video
              </button>
            )}

            <button
              onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-slate-50"
            >
              Reviews
            </button>

            <ArtworkShareButton artworkId={artwork.id} />
          </div>
        </div>
      </div>

      {/* MORE FROM ARTIST */}
      <Section title="More from this Artist" items={artistArtworks} navigate={navigate} />

      {/* RELATED */}
      <Section title="Related Artworks" items={relatedArtworks} navigate={navigate} />

      {/* IMAGE VIEWER */}
      {viewerOpen && (
        <ImageViewer
          images={images}
          idx={idx}
          setIdx={setIdx}
          setViewerOpen={setViewerOpen}
          watermarkText={`@ScopeBrush • ${artwork.artists?.name}`}
        />
      )}

      {/* VIDEO */}
      {showVideo && (
        <VideoModal
          url={artwork.video_url}
          artist={artwork.artists?.name}
          close={() => setShowVideo(false)}
        />
      )}
    </div>
  );
}

/* ===========================================================
   SECTION COMPONENT (scrollable cards)
=========================================================== */

function Section({ title, items, navigate }) {
  if (!items.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-lg md:text-xl font-semibold mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {items.map((item) => {
          const img = Array.isArray(item.image_urls) ? item.image_urls[0] : item.image_urls;
          return (
            <div
              key={item.id}
              className="min-w-[160px] md:min-w-[200px] bg-white rounded-xl border border-slate-200 shadow hover:shadow-md transition snap-center cursor-pointer"
              onClick={() => navigate(`/product?id=${item.id}`)}
            >
              <div className="h-36 md:h-44 w-full rounded-t-xl overflow-hidden">
                <img src={img} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium truncate">{item.title}</h3>
                <p className="text-slate-600 font-semibold">₹{item.cost}</p>
                {item.artists && (
                  <p className="text-blue-600 text-xs mt-1">{item.artists.name}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===========================================================
   VIDEO MODAL
=========================================================== */

function VideoModal({ url, artist, close }) {
  const videoRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false); // ✅ needed

  /* ================= HELPERS ================= */
  const format = (t = 0) =>
    `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

  /* ================= EFFECTS ================= */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // ✅ FIXED VOLUME (runs once when modal opens)
    v.volume = 0.8;

    const onTime = () => setCurrent(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);

    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  /* ================= ACTIONS ================= */
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[3000] bg-black/70 flex items-center justify-center p-4"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-black rounded-xl overflow-hidden max-w-[90vw]"
      >
        {/* VIDEO */}
        <video
          ref={videoRef}
          src={url}
          playsInline
          webkit-playsinline="true"
          disablePictureInPicture
          className="max-h-[80vh] w-auto bg-black rounded-lg"
        />

        {/* WATERMARK */}
        <div
          className="
    pointer-events-none
    absolute left-2 top-1/2 -translate-y-1/2
    rotate-[-90deg]
    bg-white/60 backdrop-blur
    px-2.5 py-0.5
    rounded-full
    text-[9px] sm:text-[10px] md:text-[11px]
    font-semibold tracking-wide
    text-black
    select-none
    whitespace-nowrap
  "
        >
          @ScopeBrush • @{artist}
        </div>

        {/* CLOSE */}
        <button
          onClick={close}
          className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full"
        >
          ✕
        </button>

        {/* CONTROLS */}
        <div
          className="
    absolute bottom-3 left-1/2 -translate-x-1/2
    w-[92%]
    bg-black/55 backdrop-blur-md
    rounded-xl
    px-3 py-2
    shadow-lg
  "
        >
          {/* TOP ROW (always fits) */}
          <div className="flex items-center justify-between gap-3">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="text-white p-1.5 rounded-md hover:bg-white/10 active:scale-95 transition"
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Time */}
            <span className="text-[11px] text-white/90 tabular-nums whitespace-nowrap">
              {format(current)} / {format(duration)}
            </span>

            {/* Mute */}
            <button
              onClick={() => {
                const v = videoRef.current;
                v.muted = !v.muted;
                setMuted(v.muted);
              }}
              className="text-white p-1.5 rounded-md hover:bg-white/10 active:scale-95 transition"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* PROGRESS BAR (own row on mobile) */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={current}
            onChange={(e) => {
              const t = Number(e.target.value);
              videoRef.current.currentTime = t;
              setCurrent(t);
            }}
            className="
      mt-2
      w-full
      h-1
      accent-white
      cursor-pointer
    "
          />
        </div>
      </div>
    </div>
  );
}



