import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

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
      .select('id, artwork_id, quantity, artworks (title, cost, image_urls)')
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

  function handleOrderNow(artworkId) {
    navigate('/order-process', { state: { artworkId } });
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <ul>
        {cartItems.map(item => (
          <li key={item.id} className="mb-8 border-b pb-4">
            <div className="flex items-center gap-6">
              <img
                src={item.artworks?.image_urls?.[0] || '/default-artwork.png'}

                alt={item.artworks?.title || 'Artwork'}
                className="w-24 h-24 object-cover rounded shadow"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{item.artworks?.title || 'Untitled'}</h3>
                <div className="text-yellow-700 mb-1 font-bold">₹{item.artworks?.cost}</div>
                <div className="text-gray-500 text-sm mb-2">Quantity: {item.quantity}</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleOrderNow(item.artwork_id)}
                    className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700"
                  >
                    Order Now
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Cart;
