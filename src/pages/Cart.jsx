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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 text-gray-800">
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
        <div className="grid md:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item, index) => {
              const isAvailable = item.artworks?.availability;

              return (
                <div
                  key={item.id}
                  className={`group relative bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden ${!isAvailable ? 'opacity-75' : ''}`}
                >
                  {/* Availability Banner */}
                  {!isAvailable && (
                    <div className="bg-red-50 text-red-600 text-center py-1 text-xs font-medium border-b border-red-100">
                      Currently Unavailable
                    </div>
                  )}

                  <div className="p-4 flex gap-4">
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
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-white shadow-sm transition-all ${isAvailable
                            ? 'bg-gray-900 hover:bg-gray-800'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOrderNow(item.artwork_id);
                          }}
                          disabled={!isAvailable}
                        >
                          {isAvailable ? 'Buy Now' : 'Sold Out'}
                        </button>

                        <button
                          className="py-1.5 px-3 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors"
                          onClick={(event) => {
                            event.stopPropagation();
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

          {/* Cart Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Summary</h3>
                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Items</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total Estimated</span>
                    <span>₹{cartItems.reduce((acc, item) => acc + (item.artworks?.cost || 0), 0)}</span>
                  </div>
                </div>
                
                <button
                  className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium rounded-lg border border-purple-200 transition-colors"
                  onClick={() => navigate('/main-dashboard')}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


}

export default Cart;
