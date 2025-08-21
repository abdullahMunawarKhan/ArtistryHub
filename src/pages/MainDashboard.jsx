import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function MainDashboard() {
  const navigate = useNavigate();

  const [tags, setTags] = useState([
    'Portrait', 'Landscape', 'Abstract', 'Watercolor', 'Oil', 'Digital', 'Sketch', 'Modern', 'Classic', 'Calligraphy'
  ]);
  const [selectedTag, setSelectedTag] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch artworks with artist info
  useEffect(() => {
    const fetchArtworks = async () => {
      let { data, error } = await supabase
        .from('artworks')
        .select(`id, title, image_url, tags, rate, artist_id, artists (id, name)`);
      if (!error && data) {
        setArtworks(data);
      }
    };
    fetchArtworks();
  }, []);

  // Filter artworks by selected tag; show all if no tag selected
  const filteredArtworks = selectedTag
    ? artworks.filter(a => a.tags && a.tags.includes(selectedTag))
    : artworks;

  // Add to cart function
  async function handleAddToCart(artworkId) {
    if (!user) {
      navigate('/user-login');
      return;
    }
    const { error } = await supabase
      .from('cart')
      .insert([{ user_id: user.id, artwork_id: artworkId, quantity: 1 }]);
    if (!error) {
      alert('Added to cart!');
    } else {
      alert('Error adding to cart');
    }
  }

  // Buy now function
  function handleBuy(artworkId, artistId) {
    navigate('/orders', { state: { artworkId, artistId } });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 py-8 px-4 relative">
      
      {/* Tag filter system with 'All' button */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        <button
          className={`badge-primary px-4 py-2 font-semibold shadow-construction-lg transition-all duration-200 ${selectedTag === '' ? 'bg-yellow-400 text-white scale-105' : ''}`}
          onClick={() => setSelectedTag('')}
        >
          All
        </button>
        {tags.map(tag => (
          <button
            key={tag}
            className={`badge-primary px-4 py-2 font-semibold shadow-construction-lg transition-all duration-200 ${selectedTag === tag ? 'bg-yellow-400 text-white scale-105' : ''}`}
            onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* ARTWORK CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
        {filteredArtworks.length === 0 ? (
          <div className="col-span-full text-center text-lg text-gray-500 py-10">
            No artworks found for selected tag.
          </div>
        ) : (
          filteredArtworks.map(artwork => (
            <div key={artwork.id} className="construction-card p-6 flex flex-col items-center text-center">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-32 h-32 rounded object-cover mb-2 shadow-construction-lg border-4 border-yellow-200"
                onError={e => { e.target.src = '/images/background.png'; }}
              />
              <h2 className="text-lg font-bold text-gradient mb-1">{artwork.title}</h2>
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {artwork.tags.map(t => (
                  <span key={t} className="badge-secondary px-2 py-1">{t}</span>
                ))}
              </div>
              <Link
                to={`/artist-list?id=${artwork.artist_id}`}
                className="underline text-blue-600 font-semibold block mb-1"
              >
                {artwork.artists?.name}
              </Link>
              <div className="font-semibold text-xl mb-3">₹{artwork.rate}</div>
              <div className="flex gap-2">
                <button
                  className="btn-primary"
                  onClick={() => handleBuy(artwork.id, artwork.artist_id)}
                >Buy</button>
                <button
                  className="btn-outline"
                  onClick={() => handleAddToCart(artwork.id)}
                >Add to Cart</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MainDashboard;
