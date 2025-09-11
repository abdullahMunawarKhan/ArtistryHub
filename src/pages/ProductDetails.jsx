import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function StarRating({ value }) {
  const full = Math.floor(value || 0);
  const half = (value || 0) % 1 >= 0.25;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[...Array(full)].map((_, i) => (
        <svg key={`f-${i}`} width={16} height={16} viewBox="0 0 20 20" fill="#F59E0B"><polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" /></svg>
      ))}
      {half && (
        <svg width={16} height={16} viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-grad-pd">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" fill="url(#half-grad-pd)" />
        </svg>
      )}
      {[...Array(5 - full - (half ? 1 : 0))].map((_, i) => (
        <svg key={`e-${i}`} width={16} height={16} viewBox="0 0 20 20" fill="#E5E7EB"><polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" /></svg>
      ))}
    </span>
  );
}
function ArtworkShareButton({ artworkId }) {
  const [copied, setCopied] = useState(false);
  const artworkUrl = `${window.location.origin}/#/product-details?id=${artworkId}`;


  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this artwork',
          text: 'Take a look at this artwork!',
          url: artworkUrl,
        });
      } catch (err) {
        console.error('Share canceled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(artworkUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed', err);
        alert(`Could not copy link. Please copy manually: ${artworkUrl}`);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow transition text-white
        ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
      aria-label="Share Artwork"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 8a3 3 0 00-6 0v8a3 3 0 006 0V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
      </svg>
      {copied ? 'Link Copied!' : 'Share'}
    </button>
  );
}

