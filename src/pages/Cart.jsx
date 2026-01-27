import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react'

function PriceDisplay({ cost, size = 'xs' }) {
  const originalPrice = Math.round(cost * 1.15);
  const discountPercent = 15;

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-gray-400 line-through font-medium">₹{originalPrice}</span>
      <span className="text-emerald-500 font-bold">-{discountPercent}%</span>
      <span className="font-black text-slate-900 text-sm">₹{cost}</span>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-950 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 mb-8 text-center max-w-xs">Look around the gallery and add some artistic masterpieces to your collection.</p>
        <button
          className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          onClick={() => navigate('/main-dashboard')}
        >
          Explore Gallery
        </button>
      </div>
    );
  }

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.artworks?.cost || 0), 0);

  return (
    <div className="min-h-screen bg-[#FDFCFD] pb-20">
      {/* Premium Header Section */}
      <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">

          <div className="relative flex items-center">

            {/* LEFT : Back button */}
            <button className="p-2">
              {/* Back icon */}
            </button>

            {/* CENTER : Title (true center) */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-900 rounded-xl text-white shadow-lg shadow-slate-900/10">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-black text-slate-950 tracking-tight">
                Shopping Cart
              </h1>
            </div>

            {/* RIGHT : Cart count */}
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden sm:inline text-sm font-bold text-slate-400 uppercase tracking-widest">
                {cartItems.length} {cartItems.length === 1 ? 'Masterpiece' : 'Masterpieces'}
              </span>
            </div>

          </div>

        </div>
      </div>


      {/* Main Cart Content */}
      <div className="max-w-7xl mx-auto pt-6 sm:pt-10 px-3 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12">
          {/* Cart Items List */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cartItems.map((item) => {
                const isAvailable = item.artworks?.availability;

                return (
                  <div
                    key={item.id}
                    className={`group bg-white rounded-xl p-2.5 sm:p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all ${!isAvailable ? 'grayscale opacity-60' : ''
                      }`}
                  >
                    <div className="flex gap-3 sm:gap-4">

                      {/* Image */}
                      <div className="w-20 sm:w-28 h-20 sm:h-28 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                        <img
                          src={item.artworks?.image_urls?.[0] || '/default-image.png'}
                          alt={item.artworks?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div
                          onClick={() => navigate(`/product?id=${item.artwork_id}`)}>
                          <h3
                            className="text-[11px] sm:text-sm font-bold uppercase text-slate-900 cursor-pointer hover:text-blue-600 truncate"

                          >
                            {item.artworks?.title}
                          </h3>

                          <p className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5">
                            ID: #{item.artwork_id.slice(0, 6)}
                          </p>

                          <div className="mt-1 sm:mt-2">
                            <PriceDisplay cost={item.artworks?.cost} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-3">

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Order Button */}
                            <button
                              className={`h-8 px-4 flex items-center justify-center gap-2 text-xs font-semibold rounded-md transition
        ${isAvailable
                                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              onClick={() => handleOrderNow(item.artwork_id)}
                              disabled={!isAvailable}
                            >
                              <ShoppingBag className="w-4 h-4" />
                              {isAvailable ? 'Order Now' : 'Out of Stock'}
                            </button>

                          </div>
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
    </div>
  );



}

export default Cart;

