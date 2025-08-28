import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, useParams } from 'react-router-dom';

const TrackOrder = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Static demo data - replace with actual API call
  const demoOrderData = {
    id: "ORD-2024-001",
    trackingNumber: "TRK123456789",
    status: "shipped",
    orderDate: "2024-08-25",
    estimatedDelivery: "2024-08-30",
    
    // Order Summary
    orderSummary: {
      subtotal: 299.97,
      shipping: 15.99,
      tax: 24.00,
      total: 339.96
    },

    // Customer Details
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567"
    },

    // Shipping Address
    shippingAddress: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "United States"
    },

    // Payment Information
    payment: {
      method: "Credit Card",
      last4: "4242",
      status: "paid",
      transactionId: "txn_1234567890"
    },

    // Products
    products: [
      {
        id: 1,
        name: "Wireless Bluetooth Headphones",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
        price: 129.99,
        quantity: 1,
        sku: "WBH-001"
      },
      {
        id: 2,
        name: "Smart Phone Case",
        image: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=300&h=300&fit=crop",
        price: 24.99,
        quantity: 2,
        sku: "SPC-002"
      },
      {
        id: 3,
        name: "USB-C Charging Cable",
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop",
        price: 19.99,
        quantity: 3,
        sku: "UCC-003"
      }
    ],

    // Order Timeline
    timeline: [
      {
        status: "ordered",
        title: "Order Placed",
        description: "Your order has been successfully placed",
        timestamp: "2024-08-25T10:30:00Z",
        completed: true
      },
      {
        status: "confirmed",
        title: "Order Confirmed",
        description: "Order confirmed and being prepared",
        timestamp: "2024-08-25T14:15:00Z",
        completed: true
      },
      {
        status: "shipped",
        title: "Shipped",
        description: "Your order is on its way",
        timestamp: "2024-08-26T09:00:00Z",
        completed: true
      },
      {
        status: "out_for_delivery",
        title: "Out for Delivery",
        description: "Your package is out for delivery",
        timestamp: null,
        completed: false
      },
      {
        status: "delivered",
        title: "Delivered",
        description: "Package delivered successfully",
        timestamp: null,
        completed: false
      }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const fetchOrderData = async () => {
      setLoading(true);
      try {
        // Replace this with actual Supabase query
        // const { data, error } = await supabase
        //   .from('orders')
        //   .select('*')
        //   .eq('tracking_number', trackingId)
        //   .single();

        // Using demo data for now
        setTimeout(() => {
          setOrderData(demoOrderData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching order:', error);
        setLoading(false);
      }
    };

    if (trackingId) {
      fetchOrderData();
    }
  }, [trackingId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h2 className="text-2xl font-semibold text-red-600 mb-3">Order Not Found</h2>
          <p className="text-gray-600 mb-8">We couldn't find an order with tracking number: {trackingId}</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8 bg-white p-5 rounded-xl shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="bg-gray-100 hover:bg-gray-200 border-none px-4 py-2 rounded-lg cursor-pointer font-medium text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Track Your Order</h1>
          <div className="flex gap-5 flex-wrap">
            <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-medium text-gray-600">
              Order #{orderData.id}
            </span>
            <span className="bg-gray-100 px-3 py-1 rounded-md text-sm font-medium text-gray-600">
              Tracking: {orderData.trackingNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white p-8 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-8">Order Status</h2>
        <div className="flex flex-col gap-0">
          {orderData.timeline.map((item, index) => (
            <div key={index} className="flex gap-5 relative">
              <div className="flex flex-col items-center relative">
                <div className={`w-4 h-4 rounded-full border-2 relative z-10 transition-all duration-300 ${
                  item.completed 
                    ? 'bg-green-500 border-green-200' 
                    : 'bg-gray-200 border-gray-100'
                }`}></div>
                {index < orderData.timeline.length - 1 && (
                  <div className={`w-0.5 h-16 mt-1 ${
                    item.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                {item.timestamp && (
                  <span className="text-xs text-gray-400 font-medium">
                    {formatTime(item.timestamp)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Order Summary */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Order Summary
          </h2>
          <div className="mb-5">
            {orderData.products.map((product) => (
              <div key={product.id} className="flex gap-4 py-4 border-b border-gray-100 last:border-b-0">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-16 h-16 object-cover rounded-lg bg-gray-50"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                  <p className="text-gray-400 text-xs mb-2">SKU: {product.sku}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Qty: {product.quantity}</span>
                    <span className="font-semibold text-gray-900 text-sm">${product.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2 text-gray-700 text-sm">
              <span>Subtotal:</span>
              <span>${orderData.orderSummary.subtotal}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-700 text-sm">
              <span>Shipping:</span>
              <span>${orderData.orderSummary.shipping}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-700 text-sm">
              <span>Tax:</span>
              <span>${orderData.orderSummary.tax}</span>
            </div>
            <div className="flex justify-between py-4 mt-3 pt-4 border-t-2 border-gray-100 font-semibold text-gray-900 text-base">
              <span>Total:</span>
              <span>${orderData.orderSummary.total}</span>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Order Details
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium text-sm">Order Date:</span>
              <span className="text-gray-900 font-medium text-sm text-right">
                {formatDate(orderData.orderDate)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium text-sm">Estimated Delivery:</span>
              <span className="text-gray-900 font-medium text-sm text-right">
                {formatDate(orderData.estimatedDelivery)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium text-sm">Customer:</span>
              <span className="text-gray-900 font-medium text-sm text-right">
                {orderData.customer.name}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600 font-medium text-sm">Email:</span>
              <span className="text-gray-900 font-medium text-sm text-right">
                {orderData.customer.email}
              </span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-600 font-medium text-sm">Phone:</span>
              <span className="text-gray-900 font-medium text-sm text-right">
                {orderData.customer.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Shipping Address
          </h2>
          <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 text-sm mb-1 leading-relaxed">
              {orderData.shippingAddress.street}
            </p>
            <p className="text-gray-700 text-sm mb-1 leading-relaxed">
              {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              {orderData.shippingAddress.country}
            </p>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 pb-3 border-b-2 border-gray-100">
            Payment Information
          </h2>
          <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-green-500">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-700 font-semibold text-sm">
                {orderData.payment.method}
              </span>
              <span className="text-gray-600 text-sm font-mono">
                **** {orderData.payment.last4}
              </span>
            </div>
            <div className="mb-3">
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase ${
                orderData.payment.status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : orderData.payment.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {orderData.payment.status}
              </span>
            </div>
            <div>
              <small className="text-gray-400 text-xs">
                Transaction ID: {orderData.payment.transactionId}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center flex-wrap">
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-3 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 min-w-36 border border-gray-200">
          Contact Support
        </button>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 min-w-36">
          Download Invoice
        </button>
      </div>
    </div>
  );
};

export default TrackOrder;

