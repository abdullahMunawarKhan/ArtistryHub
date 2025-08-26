import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

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
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    shippingAddress: "",
    billingAddress: "",
    mobile: "",
    altMobile: "",
  });

  // Modal & checkbox state
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
    if (!policiesChecked) {
      alert("Please read and accept all policies before proceeding.");
      setShowPolicies(true);
      return;
    }

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
            setShowPolicies(false);
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
            setShowPolicies(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  if (loading || !artwork) {
    return <div className="center">Loading...</div>;
  }

  return (
    <div
      className="order-page"
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "2rem",
        boxShadow: "0 4px 20px #d6d6d6",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ marginBottom: 24 }}>Checkout</h2>

      <div
        className="order-artwork-details"
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 30,
          gap: 18,
        }}
      >
        <img
          src={artwork.image_urls[0]}
          alt={artwork.title}
          style={{ height: 100, borderRadius: 8, objectFit: "cover" }}
        />
        <div>
          <strong
            style={{ display: "block", fontSize: 18, marginBottom: 6, color: "#111" }}
          >
            {artwork.title}
          </strong>
          <div style={{ fontSize: 16, color: "#444" }}>₹{artwork.cost.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>
          Quantity:
          <input
            type="number"
            min={1}
            max={10}
            value={quantity}
            disabled={processing}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.min(10, Number(e.target.value))))
            }
            style={{
              width: 60,
              marginLeft: 8,
              padding: "6px 8px",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </label>
      </div>

      <div
        className="order-cost-breakup"
        style={{ marginBottom: 22, fontSize: 16, color: "#222" }}
      >
        <div>
          Delivery Charges: <strong>₹{DELIVERY_FEE.toFixed(2)}</strong>
        </div>
        <div style={{ fontWeight: "bold", marginTop: 6 }}>
          Total Amount: ₹{totalCost.toFixed(2)}
        </div>
      </div>

      <form className="form-details" style={{ marginBottom: 18 }}>
        <input
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          required
          onChange={handleChange}
          style={{
            marginBottom: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />
        <input
          name="mobile"
          placeholder="Mobile"
          value={form.mobile}
          required
          onChange={handleChange}
          style={{
            marginBottom: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />
        <input
          name="altMobile"
          placeholder="Alternate Mobile"
          value={form.altMobile}
          onChange={handleChange}
          style={{
            marginBottom: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />
        <input
          name="shippingAddress"
          placeholder="Shipping Address"
          value={form.shippingAddress}
          required
          onChange={handleChange}
          style={{
            marginBottom: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />
        <input
          name="billingAddress"
          placeholder="Billing Address"
          value={form.billingAddress}
          required
          onChange={handleChange}
          style={{
            marginBottom: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 15,
          }}
        />
      </form>

      <button
        className="btn"
        onClick={() => setShowPolicies(true)}
        disabled={processing}
        style={{
          width: "100%",
          marginTop: 12,
          background: "#F59E0B",
          color: "#fff",
          padding: "12px 0",
          fontWeight: 600,
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Proceed to Payment
      </button>

      {/* Terms & Conditions Modal */}
      {showPolicies && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(26,26,26,0.35)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "26px 28px 22px",
              maxWidth: 700,
              width: "100%",
              boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h2 style={{ marginBottom: 22, color: "#222" }}>Terms & Policies</h2>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 20,
                justifyContent: "space-between",
              }}
            >
              {POLICY_LINKS.map((policy) => (
                <a
                  key={policy.title}
                  href={policy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    background: "#f7f7f7",
                    padding: "20px 18px",
                    borderRadius: 8,
                    boxShadow: "0 2px 14px #e3e3e3",
                    color: "#222",
                    fontWeight: 600,
                    fontSize: 16,
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 10 }}>
                    {policy.title}
                  </div>
                  <div
                    style={{
                      fontWeight: 400,
                      fontSize: 14,
                      color: "#555",
                      flex: 1,
                      marginBottom: 10,
                    }}
                  >
                    {policy.preview}
                  </div>
                  <div
                    style={{ color: "#2563eb", fontWeight: 700, fontSize: 14 }}
                  >
                    View Full Policy →
                  </div>
                </a>
              ))}
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 15,
                color: "#444",
                marginBottom: 16,
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={policiesChecked}
                onChange={(e) => setPoliciesChecked(e.target.checked)}
                style={{ accentColor: "#F59E0B", transform: "scale(1.3)" }}
              />
              I have read and accept all policies above
            </label>
            {policiesChecked && (
              <div
                style={{
                  marginBottom: 12,
                  fontSize: 14,
                  color: "#15803d",
                  fontWeight: 600,
                }}
              >
                Please ensure you have read all policies before proceeding with
                payment.
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button
                disabled={!policiesChecked}
                onClick={() => {
                  setShowPolicies(false);
                  handlePayment();
                }}
                style={{
                  flex: 1,
                  background: "#F59E0B",
                  color: "white",
                  fontWeight: 700,
                  padding: "12px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: policiesChecked ? "pointer" : "not-allowed",
                  opacity: policiesChecked ? 1 : 0.6,
                }}
              >
                Proceed to Payment
              </button>
              <button
                onClick={() => setShowPolicies(false)}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  color: "white",
                  fontWeight: 700,
                  padding: "12px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
