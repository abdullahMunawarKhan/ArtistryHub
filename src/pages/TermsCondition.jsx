import React from "react";

// Policy links remain unchanged
const POLICY_LINKS = [
    {
        title: "Shipping Policy",
        url: "https://merchant.razorpay.com/policy/R9hxQi8w5g7gdt/shipping",
        preview:
            "Shipping delays may occur due to shipping partner issues or unforeseen circumstances. Orders shipped after payment verification. Check shipment timelines and eligible addresses before confirming your order.     ",
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

// Convert terms into array of objects, so each can be a card
const ARTIST_TERMS = [
    {
        title: "Accuracy of Information",
        detail: "You must provide accurate and complete information during registration."
    },
    {
        title: "Document Authenticity",
        detail: "All submitted documents must be authentic and belong to you."
    },
    {
        title: "Intellectual Property Rights",
        detail: "You retain full ownership of your artwork and creative content."
    },
    {
        title: "Platform Compliance",
        detail: "You agree to comply with all platform policies and guidelines."
    },
    {
        title: "Legal Compliance",
        detail: "You must remain compliant with all applicable laws and regulations."
    },
    {
        title: "Account Suspension",
        detail: "Accounts may be suspended or terminated for policy violations."
    },
    {
        title: "Content Guidelines",
        detail: "All artwork must be original and not infringe on others' rights."
    },
    {
        title: "Commission Structure",
        detail: "Platform commission rates apply as per current pricing policy."
    },
    {
        title: "Shipment Charges",
        detail: "As our team will come to your doorstep for picking product, 50 rupees will be deducted from your payment per order along with platform charges."
    }
];

const TermsCondition = () => (
    <div className="terms-condition-container" style={{ padding: "2rem", maxWidth: 900, margin: "auto" }}>
        <h2 className="text-2xl font-bold mb-4">Platform Policies</h2>
        <ul className="mb-8">
            {POLICY_LINKS.map(({ title, url, preview }, idx) => (
                <li
                    key={idx}
                    style={{
                        marginBottom: "1.4rem",
                        background: "#f5f7fa",
                        borderRadius: 12,
                        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                        padding: "1.1rem",
                    }}
                >
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: "bold", fontSize: "1.1em", color: "#114488" }}
                    >
                        {title}
                    </a>
                    <p style={{ marginTop: "0.4rem", color: "#555" }}>
                        {preview}
                    </p>
                    <div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#1e90ff", textDecoration: "underline" }}
                        >
                            See full policy
                        </a>
                    </div>
                </li>
            ))}
        </ul>


        <h2 className="text-2xl font-bold mb-4">Artist Registration Terms and Conditions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARTIST_TERMS.map(({ title, detail }, idx) => (
                <div
                    key={idx}
                    style={{
                        background: "#fff",
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                        padding: "1.5rem",
                        marginBottom: "1rem",
                        borderLeft: "5px solid #1e90ff",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem"
                    }}
                >
                    <span style={{ fontWeight: "bold", fontSize: "1.13em", color: "#1e90ff" }}>
                        {idx + 1}. {title}
                    </span>
                    <span style={{ color: "#444", fontSize: "1em", fontWeight: 500 }}>{detail}</span>
                </div>
            ))}
        </div>
    </div>
);

export default TermsCondition;
