import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const orderCategories = [
  { label: 'Current Orders', value: 'current' },
  { label: 'Past Orders', value: 'past' },
  { label: 'Canceled Orders', value: 'canceled' },
];

function Orders() {
  const [selectedCategory, setSelectedCategory] = useState('current');

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Your Orders</h1>
      <div className="flex justify-center gap-4 mb-8">
        {orderCategories.map((cat) => (
          <button
            key={cat.value}
            className={`px-4 py-2 rounded-lg font-semibold border transition-colors duration-200 ${selectedCategory === cat.value ? 'bg-yellow-400 text-white border-yellow-400' : 'bg-white text-gray-700 border-gray-300 hover:bg-yellow-50'}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
        <p className="text-lg">No orders found in <span className="font-semibold text-yellow-500">{orderCategories.find(c => c.value === selectedCategory).label}</span>.</p>
        <p className="mt-2 text-sm text-gray-400">(Order details will be shown here once available.)</p>
      </div>
    </div>
  );
}

export default Orders;
