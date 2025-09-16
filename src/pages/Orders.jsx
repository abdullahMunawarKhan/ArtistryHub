// src/pages/Orders.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const ORDER_CATEGORIES = [
  { label: 'in process (in 20 hr)', value: 'pending' },
  { label: 'Current Orders', value: 'confirm' },
  { label: 'Past Orders', value: 'dilevered' },
  { label: 'Canceled Orders', value: 'canceled' },
];
// Place this code above your Orders component
function OrderTimer({ orderedAt }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    function updateRemaining() {
      const placed = new Date(orderedAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, 24 * 60 * 60 * 1000 - (now - placed));
      setRemaining(diff);
    }
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [orderedAt]);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return (
    <div className="text-sm mt-3 mb-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
      {remaining > 0 ? (
        <span className="font-medium text-blue-700">
          ⏳ Cancel before : {hours.toString().padStart(2, '0')} :
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')} <br />Afterwards not allowed to Cancel.
        </span>
      ) : (
        <span className="text-green-600 font-semibold">✔️ 24 hours passed. Status can now be confirmed.</span>
      )}
    </div>
  );
}

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
        amount,
        status,
        shipment_status,
        ordered_at,
        quantity,
        tracking_id,
        refund_amount,
        refund_status, 
        artwork:artworks (title,id,image_urls,artist:artists (name))
      `)

      .eq('user_id', user.id)
      .eq('shipment_status', selectedCategory)
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
      .update({ shipment_status: 'canceled' })
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
    <div className="min-h-[90vh] max-w-4xl mx-auto p-6 pt-12 bg-white bg-opacity-80 rounded-xl shadow-construction-lg">
      <h1 className="text-4xl font-bold text-gradient mb-6 font-['Nova_Round',cursive]">
        Your Orders
      </h1>

      <div className="flex space-x-4 mb-6">
        {ORDER_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`btn-chip ${selectedCategory === cat.value ? 'active' : ''}`}
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
          {orders.map((order) => (
            <li
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row items-start relative hover:shadow-xl transition-shadow duration-200"
            >
              <div
                className="flex cursor-pointer w-full sm:w-auto"
                onClick={() => navigate(`/product?id=${order.artwork.id}`)}
              >
                <img
                  src={order.artwork?.image_urls?.[0] || ''}
                  alt={order.artwork?.title || 'Artwork'}
                  className="w-24 h-24 object-cover rounded-lg mr-6 shadow-md border"
                />
                <div className="flex-1 space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {order.artwork?.title || 'Untitled'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Artist: <span className="font-medium">{order.artwork?.artist?.name || 'Unknown'}</span>
                  </p>
                  <p className="text-yellow-600 font-semibold text-lg">
                    ₹{order.amount.toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Ordered on: {new Date(order.ordered_at).toLocaleDateString()}
                  </p>
                  <p className="mt-1">
                    <span className={`inline-block py-1 px-2 rounded-full text-xs font-semibold
              ${order.status === 'pending'
                        ? 'bg-blue-100 text-blue-600'
                        : order.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </p>
                  {!order.tracking_id && (
                    <div className="flex flex-col items-start gap-2 mt-4">
                      {order.shipment_status === 'canceled' ? (
                        <>
                          <span className="text-red-500 font-medium">
                            Refund of ₹{order.refund_amount?.toFixed(2) || '0.00'}
                            will be credited to your account in 3-4 business days
                          </span>
                          <div className="mt-1">
                            <div
                              className="inline-block px-4 py-2 rounded-lg bg-blue-50 border border-blue-300 text-blue-800 font-semibold text-sm shadow-sm"
                              style={{ pointerEvents: 'none', cursor: 'default' }}
                            >
                              Refund Status:{" "}
                              {order.refund_status
                                ? order.refund_status.charAt(0).toUpperCase() + order.refund_status.slice(1)
                                : 'Pending'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">Awaiting Shipment</span>
                          {order.shipment_status === 'pending' && (
                            <OrderTimer orderedAt={order.ordered_at} />
                          )}
                        </>
                      )}
                    </div>

                  )}
                </div>
              </div>
              <div className="flex flex-col items-end mt-4 sm:mt-0 sm:ml-auto">
                {selectedCategory === 'pending' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelOrder(order.id);
                    }}
                    className="btn-outline px-6 py-2 rounded-xl border border-blue-400 text-blue-500 hover:bg-blue-50 transition"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOrder(order.id);
                    }}
                    className="btn-outline px-6 py-2 rounded-xl border border-gray-400 text-gray-500 hover:bg-gray-50 transition"
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
