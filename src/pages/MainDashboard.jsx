import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function MainDashboard() {
  const navigate = useNavigate();

  const [tags, setTags] = useState([
    'Portrait', 'Landscape', 'Abstract', 'Watercolor', 'Oil', 'Digital',
    'Sketch', 'Modern', 'Classic', 'Calligraphy'
  ]);
  const [selectedTag, setSelectedTag] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [user, setUser] = useState(null);

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

  // Fetch all artworks with artist info
  useEffect(() => {
    async function fetchArtworks() {
      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, category, cost, image_urls, artist_id, artists (id, name)')
      if (error) {
        console.error(error);
        setArtworks([]);
      } else {
        setArtworks(data || []);
      }
    }
    fetchArtworks();
  }, []);

  // Filter artworks by selected tag; show all if no tag selected
  const filteredArtworks = selectedTag
    ? artworks.filter(a => a.category && a.category === selectedTag)
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
    navigate('/order-process', { state: { artworkId, artistId } });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 py-8 px-4">
      <h2 className="text-3xl font-bold mb-4 text-center text-pink-600">
        Find your perfect art by style, medium, or theme.
      </h2>
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        <button
          className={`px-4 py-2 rounded font-semibold transition-all duration-200
            ${selectedTag === '' ? 'bg-yellow-400 text-white scale-105' : 'bg-white text-gray-800 border'}`}
          onClick={() => setSelectedTag('')}
        >All</button>
        {tags.map(tag => (
          <button
            key={tag}
            className={`px-4 py-2 rounded font-semibold transition-all duration-200 
              ${selectedTag === tag ? 'bg-yellow-400 text-white scale-105' : 'bg-white text-gray-800 border'}`}
            onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
          >{tag}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredArtworks.length === 0 ? (
          <div className="col-span-full text-center text-lg text-gray-500 py-10">
            No artworks found for selected tag.
          </div>
        ) : (
          filteredArtworks.map(artwork => (
            <div key={artwork.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center">
              <img
                src={artwork.image_urls?.[0] || '/default-artwork.png'}
                alt={artwork.title}
                className="w-40 h-40 rounded object-cover mb-2 border-4 border-yellow-200"
                onError={e => { e.target.src = '/images/background.png'; }}
              />
              <h2 className="text-lg font-bold mb-1">{artwork.title}</h2>
              
              <p className="font-semibold text-pink-600 text-xl mb-2">₹{artwork.cost}</p>
              {artwork.artists && (
                <Link
                  to={`/artist-profile?id=${artwork.artist_id}`}
                  className="underline text-blue-600 font-semibold block mb-2"
                >By {artwork.artists.name}</Link>
              )}
              <div className="flex gap-2">
                <button
                  className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded"
                  onClick={() => handleBuy(artwork.id, artwork.artist_id)}
                >Buy</button>
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded"
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
