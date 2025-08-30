import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [artistList, setArtistList] = useState([]);
  const [orderTag, setOrderTag] = useState('pending');
  const [orderList, setOrderList] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigate = useNavigate();

  // Admin authentication
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/admin-login');
        return;
      }
      setUserEmail(user.email);
      const { data: profile, error } = await supabase
        .from('user')
        .select('role')
        .eq('id', user.id)
        .single();
      if (error || profile?.role !== 'admin') {
        navigate('/main-dashboard');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [navigate]);

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
            id, title, image_urls, cost, length, width, height, weight
          ),
          artists (
            id, name, email, mobile
          )
        `)
        .eq('shipment_status', orderTag);
      if (!error) setOrderList(data || []);
    }
    fetchOrders();
  }, [orderTag]);

  async function handleDeleteArtist(artistId) {
    if (!window.confirm('Are you sure you want to delete this artist and all their artworks/assets?')) return;
    const { data: artworks } = await supabase.from('artworks').select('*').eq('artist_id', artistId);
    for (const artwork of artworks || []) {
      // Delete images from storage if using Supabase Storage API
    }
    await supabase.from('artworks').delete().eq('artist_id', artistId);
    await supabase.from('artists').delete().eq('id', artistId);
    setArtistList(artistList.filter(a => a.id !== artistId));
  }

  function handleViewOrderDetails(order) {
    setSelectedOrder(order);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedOrder(null);
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-xl">Checking admin credentials...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-blue-800">Admin Dashboard</h2>

      {/* Artist Management */}
      <div className="mb-14">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Artist Management</h3>
        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Location</th>
                <th className="p-2">ID Proof</th>
                <th className="p-2">Remove</th>
              </tr>
            </thead>
            <tbody>
              {artistList.map(artist => (
                <tr key={artist.id} className="border-b">
                  <td className="p-2">{artist.name}</td>
                  <td className="p-2">{artist.email}</td>
                  <td className="p-2">{artist.mobile}</td>
                  <td className="p-2">{artist.location}</td>
                  <td className="p-2">
                    {artist.id_proof_url ? (
                      <a href={artist.id_proof_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={artist.id_proof_url}
                          alt="ID Proof"
                          className="w-16 h-16 object-cover rounded-lg hover:scale-105 cursor-pointer border"
                        />
                      </a>
                    ) : <span className="text-gray-400">N/A</span>}
                  </td>
                  <td className="p-2">
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      onClick={() => handleDeleteArtist(artist.id)}
                    >Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Management */}
      <div className="mb-14">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Order Management</h3>
        <div className="flex gap-3 mb-4">
          {['pending', 'confirm', 'delivered'].map(tag => (
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
          {orderList.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No active orders right now
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Image</th>
                  <th className="p-2">Title</th>
                  <th className="p-2">Artist</th>
                  <th className="p-2">Shipment Status</th>
                  <th className="p-2">View Details</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map(order => (
                  <tr key={order.id} className="border-b">
                    <td className="p-2">
                      {order.artworks?.image_urls?.length > 0 && (
                        <img
                          src={order.artworks.image_urls[0]}
                          className="w-16 h-16 object-cover rounded border"
                          alt="Artwork"
                        />
                      )}
                    </td>
                    <td className="p-2">{order.artworks?.title || 'N/A'}</td>
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
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
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
            <button
              className="block mx-auto mt-6 bg-blue-600 hover:bg-blue-700 text-white py-1 px-6 rounded"
              onClick={closeModal}
            >Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
