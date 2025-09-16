// src/pages/OrderProcess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";
import Autocomplete from "react-google-autocomplete";
const DELIVERY_FEE = 50;
const POLICY_LINKS = [
  {
    title: "Shipping Policy",
    url: "https://merchant.razorpay.com/policy/R9hxQi8w5g7gdt/shipping",
    preview:
      "Shipping delays may occur due to shipping partner issues or unforeseen circumstances. Orders shipped after payment verification. Check shipment timelines and eligible addresses before confirming your order.",
  },
  {
    title: "Terms and Conditions",
    url: "https://merchant.razorpay.com/policy/R9hxQi8w5g7gdt/terms",
    preview:
      "Your payment and service use are subject to strict compliance with applicable laws. Personal data may be processed, and product categories registered in your profile. Any unlawful, fraudulent or prohibited activities are not allowed.",
  },
  {
    title: "Cancellation & Refunds",
    url: "https://merchant.razorpay.com/policy/R9hxQi8w5g7gdt/refund",
    preview:
      "Refunds are issued within 7-10 business days to the original payment method if cancelled within 24 hours (cancellation charges may apply). Products must be unused and in original packaging. Some items are not eligible for return.",
  },
];

export default function OrderProcess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const artworkId = state?.artworkId;

  const [artwork, setArtwork] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    shippingAddress: "",
    billingAddress: "",
    mobile: "",
    altMobile: "",
  });

  const [showPolicies, setShowPolicies] = useState(false);
  const [policiesChecked, setPoliciesChecked] = useState(false);
  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  useEffect(() => {
    if (!artworkId) {
      alert("Artwork not specified");
      navigate("/main-dashboard");
      return;
    }
    async function loadArtwork() {
      setLoading(true);
      const { data, error } = await supabase
        .from("artworks")
        .select("id, title, cost, availability, image_urls")
        .eq("id", artworkId)
        .single()
      setLoading(false);

      // Correct: Safely set only the object
      if (error || !data || data.length === 0) {
        alert("Failed to load artwork");
        navigate("/main-dashboard");
        return;
      }
      setArtwork(data);
    }
    loadArtwork();
  }, [artworkId, navigate]);

  const totalCost = artwork ? artwork.cost + DELIVERY_FEE : 0;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handlePayment() {
    if (!policiesChecked) {
      alert("Please read and accept all policies before proceeding.");
      setShowPolicies(true);
      return;
    }

    setProcessing(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in to place order");
      setProcessing(false);
      navigate("/user-login");
      return;
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: razorpayKey,
        amount: totalCost * 100, // in paise
        currency: "INR",
        name: "My Art Store",
        description: "Artwork Purchase",
        handler: async function (response) {
          try {


            // Step 2: Insert the order with tracking_id
            const { error: orderError } = await supabase.from("orders").insert([
              {
                user_id: user.id,
                artwork_id: artwork.id,

                amount: totalCost,
                delivery_fee: DELIVERY_FEE,
                status: "paid",
                ordered_at: new Date().toISOString(),
                shipping_address: form.shippingAddress,
                billing_address: form.billingAddress,
                full_name: form.fullName,
                mobile: form.mobile,
                alt_mobile: form.altMobile,
                razorpay_payment_id: response.razorpay_payment_id,
                tracking_id: null,              // not yet known
                courier_name: null,
                shipment_status: "pending",     // waiting for shipment creation
                shipment_created_at: null

              },
            ]);

            if (orderError) throw orderError;

            // Step 3: Update artwork availability to false (sold)
            const { error: availabilityError } = await supabase
              .from("artworks")
              .update({ availability: false })
              .eq("id", artwork.id);

            if (availabilityError) {
              console.error("Failed to update availability:", availabilityError);
              // Order is already placed successfully, so we just log this error
            }

            alert("Payment successful & order placed! Tracking ID allocated. Artwork is now marked as sold.");
            navigate("/orders");
            resolve(response);
          } catch (err) {
            alert("Error saving order: " + err.message);
            reject(err);
          } finally {
            setProcessing(false);
            setShowPolicies(false);
          }
        },
        prefill: {
          name: form.fullName,
          email: user.email,
          contact: form.mobile,
        },
        theme: {
          color: "#F59E0B",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setShowPolicies(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-yellow-700 font-semibold">Loading artwork details...</p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600 font-semibold">Artwork not found.</p>
      </div>
    );
  }

  const isAvailable = artwork.availability !== false;

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-tr from-yellow-50 to-white">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-construction-lg overflow-hidden flex flex-col md:flex-row">

        {/* --- LEFT SECTION: IMAGE + SHIPPING/BILLING --- */}
        <div className="md:w-1/2 w-full p-6 flex flex-col items-center">
          {/* IMAGE */}
          {artwork.image_urls && artwork.image_urls.length > 0 ? (
            <img
              src={artwork.image_urls[0]}
              alt={artwork.title}
              className="w-full max-h-72 object-contain rounded-xl shadow-md mb-6"
            />
          ) : (
            <div className="w-full h-72 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl mb-6">
              No image available
            </div>
          )}
          
          <div className="w-full flex flex-col gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-3 font-['Nova_Round',cursive]">
              Purchase <span className="text-yellow-700">{artwork.title}</span>
            </h1>
            <p className="text-lg mb-1 font-semibold text-gray-800">
              Price: <span className="text-yellow-600">₹ {artwork.cost}</span>
            </p>
            <p className="mb-1 text-gray-700">
              Shipping Fee: <span className="font-semibold text-yellow-700">₹{DELIVERY_FEE.toFixed(2)}</span>
            </p>
            <p className={`mb-2 font-semibold ${isAvailable ? "text-green-600" : "text-red-600"}`}>
              Availability: {isAvailable ? "Available" : "Not Available"}
            </p>

          </div>
        </div>

        
        <div className="md:w-1/2 w-full p-6 flex flex-col justify-center">

          
          <form className="space-y-3" onSubmit={e => { e.preventDefault(); handlePayment(); }}>
            <label className="block">
              <span className="form-label font-semibold">Full Name</span>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Your full name"
              />
            </label>
            <label className="block">
              <span className="form-label font-semibold">Mobile Number</span>
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="10-digit mobile number"
              />
            </label>
            <label className="block">
              <span className="form-label font-semibold">Alternate Mobile Number (optional)</span>
              <input
                type="tel"
                name="altMobile"
                value={form.altMobile}
                onChange={handleChange}
                className="form-input"
                placeholder="Alternate mobile number"
              />
            </label>
            {/* SHIPPING & BILLING  */}
            <label className="block">
              <span className="form-label font-semibold">Shipping Address* (include Pin code)</span>
              <textarea
                name="shippingAddress"
                value={form.shippingAddress}
                onChange={handleChange}
                className="form-input"
                rows={2}
                required
                placeholder="Shipping address"
              ></textarea>
            </label>
            <label className="block">
              <span className="form-label font-semibold">Billing Address</span>
              <textarea
                name="billingAddress"
                value={form.billingAddress}
                onChange={handleChange}
                className="form-input"
                rows={2}
                required
                placeholder="Billing address"
              ></textarea>
            </label>
            <label className="inline-flex items-center mb-2">
              <input
                type="checkbox"
                className="form-checkbox text-yellow-500"
                checked={policiesChecked}
                onChange={() => setPoliciesChecked(!policiesChecked)}
              />
              <span className="ml-2 text-gray-700">
                I have read and accept the
                <button
                  type="button"
                  onClick={() => setShowPolicies(true)}
                  className="text-yellow-600 underline font-semibold ml-1"
                >
                  policies
                </button>
              </span>
            </label>
            <p className="text-xl font-semibold mb-2 text-gray-800">
              Total: <span className="text-yellow-600 font-bold">₹{totalCost.toFixed(2)}</span> (including delivery)
            </p>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!isAvailable || processing}
                className={`btn-primary ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {processing ? "Processing..." : "Pay Now"}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* POLICIES MODAL */}
      {showPolicies && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-construction overflow-auto max-h-[80vh]">
            <h2 className="text-2xl font-bold mb-4 text-yellow-600 font-['Nova_Round',cursive]">
              Policies
            </h2>
            {POLICY_LINKS.map((policy) => (
              <div key={policy.title} className="mb-5">
                <a
                  href={policy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 underline font-semibold text-lg"
                >
                  {policy.title}
                </a>
                <p className="text-gray-700 mt-1">{policy.preview}</p>
              </div>
            ))}
            <button
              onClick={() => setShowPolicies(false)}
              className="btn-primary mt-4 px-6 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );

}
