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
  const [likedArtworks, setLikedArtworks] = useState([]);
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [isFetching, setIsFetching] = useState(false);
  const [showGoTop, setShowGoTop] = useState(false);



  // Function to filter artworks by liked status (true to show liked only, false to show all)
  function filterArtworksByLiked(artworks, likedArtworks, showLikedOnly) {
    if (!showLikedOnly) return artworks;
    return artworks.filter(artwork => likedArtworks.includes(artwork.id));
  }

  // JSX toggle button to toggle filter by liked
  function LikedFilterToggle({ showLikedOnly, setShowLikedOnly }) {
    return (
      <button
        onClick={() => setShowLikedOnly(!showLikedOnly)}
        className={`btn-chip ${showLikedOnly ? 'active bg-pink-300 text-white' : ''}`}
        aria-pressed={showLikedOnly}
        type="button"
      >
        {showLikedOnly ? 'Showing Liked' : 'Show Liked Only'}
      </button>
    );
  }

  // Fetch logged-in user profile, cart, and liked artworks
  useEffect(() => {
    async function fetchUserAndProfile() {
      setLoadingProfile(true);

      try {
        const {
          data: { user: authUser }
        } = await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          setUserProfile(null);
          setCartItems([]);
          setLikedArtworks([]);
          setLoadingProfile(false);
          return;
        }

        setUser(authUser);

        const { data: profileData, error: profileError } = await supabase
          .from('user')
          .select('id, email, role, liked_artworks')
          .eq('id', authUser.id);

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setUserProfile(null);
          setLikedArtworks([]);
        } else if (profileData && profileData.length > 0) {
          setUserProfile(profileData[0]);
          setLikedArtworks(profileData[0].liked_artworks || []);
        } else {
          setUserProfile(null);
          setLikedArtworks([]);
        }

        await fetchCart(authUser.id);
      } catch (error) {
        console.error('Error in fetchUserAndProfile:', error);
      } finally {
        setLoadingProfile(false);
      }
    }

    fetchUserAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchCart(session.user.id);
        // Fetch liked artworks on auth change
        fetchUserLikedArtworks(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setCartItems([]);
        setLikedArtworks([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);


  async function fetchUserLikedArtworks(userId) {
    const { data, error } = await supabase
      .from('user')
      .select('liked_artworks')
      .eq('id', userId);

    if (!error && data && data.length > 0 && data[0].liked_artworks) {
      setLikedArtworks(data[0].liked_artworks);
    } else {
      setLikedArtworks([]);
    }
  }

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
          .select('id, title, category, cost, image_urls, artist_id, artists (id, name), description, material, video_url, availability, likes, liked_count');

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
        state: { artworkId: artwork.id, artistId: artwork.artist_id },
      });
    } else {
      setShowModal(true);
    }
  }

  async function toggleLike(artwork) {
    if (!user) {
      alert('Please log in to use the like feature.');
      return;
    }

    const currentlyLiked = likedArtworks.includes(artwork.id);
    const updatedLikedArtworks = currentlyLiked
      ? likedArtworks.filter(id => id !== artwork.id)
      : [...likedArtworks, artwork.id];

    // 1) Update user.liked_artworks
    const { data: userData, error: userErr } = await supabase
      .from('user')
      .update({ liked_artworks: updatedLikedArtworks })
      .eq('id', user.id)
      .select('liked_artworks')
      // .single()

    if (userErr) {
      console.error('Error updating user liked_artworks:', userErr);
      alert('Failed to update your likes.');
      return;
    }
    console.log('User liked_artworks after update:', userData.liked_artworks);

    // 2) Atomically update artworks.liked_count
    // inside toggleLike()
    const newCount = currentlyLiked
      ? artwork.liked_count - 1
      : artwork.liked_count + 1

    const { data: artData, error: artErr } = await supabase
      .from('artworks')
      .update({ liked_count: newCount })
      .eq('id', artwork.id)
      .select('liked_count')
      .single()

    console.log('Artwork liked_count after update:', artData.liked_count);

    // 3) Sync local state
    setLikedArtworks(userData.liked_artworks);
    setArtworks(artworks.map(a =>
      a.id === artwork.id
        ? { ...a, liked_count: artData.liked_count }
        : a
    ));
  }



  const filteredArtworks = artworks
    .filter(artwork => {
      // Filter by category if selected
      if (selectedTag && artwork.category !== selectedTag) return false;
      // Filter by liked only if toggle is ON
      if (showLikedOnly && !likedArtworks.includes(artwork.id)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          (artwork.title && artwork.title.toLowerCase().includes(q)) ||
          (artwork.category && artwork.category.toLowerCase().includes(q)) ||
          (artwork.description && artwork.description.toLowerCase().includes(q)) ||
          (artwork.material && artwork.material.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });

  const visibleArtworks = filteredArtworks.slice(0, visibleCount);
  function handleScroll() {
    if (
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
      !isFetching &&
      visibleArtworks.length < filteredArtworks.length // prevent scroll overreach!
    ) {
      setIsFetching(true);
      setTimeout(() => {
        setVisibleCount(count => Math.min(count + 8, filteredArtworks.length));
        setIsFetching(false);
      }, 200);
    }
  }


  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredArtworks, isFetching]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [selectedTag, showLikedOnly, searchQuery]);


  useEffect(() => {
    function handleScroll() {
      setShowGoTop(window.scrollY > 300);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
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
    <div className="min-h-[90vh] bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 ">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center py-10 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
          <div className="flex items-center gap-4 mb-4 animate-fade-in">
            <img
              src="/images/logo2.png"
              alt="ScopeBrush Logo"
              className="h-16 w-16 rounded-full shadow-lg border-2 border-purple-300"
              style={{ marginRight: 0, verticalAlign: "middle" }}
            />
            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-4xl md:text-6xl drop-shadow-lg">
              Art Gallery
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-slate-700 max-w-2xl text-center px-2 leading-relaxed tracking-wide mb-2">
            Discover amazing artworks from talented artists
          </p>
          {/* 🔹 Sticky Filter + Search Section */}
          <div className="sticky top-[56px] z-30 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 mx-auto max-w-6xl px-4 py-4">
            {/* Category Filter Tags */}

            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <button
                onClick={() => {
                  setSelectedTag('');
                  setShowLikedOnly(false);
                }}
                className={`btn-chip ${!selectedTag && !showLikedOnly ? 'active' : ''}`}
              >
                All Categories
              </button>

              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag);
                    setShowLikedOnly(false);
                  }}
                  className={`btn-chip ${selectedTag === tag ? 'active' : ''}`}
                >
                  {tag}
                </button>
              ))}

              {user && (
                <button
                  onClick={() => {
                    const newShowLiked = !showLikedOnly;
                    setShowLikedOnly(newShowLiked);
                    if (newShowLiked) setSelectedTag('');
                  }}
                  className={`btn-chip ${showLikedOnly ? 'active bg-pink-300 text-white' : ''}`}
                  aria-pressed={showLikedOnly}
                  type="button"
                >
                  {showLikedOnly ? 'Showing Liked' : 'Show Liked Only'}
                </button>
              )}
            </div>

            {/* 🔍 Search Bar */}
            <div className="max-w-3xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Search artworks by title,material,category...."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:outline-none shadow-sm"
              />
            </div>
          </div>
        </div>








        <br />

        {/* NEW - Use this instead */}
        {/* Artworks Grid with Infinite Scroll */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

          {visibleArtworks.map(artwork => {
            const firstImage = Array.isArray(artwork.image_urls)
              ? artwork.image_urls[0]
              : artwork.image_urls;
            const isInCart = cartItems.includes(artwork.id);
            const isLiked = likedArtworks.includes(artwork.id);

            return (
              <div key={artwork.id} className="ScopeBrush-card group hover:scale-105 transition-all duration-300"
                onClick={() => navigate(`/product?id=${artwork.id}`)}>

                {/* Artwork Image */}
                <div className="aspect-square overflow-hidden rounded-t-xl cursor-pointer relative">
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-2">
                      {artwork.title}
                    </h3>
                    {/* Like Button with heart */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleLike(artwork);
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        toggleLike(artwork);
                      }}
                      className="flex items-center justify-center transition-all duration-200 p-0 ml-2 hover:bg-transparent active:scale-95"
                      aria-label="Like button"
                      title={isLiked ? 'Unlike' : 'Like'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        width: 'auto',
                        height: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill={isLiked ? 'red' : 'none'}
                        stroke={isLiked ? 'red' : '#a1a1aa'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transition: 'fill 0.2s, stroke 0.2s',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: 0,
                          boxShadow: 'none'
                        }}
                      >
                        <path d="M12 21s-1.45-1.34-6-5.71C2.42 13 2 10.36 4.24 8.61c2.27-1.76 5.23-.62 6.20 1.6.97-2.22 3.93-3.36 6.2-1.6C22 10.36 21.58 13 18 15.29c-4.55 4.37-6 5.71-6 5.71z" />
                      </svg>
                      <span>{artwork.liked_count ?? 0}</span>
                    </button>
                  </div>

                  {/* Artist Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-slate-500">by</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/artist-profile?id=${artwork.artist_id}`);
                      }}
                      className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      {artwork.artists?.name || 'Unknown Artist'}
                    </button>
                  </div>

                  {/* Star Rating */}
                  <div className="mb-4">
                    <StarRating value={artwork.avg_rating ?? 0} />
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
                  <div className="flex gap-2 items-center flex-wrap w-full py-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleAddToCart(artwork);
                      }}
                      className={`flex-1 min-w-[110px] py-2 px-4 rounded-lg font-medium transition-all duration-200 ${isInCart
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'btn-outline text-sm hover:bg-purple-50 hover:text-black hover:border-purple-200'
                        }`}
                      style={{ flexBasis: '40%' }}
                    >
                      {isInCart ? '✓ In Cart' : '🛒 Add to Cart'}
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleBuy(artwork);
                      }}
                      className="flex-1 min-w-[110px] btn-primary text-sm transition-all duration-200 hover:scale-105"
                      style={{ flexBasis: '40%' }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}



        </div>
        <div className="flex justify-center items-center mt-12 mb-8">
          {/* Loading indicator */}
          {isFetching && visibleArtworks.length < filteredArtworks.length && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading more artworks...</p>
            </div>
          )}

          {!isFetching && visibleArtworks.length >= filteredArtworks.length && filteredArtworks.length > 0 && (
            <div className="text-center py-4 text-gray-400 font-medium">
              No more artworks.
            </div>
          )}
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
        {showGoTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-10 right-6 p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition"
            aria-label="Scroll to top"
          >
            ↑
          </button>
        )}
      </div>
    </div >
  );
}

export default MainDashboard;