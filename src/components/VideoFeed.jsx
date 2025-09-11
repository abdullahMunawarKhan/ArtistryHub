import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, UserPlus, Play, Pause, Info } from 'lucide-react';



const aspectClass = "aspect-[3/4]"; // Reel-like format

function VideoFeed() {
  const [artworks, setArtworks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState([]);
  const [userFollowing, setUserFollowing] = useState([]);
  const carouselRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  // Scroll handler: updates currentIndex based on scroll position
  const onScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.firstChild?.offsetWidth || 1;
    const index = Math.round(scrollLeft / cardWidth);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      setIsPlaying(true); // auto-play new video
    }
  };
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await fetchUserData(user.id);
      } else {
        navigate('/login');
      }
    };
    getCurrentUser();
  }, [navigate]);

  const fetchUserData = async (userId) => {
    try {
      const { data } = await supabase
        .from('user')
        .select('liked_artworks, following')
        .eq('id', userId);

      setUserLikes(data?.liked_artworks || []);
      setUserFollowing(data?.following || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const { data } = await supabase
          .from('artworks')
          .select(`
            id, title, video_url, availability, likes, artist_id,
            artists (id, name, followers)
          `)
          .not('video_url', 'is', null)
          .neq('video_url', '');
        setArtworks(data.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error('Error fetching artworks:', error);
      }
      setLoading(false);
    };
    if (user) fetchArtworks();
  }, [user]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [currentIndex, isPlaying]);

  const handleVideoEnd = () => setCurrentIndex((currentIndex + 1) % artworks.length);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowPlayButton(true);
    setTimeout(() => setShowPlayButton(false), 2000);
  };

  const toggleLike = async (artworkId) => {
    if (!user) return alert('Login required');
    let updatedLikes = userLikes.includes(artworkId)
      ? userLikes.filter(id => id !== artworkId)
      : [...userLikes, artworkId];
    const likeCount = updatedLikes.includes(artworkId)
      ? (artworks[currentIndex].likes || 0) + 1
      : Math.max(0, (artworks[currentIndex].likes || 0) - 1);
    await supabase.from('user').update({ liked_artworks: updatedLikes }).eq('id', user.id);
    await supabase.from('artworks').update({ likes: likeCount }).eq('id', artworkId);
    setUserLikes(updatedLikes);
    setArtworks(prev => prev.map(a =>
      a.id === artworkId ? { ...a, likes: likeCount } : a
    ));
  };

  const toggleFollow = async (artistId) => {
    if (!user) return alert('Login required');
    let updatedFollowing = userFollowing.includes(artistId)
      ? userFollowing.filter(id => id !== artistId)
      : [...userFollowing, artistId];
    const followerCount = updatedFollowing.includes(artistId)
      ? (artworks[currentIndex].artists.followers || 0) + 1
      : Math.max(0, (artworks[currentIndex].artists.followers || 0) - 1);
    await supabase.from('user').update({ following: updatedFollowing }).eq('id', user.id);
    await supabase.from('artists').update({ followers: followerCount }).eq('id', artistId);
    setUserFollowing(updatedFollowing);
    setArtworks(prev => prev.map(a =>
      a.artists.id === artistId ? { ...a, artists: { ...a.artists, followers: followerCount } } : a
    ));
  };

  const addToCart = async (artworkId) => {
    if (!user) return alert('Login required');
    await supabase.from('cart').insert({
      user_id: user.id,
      artwork_id: artworkId,
      quantity: 1,
      added_at: new Date().toISOString()
    });
    alert('Added to cart!');
  };

  const buyNow = (artwork) => {
    artwork.availability
      ? navigate('/order-process', { state: { artwork } })
      : alert('Currently not available');
  };
  // Scroll to the currentIndex video on artworks change or index change
  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.firstChild?.offsetWidth || 0;
      carouselRef.current.scrollTo({
        left: cardWidth * currentIndex,
        behavior: 'smooth',
      });
    }
  }, [currentIndex, artworks]);

  // Pause/play video logic when currentIndex changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [currentIndex, isPlaying]);



  if (loading) return <div className="flex items-center justify-center h-screen">✨ Loading reels...</div>;
  if (!artworks.length) return <div className="flex items-center justify-center h-screen">No video content available</div>;

  const current = artworks[currentIndex];

  return (
    <div className="flex flex-col items-center min-h-screen bg-black py-8">
      {/* Scrollable carousel container */}
      <div
        ref={carouselRef}
        onScroll={onScroll}
        className="w-[350px] flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {artworks.map((artwork, index) => (
          <div
            key={artwork.id}
            className={`snap-start flex-shrink-0 w-[350px] ${aspectClass} relative rounded-xl overflow-hidden mr-4`}
          >
            <video
              ref={index === currentIndex ? videoRef : null}
              src={artwork.video_url}
              muted
              loop={false}
              autoPlay={index === currentIndex}
              className="object-cover w-full h-full rounded-xl"
              onClick={() => setIsPlaying(!isPlaying)}
              onEnded={() => setCurrentIndex((currentIndex + 1) % artworks.length)}
            />
            <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <button className="font-bold text-sm">{artwork.artists.name}</button>
              <div className="text-xs text-gray-300">Followers: {artwork.artists.followers}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex justify-around items-center bg-white rounded-lg shadow-lg py-3 my-4 w-[350px]">
        <button onClick={() => toggleLike(current.id)} className="flex flex-col items-center text-gray-700">
          <Heart className={`h-6 w-6 ${userLikes.includes(current.id) ? 'text-red-500' : ''}`} />
          <span className="text-xs">{current.likes || 0}</span>
        </button>
        <button onClick={() => toggleFollow(current.artists.id)} className="flex flex-col items-center text-gray-700">
          <UserPlus className={`h-6 w-6 ${userFollowing.includes(current.artists.id) ? 'text-green-400' : ''}`} />
          <span className="text-xs">Follow</span>
        </button>
        <button onClick={() => addToCart(current.id)} className="flex flex-col items-center text-gray-700">
          <ShoppingCart className="h-6 w-6" />
        </button>
        <button
          onClick={() => buyNow(current)}
          className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition"
          aria-label="Buy Now"
        >
          <span className="mr-2 text-lg">💳</span>
          Buy Now
        </button>
        <button onClick={() => navigate(`/product?id=${current.id}`)} className="flex flex-col items-center text-gray-700">
          <Info className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default VideoFeed;
