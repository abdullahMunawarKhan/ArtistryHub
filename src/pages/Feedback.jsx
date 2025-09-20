// Feedback.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate } from 'react-router-dom';


export default function Feedback() {
    const [name, setName] = useState("");
    const [emailId, setEmailId] = useState("");
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(emailId)) {
            setMessage({ type: "error", text: "Please enter a valid email address." });
            return; // stop submission if invalid
        }

        setLoading(true);


        const { data, error } = await supabase
            .from("feedbacks")
            .insert([
                {
                    name,
                    email_id: emailId,
                    feedback,
                },
            ], {
                returning: "minimal",
            });

        if (error) {
            console.error(error); // Show error in dev console
            setMessage({ type: "error", text: error.message || JSON.stringify(error) });
        } else {
            setMessage({ type: "success", text: "Thank you for your feedback!" });
            setName("");
            setEmailId("");
            setFeedback("");
            // Only navigate after success!
            navigate('/main-dashboard');
        }

        setLoading(false);
    };


    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <div className="max-w-lg mx-auto my-12 bg-white rounded-xl shadow-lg px-8 py-8">
            <h2 className="text-2xl font-bold mb-6 text-indigo-900 text-center">
                Provide Your Valuable Feedback
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="md:flex md:space-x-4 space-y-4 md:space-y-0">
                    <div className="flex-1">
                        <label htmlFor="name" className="block mb-2 font-medium text-gray-700">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            placeholder="Your Name"
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-gray-50"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="email" className="block mb-2 font-medium text-gray-700">
                            Email ID
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={emailId}
                            placeholder="your@email.com"
                            onChange={(e) => setEmailId(e.target.value)}
                            required
                            className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-gray-50"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="feedback" className="block mb-2 font-medium text-gray-700">
                        Feedback
                    </label>
                    <textarea
                        id="feedback"
                        rows={5}
                        value={feedback}
                        placeholder="Share your thoughts..."
                        onChange={(e) => setFeedback(e.target.value)}
                        required
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-gray-50 resize-vertical"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 font-semibold rounded-md transition-colors ${loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-700 text-white hover:bg-indigo-800"
                        }`}
                >
                    {loading ? "Submitting..." : "Submit Feedback"}
                </button>
            </form>
            {message && (
                <div
                    className={`mt-6 text-center font-semibold rounded-md py-2 ${message.type === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                        }`}
                >
                    {message.text}
                </div>
            )}
        </div>
    );

}
