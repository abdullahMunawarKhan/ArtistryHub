import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function StarRating({ value }) {
  const fullStars = Math.floor(value);
  const halfStar = value % 1 >= 0.25;

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {halfStar && (
        <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0v15z" />
        </svg>
      )}
      {[...Array(5 - fullStars - (halfStar ? 1 : 0))].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      <span className="text-sm text-gray-600 ml-1">{value}</span>
    </div>
  );
}

function MainDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const navigate = useNavigate();

  const [tags] = useState([
    'Portrait', 'Landscape', 'Abstract', 'Watercolor', 'Oil',
    'Digital', 'Sketch', 'Modern', 'Classic', 'Calligraphy',
  ]);

  const [selectedTag, setSelectedTag] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [user, setUser] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentArtwork, setCurrentArtwork] = useState(null);

  // Fetch logged-in user profile and cart items
  useEffect(() => {
    async function fetchUserAndProfile() {
      setLoadingProfile(true);
      
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        // Allow visitors to view the page without login
        if (!authUser) {
          console.log('No authenticated user, allowing guest access');
          return;
        }

        console.log('Authenticated user found:', authUser.id);
        setUser(authUser);

        const { data: profileData, error: profileError } = await supabase
          .from('user')
          .select('id, email, role')
          .eq('id', authUser.id)
          .single();

        if (profileError || !profileData) {
          console.error('Profile fetch error:', profileError);
          // Don't return here, let the user continue as guest
          return;
        }

        console.log('Profile fetched successfully:', profileData);
        setUserProfile(profileData);
        
        // Fetch cart items
        await fetchCart(authUser.id);
        
      } catch (error) {
        console.error('Error in fetchUserAndProfile:', error);
      } finally {
        // Always set loading to false, regardless of success or error
        setLoadingProfile(false);
      }
    }

    fetchUserAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchCart(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setCartItems([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  async function fetchCart(userId) {
    try {
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
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    }
  }

  // Fetch artworks
  useEffect(() => {
    async function fetchArtworks() {
      try {
        const { data, error } = await supabase
          .from('artworks')
          .select('id, title, category, cost, image_urls, artist_id, artists (id, name), description, material, video_url');

        if (!error && data) {
          setArtworks(data);
        } else {
          setArtworks([]);
          console.error('Failed to fetch artworks', error);
        }
      } catch (error) {
        console.error('Error fetching artworks:', error);
        setArtworks([]);
      }
    }

    fetchArtworks();
  }, []);

  function openModal(artwork) {
    navigate(`/product?id=${artwork.id}`);
  }

  async function handleAddToCart(artwork) {
    if (!user) {
      navigate('/user-login');
      return;
    }

    if (cartItems.includes(artwork.id)) {
      navigate('/cart');
      return;
    }

    try {
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
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  }

  function handleBuy(artwork) {
    if (!user) {
      navigate('/user-login');
      return;
    }
    
    if (artwork.availability === true) {
      navigate('/order-process', {
        state: { artworkId: artwork.id, artistId: artwork.artist_id }
      });
    } else {
      setShowModal(true);
    }
  }

  const filteredArtworks = selectedTag
    ? artworks.filter(artwork => artwork.category === selectedTag)
    : artworks;

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pt-20">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-6xl font-bold text-gradient-primary mb-2">
            🎨 Art Gallery
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Discover amazing artworks from talented artists around the world
          </p>
        </div>

        {/* Category Filter Tags */}
        <div className="sticky top-[72px] z-30 bg-white/80 backdrop-blur-md flex flex-wrap gap-3 justify-center py-4 rounded-xl shadow-lg border border-slate-100 mx-auto max-w-6xl">
          <button
            onClick={() => setSelectedTag('')}
            className={`btn-chip ${!selectedTag ? 'active' : ''}`}
          >
            All Categories
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`btn-chip ${selectedTag === tag ? 'active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
        <br />

        {/* Artworks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredArtworks.map(artwork => {
            const firstImage = Array.isArray(artwork.image_urls)
              ? artwork.image_urls[0]
              : artwork.image_urls;
            const isInCart = cartItems.includes(artwork.id);

            return (
              <div key={artwork.id} className="artistryhub-card group hover:scale-105 transition-all duration-300">
                {/* Artwork Image */}
                <div
                  className="aspect-square overflow-hidden rounded-t-xl cursor-pointer relative"
                  onClick={() => openModal(artwork)}
                >
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-6xl">🎨</span>
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="badge-primary">
                      {artwork.category}
                    </span>
                  </div>
                </div>

                {/* Artwork Info */}
                <div className="p-6">
                  <h3 className="font-bold text-lg text-slate-800 mb-2 line-clamp-2">
                    {artwork.title}
                  </h3>

                  {/* Artist Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-slate-500">by</span>
                    <button
                      onClick={() => navigate(`/artist-profile?id=${artwork.artist_id}`)}
                      className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      {artwork.artists?.name || 'Unknown Artist'}
                    </button>
                  </div>

                  {/* Star Rating */}
                  <div className="mb-4">
                    <StarRating value={4.5} />
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gradient-primary">
                      ₹{artwork.cost?.toLocaleString()}
                    </span>
                  </div>

                  {/* Description */}
                  {artwork.description && (
                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                      {artwork.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(artwork)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                        isInCart
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'btn-outline text-sm'
                      }`}
                    >
                      {isInCart ? '✓ In Cart' : '🛒 Add to Cart'}
                    </button>

                    <button
                      onClick={() => handleBuy(artwork)}
                      className="flex-1 btn-primary text-sm"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredArtworks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No artworks found
            </h3>
            <p className="text-slate-500">
              {selectedTag
                ? `No artworks in "${selectedTag}" category yet.`
                : 'No artworks available at the moment.'
              }
            </p>
          </div>
        )}

        {/* Not available modal */}
        {showModal && (
          <div
            className="fixed top-0 left-0 w-screen h-screen bg-slate-900/30 backdrop-blur flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl px-8 py-6 min-w-[300px] text-center"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-lg font-medium mb-4">Currently not available</p>
              <button
                className="btn-primary px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainDashboard;
