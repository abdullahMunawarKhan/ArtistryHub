// src/pages/TrackOrder.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate, useParams } from "react-router-dom";

function InteractiveStarRating({ value, onChange }) {
  const [hover, setHover] = useState(null);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width={28}
          height={28}
          viewBox="0 0 20 20"
          fill={(hover !== null ? i < hover : i < value) ? "#F59E0B" : "#E5E7EB"}
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'pointer' }}
        >
          <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
        </svg>
      ))}
    </span>
  );
}

const TrackOrder = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper for courier-specific tracking URLs
  const getTrackingUrl = (trackingId) => {
    if (!trackingId) return null;
    return `https://shiprocket.co/tracking/${trackingId}`;
  };


  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            id,
            tracking_id,
            courier_name,
            shipment_status,
            ordered_at,
            amount,
            quantity,
            shipping_address,
            billing_address,
            full_name,
            mobile,
            artworks ( id, title, image_urls, price ),
            artists ( name )
          `
          )
          .eq("tracking_id", trackingId)
          .single();

        if (error) {
          console.error("Error fetching order:", error);
          setOrderData(null);
        } else if (data) {
          // Transform into frontend-friendly format
          const order = {
            id: data.id,
            trackingNumber: data.tracking_id,
            status: data.shipment_status,
            orderDate: data.ordered_at,
            estimatedDelivery: null, // can be added later
            products: [
              {
                id: data.artworks?.id,
                name: data.artworks?.title,
                image: data.artworks?.image_urls?.[0] || "",
                price: data.artworks?.price,
                quantity: data.quantity,
              },
            ],
            customer: {
              name: data.full_name,
              phone: data.mobile,
            },
            shippingAddress: data.shipping_address,
            trackingUrl: getTrackingUrl(data.tracking_id),

          };
          setOrderData(order);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setOrderData(null);
      } finally {
        setLoading(false);
      }
    };


    if (trackingId) {
      fetchOrderData();
    }
  }, [trackingId]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const handleReviewSubmit = async () => {
    if (!starRating || !reviewText || !orderData?.products[0]?.id) return;
    setReviewLoading(true);
    const { error } = await supabase
      .from("artworks")
      .update({ rating: starRating, review: reviewText })
      .eq("id", orderData.products[0].id);
    if (!error) setReviewSubmitted(true);
    setReviewLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-5 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-96 gap-5">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="max-w-6xl mx-auto p-5 bg-gray-50 min-h-screen">
        <div className="text-center py-16 px-5 bg-white rounded-xl shadow-sm">
          <h2 className="text-2xl font-semibold text-red-600 mb-3">
            Order Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            We couldn't find an order with tracking number: {trackingId}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] max-w-6xl mx-auto p-5 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8 bg-white p-5 rounded-xl shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-100 hover:bg-gray-200 border-none px-4 py-2 rounded-lg cursor-pointer font-medium text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Track Your Order
          </h1>
          <div className="flex gap-5 flex-wrap items-center">
            <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-medium text-gray-600">
              Order #{orderData.id}
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-medium text-gray-600">
              Tracking: {orderData.trackingNumber}
            </span>
            {orderData.trackingUrl && (
              <a
                href={orderData.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Track Live
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Products */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Order Items
          </h2>
          <div className="mb-5">
            {orderData.products.map((product) => (
              <div
                key={product.id}
                className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-lg bg-gray-50"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">
                    {product.name}
                  </h4>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">
                      Qty: {product.quantity}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">
                      ₹{product.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Shipping Address
          </h2>
          <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 text-sm leading-relaxed">
              {orderData.shippingAddress}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Customer
          </h2>
          <p className="text-gray-700 text-sm">Name: {orderData.customer.name}</p>
          <p className="text-gray-700 text-sm">Phone: {orderData.customer.phone}</p>
        </div>
        
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-lg mb-2">Please provide your review</h3>
          {reviewSubmitted ? (
            <div className="text-green-600 font-medium">Thank you for your review!</div>
          ) : (
            <>
              <label className="block mb-2">Your Rating:</label>
              <InteractiveStarRating value={starRating} onChange={setStarRating} />
              <textarea
                placeholder="Write your review"
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                className="border rounded px-2 py-1 w-full mt-3 mb-2"
                rows={3}
                disabled={reviewLoading}
              />
              <button
                onClick={handleReviewSubmit}
                className={`bg-blue-600 text-white py-1 px-4 rounded ${reviewLoading ? "opacity-60" : ""}`}
                disabled={reviewLoading || !starRating || !reviewText}
              >
                Submit Review
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default TrackOrder;
