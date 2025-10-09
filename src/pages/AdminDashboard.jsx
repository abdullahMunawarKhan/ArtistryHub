import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { fetchTimeSeries } from '../utils/analytics';
import TimeSeriesChart from '../components/TimeSeriesChart';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';



// Fix the OrderTimer component
function OrderTimer({ orderedAt, shipmentStatus, orderId, onStatusUpdated }) {
  const [remaining, setRemaining] = useState(0);
  const [didUpdate, setDidUpdate] = useState(false);
  const updatingRef = useRef(false);

  useEffect(() => {
    function updateRemaining() {
      // Ensure the timestamp is treated as UTC
      const orderedDate = new Date(orderedAt + (orderedAt.includes('Z') ? '' : 'Z'));
      const placed = orderedDate.getTime();
      const now = Date.now(); // This is always UTC
      const elapsed = now - placed;
      const diff = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
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
          ⏳ Time until status can be confirmed: {hours.toString().padStart(2, '0')}:
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      ) : (
        <span className="text-green-600 font-semibold">✔️ 24 hours passed. Status can now be confirmed.</span>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl relative border border-gray-100 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-red-500 transition"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [artistList, setArtistList] = useState([]);
  const [orderTag, setOrderTag] = useState('all');
  const [orderList, setOrderList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [currentArtworkId, setCurrentArtworkId] = useState(null);
  const [enteredUtr, setEnteredUtr] = useState("")
  const [artworkPayments, setArtworkPayments] = useState([]);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [selectedIdProofUrl, setSelectedIdProofUrl] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrImageSrc, setQrImageSrc] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null); // 'artist' | 'order' | 'payment' | null
  const [period, setPeriod] = useState('day'); // 'day' | 'week' | 'month'
  const [signups, setSignups] = useState([]);
  const [artistRegs, setArtistRegs] = useState([]);
  const [artworksAdded, setArtworksAdded] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [extraDeliveryChargesInput, setExtraDeliveryChargesInput] = useState('');
  const [totalEarnings, setTotalEarnings] = useState([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [artworkList, setArtworkList] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);       // URL of image to preview
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundUTR, setRefundUTR] = useState('');
  const [shipDate, setShipDate] = useState(new Date());
  const [utrModalOpen, setUtrModalOpen] = useState(false);
  const [trackingSubmitted, setTrackingSubmitted] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [deliveryExtraCharges, setDeliveryExtraCharges] = useState('');
  const [artistUtr, setArtistUtr] = useState(null);
  const [fetchingUtr, setFetchingUtr] = useState(false);



  async function showUtrModal(artworkId) {
    setCurrentArtworkId(artworkId);
    setUtrModalOpen(true);
    setFetchingUtr(true);

    const { data, error } = await supabase
      .from('artworks')
      .select('artist_utr')
      .eq('id', artworkId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching UTR from artworks:', error);
      setArtistUtr(null);
    } else {
      setArtistUtr(data?.artist_utr || null);
    }

    setFetchingUtr(false);
  }

  const handleUtrModalClose = () => {
    setUtrModalOpen(false);
    setArtistUtr(null);
    setEnteredUtr('');
    setCurrentArtworkId(null);
  };




  // for pin setup for each section
  // const [showPinModal, setShowPinModal] = useState(false);
  // const [pendingSection, setPendingSection] = useState(null);
  // const [enteredPin, setEnteredPin] = useState('');
  // const [pinError, setPinError] = useState('');
  // const SECTION_PINS = {
  //   artist: '1111',
  //   order: '2222',
  //   payment: '3333',
  //   earnings: '4444',
  //   artwork: '5555',
  //   home:'6666'
  // };
  // Toggle modal visibility

  async function fetchOrders() {
    let query = supabase
      .from('orders')
      .select(`
    *,
    artworks (
      id, title, image_urls, cost, base_price, length, width, height, weight,
      pickupAddress, availability, artist_payment, artist_utr,
      artist_id,
      artists (
        id, name, email, mobile, artwork_count, paintings_sold, artist_qr
      )
    )
      pickup_date, 
      pickup_time   
  `);

    if (orderTag !== 'all') {
      query = query.eq('shipment_status', orderTag);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrderList(data);
    }

  }

  useEffect(() => {
    async function fetchArtworks() {
      const { data, error } = await supabase
        .from('artworks')
        .select(`
        id,
        title,
        image_urls,
        artist_id,
        artists ( name )
      `);
      if (!error) setArtworkList(data || []);
    }
    fetchArtworks();
  }, []);

  const navigate = useNavigate();

  // Admin authentication
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/main-dashboard');
        return;
      }
      setUserEmail(user.email);
      const { data: profile, error } = await supabase
        .from('user')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || profile?.role !== 'efbv') {
        navigate('/main-dashboard');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [u, a, w, o] = await Promise.all([
          fetchTimeSeries('user', 'created_at', period),
          fetchTimeSeries('artists', 'registered_at', period),
          fetchTimeSeries('artworks', 'created_at', period),
          fetchTimeSeries('orders', 'ordered_at', period),
        ]);
        // Format each dataset as needed
        setSignups((u || []).map(row => ({
          timestamp: row.hour_bucket,
          count: row.count
        })));
        setArtistRegs((a || []).map(row => ({
          timestamp: row.hour_bucket,
          count: row.count
        })));
        setArtworksAdded((w || []).map(row => ({
          timestamp: row.hour_bucket,
          count: row.count
        })));
        setPendingOrders((o || []).map(row => ({
          timestamp: row.hour_bucket,
          count: row.count
        })));
        console.log('Signups:', u);      // ← log 'u', not 'signups'
        console.log('ArtistRegs:', a);
        console.log('ArtworksAdded:', w);
        console.log('PendingOrders:', o);
        console.log('Analytics data structure:', analyticsData); // Add this 

      } catch (err) {

      }
    }

    loadAnalytics();
    // const timer = setInterval(loadAnalytics, 60 * 60 * 1000); // hourly refresh
    // return () => clearInterval(timer);
  }, [period]);

  useEffect(() => {
    async function fetchArtworkPayments() {
      const { data, error } = await supabase
        .from('artworks')
        .select(`
        id,
        title,
        image_urls,
        base_price,
        artist_payment,
        artist_utr,
        orders!inner (
          shipment_status
        ),
        artists (
          id, name, artist_qr
        )
      `)
        .eq('orders.shipment_status', 'delivered') // only delivered orders
        .in('artist_payment', ['pending', 'successful']); // payment filter

      if (!error) {
        setArtworkPayments(data || []);
      } else {
        console.error(error);
      }
    }

    fetchArtworkPayments();
  }, []);


  useEffect(() => {
    async function fetchArtists() {
      const { data, error } = await supabase.from('artists').select('*');
      if (!error) setArtistList(data || []);
    }
    fetchArtists();
  }, []);

  // Fetch orders based on shipment status
  useEffect(() => {

    fetchOrders();
  }, [orderTag]);


  useEffect(() => {
    if (selectedSection === 'earnings') {
      fetchTotalEarnings();
    }
  }, [selectedSection]);

  function handleOpenRefundModal(order) {
    setSelectedOrder(order);
    setRefundUTR(order.refund_utr || '');
    setShowRefundModal(true);
  }
  async function updatePaintingsSoldIfConfirmed(artworkId, Shipment_status) {
    if (Shipment_status === "confirm") {
      try {
        // Fetch the artwork to get artist_id
        const { data: artwork, error: artworkError } = await supabase
          .from('artworks')
          .select('artist_id')
          .eq('id', artworkId)
          .single();

        if (artworkError) {
          console.error('Error fetching artwork:', artworkError);
          return;
        }

        if (artwork && artwork.artist_id) {
          // Get the current paintings_sold count
          const { data: artist, error: artistError } = await supabase
            .from('artists')
            .select('paintings_sold')
            .eq('id', artwork.artist_id)
            .single();

          if (artistError) {
            console.error('Error fetching artist:', artistError);
            return;
          }

          if (artist) {
            // Increment paintings_sold by 1
            const newCount = (artist.paintings_sold || 0) + 1;

            const { error: updateArtistError } = await supabase
              .from('artists')
              .update({ paintings_sold: newCount })
              .eq('id', artwork.artist_id);

            if (updateArtistError) {
              console.error('Error updating artist:', updateArtistError);
            }


          }
        }
      } catch (error) {
        console.error('Error in updatePaintingsSoldIfConfirmed:', error);
      }
    }
  }

  async function handleRemoveArtwork(artwork) {
    // 1. Remove images from Supabase storage
    if (Array.isArray(artwork.image_urls)) {
      for (const url of artwork.image_urls) {
        // Extract storage path from URL: e.g. 'artist-assets/…'
        const { data: { Key } } = supabase.storage.from('artist-assets')
          .remove([new URL(url).pathname.split('/').pop()]);
      }
    }

    // 2. Remove artwork record
    const { error } = await supabase
      .from('artworks')
      .delete()
      .eq('id', artwork.id);

    if (!error) {
      // Update local state
      setArtworkList(list => list.filter(a => a.id !== artwork.id));
    } else {
      console.error('Failed to delete artwork:', error);
    }
  }

  const openPaymentModal = (artworkId) => {
    setCurrentArtworkId(artworkId);
    setEnteredUtr("");              // clear any prior UTR
    setUtrModalOpen(true);
  };

  function handleViewOrderDetails(order) {
    setSelectedOrder(order);
    setModalOpen(true);
    setPickupDate('');
    setPickupTime('');
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedOrder(null);
    setTrackingModalOpen(false);
    setTrackingInput('');
    setModalLoading(false);
    setTrackingSubmitted(false);
    setPickupDate('');  // Reset pickup date
    setPickupTime('');  // Reset pickup time

  }
  const handlePaymentSubmit = async () => {
    if (!enteredUtr.trim()) return;

    setModalLoading(true);

    try {
      // Get artist ID from artwork
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .select('artist_id')
        .eq('id', currentArtworkId)
        .maybeSingle();

      if (artworkError) throw artworkError;

      // Update artist UTR and artwork payment status
      const [artistUpdateResult, artworkUpdateResult] = await Promise.all([
        supabase
          .from('artworks')
          .update({ artist_utr: enteredUtr })
          .eq('id', artwork.artist_id),
        supabase
          .from('artworks')
          .update({ artist_payment: 'successful', artist_utr: enteredUtr })
          .eq('id', currentArtworkId)
      ]);

      if (artistUpdateResult.error) throw artistUpdateResult.error;
      if (artworkUpdateResult.error) throw artworkUpdateResult.error;

      setArtistUtr(enteredUtr);
      setEnteredUtr('');
      // Don't close modal, just update the view

    } catch (error) {
      console.error('Error updating UTR:', error);
      alert('Payment update failed.');
    } finally {
      setModalLoading(false);
    }
  };



  async function handleChangeStatus() {
    if (!selectedOrder) return;
    setModalLoading(true);
    const artworkId = selectedOrder.artwork_id;

    try {
      if (selectedOrder.shipment_status === 'pending') {
        const placed = new Date(selectedOrder.ordered_at).getTime();
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (now - placed >= twentyFourHours) {
          const { data, error } = await supabase
            .from('orders')
            .update({ shipment_status: 'confirm' })
            .eq('id', selectedOrder.id);

          if (!error) {
            setSelectedOrder({ ...selectedOrder, shipment_status: 'confirm' });
            await updatePaintingsSoldIfConfirmed(artworkId, 'confirm');
            setOrderList(orderList.map(o =>
              o.id === selectedOrder.id ? { ...o, shipment_status: 'confirm' } : o
            ));
          } else {
            alert('Error updating order status: ' + error.message);
          }
        } else {
          alert('24 hours have not yet passed since the order was placed.');
        }
      } else if (selectedOrder.shipment_status === 'confirm') {
        // FIXED: Open tracking modal instead of directly shipping
        setTrackingModalOpen(true);
        setModalLoading(false); // Reset loading since we're showing modal
        return; // Exit early, don't close modal
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  }








  // Submit Tracking ID (confirm → shipped)
  async function handleTrackingSubmit(e) {
    e.preventDefault();
    setModalLoading(true);
    if (!trackingInput) return;

    setModalLoading(true);

    // 1. Create the timestamp
    const timestamp = new Date().toISOString();

    // 2. Parse extra charges
    const extraCharges = parseFloat(extraDeliveryChargesInput) || 0;

    // 3. Send update to Supabase, including shipment_created_at
    const { error } = await supabase
      .from('orders')
      .update({
        tracking_id: trackingInput,
        shipment_status: 'shipped',
        extra_delivery_charges: extraCharges,
        shipment_created_at: timestamp,
        pickup_date: pickupDate || null,  // Add pickup date
        pickup_time: pickupTime || null   // Add pickup time    
      })
      .eq('id', selectedOrder.id);

    if (!error) {
      // 4. Optimistically update local state
      setOrderList(orderList.map(o =>
        o.id === selectedOrder.id
          ? {
            ...o,
            shipment_status: 'shipped',
            tracking_id: trackingInput,
            extra_delivery_charges: extraCharges,
            shipment_created_at: timestamp,
            pickup_date: pickupDate || null,
            pickup_time: pickupTime || null
          }
          : o
      ));
      setTrackingModalOpen(false);
      setTrackingInput('');
      setExtraDeliveryChargesInput('');
      setPickupDate('');
      setPickupTime('');
      setTrackingSubmitted(true);
    }

    setModalLoading(false);
  }

  const fetchTotalEarnings = async () => {
    setEarningsLoading(true);
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
        id,
        amount,
        extra_delivery_charges,
        shipment_status,
        earning,
        artworks:artworks (
          id,
          title,
          image_urls,
          base_price
        )
      `)
        .eq('shipment_status', 'delivered')
        .not('artworks', 'is', null);

      if (error) {
        console.error('Error fetching earnings:', error);
        return;
      }

      const processedEarnings = [];
      const earningsUpdates = [];

      ordersData.forEach(order => {
        const art = order.artworks;
        const razorpayCommission = order.amount * 0.02;
        const calculatedEarning =
          order.amount
          - art.base_price
          - razorpayCommission
          - 100
          - (order.extra_delivery_charges || 0);

        processedEarnings.push({
          id: order.id,
          artworkImage: art.image_urls,
          title: art.title,
          amount: order.amount,
          basePrice: art.base_price,
          earning: calculatedEarning,
          razorpayCommission,
          extraDeliveryCharges: order.extra_delivery_charges || 0
        });

        // Prepare for bulk update if earning is not stored
        if (order.earning === null || order.earning === undefined) {
          earningsUpdates.push({
            id: order.id,
            earning: calculatedEarning
          });
        }
      });

      // Bulk update earnings if needed
      if (earningsUpdates.length > 0) {
        console.log(`Updating earnings for ${earningsUpdates.length} orders...`);

        // You can use upsert for bulk operations
        const { error: updateError } = await supabase
          .from('orders')
          .upsert(earningsUpdates, { onConflict: 'id' });

        if (updateError) {
          console.error('Error updating earnings:', updateError);
        } else {
          console.log(`Successfully updated earnings for ${earningsUpdates.length} orders`);
        }
      }

      setTotalEarnings(processedEarnings);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setEarningsLoading(false);
    }
  };


  async function handleRefundSubmit() {
    if (!refundUTR) {
      alert('Please enter the refund UTR.');
      return;
    }
    const { error } = await supabase
      .from('orders')
      .update({
        refund_utr: refundUTR,
        refund_status: 'done'
      })
      .eq('id', selectedOrder.id);
    if (error) {
      alert('Error updating refund: ' + error.message);
    } else {
      alert('Refund marked as done.');
      setShowRefundModal(false);

      fetchOrders();
    }
  }
  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;

    try {
      setModalLoading(true);

      // Parse extra charges (same as tracking modal logic)
      const extraCharges = parseFloat(deliveryExtraCharges) || 0;

      const { error } = await supabase
        .from('orders')
        .update({
          shipment_status: 'delivered',
          delivered_at: deliveryDate.toISOString(),
          extra_delivery_charges: extraCharges // Add the extra charges
        })
        .eq('id', selectedOrder.id);

      if (error) {
        alert('Failed to update status: ' + error.message);
      } else {
        alert('Shipment marked as delivered.');
        setSelectedOrder({
          ...selectedOrder,
          shipment_status: 'delivered',
          delivered_at: deliveryDate.toISOString(),
          extra_delivery_charges: extraCharges
        });
        setDeliveryModalOpen(false); // Close delivery modal
        setDeliveryExtraCharges(''); // Reset charges input
        fetchOrders(); // Refresh order list
      }
    } catch (err) {
      alert('Error updating shipment status.');
    } finally {
      setModalLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-2xl font-semibold text-gray-700 animate-pulse">
        🔐 Checking admin credentials...
      </div>
    );
  }


  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex flex-col md:flex-row gap-6">
      {/* Right Side column menu */}
      <div className="w-full md:w-72 bg-white rounded-2xl shadow-lg sticky top-4 h-fit animate-fadeIn">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">
            Dashboard Sections
          </h3>
          <div className="space-y-3">
            {[{
              key: null,// 'home',

              label: 'Home',
              icon: '🏠',
              activeColor: 'green'
            }, {
              key: 'artist',

              label: 'Artist Management',
              icon: '🎨',
              activeColor: 'blue'
            },
            {
              key: 'artwork',
              label: 'Artwork Management',
              icon: '🖼️',
              activeColor: 'blue'
            }, {
              key: 'order',
              label: 'Order Management',
              icon: '🛒',
              activeColor: 'blue'
            }, {
              key: 'payment',
              label: 'Artist Payments',
              icon: '💳',
              activeColor: 'blue'
            },
            {
              key: 'earnings',
              label: 'Total Earnings',
              icon: '💰',
              activeColor: 'blue'
            }
            ].map((btn, i) => (
              <button
                key={i}
                onClick={() => setSelectedSection(btn.key)}
                //onClick={() => {setPendingSection(btn.key);  setShowPinModal(true);}}

                className={`w-full py-2 sm:py-3 px-3 sm:px-4 rounded-lg text-left text-sm sm:text-base font-semibold transition-all duration-200 flex items-center gap-1 sm:gap-2 ${selectedSection === btn.key
                  ? `bg-${btn.activeColor}-600 text-white shadow-md`
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {btn.icon && <span className="text-lg sm:text-xl">{btn.icon}</span>}
                <span className="truncate">{btn.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Left Side content area */}
      <div className="flex-1 bg-white p-2 sm:p-3 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-gray-100 min-h-[70vh] animate-fadeIn overflow-hidden">
        <h2 className="text-lg sm:text-xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-6 text-center text-blue-800 tracking-tight drop-shadow-sm">
          Admin Dashboard
        </h2>

        {!selectedSection && (         //{selectedSection === 'home' && (
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
            {/* Time Window Selector */}
            <div className="flex gap-1 sm:gap-2 justify-center flex-wrap">
              {['day', 'week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 sm:px-3 md:px-5 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium shadow-sm transition-all duration-200 ${period === p
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  {p === 'day' ? 'Today' : p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-5">
              {[{
                title: 'Users',
                data: signups
              }, {
                title: 'Artist Registrations',
                data: artistRegs
              }, {
                title: 'Artworks Added',
                data: artworksAdded
              }, {
                title: 'Delivered Orders',
                data: pendingOrders
              }].map((chart, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow p-2 sm:p-3 md:p-4 flex flex-col hover:shadow-lg transition duration-200"
                >
                  <h4 className="text-xs sm:text-sm md:text-base font-medium mb-1 text-center text-gray-700">
                    {chart.title}
                  </h4>
                  <div className="w-full h-32 sm:h-40 md:h-52">
                    <TimeSeriesChart data={chart.data} dataKey="count" title="" />
                  </div>
                  <div className="mt-2 text-lg sm:text-xl md:text-2xl font-bold text-blue-600 text-center">
                    {chart.data.reduce((sum, point) => sum + point.count, 0)}
                  </div>
                  <div className="text-xs text-gray-500 text-center">Total in this period</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing Sections (Artist / Orders / Payments) */}
        {selectedSection === 'artist' && (
          <div className="mb-8 sm:mb-10 md:mb-14 animate-fadeIn">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2">Artist Management ({artistList.length})</h3>
            <div className="overflow-x-auto rounded-lg sm:rounded-xl shadow bg-white">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-100 text-gray-700 text-left">
                  <tr>
                    <th className="p-2 sm:p-3">Name</th>
                    <th className="p-2 sm:p-3 hidden sm:table-cell">Email</th>
                    <th className="p-2 sm:p-3">Mobile</th>
                    <th className="p-2 sm:p-3 hidden md:table-cell">Location</th>
                    <th className="p-2 sm:p-3 hidden sm:table-cell">Artworks</th>
                    <th className="p-2 sm:p-3">Sold</th>
                    <th className="p-2 sm:p-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {artistList.map((artist) => (
                    <tr
                      key={artist.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td
                        className="p-2 sm:p-3 cursor-pointer text-blue-700 hover:underline font-medium"
                        onClick={() => navigate(`/artist-profile?id=${artist.id}`)}
                      >
                        {artist.name}
                      </td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell text-gray-600">{artist.email}</td>
                      <td className="p-2 sm:p-3 text-gray-600">{artist.mobile}</td>
                      <td className="p-2 sm:p-3 hidden md:table-cell text-gray-600">{artist.location}</td>
                      <td className="p-2 sm:p-3 hidden sm:table-cell text-gray-600">{artist.artwork_count || 0}</td>
                      <td className="p-2 sm:p-3 text-gray-600">{artist.paintings_sold || 0}</td>
                      <td className="p-2 sm:p-3">
                        {artist.id_proof_url ? (
                          <>
                            <img
                              src={artist.id_proof_url}
                              alt="ID Proof"
                              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={() => setSelectedIdProofUrl(artist.id_proof_url)}
                            />
                          </>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedIdProofUrl && (
          <Modal onClose={() => setSelectedIdProofUrl(null)}>
            <img
              src={selectedIdProofUrl}
              alt="ID Proof"
              className="max-w-full max-h-screen rounded-lg"
            />
          </Modal>
        )}
        {selectedSection === 'artwork' && (
          <div className="mb-8 sm:mb-10 md:mb-14 animate-fadeIn">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 border-b pb-2">
              Artwork Management ({artworkList.length})
            </h3>
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-200 text-left">
                  <tr>
                    <th className="p-1 sm:p-2">Title</th>
                    <th className="p-1 sm:p-2">Artist Name</th>
                    <th className="p-1 sm:p-2">Images</th>
                    <th className="p-1 sm:p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {artworkList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        No artworks available.
                      </td>
                    </tr>
                  ) : (
                    artworkList.map((art) => (
                      <tr key={art.id} className="border-b hover:bg-gray-50"
                        onClick={() => navigate(`/product?id=${art.id}`)}>
                        <td className="p-2">{art.title}</td>
                        <td className="p-2">{art.artists?.name || 'Unknown'}</td>
                        <td className="p-2">
                          {Array.isArray(art.image_urls)
                            ? art.image_urls.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={art.title}
                                className="w-12 h-12 object-cover rounded mr-2 inline-block cursor-pointer hover:opacity-75"
                                onClick={() => {
                                  setPreviewImage(img);
                                  setShowImageModal(true);
                                }}
                              />
                            ))
                            : 'N/A'}
                        </td>

                        <td className="p-2">
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                            onClick={() => handleRemoveArtwork(art)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedSection === 'order' && (
          <div className="mb-8 sm:mb-10 md:mb-14 animate-fadeIn">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2">
              Order Management ({orderList.length})
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-1 sm:gap-2 mb-3 sm:mb-4">
              {['all', 'pending', 'confirm', 'shipped', 'delivered', 'canceled'].map(tag => (
                <button
                  key={tag}
                  className={`px-2 sm:px-4 py-1 rounded text-xs sm:text-sm w-full transition ${tag === orderTag ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-200'}`}
                  onClick={() => setOrderTag(tag)}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>


            <div className="overflow-x-auto rounded-lg sm:rounded shadow bg-white">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1.5 sm:p-2">No</th>
                    <th className="p-1.5 sm:p-2">Image</th>
                    <th className="p-1.5 sm:p-2">Title</th>
                    <th className="p-1.5 sm:p-2">Status</th>
                    <th className="p-1.5 sm:p-2">Details</th>
                    {orderTag === 'canceled' && (
                      <th className="p-1.5 sm:p-2">Refund</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {orderList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
                        No active orders right now
                      </td>
                    </tr>
                  ) : (
                    orderList.map((order, index) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="p-1.5 sm:p-2">{index + 1}</td>
                        <td className="p-1.5 sm:p-2">
                          {order.artworks?.image_urls?.length > 0 && (
                            <img
                              onClick={() => navigate(`/product?id=${order.artworks.id}`)}
                              src={Array.isArray(order.artworks.image_urls) ? order.artworks.image_urls[0] : order.artworks.image_urls}
                              className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                              alt={order.artworks.title || "Artwork"}
                            />
                          )}
                        </td>
                        <td
                          className="p-1.5 sm:p-2 cursor-pointer hover:text-blue-600 text-xs sm:text-sm font-medium"
                          onClick={() => navigate(`/product?id=${order.artworks.id}`)}
                        >
                          {order.artworks?.title || "N/A"}
                        </td>

                        <td className="p-1.5 sm:p-2">
                          <span
                            className={`
                                      px-2 py-0.5 rounded-full text-xs font-semibold
                                      ${order.shipment_status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                order.shipment_status === 'confirm' ? 'bg-blue-200 text-blue-800' :
                                  order.shipment_status === 'shipped' ? 'bg-indigo-200 text-indigo-800' :
                                    order.shipment_status === 'delivered' ? 'bg-green-200 text-green-800' :
                                      order.shipment_status === 'canceled' ? 'bg-red-200 text-red-800' :
                                        'bg-gray-200 text-gray-700' // default style
                              }`}
                          >
                            {order.shipment_status.charAt(0).toUpperCase() + order.shipment_status.slice(1)}
                          </span>
                        </td>
                        <td className="p-2">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            View Full Details
                          </button>
                        </td>
                        {orderTag === 'canceled' && (
                          <td className="p-2">
                            <button
                              className="px-3 py-1 rounded bg-blue-50 border border-blue-400 text-blue-700 font-semibold hover:bg-blue-100"
                              onClick={() => handleOpenRefundModal(order)}
                            >
                              {order.refund_status
                                ? order.refund_status.charAt(0).toUpperCase() + order.refund_status.slice(1)
                                : 'Pending'}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showRefundModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-bold mb-4">Process Refund</h2>

              <div className="mb-4">
                <span className="font-semibold">Refund Amount: </span>
                <span>{selectedOrder.refund_amount}</span>
              </div>
              <label className="block font-semibold mb-2">Refund UTR:</label>
              <input
                className="border rounded p-2 mb-4 w-full"
                type="text"
                value={refundUTR}
                onChange={(e) => setRefundUTR(e.target.value)}
                placeholder="Enter Refund UTR"
              />
              <button
                className="px-5 py-2 bg-blue-700 text-white rounded hover:bg-blue-800"
                onClick={handleRefundSubmit}
              >
                Mark as Refunded
              </button>

              <button className="ml-3 px-5 py-2 text-gray-500 hover:underline" onClick={() => setShowRefundModal(false)}>Cancel</button>
            </div>
          </div>
        )}


        {selectedSection === 'payment' && (
          <div className="mb-8 sm:mb-10 md:mb-14 animate-fadeIn">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 border-b pb-2">
              Artist Payments ({artworkPayments.length})
            </h3>
            <div className="overflow-x-auto rounded-lg sm:rounded shadow bg-white">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1.5 sm:p-2">No</th>
                    <th className="p-1.5 sm:p-2">Image</th>
                    <th className="p-1.5 sm:p-2 hidden sm:table-cell">Title</th>
                    <th className="p-1.5 sm:p-2">Artist</th>
                    <th className="p-1.5 sm:p-2 hidden md:table-cell">QR</th>
                    <th className="p-1.5 sm:p-2">Status</th>
                    <th className="p-1.5 sm:p-2">Price</th>
                    <th className="p-1.5 sm:p-2">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {artworkPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
                        No delivered artworks pending payment.
                      </td>
                    </tr>
                  ) : (
                    artworkPayments.map((artwork, index) => (
                      <tr key={artwork.id} className="border-b hover:bg-gray-50">
                        <td className="p-1.5 sm:p-2">{index + 1}</td>
                        <td className="p-1.5 sm:p-2">
                          <img
                            src={Array.isArray(artwork.image_urls) ? artwork.image_urls : artwork.image_urls}
                            alt={artwork.title || "Artwork"}
                            className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded border"
                          />
                        </td>
                        <td className="p-1.5 sm:p-2 hidden sm:table-cell">{artwork.title}</td>
                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">{artwork.artists?.name || "N/A"}</td>
                        <td className="p-1.5 sm:p-2 text-center hidden md:table-cell">
                          {artwork.artists?.artist_qr ? (
                            <>
                              <img
                                src={artwork.artists.artist_qr}
                                alt="Artist QR"
                                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-cover border cursor-pointer"
                                onClick={() => {
                                  setQrImageSrc(artwork.artists.artist_qr);
                                  setShowQrModal(true);
                                }}
                              />
                              {showQrModal && (
                                <Modal onClose={() => setShowQrModal(false)}>
                                  <img src={qrImageSrc} alt="Artist QR" className="max-w-full max-h-screen" />
                                </Modal>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">{artwork.orders?.[0]?.shipment_status || 'N/A'}</td>


                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">₹{artwork.base_price}</td>
                        <td className="p-1.5 sm:p-2">
                          {artwork.artist_payment === "pending" ? (
                            <button
                              className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded text-white bg-orange-500 hover:bg-orange-600"
                              onClick={() => openPaymentModal(artwork.id)}
                            >
                              Pending
                            </button>
                          ) : (
                            <button
                              className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm rounded text-white bg-green-600"
                              onClick={() => showUtrModal(artwork.id)}



                            >
                              Successful
                            </button>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {utrModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
                onClick={handleUtrModalClose}
                aria-label="Close"
              >
                ×
              </button>

              <h3 className="text-xl font-semibold mb-4 text-blue-800">
                {artistUtr ? 'UTR / Transaction ID' : 'Enter UTR / Transaction ID'}
              </h3>

              {fetchingUtr ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full"></div>
                </div>
              ) : artistUtr ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your UTR:
                  </label>
                  <div className="bg-gray-50 border rounded px-3 py-2 font-mono">
                    {artistUtr}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <input
                    type="text"
                    value={enteredUtr}
                    onChange={(e) => setEnteredUtr(e.target.value)}
                    className="w-full border rounded px-3 py-2 focus:ring-blue-500"
                    placeholder="Enter UTR / Transaction ID"
                  />
                  <div className="flex justify-end mt-4">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      onClick={handlePaymentSubmit}
                      disabled={modalLoading || !enteredUtr.trim()}
                    >
                      {modalLoading ? 'Submitting…' : 'Submit'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded"
                  onClick={handleUtrModalClose}
                  disabled={modalLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}



        {selectedSection === 'earnings' && (
          <div className="mb-8 sm:mb-10 md:mb-14 animate-fadeIn">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4 border-b pb-2">
              Total Earnings ({totalEarnings.length})
            </h3>
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1.5 sm:p-2">Image</th>
                    <th className="p-1.5 sm:p-2 hidden sm:table-cell">Title</th>
                    <th className="p-1.5 sm:p-2">Amount</th>
                    <th className="p-1.5 sm:p-2">Base</th>
                    <th className="p-1.5 sm:p-2">Earning</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsLoading ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading earnings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : totalEarnings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-4 text-center text-gray-500">
                        No earnings data available.
                      </td>
                    </tr>
                  ) : (
                    totalEarnings.map((earning, index) => (
                      <tr key={earning.id} className="border-b hover:bg-gray-50">
                        <td className="p-1.5 sm:p-2">
                          {earning.artworkImage && (
                            <img
                              src={Array.isArray(earning.artworkImage)
                                ? earning.artworkImage[0]
                                : earning.artworkImage}
                              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-cover rounded border"
                              alt={earning.title || "Artwork"}
                            />
                          )}
                        </td>
                        <td className="p-1.5 sm:p-2 font-medium hidden sm:table-cell">
                          {earning.title || "N/A"}
                        </td>
                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">
                          ₹{earning.amount?.toLocaleString() || 0}
                        </td>
                        <td className="p-1.5 sm:p-2 text-xs sm:text-sm">
                          ₹{earning.basePrice?.toLocaleString() || 0}
                        </td>
                        <td className="p-1.5 sm:p-2">
                          <span
                            className={`text-xs sm:text-sm font-semibold ${earning.earning < 0 ? 'text-red-600' : 'text-green-600'
                              }`}
                          >
                            ₹{earning.earning?.toLocaleString() || 0}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


      {/* Modal for image_view */}
      {showImageModal && previewImage && (
        <Modal onClose={() => setShowImageModal(false)}>
          <img
            src={previewImage}
            alt="Artwork Preview"
            className="max-w-full max-h-screen rounded"
          />
        </Modal>
      )}


      {/* Modal for id_view */}
      {selectedArtwork && (
        <Modal onClose={() => setSelectedArtwork(null)}>
          <img src={selectedArtwork.image_urls[0]} alt={selectedArtwork.title} />
          <h2>{selectedArtwork.title}</h2>
          <h3>{selectedArtwork.artist}</h3>
        </Modal>
      )}



      {/* Modal for Order Details */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl relative">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-800">
                Artwork: {selectedOrder.artworks?.title}
              </h3>
              <button
                className="text-xl px-2 text-gray-400 hover:text-red-600 transition-colors"
                onClick={closeModal}
                aria-label="Close"
              >&times;</button>
            </div>

            {/* Content Area - Responsive Grid */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">

              {/* Left Column - Order Information */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <strong className="font-semibold text-gray-700">Artist:</strong>
                    <button
                      onClick={() => navigate(`/artist-profile?id=${selectedOrder.artists?.id}`)}
                      className="text-blue-600 hover:underline text-sm font-normal ml-2"
                    >
                      {selectedOrder.artworks?.artists?.name}
                    </button>
                    <div className="text-xs text-gray-600 mt-1">
                      {selectedOrder.artworks?.artists?.mobile} | Email: {selectedOrder.artworks?.artists?.email}
                    </div>
                  </div>

                  <div>
                    <strong className="font-semibold text-gray-700">Pickup Address:</strong>
                    <span className="font-normal ml-2">{selectedOrder.artworks?.pickupAddress}</span>
                  </div>

                  <div>
                    <strong className="font-semibold text-gray-700">Pickup Date & Time:</strong>
                    <span className="font-normal ml-2">
                      {selectedOrder.pickup_date && selectedOrder.pickup_time
                        ? `${new Date(selectedOrder.pickup_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })} at ${new Date(`1970-01-01T${selectedOrder.pickup_time}`).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}`
                        : selectedOrder.pickup_date
                          ? `${new Date(selectedOrder.pickup_date).toLocaleDateString('en-US')} (Time not specified)`
                          : 'Not specified'
                      }
                    </span>
                  </div>

                  <div>
                    <strong className="font-semibold text-gray-700">Shipment Status:</strong>
                    <span className={`font-normal ml-2 px-2 py-1 rounded-full text-xs ${selectedOrder.shipment_status === 'confirm' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.shipment_status === 'shipped' ? 'bg-green-100 text-green-800' :
                        selectedOrder.shipment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedOrder.shipment_status}
                    </span>
                  </div>
                </div>

                {/* Artwork Details Card */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <strong className="font-semibold text-gray-700 block mb-2">Artwork Details:</strong>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Cost: ₹{selectedOrder.artworks?.cost}</div>
                    <div>Length: {selectedOrder.artworks?.length} cm</div>
                    <div>Width: {selectedOrder.artworks?.width} cm</div>
                    <div>Height: {selectedOrder.artworks?.height} cm</div>
                    <div className="col-span-2">Weight: {selectedOrder.artworks?.weight} kg</div>
                  </div>
                </div>

                {/* Customer Details Card */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <strong className="font-semibold text-gray-700 block mb-2">Customer:</strong>
                  <div className="space-y-1 text-xs">
                    <div><strong>Name:</strong> {selectedOrder.full_name}</div>
                    <div><strong>Mobile:</strong> {selectedOrder.mobile}</div>
                    <div><strong>Address:</strong> {selectedOrder.shipping_address}</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Actions and Tracking */}
              <div className="space-y-4">
                {/* Tracking Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="text-xs">
                      <strong className="font-semibold text-gray-700">Tracking ID:</strong>
                      <span className="ml-2 font-mono">{selectedOrder.tracking_id || selectedOrder.trackingid || 'Not assigned'}</span>
                    </div>
                    <div className="text-xs">
                      <strong className="font-semibold text-gray-700">Extra Delivery Charges:</strong>
                      <span className="ml-2">₹{selectedOrder.extradeliverycharges ?? '0'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Timer */}
                {selectedOrder.shipment_status === 'pending' && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <OrderTimer
                      orderedAt={selectedOrder.ordered_at}
                      shipmentStatus={selectedOrder.shipment_status}
                      orderId={selectedOrder.id}
                      onStatusUpdated={fetchOrders}
                    />
                  </div>
                )}

                {/* Action Forms */}
                <div className="space-y-4">
                  {selectedOrder.shipment_status === 'pending' && (
                    <button
                      className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-sm font-medium transition-colors ${modalLoading && 'opacity-50'}`}
                      onClick={handleChangeStatus}
                      disabled={modalLoading}
                    >
                      Mark as Shipped
                    </button>
                  )}

                  {selectedOrder.shipment_status === 'confirm' && (
                    trackingSubmitted ? (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-semibold">Tracking ID:</span>
                            <span className="ml-2 font-mono">{trackingInput}</span>
                          </div>
                          <div>
                            <span className="font-semibold">Extra Delivery Charges:</span>
                            <span className="ml-2">₹{extraDeliveryChargesInput}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleTrackingSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-700">Pickup Date</label>
                            <input
                              type="date"
                              value={pickupDate}
                              onChange={(e) => setPickupDate(e.target.value)}
                              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={modalLoading}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-700">Pickup Time</label>
                            <input
                              type="time"
                              value={pickupTime}
                              onChange={(e) => setPickupTime(e.target.value)}
                              className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={modalLoading}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block text-gray-700">Enter Tracking ID:</label>
                          <input
                            type="text"
                            value={trackingInput}
                            onChange={e => setTrackingInput(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={modalLoading}
                            placeholder="Enter tracking number"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium mb-1 block text-gray-700">Extra Delivery Charges (₹):</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={extraDeliveryChargesInput}
                            onChange={e => setExtraDeliveryChargesInput(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={modalLoading}
                            placeholder="Enter extra delivery charges"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                          disabled={modalLoading || !trackingInput}
                        >
                          Submit & Mark as Shipped
                        </button>
                      </form>
                    )
                  )}

                  {selectedOrder.shipment_status === 'shipped' && (
                    <button
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      onClick={() => setDeliveryModalOpen(true)}
                      disabled={modalLoading}
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>


          </div>
        </div>
      )}





      {/* Tracking ID Modal */}
      {/* {trackingModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl relative">
            <form onSubmit={handleTrackingSubmit}>
              <label className="text-sm font-semibold mb-2 block">Enter Tracking ID:</label>
              <input
                type="text"
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                className="border rounded px-2 py-1 w-full mb-2"
                disabled={modalLoading}
              />
              <label className="text-sm font-semibold mb-2 block">Extra Delivery Charges (₹):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={extraDeliveryChargesInput}
                onChange={e => setExtraDeliveryChargesInput(e.target.value)}
                className="border rounded px-2 py-1 w-full mb-2"
                disabled={modalLoading}
                placeholder="Enter extra delivery charges"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded mr-2"
                disabled={modalLoading || !trackingInput}
              >
                Submit & Mark as Shipped
              </button>
              <button
                type="button"
                onClick={() => setTrackingModalOpen(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
                disabled={modalLoading}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )} */}



      {/* Delivery Date Modal */}
      {deliveryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">Mark as Delivered</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleMarkDelivered();
            }}>
              <label className="text-sm font-semibold mb-2 block">Delivery Date & Time</label>
              <input
                type="datetime-local"
                value={deliveryDate.toISOString().slice(0, 16)}
                onChange={(e) => setDeliveryDate(new Date(e.target.value))}
                className="border rounded px-3 py-2 w-full mb-4"
                disabled={modalLoading}
                required
              />




              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setDeliveryModalOpen(false);
                    setDeliveryExtraCharges(''); // Reset on cancel
                  }}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  disabled={modalLoading}
                >
                  Mark as Delivered
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* input pin Modal */}

      {/* {showPinModal && (
        <Modal onClose={() => {
          setShowPinModal(false);
          setEnteredPin('');
          setPinError('');
        }}>
          <h3 className="text-lg font-bold mb-4">Enter PIN for {pendingSection?.toUpperCase()}</h3>
          <input
            type="password"
            value={enteredPin}
            onChange={e => setEnteredPin(e.target.value)}
            className="border rounded px-3 py-2 w-full mb-2"
            placeholder="Enter PIN"
          />
          {pinError && <div className="text-red-600 text-sm mb-2">{pinError}</div>}
          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-300 px-4 py-2 rounded"
              onClick={() => {
                setShowPinModal(false);
                setEnteredPin('');
                setPinError('');
              }}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                const requiredPin = SECTION_PINS[pendingSection];
                if (enteredPin === requiredPin) {
                  setSelectedSection(pendingSection);
                  setShowPinModal(false);
                  setEnteredPin('');
                  setPinError('');
                } else {
                  setPinError('Incorrect PIN');
                }
              }}
            >
              Unlock
            </button>
          </div>
        </Modal>
      )} */}
    </div>
  );
}

export default AdminDashboard;