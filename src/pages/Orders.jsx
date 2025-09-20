// src/pages/Orders.jsx
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const ORDER_CATEGORIES = [
  { label: 'All', value: 'all' },

  { label: 'Current Orders', value: 'current' },
  { label: 'Past Orders', value: 'dilevered' },
  { label: 'Canceled Orders', value: 'canceled' },
];

// Place this code above your Orders component
function OrderTimer({ orderedAt, orderId, shipmentStatus, onStatusUpdated }) {
  const [remaining, setRemaining] = useState(0);
  const [didUpdate, setDidUpdate] = useState(false);
  const updatingRef = useRef(false);

  useEffect(() => {
    function updateRemaining() {
      // Use the stored IST timestamp directly
      const placed = new Date(orderedAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, 24 * 60 * 60 * 1000 - (now - placed));
      setRemaining(diff);

      if (diff === 0 && shipmentStatus === 'pending' && !updatingRef.current && !didUpdate) {
        updatingRef.current = true;
        supabase
          .from('orders')
          .update({ shipment_status: 'confirm' })
          .eq('id', orderId)
          .then(() => {
            setDidUpdate(true);
            if (onStatusUpdated) onStatusUpdated();
          })
          .finally(() => {
            updatingRef.current = false;
          });
      }
    }
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [orderedAt, shipmentStatus, orderId, onStatusUpdated, didUpdate]);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return (
    <div className="text-sm mt-3 mb-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
      {remaining > 0 ? (
        <span className="font-medium text-blue-700">
          ⏳ Cancel before: {hours.toString().padStart(2, '0')}:
          {minutes.toString().padStart(2, '0')}:
          {seconds.toString().padStart(2, '0')}<br />
          Afterwards not allowed to Cancel.
        </span>
      ) : (
        <span className="text-green-600 font-semibold">
          ✔️ 24 hours passed. Status can now be confirmed.
        </span>
      )}
    </div>
  );
}


export default function Orders() {
  const [selectedCategory, setSelectedCategory] = useState('all');
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
    let query = supabase
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
      refund_utr,
      refund_status, 
      artwork:artworks (title,id,image_urls,artist:artists (name))
    `)
      .eq('user_id', user.id);

    if (selectedCategory === 'current') {
      query = query.in('shipment_status', ['confirm', 'pending', 'shipped']);
    } else if (selectedCategory !== 'all') {
      query = query.eq('shipment_status', selectedCategory);
    }


    const { data, error } = await query.order('ordered_at', { ascending: false });

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

    // ✅ IMPROVED: Check for other active orders before making available
    if (orderData?.artwork_id) {
      const { data: activeOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('artwork_id', orderData.artwork_id)
        .not('shipment_status', 'eq', 'canceled');

      // Only make available if no active orders exist
      if (!activeOrders || activeOrders.length === 0) {
        await supabase
          .from('artworks')
          .update({ availability: true })
          .eq('id', orderData.artwork_id);
      }
    }

    fetchOrders();
  }




  async function deleteOrder(id) {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    const { error } = await supabase
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null);
    if (error) alert('Failed to delete: ' + error.message);
    else fetchOrders();
  }

  return (
    <div className="min-h-[90vh] max-w-4xl mx-auto p-4 sm:p-6 pt-12 bg-white bg-opacity-80 rounded-xl shadow-construction-lg">
      <h1 className="text-3xl sm:text-4xl font-bold text-gradient mb-6 font-['Nova_Round',cursive] text-center sm:text-left">
        Your Orders
      </h1>

      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
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
        <p className="text-center text-gray-600">No orders in this category.</p>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => (
            <li
              key={order.id}
              className="bg-white border border-gray-100 rounded-2xl shadow-lg p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start hover:shadow-xl transition-shadow duration-200"
            >
              {/* Image + details */}
              <div
                className="flex flex-col sm:flex-row w-full cursor-pointer gap-4"
                onClick={() => navigate(`/product?id=${order.artwork.id}`)}
              >
                <img
                  src={order.artwork?.image_urls?.[0] || ''}
                  alt={order.artwork?.title || 'Artwork'}
                  className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-lg shadow-md border"
                />
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
                    {order.artwork?.title || 'Untitled'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Artist:{" "}
                    <span className="font-medium">
                      {order.artwork?.artist?.name || 'Unknown'}
                    </span>
                  </p>
                  <p className="text-yellow-600 font-semibold text-base sm:text-lg">
                    ₹{order.amount.toFixed(2)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Ordered on: {new Date(order.ordered_at).toLocaleDateString()}
                  </p>

                  {/* Status badge */}
                  <p>
                    <span
                      className={`inline-block py-1 px-2 rounded-full text-xs font-semibold
                      ${order.status === 'pending'
                          ? 'bg-blue-100 text-blue-600'
                          : order.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </p>

                  {/* Shipment / Refund details */}
                  {!order.tracking_id && (
                    <div className="flex flex-col items-start gap-2 mt-4 text-sm">
                      {order.shipment_status === 'canceled' ? (
                        <>
                          {order.refund_status !== 'done' && (
                            <span className="text-red-500 font-medium">
                              Refund of ₹{order.refund_amount?.toFixed(2) || '0.00'} will be credited
                              in 3-4 business days
                            </span>
                          )}
                          <div className="mt-1">
                            <div
                              className="inline-block px-3 py-1 rounded-lg bg-blue-50 border border-blue-300 text-blue-800 font-semibold text-xs shadow-sm"
                              style={{ pointerEvents: 'none', cursor: 'default' }}
                            >
                              Refund Status:{" "}
                              {order.refund_status
                                ? order.refund_status.charAt(0).toUpperCase() +
                                order.refund_status.slice(1)
                                : 'Pending'}
                            </div>
                          </div>
                          {order.refund_status === 'done' && (
                            <div className="mt-2 text-gray-700 space-y-1">
                              <div>Refund Amount: ₹{order.refund_amount?.toFixed(2) || '0.00'}</div>
                              <div>Refund UTR: {order.refund_utr || 'N/A'}</div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-gray-500">Awaiting Shipment</span>
                          {order.shipment_status === 'pending' && (
                            <OrderTimer
                              orderedAt={order.ordered_at}
                              orderId={order.id}
                              shipmentStatus={order.shipment_status}
                              onStatusUpdated={fetchOrders}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side actions */}
              <div className="mt-4 sm:mt-0 sm:ml-auto flex flex-col items-stretch sm:items-end gap-3 w-full sm:w-auto">
                {/* Shipment Status */}
                <div
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-center
                  ${order.shipment_status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.shipment_status === 'confirm'
                        ? 'bg-blue-100 text-blue-800'
                        : order.shipment_status === 'dilevered'
                          ? 'bg-green-100 text-green-800'
                          : order.shipment_status === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : order.shipment_status === 'shipped'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {order.shipment_status.charAt(0).toUpperCase() + order.shipment_status.slice(1)}
                </div>

                {/* Tracking Info */}
                {(order.tracking_id || order.shipment_status === 'shipped') && (
                  <div
                    className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-sm text-purple-800 cursor-pointer hover:bg-purple-100 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (order.tracking_id) {
                        navigate(`/track-order/${order.tracking_id}`);
                      }
                    }}
                  >
                    <p className="font-semibold">
                      Tracking ID:{" "}
                      <span className="font-bold text-purple-900">
                        {order.tracking_id || "Not Available"}
                      </span>
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-purple-600">
                      📲 A tracking link has been sent to your WhatsApp.
                      {order.tracking_id && (
                        <span className="ml-2 text-purple-700 font-medium">→ Click to track</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {order.shipment_status === 'pending' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelOrder(order.id);
                    }}
                    className="btn-outline w-full sm:w-auto px-6 py-2 rounded-xl border border-blue-400 text-blue-500 hover:bg-blue-50 transition"
                  >
                    Cancel
                  </button>
                ) : order.shipment_status === 'dilevered' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOrder(order.id);
                    }}
                    className="btn-outline w-full sm:w-auto px-6 py-2 rounded-xl border border-gray-400 text-gray-500 hover:bg-gray-50 transition"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );


}


