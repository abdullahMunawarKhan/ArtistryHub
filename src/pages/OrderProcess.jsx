// src/pages/OrderProcess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

import {
  X,
  ChevronRight,
  AlertCircle,
  FileText,
  Phone,
  User,
  MapPin
} from "lucide-react";

const DELIVERY_FEE = 50;

const POLICY_LINKS = [
  {
    title: "Shipping Policy",
    url: "https://merchant.razorpay.com/policy/R9hxQi8w5g7gdt/shipping",
    preview:
      "Shipping delays may occur due to courier issues or unforeseen conditions. Orders shipped after payment verification."
  },
  {
    title: "Terms and Conditions",
    url: "https://merchant.razorpay.com/policy/R9hxQi8w5g7gdt/terms",
    preview:
      "Payment is subject to laws & compliance. Personal data may be processed."
  },
  {
    title: "Cancellation & Refunds",
    url: "https://merchant.razorpay.com/policy/R9hxQi8w5g7gdt/refund",
    preview:
      "Refunds issued within 7–10 days if cancelled within 24 hours. Packaging must be original."
  }
];

function PriceDisplay({ cost }) {
  const original = Math.round(cost * 1.15);

  return (
    <div className="text-xs md:text-sm mt-1">
      <span className="line-through text-slate-500 mr-1">₹{original}</span>
      <span className="text-green-600 font-medium mr-1">(15% off)</span>
      <span className="font-bold text-lg md:text-xl">₹{cost}</span>
    </div>
  );
}

function PaymentDetailsTable({ cost }) {
  const total = cost + DELIVERY_FEE;

  return (
    <div className="mt-3">
      <h3 className="font-semibold text-sm md:text-base mb-2">Payment Details</h3>

      <table className="w-full text-xs md:text-sm">
        <tbody>
          <tr>
            <td className="py-1 text-slate-600">Actual Price</td>
            <td className="py-1 font-medium">₹{Math.round(cost * 1.15)}</td>
          </tr>

          <tr>
            <td className="py-1 text-green-700">Offer (15% off)</td>
            <td className="py-1 font-medium">₹{cost}</td>
          </tr>

          <tr>
            <td className="py-1 text-yellow-700">Shipping Fee</td>
            <td className="py-1 font-medium">₹{DELIVERY_FEE}</td>
          </tr>

          <tr>
            <td className="py-2 font-bold">Total</td>
            <td className="py-2 text-yellow-700 font-bold text-base">₹{total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function OrderProcess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const artworkId = state?.artworkId;

  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [policiesChecked, setPoliciesChecked] = useState(false);

  const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    altMobile: "",
    shippingAddress: ""
  });

  // Load Artwork
  useEffect(() => {
    if (!artworkId) {
      alert("Artwork not found");
      navigate("/main-dashboard");
      return;
    }

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("artworks")
        .select("id,title,cost,availability,image_urls")
        .eq("id", artworkId)
        .single();

      setLoading(false);

      if (error || !data) {
        alert("Failed to load artwork");
        navigate("/main-dashboard");
        return;
      }

      setArtwork(data);
    }

    load();
  }, [artworkId]);

  const totalCost = artwork ? artwork.cost + DELIVERY_FEE : 0;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Payment
  async function handlePayment() {
    if (!form.fullName?.trim() || !form.mobile?.trim() || !form.shippingAddress?.trim()) {
      alert("Please fill all required fields");
      return;
    }

    if (!policiesChecked) {
      setShowPolicies(true);
      return;
    }

    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please login first");
      navigate("/user-login");
      setProcessing(false);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: totalCost * 100,
      currency: "INR",
      name: "My Art Store",
      handler: async function (resp) {
        try {
          await supabase.from("orders").insert([
            {
              user_id: user.id,
              artwork_id: artwork.id,
              amount: totalCost,
              delivery_fee: DELIVERY_FEE,
              status: "paid",
              ordered_at: new Date(),
              shipping_address: form.shippingAddress,
              full_name: form.fullName,
              mobile: form.mobile,
              alt_mobile: form.altMobile,
              razorpay_payment_id: resp.razorpay_payment_id,
              tracking_id: null,
              shipment_status: "pending"
            }
          ]);

          // mark as sold
          await supabase
            .from("artworks")
            .update({ availability: false })
            .eq("id", artwork.id);

          alert("Order Placed Successfully!");
          navigate("/orders");
        } finally {
          setProcessing(false);
          setShowPolicies(false);
        }
      },
      prefill: {
        name: form.fullName,
        contact: form.mobile
      },
      modal: {
        ondismiss: function () {
          setProcessing(false);
        }
      },
      theme: { color: "#F59E0B" }
    };

    new window.Razorpay(options).open();
  }

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-sm md:text-base animate-pulse">Loading...</p>
      </div>
    ); 

  if (!artwork)
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm md:text-base">Artwork not found.</p>
      </div>
    );

  const isAvailable = artwork.availability !== false;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-yellow-50 to-white flex items-center justify-center p-3">

      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">

        {/* LEFT SIDE */}
        <div className="md:w-1/2 w-full p-4 flex flex-col items-center">

          {/* Image */}
          {artwork.image_urls?.length ? (
            <img
              src={artwork.image_urls[0]}
              className="w-full max-h-64 object-contain rounded-xl shadow"
            />
          ) : (
            <div className="w-full h-64 bg-slate-100 flex items-center justify-center text-slate-500">
              No image
            </div>
          )}

          {/* Title */}
          <h1 className="text-lg md:text-xl font-bold mt-3 text-slate-800">
            Purchase <span className="text-yellow-700">{artwork.title}</span>
          </h1>

          <div className="flex flex-row md:flex-col justify-between items-center w-full mt-1">

            {/* Availability */}
            <p className="text-xs md:text-sm font-medium">
              Availability:{" "}
              <span className={isAvailable ? "text-green-600" : "text-red-600"}>
                {isAvailable ? "Yes" : "No"}
              </span>
            </p>

            {/* Price */}
            <div className="text-right mt-0 md:mt-1">
              <PriceDisplay cost={artwork.cost} />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="md:w-1/2 w-full p-4">
          <PaymentDetailsTable cost={artwork.cost} />

          {/* FORM */}
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              handlePayment();
            }}
          >
            {/* Full Name */}
            <Field
              icon={<User size={16} />}
              label="Full Name"
              name="fullName"
              required
              value={form.fullName}
              onChange={handleChange}
              placeholder="Your full name"
            />

            {/* Mobile */}
            <Field
              icon={<Phone size={16} />}
              label="Mobile Number"
              name="mobile"
              type="tel"
              required
              value={form.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
            />

            {/* Alt Mobile */}
            <Field
              icon={<Phone size={16} />}
              label="Alternate Mobile (optional)"
              name="altMobile"
              type="tel"
              value={form.altMobile}
              onChange={handleChange}
              placeholder="Alternate mobile"
            />

            {/* Address */}
            <FieldTextArea
              icon={<MapPin size={16} />}
              label="Shipping Address*"
              name="shippingAddress"
              required
              value={form.shippingAddress}
              onChange={handleChange}
              placeholder="Enter address with PIN code"
            />

            {/* Policies */}
            <label className="flex items-center text-xs md:text-sm text-slate-700 mt-1">
              <input
                type="checkbox"
                className="mr-2 accent-yellow-500"
                checked={policiesChecked}
                onChange={() => setPoliciesChecked(!policiesChecked)}
              />
              I accept the{" "}
              <button
                type="button"
                className="text-yellow-600 underline ml-1 font-medium"
                onClick={() => setShowPolicies(true)}
              >
                policies
              </button>
            </label>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!isAvailable || processing}
                className="bg-yellow-600 text-white text-xs md:text-sm px-4 py-2 rounded-lg w-fit shadow hover:bg-yellow-700 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Pay Now"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="border text-xs md:text-sm border-slate-400 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* POLICIES POPUP */}
      {showPolicies && (
        <PoliciesPopup
          close={() => setShowPolicies(false)}
          links={POLICY_LINKS}
        />
      )}
    </div>
  );
}

