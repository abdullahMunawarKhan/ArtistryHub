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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Compact Header Section - Single Line */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white py-4 shadow-lg">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between">
            {/* Left Side - Icon and Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Your Cart</h1>
            </div>

            {/* Right Side - Item Count */}
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="text-sm font-medium">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
              </span>
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Cart Content */}
      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {cartItems.map((item, index) => {
                const isAvailable = item.artworks?.availability;

                return (
                  <div
                    key={item.id}
                    className={`group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden ${!isAvailable ? 'opacity-75' : ''
                      }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                    onClick={() => navigate(`/product?id=${item.artwork_id}`)}
                  >
                    {/* Availability Banner */}
                    {!isAvailable && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-center py-2 text-sm font-medium z-10">
                        ⚠️ Currently Unavailable
                      </div>
                    )}

                    <div className={`p-6 ${!isAvailable ? 'pt-16' : ''}`}>
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Enhanced Image */}
                        <div className="relative group/image">
                          <div className="w-full md:w-32 h-48 md:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer transition-transform duration-300 group-hover/image:scale-105">
                            <img
                              src={item.artworks?.image_urls?.[0] || '/default-image.png'}
                              alt={item.artworks?.title || 'Untitled'}
                              className="w-full h-full object-cover"

                            />

                          </div>

                        </div>

                        {/* Enhanced Details */}
                        <div className="flex-1 space-y-3">
                          <div
                            className="cursor-pointer group/title"

                          >
                            <h3 className="text-xl font-bold text-gray-900 group-hover/title:text-purple-600 transition-colors duration-300 line-clamp-2">
                              {item.artworks?.title || 'Untitled Artwork'}
                            </h3>
                          </div>

                          {/* Price with Enhanced Styling */}
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                            <PriceDisplay cost={item.artworks?.cost} />
                          </div>

                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              🎨 Artwork
                            </span>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                              ✨ Premium Quality
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Action Buttons */}
                      <div className="mt-6 flex gap-3">
                        <button
                          className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${isAvailable
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-green-500/25'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                            }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOrderNow(item.artwork_id);
                          }}
                          disabled={!isAvailable}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isAvailable ? (
                              <>

                                Order Now
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                                </svg>
                                Not Available
                              </>
                            )}
                          </div>
                        </button>

                        <button
                          className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRemove(item.id);
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">


              {/* Continue Shopping */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Keep Exploring</h3>
                <p className="text-gray-600 text-sm mb-4">Discover more amazing artworks from talented artists</p>
                <button
                  className="bg-white hover:bg-gray-50 text-gray-900 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-300"
                  onClick={() => navigate('/main-dashboard')}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add this CSS for animations */}
      <style jsx>{`
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `}</style>
    </div>
  );


}

export default Cart;
