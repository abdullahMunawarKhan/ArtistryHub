import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

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
            <linearGradient id="half-grad-pd">
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#E5E7EB" />
            </linearGradient>
          </defs>
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" fill="url(#half-grad-pd)"/>
        </svg>
      )}
      {[...Array(5 - full - (half ? 1 : 0))].map((_, i) => (
        <svg key={`e-${i}`} width={16} height={16} viewBox="0 0 20 20" fill="#E5E7EB"><polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7"/></svg>
      ))}
    </span>
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
  const [inCart, setInCart] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    async function fetchArtwork() {
      const { data: auth } = await supabase.auth.getUser();
      setUser(auth?.user || null);
      if (!artworkId) {
        navigate('/main-dashboard');
        return;
      }
      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, category, cost, description, material, image_urls, artist_id, availability, artists (id, name), video_url')
        .eq('id', artworkId)
        .single();
      if (!error) setArtwork(data);
      setLoading(false);

      if (auth?.user) {
        const { data: cartRows } = await supabase
          .from('cart')
          .select('id')
          .eq('user_id', auth.user.id)
          .eq('artwork_id', artworkId)
          .limit(1)
          .maybeSingle();
        setInCart(!!cartRows);
      }
    }
    fetchArtwork();
  }, [artworkId, navigate]);

  if (loading) {
    return <div className="max-w-5xl mx-auto p-6">Loading...</div>;
  }
  if (!artwork) {
    return <div className="max-w-5xl mx-auto p-6">Artwork not found.</div>;
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

  return (
    <div className="max-w-5xl mx-auto p-6">
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
          <h1 className="text-2xl font-bold text-slate-900">{artwork.title}</h1>
          <div className="text-slate-600">Category: {artwork.category}</div>
          <div className="text-slate-600">Material: {artwork.material || 'N/A'}</div>
          <div className="mt-2 text-slate-700 flex items-center gap-3">
            <span>
              Artist: <button className="text-blue-600 hover:text-blue-700 font-semibold" onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}>{artwork.artists?.name ?? 'Artist'}</button>
            </span>
            <StarRating value={4.5} />
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

          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-primary px-5 py-2" onClick={buyNow}>Buy Now</button>
            {inCart ? (
              <button className="btn-secondary px-5 py-2" onClick={() => navigate('/cart')}>View Cart</button>
            ) : (
              <button className="btn-secondary px-5 py-2" onClick={addToCart}>Add to Cart</button>
            )}
            {artwork.video_url && (
              <button className="btn-outline px-5 py-2" onClick={() => setShowVideo(true)}>See Creation Video</button>
            )}
            <button className="btn-outline px-5 py-2" onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}>View Reviews</button>
          </div>
        </div>
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
            <video src={artwork.video_url} controls className="w-full max-h-[70vh] rounded-xl shadow-construction" />
            
            <button className="absolute top-3 right-4 text-blue-600 text-2xl font-bold" onClick={() => setShowVideo(false)}>&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}