/* =====================================================
   Small Reusable Field Component
===================================================== */
function Field({ icon, label, ...rest }) {
  return (
    <label className="block text-xs md:text-sm mb-3">   {/* spacing between fields */}
      <span className="font-medium text-slate-700 flex items-center gap-1 mb-1">
        {icon} {label}
      </span>

      <input
        {...rest}
        className="
          w-full
          text-xs md:text-sm
          px-3 py-2
          border border-slate-300
          rounded-lg
          focus:ring-2 focus:ring-yellow-500
          outline-none
          transition
        "
      />
    </label>
  );
}

function FieldTextArea({ icon, label, ...rest }) {
  return (
    <label className="block text-xs md:text-sm mb-3">   {/* spacing between fields */}
      <span className="font-medium text-slate-700 flex items-center gap-1 mb-1">
        {icon} {label}
      </span>

      <textarea
        {...rest}
        rows={2}
        className="
          w-full
          text-xs md:text-sm
          px-3 py-2
          border border-slate-300
          rounded-lg
          focus:ring-2 focus:ring-yellow-500
          outline-none
          transition
        "
      />
    </label>
  );
}

/* =====================================================
   Policies Modal
===================================================== */
function PoliciesPopup({ close, links }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[80vh] overflow-auto shadow-lg">

        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-yellow-600 flex items-center gap-2">
            <FileText size={18} /> Policies
          </h2>
          <button onClick={close}>
            <X size={22} className="text-slate-600" />
          </button>
        </div>

        {links.map((p) => (
          <div key={p.title} className="mb-4">
            <a
              href={p.url}
              className="text-yellow-600 underline text-sm font-medium"
              target="_blank"
            >
              {p.title}
            </a>
            <p className="text-xs text-slate-700 mt-1">{p.preview}</p>
          </div>
        ))}

        <button
          onClick={close}
          className="mt-2 bg-yellow-600 text-white px-4 py-2 text-sm rounded-lg w-full hover:bg-yellow-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
