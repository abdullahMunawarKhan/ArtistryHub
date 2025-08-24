import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const orderCategories = [
  { label: 'Current Orders', value: 'pending' },
  { label: 'Past Orders', value: 'completed' },
  { label: 'Canceled Orders', value: 'canceled' },
];

function Orders() {
  const [selectedCategory, setSelectedCategory] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [selectedCategory]);

  async function fetchOrders() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        artwork_id,
        artist_id,
        amount,
        status,
        ordered_at,
        quantity,
        artworks (title, image_urls),
        artists (name)
      `)
      .eq('user_id', user.id)
      .eq('status', selectedCategory)
      .order('ordered_at', { ascending: false });
    if (error) {
      console.error(error);
      setOrders([]);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  async function cancelOrder(orderId) {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'canceled' })
      .eq('id', orderId);
    if (error) {
      alert("Failed to cancel order: " + error.message);
    } else {
      alert("Order canceled.");
      fetchOrders();
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm("Are you sure you want to delete this order?");
    if (!confirmed) return;
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    if (error) {
      alert("Failed to delete order: " + error.message);
    } else {
      alert("Order deleted.");
      fetchOrders();
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Orders</h1>
      <div className="flex justify-center gap-4 mb-8">
        {orderCategories.map(cat => (
          <button
            key={cat.value}
            className={`px-5 py-2 rounded-lg font-semibold transition 
              ${selectedCategory === cat.value ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-yellow-50'}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-600 p-8 bg-white rounded shadow">
          No orders found in <strong>{orderCategories.find(c => c.value === selectedCategory)?.label}</strong>.
        </div>
      ) : (
        <ul className="space-y-6">
          {orders.map(order => (
            <li key={order.id} className="flex items-center gap-6 bg-white p-5 rounded shadow">
              <img
                src={order.artworks?.image_urls?.[0] ?? '/default-artwork.png'}
                alt={order.artworks?.title ?? 'Artwork'}
                className="h-24 w-24 object-cover rounded"
              />
              <div className="flex-grow">
                <h2 className="text-xl font-semibold">{order.artworks?.title ?? 'Untitled'}</h2>
                <p className="text-yellow-700 font-bold">₹{order.amount?.toFixed(2) ?? order.amount}</p>
                <p>Quantity: {order.quantity}</p>
                <p>Status: <span className="capitalize">{order.status}</span></p>
                <p>Ordered at: {new Date(order.ordered_at).toLocaleDateString()}</p>
                <p>Artist: {order.artists?.name ?? 'Unknown'}</p>
              </div>
              <div className="flex flex-col gap-2">
                {selectedCategory === 'pending' && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded"
                  >
                    Cancel
                  </button>
                )}
                {(selectedCategory === 'completed' || selectedCategory === 'canceled') && (
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="bg-gray-600 hover:bg-gray-800 text-white py-1 px-3 rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Orders;
