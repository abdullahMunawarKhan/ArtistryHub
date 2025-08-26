import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function StarRating({ value }) {
  const fullStars = Math.floor(value);
  const halfStar = value % 1 >= 0.25;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[...Array(fullStars)].map((_, i) => (
        <svg key={i} width={18} height={18}>
          <polygon points="9,1 11,6 17,6 12,10 14,16 9,12 4,16 6,10 1,6 7,6" style={{ fill: '#FFD700' }} />
        </svg>
      ))}
      {halfStar && (
        <svg width={18} height={18}>
          <defs>
            <linearGradient id="half-grad">
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#ccc" />
            </linearGradient>
          </defs>
          <polygon points="9,1 11,6 17,6 12,10 14,16 9,12" fill="url(#half-grad)" />
          <polygon points="9,12 4,16 6,10 1,6 7,6" fill="#ccc" />
        </svg>
      )}
      {[...Array(5 - fullStars - (halfStar ? 1 : 0))].map((_, i) => (
        <svg key={i} width={18} height={18}>
          <polygon points="9,1 11,6 17,6 12,10 14,16 9,12 4,16 6,10 1,6 7,6" fill="#ccc" />
        </svg>
      ))}
      <span style={{ marginLeft: 4, color: '#444', fontWeight: 500 }}>{value}</span>
    </span>
  );
}

function MainDashboard() {
  const navigate = useNavigate();
  const [tags] = useState([
    'Portrait', 'Landscape', 'Abstract', 'Watercolor',
    'Oil', 'Digital', 'Sketch', 'Modern', 'Classic', 'Calligraphy'
  ]);
  const [selectedTag, setSelectedTag] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchCart(user.id);
      }
    }
    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCart(session.user.id);
      else setCartItems([]);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchCart(userId) {
    const { data, error } = await supabase
      .from('cart')
      .select('artwork_id')
      .eq('user_id', userId);
    if (!error && data) {
      setCartItems(data.map(item => item.artwork_id));
    } else {
      setCartItems([]);
      console.error('Failed to fetch cart', error);
    }
  }

  useEffect(() => {
    async function fetchArtworks() {
      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, category, cost, image_urls, artist_id, artists (id, name), description, material, video_url');
      if (!error && data) {
        setArtworks(data);
      } else {
        setArtworks([]);
        console.error('Failed to fetch artworks', error);
      }
    }
    fetchArtworks();
  }, []);

  useEffect(() => {
    if (showModal && currentArtwork) {
      const imgs = currentArtwork.image_urls || [];
      if (imgs.length > 1) {
        const timer = setInterval(() => {
          setCarouselIndex(idx => (idx + 1) % imgs.length);
        }, 2000);
        return () => clearInterval(timer);
      }
    }
  }, [showModal, currentArtwork]);

  function openModal(artwork) {
    // Navigate to Product Details page instead of opening modal
    navigate(`/product?id=${artwork.id}`);
  }

  function openImageViewer(idx) {
    setViewerIndex(idx);
    setImageViewerOpen(true);
    setZoom(1);
  }

  function nextImage(images) {
    setViewerIndex(idx => (idx + 1) % images.length);
    setZoom(1);
  }

  function prevImage(images) {
    setViewerIndex(idx => (idx === 0 ? images.length - 1 : idx - 1));
    setZoom(1);
  }

  function zoomIn() {
    setZoom(z => Math.min(z + 0.25, 3));
  }

  function zoomOut() {
    setZoom(z => Math.max(z - 0.25, 1));
  }

  async function handleAddToCart(artwork) {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cartItems.includes(artwork.id)) {
      navigate('/cart');
      return;
    }
    const { error } = await supabase
      .from('cart')
      .insert([{ user_id: user.id, artwork_id: artwork.id, quantity: 1 }]);
    if (error) {
      alert('Failed to add to cart');
      console.error(error);
    } else {
      alert('Added to cart');
      setCartItems([...cartItems, artwork.id]);
    }
  }

  function handleBuy(artwork) {
    navigate('/order-process', { state: { artworkId: artwork.id, artistId: artwork.artist_id } });
  }

  return (
    <div className="px-4 py-8 bg-slate-50">
      {/* Filter section */}
      <div className="max-w-7xl mx-auto mb-6 sticky top-16 z-30">
        <div className="glass-card border border-slate-200/60 rounded-2xl px-4 py-3 shadow-construction">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Filter by Category</span>
            <span className="text-xs text-slate-500">Selected: <span className="font-semibold">{selectedTag || 'All'}</span></span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${selectedTag === '' ? 'bg-yellow-100 text-yellow-900 border-yellow-400 shadow-construction' : 'bg-white text-slate-700 border-slate-200 hover:border-yellow-300 hover:text-yellow-700'}`}
              onClick={() => setSelectedTag('')}
            >
              All
            </button>
            {tags.map(tag => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${active ? 'bg-yellow-100 text-yellow-900 border-yellow-400 shadow-construction' : 'bg-white text-slate-700 border-slate-200 hover:border-yellow-300 hover:text-yellow-700'}`}
                  onClick={() => setSelectedTag(active ? '' : tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Product grid */}  
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {artworks.filter(art => selectedTag === '' || art.category === selectedTag).length === 0 ? (
        <div className="col-span-full text-center py-20 text-gray-400">No products found</div>
        ) : (
          artworks
            .filter(art => selectedTag === '' || art.category === selectedTag)
            .map(artwork => {
            const images = Array.isArray(artwork.image_urls) ? artwork.image_urls : artwork.image_urls ? [artwork.image_urls] : [];
            const firstImage = images[0];
            const isInCart = cartItems.includes(artwork.id);
            return (
              <div key={artwork.id} className="bg-white rounded-lg shadow p-4 flex flex-col">

              {/* Image */}
              <div className="cursor-pointer bg-gray-100 rounded-lg h-48 flex items-center justify-center" onClick={() => openModal(artwork)}>
               {firstImage ? (
                  <img className="max-h-full max-w-full" src={firstImage} alt={artwork.title} />
                ) : (
                  <span className="text-gray-400">No Image</span>
                )}
              </div>

              {/* Title */}
              <div className="mt-2 font-bold text-lg">{artwork.title}</div>

              {/* More Info */}
              <button onClick={() => openModal(artwork)} className="mt-1 text-yellow-600 text-sm hover:underline">
                More Info
              </button>

              {/* Price */}
              <div className="mt-2 text-gray-700 font-semibold">₹{artwork.cost}</div>

              {/* Artist name & Reviews */}
              <div className="mt-3 flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}>
                <span className="text-blue-600 font-semibold">{artwork.artists?.name || 'Artist'}</span>
                  <StarRating value={4.5} />
              </div>

              {/* Order and Add to Cart */}
              <div className="mt-auto flex gap-2">
                {isInCart ? (
                  <button onClick={() => navigate('/cart')} className="flex-grow bg-yellow-500 text-white rounded px-4 py-2 hover:bg-yellow-600">
                    Check Cart
                  </button>
                ) : (
                  <button onClick={() => handleAddToCart(artwork)} className="flex-grow bg-yellow-400 text-white rounded px-4 py-2 hover:bg-yellow-500">
                    Add to Cart
                  </button>
                )}
                  <button onClick={() => handleBuy(artwork)} className="flex-grow border border-yellow-500 text-yellow-600 rounded px-4 py-2 hover:bg-yellow-100">
                  Buy Now
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>
  </div>
  );
}

export default MainDashboard;