export default function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const artworkId = params.get('id');

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [user, setUser] = useState(null);
  const [likedArtworks, setLikedArtworks] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showVideo, setShowVideo] = useState(false);
  const [artistArtworks, setArtistArtworks] = useState([]);
  const [relatedArtworks, setRelatedArtworks] = useState([]);


  useEffect(() => {
    async function fetchArtwork() {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth?.user || null);
      if (!artworkId) {
        navigate('/main-dashboard');
        return;
      }
      setLoading(true); // ensure loading is set at start

      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, category, cost, description, material, image_urls, artist_id, availability, artists (id, name), video_url, liked_count, actual_length, actual_height')
        .eq('id', artworkId)


      if (!error) {
        if (!error) {
          setArtwork(Array.isArray(data) ? data[0] : data);
        } else {
          setArtwork(null);
        }

      } else {
        // Optional: handle error for debugging or user hint
        console.error("Error fetching artwork:", error);
        setArtwork(null);
      }
      setLoading(false);

      if (auth?.user) {
        // Fetch user's liked artworks
        const { data: userData } = await supabase
          .from('user')
          .select('liked_artworks')
          .eq('id', auth.user.id)
          .single();

        const liked = userData?.liked_artworks || [];
        setLikedArtworks(liked);
        setIsLiked(liked.includes(artworkId));

        const { data: cartRows } = await supabase
          .from('cart')
          .select('id')
          .eq('user_id', auth.user.id)
          .eq('artwork_id', artworkId)
          .limit(1)
          .maybeSingle();
        setInCart(!!cartRows);
      }
      if (data?.category) {
        const { data: related } = await supabase
          .from("artworks")
          .select("id, title, cost, image_urls, artist_id, artists(name)")
          .eq("category", data.category)
          .neq("id", artworkId)   // exclude current artwork
          .limit(12);

        setRelatedArtworks(related || []);
      }

    }
    fetchArtwork();
  }, [artworkId, navigate]);


  useEffect(() => {
    async function fetchArtistArtworks() {
      if (!artwork?.artist_id) return;

      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, cost, image_urls')
        .eq('artist_id', artwork.artist_id)
        .neq('id', artwork.id) // exclude current artwork
        .limit(10);

      if (!error) {
        setArtistArtworks(data || []);
      }
    }
    fetchArtistArtworks();
  }, [artwork]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-2xl font-semibold text-gray-700 animate-pulse">
      Loading...</div>;
  }
  if (!artwork) {
    return <div className="flex justify-center items-center h-screen text-2xl font-semibold text-gray-700 animate-pulse">Artwork not found.</div>;
  }

  const images = Array.isArray(artwork.image_urls) ? artwork.image_urls : (artwork.image_urls ? [artwork.image_urls] : []);
  const current = images[idx];
  const isAvailable = !(
    artwork.availability === false ||
    artwork.availability === 0 ||
    artwork.availability === 'false' ||
    artwork.availability === 'False' ||
    artwork.availability === 'NO' ||
    artwork.availability === 'No'
  );

  async function addToCart() {
    if (!user) {
      navigate('/user-login');
      return;
    }
    const { error } = await supabase
      .from('cart')
      .insert([{ user_id: user.id, artwork_id: artwork.id, quantity: 1 }]);
    if (!error) {
      setInCart(true);
      alert('Added to cart!');
    } else {
      alert('Error adding to cart');
    }
  }


  function buyNow() {
    if (artwork && !isAvailable) {
      alert('This artwork is currently not available for ordering.');
      return;
    }
    navigate('/order-process', { state: { artworkId: artwork.id, artistId: artwork.artist_id } });
  }
  async function toggleLike() {
    if (!user) {
      alert('Please log in to use the like feature.');
      return;
    }

    // Compute new liked_artworks array and new liked_count
    const isNowLiked = !isLiked;
    const updatedLikedArtworks = isNowLiked
      ? [...likedArtworks, artwork.id]
      : likedArtworks.filter(id => id !== artwork.id);

    const newLikedCount = (artwork.liked_count || 0) + (isNowLiked ? 1 : -1);

    try {
      // 1. Update user's liked_artworks
      const { error: userErr } = await supabase
        .from('user')
        .update({ liked_artworks: updatedLikedArtworks })
        .eq('id', user.id);
      if (userErr) throw userErr;

      // 2. Update artwork's liked_count
      const { error: artErr } = await supabase
        .from('artworks')
        .update({ liked_count: newLikedCount })
        .eq('id', artwork.id);
      if (artErr) throw artErr;

      // 3. Reflect changes in local state
      setLikedArtworks(updatedLikedArtworks);
      setIsLiked(isNowLiked);
      setArtwork({ ...artwork, liked_count: newLikedCount });
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update like status. Please try again.');
    }
  }



  return (
    <div className="min-h-[90vh] max-w-5xl mx-auto p-6 flex flex-col items-center">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="w-full h-80 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setViewerOpen(true)}>
            {current ? (
              <img src={current} alt={artwork.title} className="w-full h-full object-contain" />
            ) : (
              <div className="text-slate-500">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`w-16 h-16 rounded-lg overflow-hidden border ${i === idx ? 'border-yellow-400' : 'border-slate-200'}`}>
                  <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{artwork.title}</h1>
            <div className="flex items-center gap-2">


              <button
                onClick={toggleLike}
                onDoubleClick={toggleLike}
                className="flex items-center justify-center p-0 ml-2 cursor-pointer transition-all duration-200 active:scale-95"
                aria-label="Like button"
                title={isLiked ? 'Unlike' : 'Like'}
                style={{ width: 40, height: 40 }}
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill={isLiked ? 'red' : 'none'}
                  stroke={isLiked ? 'red' : '#a1a1aa'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21s-1.45-1.34-6-5.71C2.42 13 2 10.36 4.24 8.61c2.27-1.76 5.23-.62 6.20 1.6.97-2.22 3.93-3.36 6.2-1.6C22 10.36 21.58 13 18 15.29c-4.55 4.37-6 5.71-6 5.71z" />
                </svg>
                <span className="ml-1 text-sm font-medium">
                  {artwork.liked_count ?? 0}
                </span>

              </button>
            </div>

          </div>

          <div className="text-slate-600">Category: {artwork.category}</div>
          <div className="text-slate-600">Material: {artwork.material || 'N/A'}</div>
          <div className="text-slate-600">
            Dimensions: <span className="font-medium">{artwork.actual_length ?? 'N/A'} cm (L)</span> × <span className="font-medium">{artwork.actual_height ?? 'N/A'} cm (H)</span>
          </div>

          <div className="mt-2 text-slate-700 flex items-center gap-3">
            <span>
              Artist: <button className="text-blue-600 hover:text-blue-700 font-semibold" onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}>{artwork.artists?.name ?? 'Artist'}</button>
            </span>
            {/* Star Rating */}
            <div className="mb-4">
              <StarRating value={artwork.avg_rating ?? 0} />
            </div>
          </div>
          <p className="text-xl font-bold mt-2">₹{artwork.cost}</p>
          <p className="mt-1 text-slate-700">
            Availability: {isAvailable ? (
              <span className="font-semibold text-green-700">Yes</span>
            ) : (
              <span className="font-semibold text-red-700">No</span>
            )}
          </p>
          <p className="mt-3 text-slate-700">{artwork.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn-primary px-5 py-2" onClick={buyNow}>Buy Now</button>
            {inCart ? (
              <button className="btn-secondary px-5 py-2" onClick={() => navigate('/cart')}>View Cart</button>
            ) : (
              <button className="btn-secondary px-5 py-2" onClick={addToCart}>Add to Cart</button>
            )}
            <div className="flex flex-col items-center">
              {artwork.video_url && (
                <button className="btn-outline px-5 py-2" onClick={() => setShowVideo(true)}>See Creation Video</button>
              )}
            </div>
            <button className="btn-outline px-5 py-2" onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}>View Reviews</button>
            <ArtworkShareButton artworkId={artwork.id} />
          </div>

        </div>

      </div>

      {/* See More by This Artist */}
      <div className="mt-10 w-full">
        <h2 className="text-xl font-semibold mb-3">See more artwork by this artist</h2>
        {artistArtworks.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {artistArtworks.map((item) => {
              const img = Array.isArray(item.image_urls) ? item.image_urls[0] : item.image_urls;
              return (
                <div
                  key={item.id}
                  className="min-w-[200px] bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition"
                  onClick={() => navigate(`/product-details?id=${item.id}`)}
                >
                  <div className="w-full h-40 rounded-t-xl overflow-hidden">
                    <img src={img} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-slate-900 truncate">{item.title}</h3>
                    <p className="text-slate-600 font-semibold">₹{item.cost}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 italic">No other artworks available.</p>
        )}
      </div>
      {/* Related Artworks */}
      <div className="mt-10 w-full">
        <h2 className="text-xl font-semibold mb-3">See related artworks</h2>
        {relatedArtworks.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {relatedArtworks.map((item) => {
              const img = Array.isArray(item.image_urls) ? item.image_urls[0] : item.image_urls;
              return (
                <div
                  key={item.id}
                  className="min-w-[200px] bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition"
                >
                  {/* Image clickable */}
                  <div
                    className="w-full h-40 rounded-t-xl overflow-hidden"
                    onClick={() => navigate(`/product-details?id=${item.id}`)}
                  >
                    <img src={img} alt={item.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="p-3">
                    {/* Title clickable */}
                    <h3
                      className="text-sm font-medium text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/product-details?id=${item.id}`)}
                    >
                      {item.title}
                    </h3>

                    {/* Cost clickable */}
                    <p
                      className="text-slate-600 font-semibold cursor-pointer hover:text-blue-600"
                      onClick={() => navigate(`/product-details?id=${item.id}`)}
                    >
                      ₹{item.cost}
                    </p>

                    {/* Artist clickable */}
                    <p
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 cursor-pointer"
                      onClick={() => navigate(`/artist-profile?id=${item.artist_id}`)}
                    >
                      {item.artists?.name ?? "Unknown Artist"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500 italic">No related artworks found.</p>
        )}
      </div>



      {/* Image Viewer Modal */}
      {viewerOpen && (
        <div className="fixed inset-0 bg-black/90 z-[20000] flex items-center justify-center p-4 select-none" onClick={() => setViewerOpen(false)}>
          <div className="relative max-w-[95vw] max-h-[90vh] flex gap-3" onClick={(e) => e.stopPropagation()}>
            {/* Sidebar thumbnails */}
            {images.length > 1 && (
              <div className="hidden md:flex flex-col gap-2 pr-2 overflow-y-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => { setIdx(i); setZoom(1); }} className={`w-16 h-16 rounded overflow-hidden border ${i === idx ? 'border-yellow-400' : 'border-slate-500/40'}`}>
                    <img src={img} alt={`side-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="relative">
              <img src={current} alt={`large-${idx}`} className="max-w-[80vw] max-h-[80vh] object-contain rounded" style={{ transform: `scale(${zoom})`, transition: 'transform .2s' }} />
              {/* Watermark */}
              <div className="absolute top-4 left-4 pointer-events-none select-none"
                style={{
                  background: "rgba(255,255,255,0.65)",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "18px",
                  color: "#333",
                  textShadow: "0 2px 8px rgba(0,0,0,0.13)",
                  zIndex: 15,
                  whiteSpace: "nowrap",
                }}
              >
                @{`ScopeBrush`} &nbsp; @{artwork.artists?.name}
              </div>

              <button className="absolute top-1/2 -translate-y-1/2 left-2 bg-blue-600 text-white rounded-full w-8 h-8 font-bold" onClick={() => { setIdx(i => (i === 0 ? images.length - 1 : i - 1)); setZoom(1); }}>&lt;</button>
              <button className="absolute top-1/2 -translate-y-1/2 right-2 bg-blue-600 text-white rounded-full w-8 h-8 font-bold" onClick={() => { setIdx(i => (i + 1) % images.length); setZoom(1); }}>&gt;</button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 px-6 py-2 rounded-xl flex gap-3 items-center">
                <button className={`font-bold text-lg px-2 rounded bg-slate-200 ${zoom > 1 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - 0.25))}>-</button>
                <span className="font-bold text-base">{(zoom * 100).toFixed(0)}%</span>
                <button className={`font-bold text-lg px-2 rounded bg-slate-200 ${zoom < 3 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} disabled={zoom >= 3} onClick={() => setZoom(z => Math.min(3, z + 0.25))}>+</button>
              </div>
              <button className="absolute top-2 right-2 text-white text-3xl" onClick={() => setViewerOpen(false)}>&times;</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideo && artwork.video_url && (
        <div className="fixed inset-0 bg-slate-900/90 z-[30000] flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
          <div className="relative bg-white rounded-2xl p-4 min-w-[320px] max-w-[96vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <video src={artwork.video_url} controls autoPlay className="w-full max-h-[70vh] rounded-xl shadow-construction" />
            {/* Watermark */}
            <div className="absolute top-4 left-4 pointer-events-none select-none"
              style={{
                background: "rgba(255,255,255,0.65)",
                padding: "6px 16px",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "18px",
                color: "#333",
                textShadow: "0 2px 8px rgba(0,0,0,0.13)",
                zIndex: 15,
                whiteSpace: "nowrap",
              }}
            >
              @{`ScopeBrush`} &nbsp; @{artwork.artists?.name}
            </div>
            <button className="absolute top-3 right-4 text-blue-600 text-2xl font-bold" onClick={() => setShowVideo(false)}>&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
