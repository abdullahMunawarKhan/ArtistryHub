import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


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

function PriceDisplay({ cost }) {
  const originalPrice = Math.round(cost * 1.15); // 15% increase
  const discountPercent = 15;

  return (
    <div>
      <div style={{ fontSize: "12px", color: "#555" }}>M.R.P - </div>
      <span
        style={{
          textDecoration: "line-through",
          color: "#888",
          marginRight: 8,
        }}
      >
        ₹{originalPrice}
      </span>
      <span
        style={{
          color: "green",
          fontWeight: 500,
          marginRight: 8,
        }}
      >
        ({discountPercent}% off)
      </span>
      <span style={{ fontWeight: "bold" }}>₹{cost}</span>
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
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollRef = useRef(null);

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
  async function fetchArtworks() {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, category, cost, image_urls, artist_id, artists (id, name, avg_rating), description, material, video_url, availability, likes, liked_count');

      if (!error && data) {
        setArtworks(data);
      } else {
        setArtworks([]);
        console.error('Failed to fetch artworks', error);
      }
    } catch (error) {
      console.error('Error fetching artworks:', error);
      setArtworks([]);
    } finally {
      setIsFetching(false);
    }
  }

  useEffect(() => {
    fetchArtworks();
  }, []);

  // Pull-to-refresh handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (window.scrollY === 0 && startY.current > 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      if (diff > 0) {
        // Logarithmic resistance
        setPullY(Math.min(diff * 0.4, 150));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY > 80) { // Threshold to trigger refresh
      setIsRefreshing(true);
      setPullY(100); // Keep visual indicator visible
      await fetchArtworks();
      setIsRefreshing(false);
    }
    setPullY(0);
    startY.current = 0;
  };

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

    // ✅ 1) OPTIMISTIC UPDATE - Update UI immediately
    setLikedArtworks(updatedLikedArtworks);

    // Update artwork's liked_count optimistically
    const newCount = currentlyLiked ? artwork.liked_count - 1 : artwork.liked_count + 1;
    setArtworks(artworks.map(a =>
      a.id === artwork.id
        ? { ...a, liked_count: newCount }
        : a
    ));

    try {
      // ✅ 2) Update user.liked_artworks in database
      const { data: userData, error: userErr } = await supabase
        .from('user')
        .update({ liked_artworks: updatedLikedArtworks })
        .eq('id', user.id)
        .select('liked_artworks');

      if (userErr) {
        console.error('Error updating user liked_artworks:', userErr);
        // ✅ REVERT optimistic update on error
        setLikedArtworks(likedArtworks);
        setArtworks(artworks.map(a =>
          a.id === artwork.id
            ? { ...a, liked_count: artwork.liked_count }
            : a
        ));
        alert('Failed to update your likes.');
        return;
      }

      // ✅ 3) Update artworks.liked_count in database
      const { data: artData, error: artErr } = await supabase
        .from('artworks')
        .update({ liked_count: newCount })
        .eq('id', artwork.id)
        .select('liked_count')
        .single();

      if (artErr) {
        console.error('Error updating artwork liked_count:', artErr);
        // Keep the UI updated since user's liked_artworks was successful
        return;
      }

      // ✅ 4) Sync final state (usually not needed due to optimistic updates)
      console.log('Successfully updated likes');

    } catch (error) {
      console.error('Error in toggleLike:', error);
      // ✅ REVERT optimistic update on error
      setLikedArtworks(likedArtworks);
      setArtworks(artworks.map(a =>
        a.id === artwork.id
          ? { ...a, liked_count: artwork.liked_count }
          : a
      ));
      alert('Failed to update likes.');
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative"
        >
          {/* Glow Ring */}
          <div className="absolute inset-0 rounded-full blur-2xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-30 animate-pulse" />

          {/* Glass Card */}
          <div className="relative bg-white/80 backdrop-blur-xl border border-purple-100 shadow-2xl rounded-2xl px-10 py-8 flex flex-col items-center">

            {/* Spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              className="mb-4"
            >
              <Loader2 className="h-12 w-12 text-purple-600" />
            </motion.div>

            {/* Text */}
            <p className="text-lg font-semibold text-purple-700">
              Loading your profile
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Preparing your art space 🎨
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-800 pb-20 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {(pullY > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: pullY,
              y: pullY > 0 ? 0 : -50
            }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-20 left-0 w-full flex items-center justify-center z-40 pointer-events-none overflow-hidden"
          >
            <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 shadow-lg flex items-center gap-2 border border-purple-100">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-5 h-5 text-purple-600" />
              </motion.div>
              <span className="text-sm font-medium text-purple-900">
                {isRefreshing ? "Refreshing..." : "Pull to refresh"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center justify-center py-1 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
          <div className="flex items-center gap-4 mb-4 animate-fade-in">
            <img
              src="/images/logo2.jpeg"
              alt="ScopeBrush Logo"
              className="h-12 w-12 md:h-16 md:w-16 rounded-full shadow-lg border-2 border-purple-300"
            />

            <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r 
from-purple-500 via-pink-500 to-blue-500 
text-3xl md:text-6xl drop-shadow-lg">
              Art Gallery
            </h1>

          </div>
          <p className="text-base md:text-2xl text-slate-700 max-w-2xl text-center px-2 leading-relaxed tracking-wide mb-2">
            Discover amazing artworks from talented artists
          </p>
          {/* 🔹 Sticky Filter + Search Section */}
          <div className="sticky top-[56px] z-30 bg-white/80 backdrop-blur-md 
rounded-xl shadow-lg border border-slate-100 
mx-auto max-w-6xl px-3 py-3 md:px-4 md:py-4">
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
                className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base 
  rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 shadow-sm"
              />
            </div>
          </div>
        </div>

        <br />
        {filteredArtworks.length === 0 ? (
          // EMPTY STATE (Centered)
          <div
            className="
      w-full
      flex flex-col items-center justify-center text-center
      py-16 md:py-32
      min-h-[50vh]
    "
          >
            <div className="text-5xl md:text-6xl mb-3">🎨</div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-700 mb-1">
              No artworks found
            </h3>
            <p className="text-slate-500 text-sm md:text-base">
              {selectedTag
                ? `No artworks in "${selectedTag}" category yet.`
                : "No artworks available at the moment."}
            </p>
          </div>
        ) : (
          // GRID ONLY WHEN ARTWORKS EXIST
          <div
            className="
    grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2
    lg:grid-cols-3 xl:grid-cols-4
    gap-y-3 gap-x-3 sm:gap-4 md:gap-8
  "
          >
            {visibleArtworks.map((artwork) => {
              const firstImage = Array.isArray(artwork.image_urls)
                ? artwork.image_urls[0]
                : artwork.image_urls;

              const isInCart =
                cartItems && cartItems.includes
                  ? cartItems.includes(artwork.id)
                  : false;

              const isLiked =
                likedArtworks && likedArtworks.includes
                  ? likedArtworks.includes(artwork.id)
                  : false;

              return (
                <div
                  key={artwork.id}
                  className="
          ScopeBrush-card group
          transition-all duration-300
          sm:hover:scale-105
        "
                  onClick={() => navigate(`/product?id=${artwork.id}`)}
                >
                  {/* Artwork Image */}
                  <div className="aspect-square overflow-hidden rounded-t-lg sm:rounded-t-xl relative">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={artwork.title}
                        className="w-full h-full object-cover sm:group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl sm:text-6xl">🎨</span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                      <span className="
              px-2 py-0.5 sm:px-3 sm:py-1
              rounded-lg sm:rounded-xl
              bg-gradient-to-r from-gray-100 to-indigo-100
              shadow
              text-xs sm:text-sm
              font-semibold
            ">
                        {artwork.category}
                      </span>
                    </div>
                  </div>

                  {/* Artwork Info */}
                  <div className="p-3 sm:p-4 md:p-6">
                    {/* Title & Like */}
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <h3 className="
              font-semibold sm:font-bold
              text-sm sm:text-base md:text-lg
              text-slate-800
              line-clamp-2
            ">
                        {artwork.title}
                      </h3>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(artwork);
                        }}
                        className="flex items-center gap-1 ml-1 sm:ml-2 active:scale-95"
                        aria-label="Like button"
                      >
                        <Heart
                          size={22}
                          className="sm:hidden"
                          fill={isLiked ? "red" : "none"}
                          stroke={isLiked ? "red" : "#a1a1aa"}
                          strokeWidth={1.5}
                        />
                        <Heart
                          size={32}
                          className="hidden sm:block"
                          fill={isLiked ? "red" : "none"}
                          stroke={isLiked ? "red" : "#a1a1aa"}
                          strokeWidth={1.5}
                        />
                        <span className="text-xs sm:text-sm">
                          {artwork.liked_count ?? 0}
                        </span>
                      </button>
                    </div>

                    {/* Artist */}
                    <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                      <span className="text-xs sm:text-sm text-slate-500">by</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artist-profile?id=${artwork.artist_id}`);
                        }}
                        className="text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-800"
                      >
                        {artwork.artists?.name || "Unknown Artist"}
                      </button>
                    </div>

                    {/* Rating */}
                    <div className="mb-2 sm:mb-4">
                      <StarRating value={artwork.artists?.avg_rating ?? 0} />
                    </div>

                    {/* Price */}
                    <div className="mb-2 sm:mb-4">
                      <PriceDisplay cost={artwork.cost} />
                    </div>

                    {/* Description */}
                    {artwork.description && (
                      <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-4 line-clamp-3">
                        {artwork.description}
                      </p>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 flex-wrap w-full py-1 sm:py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(artwork);
                        }}
                        className={`
                flex-1 min-w-[90px] sm:min-w-[110px]
                py-1.5 sm:py-2 px-3 sm:px-4
                rounded-md sm:rounded-lg
                text-xs sm:text-sm font-medium
                transition-all
                ${isInCart
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "btn-outline hover:bg-purple-50 hover:text-black"
                          }
              `}
                      >
                        {isInCart ? "✓ In Cart" : "🛒 Add"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuy(artwork);
                        }}
                        className="
                flex-1 min-w-[90px] sm:min-w-[110px]
                py-1.5 sm:py-2 px-3 sm:px-4
                rounded-md sm:rounded-lg
                btn-primary
                text-xs sm:text-sm
                transition-all
                sm:hover:scale-105
              "
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        )}




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
        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">

            <div className="relative bg-white/80 backdrop-blur-xl shadow-2xl border border-white/40 
                    rounded-2xl p-8 w-[90%] max-w-sm animate-slideUp">

              {/* Close Icon */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/main-dashboard');
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
              >
                ✖
              </button>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">
                Please Login
              </h2>

              {/* Subtitle */}
              <p className="text-gray-600 text-center mb-6">
                You need to log in to access this feature.
              </p>

              {/* Action Button */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('/user-login');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500
                   text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]
                   transition-all"
              >
                Go to Login
              </button>

              {/* Secondary button */}
              <button
                onClick={() => setShowLoginModal(false)}
                className="mt-4 w-full py-3 rounded-xl border border-gray-300 
                   text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>

            </div>
          </div>
        )}

      </div>
    </div >
  );
}

export default MainDashboard;