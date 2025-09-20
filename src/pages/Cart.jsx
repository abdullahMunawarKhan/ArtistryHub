import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

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

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  async function fetchCartItems() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cart')
      .select('id, artwork_id, quantity, artworks (title, cost, image_urls,availability)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } else {
      setCartItems(data || []);
    }
    setLoading(false);
  }

  async function handleRemove(itemId) {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('id', itemId);

    if (error) {
      alert('Failed to remove item from cart');
      console.error(error);
      return;
    }
    fetchCartItems();
  }

  async function handleOrderNow(artworkId) {
    // Check availability before proceeding to order
    const { data, error } = await supabase
      .from('artworks')
      .select('availability, artist_id')
      .eq('id', artworkId)

    if (error) {
      alert('Unable to verify availability. Please try again.');
      return;
    }
    if (data && data.availability === false) {
      alert('This artwork is currently not available for ordering.');
      return;
    }
    navigate('/order-process', { state: { artworkId, artistId: data?.artist_id } });
  }

  if (loading) {
    return <div className="py-20 text-center">Loading your cart...</div>;
  }

  if (!cartItems.length) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
        <p className="mb-6">Add artworks to your cart to see them here.</p>
        <button
          className="px-6 py-2 bg-yellow-400 rounded font-semibold text-white"
          onClick={() => navigate('/main-dashboard')}
        >
          Browse Artworks
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] mx-auto py-6 px-3 max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">🛒 Your Cart</h1>
      <ul className="space-y-6">
        {cartItems.map(item => (
          <li
            key={item.id}
            className="p-4 bg-white rounded-2xl shadow-md border hover:shadow-lg transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
              {/* Image */}
              <img
                src={item.artworks?.image_urls?.[0] || '/default-image.png'}
                alt={item.artworks?.title || 'Untitled'}
                className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-xl cursor-pointer"
                onClick={() => navigate(`/product?id=${item.artwork_id}`)}
              />

              {/* Details */}
              <div
                className="flex-1 mt-4 sm:mt-0 cursor-pointer"
                onClick={() => navigate(`/product?id=${item.artwork_id}`)}
              >
                <h3 className="text-lg font-semibold truncate">
                  {item.artworks?.title || 'Untitled'}
                </h3>
                <div className="mt-2">
                  <PriceDisplay cost={item.artworks?.cost} />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-3">
              <button
                className="flex-1 bg-green-600 text-white py-2 rounded-xl font-medium shadow hover:bg-green-700 active:scale-95 transition"
                onClick={() => handleOrderNow(item.artwork_id)}
              >
               Order Now
              </button>
              <button
                className="flex-1 bg-red-600 text-white py-2 rounded-xl font-medium shadow hover:bg-red-700 active:scale-95 transition"
                onClick={() => handleRemove(item.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

}

export default Cart;
