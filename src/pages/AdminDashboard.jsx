import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';
import { fetchTimeSeries } from '../utils/analytics';
import TimeSeriesChart from '../components/TimeSeriesChart';



// Timer component for order countdown (until 24hrs since placed)
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
  const [orderTag, setOrderTag] = useState('pending');
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
  const [showIdProofModal, setShowIdProofModal] = React.useState(false);
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
      // Fetch artworks with delivered shipment_status and payment pending/successful
      const { data, error } = await supabase
        .from('artworks')
        .select(`
        *,
        artists (
          id, name, artist_qr
        )
      `)
        .eq('shipment_status', 'delivered')
        .in('artist_payment', ['pending', 'successful']);
      if (!error) setArtworkPayments(data || []);
    }
    fetchArtworkPayments();
  }, []);

  // Fetch artists
  useEffect(() => {
    async function fetchArtists() {
      const { data, error } = await supabase.from('artists').select('*');
      if (!error) setArtistList(data || []);
    }
    fetchArtists();
  }, []);

  // Fetch orders based on shipment status
  useEffect(() => {
    async function fetchOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          artworks (
            id, title, image_urls, cost, base_price,length, width, height, weight,pickupAddress,availability,shipment_status,artist_payment,
    artist_utr,
    artist_id
          ),
          artists (
            id, name, email, mobile,artwork_count, paintings_sold,artist_qr
          )
        `)
        .eq('shipment_status', orderTag);
      if (!error) setOrderList(data || []);
    }
    fetchOrders();
  }, [orderTag]);
  useEffect(() => {
    if (selectedSection === 'earnings') {
      fetchTotalEarnings();
    }
  }, [selectedSection]);


  async function updatePaintingsSoldIfConfirmed(artworkId, newShipmentStatus) {
    if (newShipmentStatus === "confirm") {
      // Fetch the artwork to get artist_id
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .select('artist_id')
        .eq('id', artworkId)
        .single();

      if (artwork && artwork.artist_id) {
        // Get the current paintings_sold count
        const { data: artist, error: artistError } = await supabase
          .from('artists')
          .select('paintings_sold')
          .eq('id', artwork.artist_id)
          .single();

        if (artist) {
          // Increment paintings_sold by 1
          const newCount = (artist.paintings_sold || 0) + 1;

          await supabase
            .from('artists')
            .update({ paintings_sold: newCount })
            .eq('id', artwork.artist_id);
          await supabase
            .from('artworks')
            .update({ artist_utr: enteredUtr, artist_payment: 'successful' })
            .eq('id', artworkId);
        }
      }
    }
  }
  const openPaymentModal = (artworkId) => {
    setCurrentArtworkId(artworkId);
    setModalOpen(true);
  };

  function handleViewOrderDetails(order) {
    setSelectedOrder(order);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedOrder(null);
    setTrackingModalOpen(false);
    setTrackingInput('');
    setModalLoading(false);
  }
  const handlePaymentSubmit = async () => {
    const { error } = await supabase
      .from('artworks')
      .update({ artist_utr: enteredUtr, artist_payment: 'successful' })
      .eq('id', currentArtworkId);

    if (!error) {
      setModalOpen(false);
      // Optionally refetch artworks here to reflect changes
    } else {
      // Handle error (display error message)
    }
  };

  // Change Status button logic
  async function handleChangeStatus() {
    if (!selectedOrder) return;
    setModalLoading(true);
    const artworkId = selectedOrder.artwork_id;
    // If pending: allow after 24hrs
    if (selectedOrder.shipment_status === 'pending') {
      const placed = new Date(selectedOrder.ordered_at).getTime();
      if (Date.now() - placed >= 24 * 60 * 60 * 1000) {
        // Update to confirm
        const { error } = await supabase
          .from('orders')
          .update({ shipment_status: 'confirm' })

          .eq('id', selectedOrder.id);
        if (!error) {
          setSelectedOrder({ ...selectedOrder, shipment_status: 'confirm' });
          await updatePaintingsSoldIfConfirmed(artworkId, "confirm");
          setOrderList(orderList.map(o => o.id === selectedOrder.id ? { ...o, shipment_status: 'confirm' } : o));
        }
      } else {
        alert('24 hours have not yet passed since the order was placed.');
      }
    }
    // If confirm: open tracking modal
    else if (selectedOrder.shipment_status === 'confirm') {
      setTrackingModalOpen(true);
    }
    setModalLoading(false);
  }

  // Submit Tracking ID (confirm → shipped)
  async function handleTrackingSubmit(e) {
    e.preventDefault();
    if (!trackingInput) return;
    setModalLoading(true);
    const extraCharges = parseFloat(extraDeliveryChargesInput) || 0;
    const { error } = await supabase
      .from('orders')
      .update({ tracking_id: trackingInput, shipment_status: 'shipped', extra_delivery_charges: extraCharges })
      .eq('id', selectedOrder.id);
    if (!error) {
      setSelectedOrder({ ...selectedOrder, shipment_status: 'shipped', tracking_id: trackingInput, extra_delivery_charges: extraCharges });
      setOrderList(orderList.map(o => o.id === selectedOrder.id ? { ...o, shipment_status: 'shipped', tracking_id: trackingInput, extra_delivery_charges: extraCharges } : o));
      setTrackingModalOpen(false);
      setTrackingInput('');
      setExtraDeliveryChargesInput('');
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
        earning,
        orders_artwork_id_fkey:artworks (
          id,
          title,
          image_urls,
          base_price
        )
      `)
        .not('orders_artwork_id_fkey:artworks', 'is', null); // Also update the not() clause

      if (error) {
        console.error('Error fetching earnings:', error);
        return;
      }

      // Process earnings data
      const processedEarnings = ordersData.map(order => {
        const razorpayCommission = order.amount * 0.02;
        const calculatedEarning = order.amount -
          order.artworks.base_price -
          razorpayCommission -
          (order.extra_delivery_charges || 0);

        return {
          id: order.id,
          artworkImage: order.artworks.image_urls,
          title: order.artworks.title,
          amount: order.amount,
          basePrice: order.artworks.base_price,
          earning: calculatedEarning,
          razorpayCommission,
          extraDeliveryCharges: order.extra_delivery_charges || 0
        };
      });

      setTotalEarnings(processedEarnings);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setEarningsLoading(false);
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
              key: null,
              label: 'Home',
              icon: '🏠',
              activeColor: 'green'
            }, {
              key: 'artist',
              label: 'Artist Management',
              icon: '🎨',
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
                className={`w-full py-3 px-4 rounded-lg text-left font-semibold transition-all duration-200 flex items-center gap-2 ${selectedSection === btn.key
                  ? `bg-${btn.activeColor}-600 text-white shadow-md`
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {btn.icon && <span className="text-xl">{btn.icon}</span>}
                {btn.label}
              </button>
            ))}
          </div>

        </div>
      </div>
      {/* Left Side content area */}
      <div className="flex-1 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 min-h-[70vh] animate-fadeIn">
        <h2 className="text-3xl font-extrabold mb-10 text-center text-blue-800 tracking-tight drop-shadow-sm">
          Admin Dashboard
        </h2>

        {!selectedSection && (
          <div className="flex flex-col gap-10 ">
            {/* Time Window Selector */}
            <div className="flex gap-3 justify-center flex-wrap">
              {['day', 'week', 'month'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200 ${period === p
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  {p === 'day' ? 'Today' : p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                </button>
              ))}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[{
                title: 'Users ',
                data: signups
              }, {
                title: 'Artist Registrations',
                data: artistRegs
              }, {
                title: 'Artworks Added',
                data: artworksAdded
              }, {
                title: 'dilevered Orders',
                data: pendingOrders
              }].map((chart, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-4 flex flex-col hover:shadow-lg transition duration-200"
                >
                  <h4 className="text-lg font-semibold mb-2 text-center text-gray-700">
                    {chart.title}
                  </h4>
                  <div className="w-full h-60">
                    <TimeSeriesChart data={chart.data} dataKey="count" title="" />
                  </div>
                  <div className="mt-3 text-2xl font-bold text-blue-600 text-center">
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
          <div className="mb-14 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Artist Management ({artistList.length})</h3>
            <div className="overflow-x-auto rounded-xl shadow bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700 text-left">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Uploaded Artworks</th>
                    <th className="p-3">Paintings Sold</th>
                    <th className="p-3">ID Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {artistList.map((artist) => (
                    <tr
                      key={artist.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td
                        className="p-3 cursor-pointer text-blue-700 hover:underline"
                        onClick={() => navigate(`/artist-profile?id=${artist.id}`)}
                      >
                        {artist.name}
                      </td>
                      <td className="p-3">{artist.email}</td>
                      <td className="p-3">{artist.mobile}</td>
                      <td className="p-3">{artist.location}</td>
                      <td className="p-3">{artist.artwork_count || 0}</td>
                      <td className="p-3">{artist.paintings_sold || 0}</td>
                      <td className="p-3">
                        {artist.id_proof_url ? (
                          <>
                            <img
                              src={artist.id_proof_url}
                              alt="ID Proof"
                              className="w-16 h-16 object-cover rounded-lg border cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={() => setShowIdProofModal(true)}
                            />
                            {showIdProofModal && (
                              <Modal onClose={() => setShowIdProofModal(false)}>
                                <img
                                  src={artist.id_proof_url}
                                  alt="ID Proof"
                                  className="max-w-full max-h-screen rounded-lg"
                                />
                              </Modal>
                            )}
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

        {selectedSection === 'order' && (
          <div className="mb-14 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Order Management ({orderList.length})
            </h3>
            <div className="flex gap-3 mb-4">
              {['pending', 'confirm', 'shipped', 'delivered'].map(tag => (
                <button
                  key={tag}
                  className={`px-4 py-1 rounded ${tag === orderTag ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-200'}`}
                  onClick={() => setOrderTag(tag)}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2">Sr. No</th>
                    <th className="p-2">Image</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Artist</th>
                    <th className="p-2">Shipment Status</th>
                    <th className="p-2">View Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orderList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No active orders right now
                      </td>
                    </tr>
                  ) : (
                    orderList.map((order, index) => (
                      <tr key={order.id} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          {order.artworks?.image_urls?.length > 0 && (
                            <img
                              onClick={() => navigate(`/product?id=${order.artworks.id}`)}
                              src={Array.isArray(order.artworks.image_urls) ? order.artworks.image_urls[0] : order.artworks.image_urls}
                              className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                              alt={order.artworks.title || "Artwork"}
                            />
                          )}
                        </td>
                        <td
                          className="p-2 cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/product?id=${order.artworks.id}`)}
                        >
                          {order.artworks?.title || "N/A"}
                        </td>
                        <td className="p-2">
                          {order.artists?.id ? (
                            <button
                              onClick={() => navigate(`/artist-profile?id=${order.artists.id}`)}
                              className="text-blue-600 hover:underline"
                            >
                              {order.artists.name}
                            </button>
                          ) : 'N/A'}
                        </td>
                        <td className="p-2">{order.shipment_status}</td>
                        <td className="p-2">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                            onClick={() => handleViewOrderDetails(order)}
                          >
                            View Full Details
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

        {selectedSection === 'payment' && (
          <div className="mb-14 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Artist Payments ({artworkPayments.length})
            </h3>
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2">Sr. No</th>
                    <th className="p-2">Image</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Artist Name</th>
                    <th className="p-2">Artist QR</th>
                    <th className="p-2">Shipment Status</th>
                    <th className="p-2">amount</th>
                    <th className="p-2">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {artworkPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        No delivered artworks pending payment.
                      </td>
                    </tr>
                  ) : (
                    artworkPayments.map((artwork, index) => (
                      <tr key={artwork.id} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <img
                            src={Array.isArray(artwork.image_urls) ? artwork.image_urls : artwork.image_urls}
                            alt={artwork.title || "Artwork"}
                            className="w-16 h-16 object-cover rounded border"
                          />
                        </td>
                        <td className="p-2">{artwork.title}</td>
                        <td className="p-2">{artwork.artists?.name || "N/A"}</td>
                        <td className="p-2 text-center">
                          {artwork.artists?.artist_qr ? (
                            <>
                              <img
                                src={artwork.artists.artist_qr}
                                alt="Artist QR"
                                className="w-14 h-14 object-cover border cursor-pointer"
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
                        <td className="p-2">{artwork.shipment_status}</td>
                        <td className="p-2">{artwork.base_price}</td>
                        <td className="p-2">
                          <button
                            className={`px-3 py-1 rounded text-white ${artwork.artist_payment === "pending" ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600"}`}
                            onClick={() => openPaymentModal(artwork.id)}
                            disabled={artwork.artist_payment === "successful"}
                          >
                            {artwork.artist_payment.charAt(0).toUpperCase() + artwork.artist_payment.slice(1)}
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
        {selectedSection === 'earnings' && (
          <div className="mb-14 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Total Earnings ({totalEarnings.length})
            </h3>
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2">Artwork Image</th>
                    <th className="p-2">Title</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Base Price</th>
                    <th className="p-2">Earning</th>
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
                        <td className="p-2">
                          {earning.artworkImage && (
                            <img
                              src={Array.isArray(earning.artworkImage)
                                ? earning.artworkImage[0]
                                : earning.artworkImage}
                              className="w-16 h-16 object-cover rounded border"
                              alt={earning.title || "Artwork"}
                            />
                          )}
                        </td>
                        <td className="p-2 font-medium">
                          {earning.title || "N/A"}
                        </td>
                        <td className="p-2">
                          ₹{earning.amount?.toLocaleString() || 0}
                        </td>
                        <td className="p-2">
                          ₹{earning.basePrice?.toLocaleString() || 0}
                        </td>
                        <td className="p-2">
                          <span
                            className={`font-semibold ${earning.earning < 0 ? 'text-red-600' : 'text-green-600'
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



      {/* ALL EXISTING MODALS PRESERVED BELOW */}

      {/* UTR Payment Modal */}
      {modalOpen && !selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              className="absolute top-2 right-2 text-2xl px-2 text-gray-400 hover:text-red-600"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >×</button>
            <h3 className="text-xl font-bold mb-4 text-blue-800">
              Enter UTR / Transaction ID
            </h3>
            <input
              type="text"
              value={enteredUtr}
              onChange={e => setEnteredUtr(e.target.value)}
              className="border rounded px-3 py-2 w-full mb-4 focus:ring-2 focus:ring-blue-500"
              placeholder="UTR / Transaction ID"
              disabled={modalLoading}
            />
            <div className="flex justify-end gap-3">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm"
                onClick={handlePaymentSubmit}
                disabled={modalLoading || !enteredUtr}
              >
                Submit
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg"
                onClick={() => setModalOpen(false)}
                disabled={modalLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl relative">
            <button
              className="absolute top-2 right-2 text-2xl px-2 text-gray-400 hover:text-red-600"
              onClick={closeModal}
              aria-label="Close"
            >&times;</button>
            <h3 className="text-xl font-bold mb-2 text-blue-800">
              Artwork: {selectedOrder.artworks?.title}
            </h3>
            <div className="mb-2">
              <strong>Artist: </strong>
              <button
                onClick={() => navigate(`/artist-profile?id=${selectedOrder.artists?.id}`)}
                className="text-blue-600 hover:underline"
              >
                {selectedOrder.artists?.name}
              </button>
              <div className="text-sm">
                Mobile: {selectedOrder.artists?.mobile} | Email: {selectedOrder.artists?.email}
              </div>
            </div>
            <div className="mb-2">
              <strong>Pickup Address:</strong> {selectedOrder.pickup_address}
            </div>
            <div className="mb-2">
              <strong>Artwork Details:</strong>
              <ul className="list-disc ml-6 mt-1">
                <li>Cost: ₹ {selectedOrder.artworks?.cost}</li>
                <li>Length: {selectedOrder.artworks?.length} cm</li>
                <li>Width: {selectedOrder.artworks?.width} cm</li>
                <li>Height: {selectedOrder.artworks?.height} cm</li>
                <li>Weight: {selectedOrder.artworks?.weight} kg</li>
              </ul>
            </div>
            <div className="mb-2">
              <strong>Customer:</strong>
              <ul className="list-disc ml-6 mt-1">
                <li>Name: {selectedOrder.full_name}</li>
                <li>Mobile: {selectedOrder.mobile}</li>
                <li>Address: {selectedOrder.shipping_address}</li>
              </ul>
            </div>
            <div className="mb-2">
              <strong>Shipment Status:</strong> <span>{selectedOrder.shipment_status}</span>
            </div>
            {/* Timer and Change Status Logic */}
            {selectedOrder.shipment_status === 'pending' && (
              <OrderTimer orderedAt={selectedOrder.ordered_at} />
            )}
            {/* Tracking ID and extra charges Display */}

            {['shipped', 'delivered'].includes(selectedOrder.shipment_status) && (
              <>
                <div className="mb-2 text-green-700">
                  <strong>Tracking ID:</strong> {selectedOrder.tracking_id || ''}
                </div>
                {selectedOrder.extra_delivery_charges !== undefined && (
                  <div className="mb-2 text-green-700">
                    <strong>Extra Delivery Charges:</strong> ₹ {selectedOrder.extra_delivery_charges.toFixed(2)}
                  </div>
                )}
              </>
            )}


            {/* Change Status button */}
            {(selectedOrder.shipment_status === 'pending' ||
              selectedOrder.shipment_status === 'confirm') && (
                <button
                  className={`block mx-auto mt-6 bg-blue-600 hover:bg-blue-700 text-white py-1 px-6 rounded ${modalLoading && 'opacity-50'}`}
                  onClick={handleChangeStatus}
                  disabled={modalLoading}
                >
                  {selectedOrder.shipment_status === 'pending'
                    ? 'Mark as Confirmed'
                    : 'Mark as Shipped'}
                </button>
              )}

            {/* Tracking ID Modal */}
            {trackingModalOpen && (
              <form onSubmit={handleTrackingSubmit} className="mt-4">
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
                >Cancel</button>
              </form>
            )}
            <button
              className="block mx-auto mt-6 bg-gray-300 hover:bg-gray-400 text-black py-1 px-6 rounded"
              onClick={closeModal}
            >Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
