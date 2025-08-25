import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

const DELIVERY_FEE = 50;

export default function OrderProcess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const artworkId = state?.artworkId;

  const [artwork, setArtwork] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    shippingAddress: "",
    billingAddress: "",
    mobile: "",
    altMobile: "",
  });

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
        .select("id, title, cost, image_urls")
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
    loadArtwork();
  }, [artworkId, navigate]);

  const totalCost = artwork ? artwork.cost * quantity + DELIVERY_FEE : 0;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handlePayment() {
    setProcessing(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
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
            // Insert order in Supabase after successful payment
            const { error } = await supabase.from("orders").insert([
              {
                user_id: user.id,
                artwork_id: artwork.id,
                quantity,
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
              },
            ]);
            if (error) throw error;
            alert("Payment successful & order placed!");
            navigate("/orders");
            resolve(response);
          } catch (err) {
            alert("Error saving order: " + err.message);
            reject(err);
          } finally {
            setProcessing(false);
            setShowConfirm(false);
          }
        },
        prefill: {
          name: form.fullName,
          email: user?.email,
          contact: form.mobile,
        },
        theme: { color: "#F59E0B" },
        modal: {
         ondismiss: function () {
         setProcessing(false);
         setShowConfirm(false); // Optional: Also close the confirmation modal if needed
    
      }
    }
  };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  if (loading || !artwork) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="flex flex-col md:flex-row w-full max-w-7xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left side: Artwork image and summary */}
        <div className="md:w-1/2 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-200">
          <img
            src={artwork.image_urls?.[0] || "/default-artwork.png"}
            alt={artwork.title}
            className="w-full h-96 object-cover rounded-lg"
          />
          <h1 className="text-3xl font-extrabold mt-6 text-gray-800">
            {artwork.title}
          </h1>
          <p className="text-xl text-yellow-600 mt-2">
            ₹{artwork.cost.toFixed(2)}
          </p>
        </div>

        {/* Right side: Form */}
        <div className="md:w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-6">Complete Your Purchase</h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setShowConfirm(true);
            }}
          >
            <div>
              <label className="block mb-1 font-semibold">Full Name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Shipping Address</label>
              <textarea
                name="shippingAddress"
                value={form.shippingAddress}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Billing Address</label>
              <textarea
                name="billingAddress"
                value={form.billingAddress}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Mobile Number</label>
              <input
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">
                Alternative Mobile Number
              </label>
              <input
                name="altMobile"
                value={form.altMobile}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="mt-6 p-4 bg-yellow-100 rounded-md border border-yellow-300">
              <div className="flex justify-between">
                <span className="font-semibold">Items Total:</span>
                <span>₹{(artwork.cost * quantity).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-semibold">Delivery Charges:</span>
                <span>₹{DELIVERY_FEE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-4 text-xl font-bold">
                <span>Total:</span>
                <span>₹{totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <label className="flex items-center gap-2">
                Quantity:
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-20 border border-gray-300 rounded px-2 py-1 ml-2"
                />
              </label>

              <button
                type="submit"
                disabled={processing}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded font-semibold"
              >
                {processing ? "Processing..." : "Pay with UPI"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">Confirm Your Order</h3>
            <p>
              Items: <strong>{quantity}</strong>
            </p>
            <p>
              Delivery Charges: <strong>₹{DELIVERY_FEE.toFixed(2)}</strong>
            </p>
            <p className="font-bold text-lg mt-2">
              Total Amount: ₹{totalCost.toFixed(2)}
            </p>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={processing}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
              >
                {processing ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
