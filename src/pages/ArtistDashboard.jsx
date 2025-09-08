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

  // NEW STATE: Track which section is selected
  const [activeSection, setActiveSection] = useState('home');

  const shipmentFilters = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirm' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
  ];

  // Dashboard sections menu
  const dashboardSections = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'orders', label: 'Order Management', icon: '📦' },
    { id: 'payments', label: 'Payment Analysis', icon: '💰' }
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

  function PaymentTable() {
    return (
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
                <td colSpan={5} className="text-gray-600 py-8 text-center">
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
                          ? artwork.image_urls[0]
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
    );
  }

  // NEW FUNCTION: Render content based on active section
  function renderMainContent() {
    switch (activeSection) {
      case 'home':
        return (
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome to Artist Dashboard</h2>
              <p className="text-lg text-gray-600">Click on sections from the menu to view tables</p>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Management</h2>
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
            {/* Orders Table */}
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading ordered artworks...</span>
              </div>
            ) : (
              <OrdersTable orders={orderedArtworks} />
            )}
          </div>
        );

      case 'payments':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Analysis</h2>
            {loadingPayments ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading payment data...</span>
              </div>
            ) : (
              <PaymentTable />
            )}
          </div>
        );

      default:
        return null;
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Please log in to access the artist dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="flex">
        {/* LEFT SIDEBAR - 25% width */}
        <div className="w-1/4 bg-white shadow-md min-h-screen">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Artist Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">Dashboard Sections</p>
          </div>

          {/* Menu Items */}
          <div className="p-4">
            <nav className="space-y-2">
              {dashboardSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${activeSection === section.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* RIGHT CONTENT AREA - 75% width */}
        <div className="flex-1 p-8">
          <div className="bg-white rounded-lg shadow-sm min-h-96 p-6">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArtistDashboard;
