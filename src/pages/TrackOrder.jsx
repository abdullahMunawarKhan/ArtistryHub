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
  const [starRating, setStarRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const normalizedId = trackingId.trim();

  // Helper for courier-specific tracking URLs
  const getTrackingUrl = (trackingId) => {
    if (!trackingId) return null;
    return `https://shiprocket.co/tracking/${trackingId}`;
  };

  const ORDER_STEPS = [
    { key: 'pending', label: 'Order placed ' },
    { key: 'confirm', label: 'Order Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered' },
  ];
  const updateArtworkReview = async (artworkId, newReviewText, newRating) => {
    const numericRating = Number(newRating);
    if (isNaN(numericRating)) {
      console.error("Invalid rating: not a number");
      return;
    }

    // Fetch current review JSON array
    const { data: artworkData, error: fetchError } = await supabase
      .from("artworks")
      .select("review, rating")
      .eq("id", artworkId)
      .single();

    if (fetchError) {
      console.error("Error fetching artwork data:", fetchError);
      return;
    }

    const currentReviews = artworkData?.review || [];
    const updatedReviews = [...currentReviews, newReviewText];

    // Update review and rating columns with numeric rating value
    const { error: updateError } = await supabase
      .from("artworks")
      .update({
        review: updatedReviews,
        rating: numericRating,
      })
      .eq("id", artworkId);

    if (updateError) {
      console.error("Error updating artwork:", updateError);
    } else {
      console.log("Artwork review and rating updated successfully");
    }
  };

  useEffect(() => {
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`
            id,
            tracking_id,
            shipment_created_at,
            shipment_status,
            ordered_at,
            amount,
            delivered_at,
            shipping_address,
            billing_address,
            full_name,
            mobile,
            artwork:artworks (
              id, 
              title, 
              image_urls, 
             
              artist:artists (name)
            )
          `)
          .eq("tracking_id", normalizedId)
          .maybeSingle();

        console.log("fetchOrderData →", { data, error });

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
            shipmentCreatedAt: data.shipment_created_at,
            deliveredAt: data.delivered_at,
            estimatedDelivery: null, // can be added later
            totalAmount: data.amount,
            products: [
              {
                id: data.artwork?.id,
                name: data.artwork?.title,
                image: data.artwork?.image_urls?.[0] || "",
                price: data.amount, // Use order amount as it might include shipping
                quantity: data.quantity,
                artist: data.artwork?.artist?.name,
              },
            ],
            customer: {
              name: data.full_name,
              phone: data.mobile,
            },
            shippingAddress: data.shipping_address,
            billingAddress: data.billing_address,
            courierName: data.courier_name,
            trackingUrl: getTrackingUrl(data.tracking_id),
          };
          setOrderData(order);
          if (order.products && order.products[0]) {
            const product = order.products[0];
            // You might need to fetch the review for this artwork/product from DB
            // For example (assuming supabase, similar to your update logic):
            let { data: artworkData, error } = await supabase
              .from('artworks')
              .select('review, rating')
              .eq('id', product.id)
              .single();

            if (artworkData && artworkData.review && artworkData.rating) {
              setReviewSubmitted(true); // Hide form, show submitted block
              // Optionally, prefill these line if you want to show the values:
              setStarRating(artworkData.rating);
              setReviewText(artworkData.review);
            }
          }
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
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirm: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      dilevered: "bg-green-100 text-green-800",
      canceled: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const handleReviewSubmit = async () => {
    if (!starRating || !reviewText || !orderData?.products[0]?.id) return;

    setReviewLoading(true);
    try {
      await updateArtworkReview(orderData.products[0].id, reviewText, starRating);
      setReviewSubmitted(true);
    } catch (err) {
      console.error("Review submission error:", err);
    } finally {
      setReviewLoading(false);
    }
  };


  function VerticalOrderStatus({ status }) {
    const stepIndex = ORDER_STEPS.findIndex((step) =>
      status.toLowerCase().includes(step.key)
    );
    return (
      <ol className="space-y-6 my-6 w-72 mx-auto">
        {ORDER_STEPS.map((step, i) => {
          const isActive = i <= stepIndex;
          // Determine which date to show for this step
          // Inside VerticalOrderStatus, where you determine timestamp:
          let timestamp;
          switch (step.key) {
            case "pending":
              timestamp = orderData.orderDate;
              break;
            case "confirm":
              timestamp = orderData.orderDate
                ? new Date(new Date(orderData.orderDate).getTime() + 24 * 3600 * 1000)
                : null;
              break;
            case "shipped":
              timestamp = orderData.shipmentCreatedAt;
              break;
            case "delivered":
              timestamp = orderData.deliveredAt;
              break;
            default:
              timestamp = null;
          }




          return (
            <li key={step.key} className="relative flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2
              ${isActive ? 'border-green-500 bg-green-100 text-green-700' : 'border-gray-300 bg-white text-gray-400'}`}>
                {isActive ? (
                  // Checkmark SVG
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10l4 4 6-6" stroke="green" strokeWidth="2" fill="none" />
                  </svg>
                ) : (
                  <span className="text-lg font-semibold">{i + 1}</span>
                )}
              </div>
              <span className={`ml-4 font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
                {step.key === 'delivered'
                  ? orderData.status === 'delivered' ? 'Delivered' : 'Delivery'
                  : step.label}
              </span>

              {step.key === "shipped" ? (
                // Shipped step: show waiting if no timestamp, else formatted date
                orderData.shipmentCreatedAt ? (
                  <span className="ml-2 text-xs text-gray-400">
                    {formatDate(orderData.shipmentCreatedAt)}
                  </span>
                ) : (
                  <span className="ml-2 text-xs text-gray-500 italic">
                    Waiting for shipment
                  </span>
                )
              ) : step.key === "delivered" ? (
                // Delivered step: only show if deliveredAt exists
                orderData.deliveredAt && (
                  <span className="ml-2 text-xs text-gray-400">
                    {formatDate(orderData.deliveredAt)}
                  </span>
                )
              ) : (
                // Pending & Confirm steps: show date if exists
                timestamp && (
                  <span className="ml-2 text-xs text-gray-400">
                    {formatDate(timestamp)}
                  </span>
                )
              )}

              {i < ORDER_STEPS.length - 1 && (
                <div className={`absolute left-4 top-8 w-0.5 h-8 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}

            </li>
          );
        })}
      </ol>
    );
  }

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
    <div className="min-h-[90vh] max-w-6xl mx-auto p-5 bg-gray-50">
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

        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Order Date:</span>
            <p className="font-medium">{formatDate(orderData.orderDate)}</p>
          </div>
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <p className="font-medium">₹{orderData.totalAmount?.toFixed(2)}</p>
          </div>
          <div className="flex gap-5 flex-wrap items-center">

            <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-medium text-gray-600">
              Tracking: {orderData.trackingNumber}
            </span>
            <span className={`px-3 py-1 rounded-md text-sm font-medium ${getStatusColor(orderData.status)}`}>
              {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
            </span>
            {orderData.trackingUrl && (
              <a
                href={orderData.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Track Live
              </a>
            )}
          </div>
          <VerticalOrderStatus status={orderData.status} orderData={orderData} />
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
                onClick={() => navigate(`/product?id=${product.id}`)}
                className="flex gap-4 py-4 px-6 mb-4 rounded-lg border border-white/20 bg-white/10 backdrop-blur-md shadow-lg cursor-pointer transition-transform hover:scale-[1.02]"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg bg-gray-50 border"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-base mb-1">
                    {product.name}
                  </h4>
                  {product.artist && (
                    <p className="text-gray-600 text-sm mb-2">
                      Artist: {product.artist}
                    </p>
                  )}
                  <div className="flex justify-between items-center">

                    <span className="font-semibold text-gray-900 text-base">
                      ₹{product.price?.toFixed(2)}
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
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {orderData.shippingAddress}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Customer Information
          </h2>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600 text-sm">Name:</span>
              <p className="font-medium">{orderData.customer.name}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Phone:</span>
              <p className="font-medium">{orderData.customer.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section - Only show for delivered orders */}
      {orderData.status === 'dilevered' || 'shipped' && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Share Your Experience
          </h3>
          {reviewSubmitted ? (
            <div className="text-center py-8">
              <div className="text-green-600 font-medium text-lg mb-2">
                ✅ Thank you for your review!
              </div>
              <p className="text-gray-600">
                Your feedback helps us improve our service.
              </p>
              {/* Stars */}
              <div className="flex justify-center mt-4 mb-2">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <svg
                    key={idx}
                    width={28}
                    height={28}
                    viewBox="0 0 20 20"
                    fill={idx <= starRating ? "#F59E0B" : "#E5E7EB"}
                    style={{ marginRight: 4 }}
                  >
                    <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,13.5 4.5,18 6.5,11 1,7 8,7" />
                  </svg>
                ))}
              </div>
              {/* Review text */}
              <div className="mt-4 text-gray-800 text-base italic">
                "{reviewText}"
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Rating:
                </label>
                <InteractiveStarRating value={starRating} onChange={setStarRating} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Write Your Review:
                </label>
                <textarea
                  placeholder="Tell us about your experience with this artwork..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  disabled={reviewLoading}
                />
              </div>
              <button
                onClick={handleReviewSubmit}
                className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors ${reviewLoading || !starRating || !reviewText
                  ? "opacity-50 cursor-not-allowed"
                  : ""
                  }`}
                disabled={reviewLoading || !starRating || !reviewText}
              >
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
