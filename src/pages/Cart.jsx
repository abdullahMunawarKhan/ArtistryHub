import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

function PriceDisplay({ cost }) {
  const originalPrice = Math.round(cost * 1.15); // 15% increase
  const discountPercent = 15;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400 line-through text-xs">₹{originalPrice}</span>
      <span className="text-green-600 font-medium text-xs">-{discountPercent}%</span>
      <span className="font-bold text-gray-900">₹{cost}</span>
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
    try {
      // Check availability before proceeding to order
      const { data, error } = await supabase
        .from('artworks')
        .select('availability, artist_id')
        .eq('id', artworkId)
        .single();

      if (error) {
        throw error;
      }

      // ✅ Check if artwork is available (truthy values only)
      if (!data.availability) {
        alert('This artwork is currently not available for ordering.');
        return;
      }

      navigate('/order-process', { state: { artworkId, artistId: data.artist_id } });

    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Unable to verify availability. Please try again.');
    }
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
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-800">
      {/* Compact Header Section */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-purple-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-800">Your Cart</h1>
            </div>

            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              <span className="text-xs font-medium text-purple-700">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Cart Content */}
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const isAvailable = item.artworks?.availability;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 overflow-hidden ${!isAvailable ? 'opacity-75' : ''
                    }`}
                >
                  {/* Availability Banner */}
                  {!isAvailable && (
                    <div className="bg-red-50 text-red-600 text-center py-1 text-xs font-medium border-b border-red-100">
                      Currently Unavailable
                    </div>
                  )}

                  <div className="p-4 flex gap-4 flex-wrap sm:flex-nowrap">
                    {/* Image */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={item.artworks?.image_urls?.[0] || '/default-image.png'}
                        alt={item.artworks?.title || 'Untitled'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3
                          className="text-base font-semibold text-gray-900 truncate cursor-pointer hover:text-purple-600 transition-colors"
                          onClick={() => navigate(`/product?id=${item.artwork_id}`)}
                        >
                          {item.artworks?.title || 'Untitled Artwork'}
                        </h3>

                        <div className="mt-1">
                          <PriceDisplay cost={item.artworks?.cost} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button
                          className={`w-full sm:flex-1 py-2 px-3 rounded-lg text-xs font-medium text-white shadow-sm transition-all ${isAvailable
                              ? 'bg-gray-900 hover:bg-gray-800'
                              : 'bg-gray-400 cursor-not-allowed'
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderNow(item.artwork_id);
                          }}
                          disabled={!isAvailable}
                        >
                          {isAvailable ? 'Buy Now' : 'Sold Out'}
                        </button>

                        <button
                          className="w-full sm:w-auto py-2 px-3 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(item.id);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );



}

export default Cart;
