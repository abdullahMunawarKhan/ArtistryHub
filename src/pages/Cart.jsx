import React from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

function Cart() {
  // For now, show empty cart UI
  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Your Cart</h1>
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <svg className="mx-auto mb-4" width="48" height="48" fill="none" stroke="#fbbf24" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A1 1 0 0 0 6.6 17h10.8a1 1 0 0 0 .95-.68L21 13M7 13V6h13" />
        </svg>
        <p className="text-lg text-gray-600">No items in your cart yet.</p>
        <p className="mt-2 text-sm text-gray-400">Items you add from products will appear here for checkout.</p>
        <button className="mt-6 px-6 py-2 bg-yellow-400 text-white font-semibold rounded-lg shadow hover:bg-yellow-500 transition">Continue Shopping</button>
      </div>
    </div>
  );
}

export default Cart;
