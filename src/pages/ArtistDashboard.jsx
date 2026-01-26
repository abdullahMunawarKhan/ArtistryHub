import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { Home, Package, Wallet } from "lucide-react";


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

  // NEW STATE: Modal state for pickup scheduling
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const shipmentFilters = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirm' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
  ];

  // Dashboard sections menu
  const dashboardSections = [
    { id: "home", label: "Home", icon: Home },
    { id: "orders", label: "Order Management", icon: Package },
    { id: "payments", label: "Payment Analysis", icon: Wallet },
  ];


  const sectionRef = useRef(null);
  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

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
    async function fetchDeliveredArtworks() {
      setLoadingPayments(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            artwork:artworks (
              id,
              title,
              image_urls,
              cost,
              artist_payment,
              artist_id,
              base_price,
              artist_utr
            )
          `)
          .eq('shipment_status', 'delivered')
          .eq('artwork.artist_id', artistId);

        if (error) {
          throw error;
        }

        const artworksFromDeliveredOrders = [];
        const seenArtworkIds = new Set();

        data.forEach(order => {
          const artwork = order.artwork;
          if (artwork && !seenArtworkIds.has(artwork.id)) {
            seenArtworkIds.add(artwork.id);
            artworksFromDeliveredOrders.push(artwork);
          }
        });

        setArtworks(artworksFromDeliveredOrders);
      } catch (err) {
        console.error('Error fetching delivered artworks:', err.message);
        setArtworks([]);
      }
      setLoadingPayments(false);
    }
    if (artistId) fetchDeliveredArtworks();
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
      const { data: artistArtworks, error: artworkError } = await supabase
        .from('artworks')
        .select('id')
        .eq('artist_id', artistId);

      if (artworkError) {
        throw artworkError;
      }

      const artistArtworkIds = artistArtworks ? artistArtworks.map(a => a.id) : [];

      if (artistArtworkIds.length === 0) {
        setOrderedArtworks([]);
        setLoadingOrders(false);
        return;
      }

      // UPDATED QUERY: Include pickup_date and pickup_time from orders table
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
          pickup_date,
          pickup_time,
          artwork:artworks (
            id,
            title,
            image_urls,
            artist_id,
            base_price,
            artist_utr,
            cost 
          )
        `)
        .not('shipment_status', 'is', null)
        .not('shipment_status', 'eq', 'canceled')
        .not('shipment_status', 'eq', 'cancelled')
        .in('artwork_id', artistArtworkIds);

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

  // NEW FUNCTION: Update pickup details in orders table
  async function updatePickupDetails(orderId, pickupDate, pickupTime) {
    try {
      console.log('Updating pickup details for order:', orderId, 'Date:', pickupDate, 'Time:', pickupTime);

      const { data, error } = await supabase  // ✅ Now destructuring BOTH data and error
        .from('orders')
        .update({
          pickup_date: pickupDate,
          pickup_time: pickupTime
        })
        .eq('id', orderId)
        .select(); // This returns the updated row for verification

      console.log('Updated data:', data); // ✅ Now 'data' is properly defined

      if (error) {
        console.error('Error updating pickup details:', error);
        alert('Failed to save pickup details. Please try again.');
        return false;
      } else {
        alert('Pickup details saved successfully!');
        // Force refresh the orders data
        await fetchOrderedArtworks();
        setIsPickupModalOpen(false);
        setSelectedOrder(null);
        return true;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save pickup details. Please try again.');
      return false;
    }
  }

  function generateAvailableDates() {
    const dates = [];
    const today = new Date();
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

  // NEW COMPONENT: Pickup Modal
  function PickupModal({ isOpen, onClose, order, onSubmit }) {
    const [selectedDate, setSelectedDate] = useState(order?.pickup_date || '');
    const [selectedTime, setSelectedTime] = useState(order?.pickup_time || '');
    const [loading, setLoading] = useState(false);

    const availableDates = generateAvailableDates();
    const timeSlots = generateTimeSlots();

    // Reset form when order changes
    useEffect(() => {
      if (order) {
        setSelectedDate(order.pickup_date || '');
        setSelectedTime(order.pickup_time || '');
      }
    }, [order]);

    const handleSubmit = async () => {
      if (!selectedDate || !selectedTime) {
        alert('Please select both date and time for pickup.');
        return;
      }

      setLoading(true);
      const success = await onSubmit(order.id, selectedDate, selectedTime);
      setLoading(false);
    };

    const handleClose = () => {
      setSelectedDate(order?.pickup_date || '');
      setSelectedTime(order?.pickup_time || '');
      onClose();
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-3 sm:p-6">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 pr-2">
                📦 Schedule Pickup <span className="hidden sm:inline">(you will be unable to resheduled once set)</span>
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Order Info */}
            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700">
                <strong>Artwork:</strong> {order?.artwork?.title?.toUpperCase() || 'Unknown'}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Be ready with packaging. Choose your preferred pickup date and time:
            </p>

            {/* Date and Time Selection */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Pickup Date
                </label>
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Date</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Pickup Time
                </label>
                <select
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Time</option>
                  {timeSlots.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.display}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Schedule Display */}
            {(order?.pickup_date && order?.pickup_time) && (
              <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs sm:text-sm text-green-700">
                  <strong>Current Schedule:</strong> {' '}
                  {new Date(order.pickup_date).toLocaleDateString()} at {' '}
                  {new Date(`2000-01-01T${order.pickup_time}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-300 text-gray-700 py-1.5 sm:py-2 px-2 sm:px-4 rounded-md hover:bg-gray-400 transition-colors duration-200 font-medium text-xs sm:text-sm"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-1.5 sm:py-2 px-2 sm:px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 text-xs sm:text-sm"
              >
                {loading ? 'Saving...' : 'Save Pickup Schedule'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UPDATED COMPONENT: Orders Table with Set Pickup column
  function OrdersTable({ orders }) {
    const handleSetPickup = (order) => {
      setSelectedOrder(order);
      setIsPickupModalOpen(true);
    };

    if (orders.length === 0) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-1 sm:py-3 sm:px-2">No</th>
                <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Title</th>
                <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden sm:table-cell">Base</th>
                <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden md:table-cell">Cost</th>
                <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden sm:table-cell">Date</th>
                <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Status</th>
                <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Pickup</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-6 sm:py-8 text-gray-600 text-xs sm:text-sm">
                  No orders found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-1 sm:py-3 sm:px-2">No</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Title</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden sm:table-cell">Base</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden md:table-cell">Cost</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden sm:table-cell">Date</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Status</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Pickup</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order.id}
                className="even:bg-gray-50 hover:bg-blue-50"
              >
                <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center">{index + 1}</td>
                <td
                  className="py-1.5 px-1 sm:py-2 sm:px-2 text-black-700 text-center align-middle cursor-pointer truncate max-w-[100px] sm:max-w-none"
                  onClick={() => navigate(`/product?id=${order.artwork?.id}`)}
                >
                  {(order.artwork?.title || 'Unknown').toUpperCase()}
                </td>
                <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle hidden sm:table-cell">
                  ₹{order.artwork?.base_price?.toFixed(2) ?? 'N/A'}
                </td>
                <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle hidden md:table-cell">
                  ₹{order.artwork?.cost?.toFixed(2) ?? 'N/A'}
                </td>
                <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle hidden sm:table-cell">
                  {new Date(order.ordered_at).toLocaleDateString()}
                </td>
                <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle">
                  <span className={`px-1 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-semibold ${order.shipment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.shipment_status === 'confirm' ? 'bg-blue-100 text-blue-800' :
                      order.shipment_status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.shipment_status === 'delivered' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {order.shipment_status?.toUpperCase() || '-'}
                  </span>
                </td>
                <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle">
                  {(order.pickup_date != null && order.pickup_time != null && order.pickup_date && order.pickup_time ? (
                    <div className="text-[10px] sm:text-xs">
                      <div className="font-medium text-green-700">
                        {new Date(order.pickup_date).toLocaleDateString('en-US', {
                          year: '2-digit',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-600">
                        {new Date(`2000-01-01T${order.pickup_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSetPickup(order)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[10px] sm:text-xs"
                    >
                      Set Pickup
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function PaymentTable() {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">No</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Item</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden sm:table-cell">Image</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Amount</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden md:table-cell">Cost</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center hidden sm:table-cell">UTR</th>
              <th className="py-2 px-1 sm:py-3 sm:px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {artworks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-gray-600 py-6 sm:py-8 text-center text-xs sm:text-sm">
                  No delivered artworks found for payment analysis.
                </td>
              </tr>
            ) : (
              artworks.map((artwork, index) => {
                return (
                  <tr key={artwork.id} className="even:bg-gray-50 hover:bg-blue-50"
                    onClick={() => navigate(`/product?id=${artwork.id}`)}>
                    <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle">{index + 1}</td>
                    <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle truncate max-w-[80px] sm:max-w-none">
                      {artwork.title.toUpperCase()}
                    </td>
                    <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle hidden sm:table-cell">
                      <img
                        src={Array.isArray(artwork.image_urls)
                          ? artwork.image_urls[0]
                          : artwork.image_urls}
                        alt={artwork.title}
                        className="w-8 h-8 sm:w-12 sm:h-12 rounded cursor-pointer mx-auto"
                      />
                    </td>
                    <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle">₹{artwork.base_price}</td>
                    <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle hidden md:table-cell">₹{artwork.cost}</td>
                    <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle hidden sm:table-cell">
                      {artwork.artist_utr && String(artwork.artist_utr).trim() !== '' ? (
                        artwork.artist_utr
                      ) : (
                        <span className="text-yellow-600 font-semibold text-[10px] sm:text-xs">Waiting for payment</span>
                      )}
                    </td>
                    <td className="py-1.5 px-1 sm:py-2 sm:px-2 text-center align-middle">
                      <span
                        className={
                          artwork.artist_payment === 'successful'
                            ? 'text-green-600 font-semibold px-1 py-0.5 sm:px-2 sm:py-1 bg-green-50 rounded text-[10px] sm:text-xs'
                            : 'text-yellow-600 font-semibold px-1 py-0.5 sm:px-2 sm:py-1 bg-yellow-50 rounded text-[10px] sm:text-xs'
                        }
                      >
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

  // Render content based on active section
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
            <div className="mb-4 sm:mb-6">
              <div className="border-b border-gray-200">
                <nav className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 mb-2 sm:mb-4">
                  {shipmentFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`py-1 sm:py-2 px-1 border-b-2 font-medium text-xs sm:text-sm truncate ${selectedFilter === filter.value
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
    <div className="min-h-screen bg-gray-50 pt-0">
      <div className="flex flex-col md:flex-row">
        {/* LEFT SIDEBAR - 25% width */}
        <div className="w-full md:w-1/4 bg-white shadow-md">
          {/* Header */}
          <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 text-center sm:text-left">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Artist Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Dashboard Sections
            </p>
          </div>


          {/* Menu Items */}
          <div className="p-2 sm:p-3 md:p-4">
            <nav className="flex flex-col space-y-1 sm:space-y-2">
              {dashboardSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full text-left px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm md:text-base ${activeSection === section.id
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "hover:bg-gray-100 text-gray-700"
                    }`}
                >
                  <span className="text-base sm:text-lg">{section.icon}</span>
                  <span className="font-medium truncate">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* RIGHT CONTENT AREA - 75% width */}
        <div className="flex-1 p-3 sm:p-5 md:p-8">
          <div
            ref={sectionRef}
            className="flex-1 p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-sm min-h-96"
          >
            {renderMainContent()}
          </div>
        </div>
      </div>

      {/* Pickup Modal */}
      <PickupModal
        isOpen={isPickupModalOpen}
        onClose={() => {
          setIsPickupModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSubmit={updatePickupDetails}
      />
    </div>
  );
}

export default ArtistDashboard;