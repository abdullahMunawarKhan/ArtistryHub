import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";

function ArtistDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [artistId, setArtistId] = useState(null);
  const [orderedArtworks, setOrderedArtworks] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [artworks, setArtworks] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const shipmentFilters = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirm' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
  ];

  // Load user and artist info
  useEffect(() => {
    async function loadUserAndArtist() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) return;
      const { data: artist } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();
      setArtistId(artist?.id || null);
    }
    loadUserAndArtist();
  }, []);

  // Fetch delivered artworks for payment analysis
  useEffect(() => {
    async function fetchArtworks() {
      setLoadingPayments(true);
      const { data, error } = await supabase
        .from('artworks')
        .select('id, title, image_urls, cost, artist_payment, artist_id,base_price')
        .eq('artist_id', artistId)
        .eq('shipment_status', 'delivered')
        .order('created_at', { ascending: false });

      if (!error) setArtworks(data || []);
      setLoadingPayments(false);
    }
    if (artistId) fetchArtworks();
  }, [artistId]);

  // Fetch orders for order management
  useEffect(() => {
    if (artistId) {
      fetchOrderedArtworks();
    }
  }, [artistId, selectedFilter]);

  async function fetchOrderedArtworks() {
    setLoadingOrders(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          artwork_id,
          shipment_status,
          ordered_at,
          quantity,
          
          shipping_address,
          user_id,
          artwork:artworks (
            id,
            title,
            image_urls,
            artist_id,
            base_price,
            cost 
          )
        `)
        .not('shipment_status', 'is', null)
        .eq('artwork.artist_id', artistId);

      if (selectedFilter !== 'all') {
        query = query.eq('shipment_status', selectedFilter);
      }

      const { data, error } = await query.order('ordered_at', { ascending: false });

      if (error) {
        console.error('Error fetching ordered artworks:', error.message);
        setOrderedArtworks([]);
      } else {
        setOrderedArtworks(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setOrderedArtworks([]);
    }
    setLoadingOrders(false);
  }

  // Pickup time/date logic for 'pending' orders
  async function updatePickupDetails(artworkId, pickupDate, pickupTime) {
    try {
      const { error } = await supabase
        .from('artworks')
        .update({
          pickup_date: pickupDate,
          pickup_time: pickupTime
        })
        .eq('id', artworkId);

      if (error) {
        console.error('Error updating pickup details:', error);
        alert('Failed to save pickup details. Please try again.');
      } else {
        alert('Pickup details saved successfully!');
        fetchOrderedArtworks(); // Refresh the data
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save pickup details. Please try again.');
    }
  }

  function generateAvailableDates() {
    const dates = [];
    const today = new Date();
    // Generate dates starting from 3 days after today
    for (let i = 3; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }

  function generateTimeSlots() {
    const slots = [];
    for (let hour = 10; hour <= 18; hour++) {
      const suffix = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour;
      const display = `${displayHour}:00 ${suffix}`;
      const value = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({ display, value });
    }
    return slots;
  }

  function PickupScheduler({ artwork }) {
    const [selectedDate, setSelectedDate] = useState(artwork.pickup_date || '');
    const [selectedTime, setSelectedTime] = useState(artwork.pickup_time || '');
    const availableDates = generateAvailableDates();
    const timeSlots = generateTimeSlots();

    const handleSave = () => {
      if (!selectedDate || !selectedTime) {
        alert('Please select both date and time for pickup.');
        return;
      }
      updatePickupDetails(artwork.id, selectedDate, selectedTime);
    };

    return (
      <div className="pickup-scheduler mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-3">📦 Schedule Pickup</h4>
        <p className="text-sm text-yellow-700 mb-4">Be ready with packaging. Choose your preferred pickup date and time:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date</label>
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Date</option>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Time</label>
            <select
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Time</option>
              {timeSlots.map(slot => (
                <option key={slot.value} value={slot.value}>{slot.display}</option>
              ))}
            </select>
          </div>
        </div>
        {(artwork.pickup_date && artwork.pickup_time) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              <strong>Current Schedule:</strong> {' '}
              {new Date(artwork.pickup_date).toLocaleDateString()} at {' '}
              {new Date(`2000-01-01T${artwork.pickup_time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>
        )}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
        >
          Save Pickup Schedule
        </button>
      </div>
    );
  }
  function OrdersTable({ orders }) {
    if (orders.length === 0) {
      return (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-2">Title</th>
              <th className="py-3 px-2">Base Price</th>
              <th className="py-3 px-2">Selling Cost</th>
              <th className="py-3 px-2">Ordered</th>
              <th className="py-3 px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-600">
                No orders found.
              </td>
            </tr>
          </tbody>
        </table>
      );
    }

    return (
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-2">Title</th>
            <th className="py-3 px-2">Base Price</th>
            <th className="py-3 px-2">Selling Cost</th>
            <th className="py-3 px-2">Ordered</th>
            <th className="py-3 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="even:bg-gray-50 hover:bg-blue-50 cursor-pointer"
              onClick={() => navigate(`/product-details?id=${order.artwork?.id}`)}>
              <td className="text-blue-700 underline">{order.artwork?.title || 'Unknown'}</td>
              <td>₹{order.artwork?.base_price?.toFixed(2) ?? 'N/A'}</td>
              <td>₹{order.artwork?.cost?.toFixed(2) ?? 'N/A'}</td>
              <td>{new Date(order.ordered_at).toLocaleDateString()}</td>
              <td>{order.shipment_status?.toUpperCase() || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }


  function OrderCard({ order }) {
    const { artwork, shipment_status, ordered_at, amount, shipping_address } = order;
    const statusInfo = {
      pending: {
        message: 'Be ready with packaging',
        color: 'yellow',
        showScheduler: true
      },
      confirm: {
        message: 'Pickup time and address will be notified shortly through SMS. Be ready with your package.',
        color: 'blue',
        showScheduler: false
      },
      shipped: {
        message: 'SMS is sent to you. Check out and be ready timely.',
        color: 'purple',
        showScheduler: false
      },
      delivered: {
        message: 'Your artwork has reached the customer! You will receive payment shortly. Enjoy the day and best wishes for the future! 🎉',
        color: 'green',
        showScheduler: false
      }
    }[shipment_status] || {
      message: 'Status unknown',
      color: 'gray',
      showScheduler: false
    };
    const colorClasses = {
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      green: 'bg-green-50 border-green-200 text-green-800',
      gray: 'bg-gray-50 border-gray-200 text-gray-800'
    };

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition mb-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Artwork Image */}
          <div className="flex-shrink-0">
            <img
              src={artwork?.image_urls?.[0] || '/placeholder-image.jpg'}
              alt={artwork?.title || 'Artwork'}
              className="w-24 h-24 object-cover rounded-lg cursor-pointer"
              onClick={() => navigate(`/product-details?id=${artwork?.id}`)}
            />
          </div>
          {/* Order Details */}
          <div className="flex-grow">
            <h3
              className="text-lg font-semibold text-blue-700 underline mb-2 cursor-pointer"
              onClick={() => navigate(`/product-details?id=${artwork?.id}`)}
            >
              {artwork?.title || 'Unknown Artwork'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">

              <div>
                <span className="font-medium">Base Price:</span> ₹{artwork?.base_price?.toFixed(2) ?? 'N/A'}
              </div>
              <div>
                <span className="font-medium">Selling Cost:</span> ₹{artwork?.cost?.toFixed(2) ?? 'N/A'}
              </div>
              <div>
                <span className="font-medium">Ordered:</span> {new Date(ordered_at).toLocaleDateString()}
              </div>
              <div>
                <span className={
                  `inline-block px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`
                }>
                  {shipment_status?.toUpperCase()}
                </span>
              </div>
            </div>
            {shipping_address && (
              <div className="mb-3">
                <span className="font-medium text-gray-700">Shipping to:</span>
                <p className="text-sm text-gray-600">{shipping_address}</p>
              </div>
            )}
            <div className={`p-3 rounded-lg border ${colorClasses[statusInfo.color]} mb-3`}>
              <p className="text-sm font-medium">{statusInfo.message}</p>
            </div>
            {statusInfo.showScheduler && (
              <PickupScheduler artwork={artwork} />
            )}
          </div>
        </div>
      </div>
    );
  }

  const pickupCharge = 50;

  // Payment Analysis Table
  function PaymentTable() {
    return (
      <div className="bg-white rounded shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Payment Analysis</h2>
        {loadingPayments ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-2">Item</th>
                  <th className="py-3 px-2">Image</th>
                  <th className="py-3 px-2">Base Price (payment amount)</th>
                  <th className="py-3 px-2">Cost</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {artworks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-gray-600 py-8 text-center">
                      No delivered artworks found for payment analysis.
                    </td>
                  </tr>
                ) : (
                  artworks.map(artwork => {


                    return (
                      <tr key={artwork.id} className="even:bg-gray-50 hover:bg-blue-50">
                        <td
                          className="text-blue-700 underline cursor-pointer"
                          onClick={() => navigate(`/product-details?id=${artwork.id}`)}
                        >
                          {artwork.title}
                        </td>
                        <td>
                          <img
                            src={Array.isArray(artwork.image_urls)
                              ? artwork.image_urls
                              : artwork.image_urls}
                            alt={artwork.title}
                            className="w-12 h-12 rounded cursor-pointer"
                            onClick={() => navigate(`/product-details?id=${artwork.id}`)}
                          />
                        </td>
                        <td>₹{artwork.base_price}</td>
                        <td>₹{artwork.cost}</td>
                        

                        <td>
                          <span className={
                            artwork.artist_payment === 'successful'
                              ? 'text-green-600 font-semibold px-2 py-1 bg-green-50 rounded'
                              : 'text-yellow-600 font-semibold px-2 py-1 bg-yellow-50 rounded'
                          }>
                            {artwork.artist_payment || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }


  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Please log in to access the artist dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Artist Dashboard</h1>
          <p className="text-gray-600">Manage your ordered and payments</p>
        </div>
        {/* Order Management Section */}
        <h2 className="text-xl font-semibold mb-4">Order Management</h2>
        <div>
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {shipmentFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${selectedFilter === filter.value
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          {/* Order Cards */}
          {loadingOrders ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading ordered artworks...</span>
            </div>
          ) : (
            <OrdersTable orders={orderedArtworks} />
          )}

        </div>
        {/* Payment Analysis Section */}
        <PaymentTable />
      </div>
    </div>
  );
}

export default ArtistDashboard;


