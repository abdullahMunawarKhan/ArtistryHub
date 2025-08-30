// src/pages/Orders.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const ORDER_CATEGORIES = [
  { label: 'Current Orders', value: 'pending' },
  { label: 'Past Orders', value: 'completed' },
  { label: 'Canceled Orders', value: 'canceled' },
];

export default function Orders() {
  const [selectedCategory, setSelectedCategory] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
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
        amount,
        status,
        ordered_at,
        quantity,
        artworks ( title, image_urls ),
        artists ( name )
        tracking_id, 
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

  async function cancelOrder(id) {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    // Get the order details before canceling
    const { data: orderData } = await supabase
      .from('orders')
      .select('artwork_id')
      .eq('id', id)
      .single();

    // Cancel the order
    const { error: cancelError } = await supabase
      .from('orders')
      .update({ status: 'canceled' })
      .eq('id', id);

    if (cancelError) {
      alert('Failed to cancel: ' + cancelError.message);
      return;
    }

    // Make artwork available again
    if (orderData?.artwork_id) {
      const { error: availabilityError } = await supabase
        .from('artworks')
        .update({ availability: true })
        .eq('id', orderData.artwork_id);

      if (availabilityError) {
        console.error('Failed to update availability:', availabilityError);
      }
    }

    fetchOrders();
  }


  async function deleteOrder(id) {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) alert('Failed to delete: ' + error.message);
    else fetchOrders();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white bg-opacity-80 rounded-xl shadow-construction-lg">
      <h1 className="text-4xl font-bold text-gradient mb-6 font-['Nova_Round',cursive]">
        Your Orders
      </h1>

      <div className="flex space-x-4 mb-6">
        {ORDER_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`btn-chip ${selectedCategory === cat.value ? 'active' : ''
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-600">
          No orders in this category.
        </p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => {
            const imgUrl = order.artworks.image_urls?.[0] || '';
            return (
              <li
                key={order.id}
                className="flex items-center bg-white rounded-lg shadow-construction p-4"
              >
                {imgUrl && (
                  <img
                    src={imgUrl}
                    alt={order.artworks.title}
                    className="w-24 h-24 object-cover rounded mr-6"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    {order.artworks.title}
                  </h2>
                  <p className="text-gray-600">
                    Artist: {order.artists?.name || 'Unknown'}
                  </p>
                  <p className="text-gray-600">
                    Quantity: {order.quantity}
                  </p>
                  <p className="text-gray-600">
                    Amount:{' '}
                    <span className="font-semibold text-yellow-600">
                      ₹{order.amount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Ordered on:{' '}
                    {new Date(order.ordered_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2">
                    <span
                      className={`badge-primary ${order.status === 'pending'
                          ? 'badge-primary'
                          : order.status === 'completed'
                            ? 'badge-secondary'
                            : 'badge-red-500 text-white'
                        }`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </p>
                  {order.tracking_id ? (
                    <button
                      onClick={() => navigate(`/track-order/${order.tracking_id}`)}
                      className="btn-primary ml-4"
                    >
                      Track Order
                    </button>
                  ) : (
                    <p className="text-gray-500 ml-4">Awaiting Shipment</p>
                  )}
                </div>
                {selectedCategory === 'pending' ? (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="btn-outline ml-4"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="btn-outline ml-4"
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
