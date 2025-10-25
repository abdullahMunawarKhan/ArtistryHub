import React, { useState, useRef } from "react";

export default function Demo() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [material, setMaterial] = useState("");
    const [previewUrls, setPreviewUrls] = useState([]);
    const [videoPreview, setVideoPreview] = useState("");
    const [pickupAddress, setPickupAddress] = useState("");
    const [length, setLength] = useState("");
    const [width, setWidth] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [actualLength, setActualLength] = useState("");
    const [actualHeight, setActualHeight] = useState("");
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const fileInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const pickupCharges = 50;
    const platformFees = basePrice ? (0.075 * Number(basePrice)).toFixed(2) : 0;
    const totalCost = basePrice ? Math.round(Number(basePrice) + pickupCharges + Number(platformFees)) : "";

    const defaultCategories = [
        "Portrait",
        "Landscape",
        "Abstract",
        "Watercolor",
        "Oil",
        "Digital",
        "Sketch",
        "Modern",
        "Classic",
        "Calligraphy",
    ];

    const zoomStep = 0.25;
    const maxZoom = 3;
    const minZoom = 1;

    function handleImageChange(e) {
        const files = Array.from(e.target.files).slice(0, 3);
        const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);

        if (validFiles.length < files.length) {
            alert("Some images were ignored due to size limit (max 10MB each).");
        }

        const urls = validFiles.map((file) => URL.createObjectURL(file));
        setPreviewUrls(urls);
    }

    function handleVideoChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            alert("Video size must be less than 50MB");
            if (videoInputRef.current) {
                videoInputRef.current.value = '';
            }
            return;
        }

        const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];
        if (!validVideoTypes.includes(file.type)) {
            alert("Invalid video format. Please upload MP4, WebM, OGG, AVI, MOV, or WMV files only.");
            if (videoInputRef.current) {
                videoInputRef.current.value = '';
            }
            return;
        }

        setVideoPreview(URL.createObjectURL(file));
    }

    function handleRemoveImage(idx) {
        const updatedUrls = previewUrls.filter((_, i) => i !== idx);
        setPreviewUrls(updatedUrls);

        if (updatedUrls.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    const resetImageView = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const zoomIn = () => {
        if (zoom < maxZoom) {
            setZoom(prev => Math.min(prev + 0.25, maxZoom));
        }
    };

    const zoomOut = () => {
        const newZoom = Math.max(zoom - 0.25, minZoom);
        setZoom(newZoom);
        if (newZoom === minZoom) {
            setPosition({ x: 0, y: 0 }); // Reset position when fully zoomed out
        }
    };

    // Pan handlers
    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e) => {
        if (zoom > 1 && e.touches.length === 1) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y
            });
        }
    };

    const handleTouchMove = (e) => {
        if (isDragging && zoom > 1 && e.touches.length === 1) {
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % previewUrls.length);
        resetImageView();
    };

    const goToPrevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length);
        resetImageView();
    };

    function handleDemoSubmit(e) {
        e.preventDefault();
        alert("This is a demo page. Artwork upload will be enabled soon!");
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            {/* Top Announcement Banner */}
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 text-white py-6 px-4 shadow-lg">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 mr-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <h1 className="text-2xl md:text-3xl font-bold">
                            Get Ready with Your Artwork!
                        </h1>
                    </div>
                    <p className="text-base md:text-lg font-medium">
                        We will be enabling artwork upload in a few days. Explore the upload process below.
                    </p>
                    <p className="text-sm md:text-base mt-2 opacity-90">
                        This is a sample preview page to help you prepare your artwork details in advance.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6">
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200">
                    {/* Header */}
                    {/* <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 px-6 md:px-8">
            <h2 className="text-2xl md:text-3xl font-bold flex items-center">
              <svg className="w-7 h-7 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Artwork - Demo Preview
            </h2>
            <p className="text-sm text-gray-300 mt-2">
              Fill out this form to see how the artwork upload process works
            </p>
          </div> */}

                    {/* Form */}
                    <form onSubmit={handleDemoSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                                        Artwork Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Enter artwork title"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Describe your artwork"
                                        rows="4"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 resize-none"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                                    >
                                        <option value="">Select category</option>
                                        {defaultCategories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Material */}
                                <div>
                                    <label className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                                        Material
                                    </label>
                                    <input
                                        type="text"
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        placeholder="e.g., Canvas, Paper, Wood"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                                    />
                                </div>

                                {/* Pickup Address */}
                                <div>
                                    <label className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                                        Pickup Address <span className="text-red-500">*</span>
                                        <span className="text-xs text-gray-500 ml-2">(with Pin code, precise)</span>
                                    </label>
                                    <textarea
                                        value={pickupAddress}
                                        onChange={(e) => setPickupAddress(e.target.value)}
                                        placeholder="Enter complete pickup address with pin code"
                                        rows="3"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm md:text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 resize-none"
                                    />
                                </div>

                                {/* Video Upload */}
                                <div>
                                    <label htmlFor="video-input" className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                                        Video Upload <span className="text-red-500">*</span>
                                        <span className="text-xs text-gray-500 ml-2">(Max 50 MB, 30 seconds)</span>
                                    </label>
                                    <input
                                        ref={videoInputRef}
                                        id="video-input"
                                        type="file"
                                        accept="video/mp4,video/webm,video/ogg,video/avi,video/mov,video/wmv"
                                        onChange={handleVideoChange}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 cursor-pointer"
                                    />

                                    {!videoPreview && (
                                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-sm text-amber-800 flex items-start">
                                                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Video upload will be mandatory (max 30 seconds, 50 MB)
                                            </p>
                                        </div>
                                    )}

                                    {videoPreview && (
                                        <div className="mt-4">
                                            <video
                                                controls
                                                className="w-full max-w-md rounded-lg shadow-lg border border-gray-200"
                                            >
                                                <source src={videoPreview} />
                                                Your browser does not support video preview.
                                            </video>
                                            <p className="mt-2 text-sm text-green-600 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Video preview loaded successfully
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Dimensions After Packing */}
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                    <label className="block font-semibold text-gray-800 mb-3 text-sm md:text-base">
                                        Artwork Dimensions <span className="text-xs text-gray-500">(after packing)</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input
                                            type="number"
                                            value={length}
                                            onChange={(e) => setLength(e.target.value)}
                                            placeholder="Length (cm)"
                                            min="1"
                                            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        />
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(e.target.value)}
                                            placeholder="Width (cm)"
                                            min="1"
                                            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        />
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            placeholder="Height (cm)"
                                            min="1"
                                            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        />
                                        <input
                                            type="number"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            placeholder="Weight (kg)"
                                            min="0.1"
                                            step="any"
                                            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                        />
                                    </div>
                                </div>

                                {/* Actual Dimensions */}
                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                    <label className="block font-semibold text-gray-800 mb-3 text-sm md:text-base">
                                        Actual Artwork Dimensions
                                    </label>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Length (cm)</label>
                                            <input
                                                type="number"
                                                value={actualLength}
                                                onChange={(e) => setActualLength(e.target.value)}
                                                placeholder="Actual length"
                                                min="1"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-1">Height (cm)</label>
                                            <input
                                                type="number"
                                                value={actualHeight}
                                                onChange={(e) => setActualHeight(e.target.value)}
                                                placeholder="Actual height"
                                                min="1"
                                                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-lg border border-yellow-200">
                                    <h3 className="font-semibold text-gray-800 mb-4 text-sm md:text-base flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        Price Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700">Base Price (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={basePrice}
                                                onChange={(e) => setBasePrice(e.target.value)}
                                                placeholder="0"
                                                className="w-32 sm:w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Pickup Charges</span>
                                            <span className="text-sm font-semibold text-gray-800 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                                ₹ {pickupCharges}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Platform Fees (7.5%)</span>
                                            <span className="text-sm font-semibold text-gray-800 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                                ₹ {platformFees}
                                            </span>
                                        </div>
                                        <div className="pt-3 border-t-2 border-yellow-300 flex items-center justify-between">
                                            <span className="text-base font-bold text-gray-900">Total Cost for Buyer</span>
                                            <span className="text-lg font-bold text-yellow-700 bg-white px-4 py-2 rounded-lg border-2 border-yellow-300 shadow-sm">
                                                ₹ {totalCost || "0"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block font-semibold text-gray-800 mb-2 text-sm md:text-base">
                                        Upload Images <span className="text-xs text-gray-500">(Max 3, each under 10MB)</span>
                                    </label>
                                    <p className="text-xs text-amber-700 mb-3 bg-amber-50 p-2 rounded border border-amber-200">
                                        Don't upload with any social media ID tag or watermark - will be provided by our platform
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 file:mr-4 file:py-3 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                                    />

                                    {previewUrls.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 gap-3">
                                            {previewUrls.map((url, i) => (
                                                <div key={i} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt={`preview-${i}`}
                                                        className="w-full h-28 object-cover rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform duration-300 border border-gray-200"
                                                        onClick={() => {
                                                            setCurrentImageIndex(i);
                                                            setImageViewerOpen(true);
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveImage(i)}
                                                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg text-xs font-bold"
                                                        title="Remove image"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                    </form>
                </div>
            </div>

            {/* Image Viewer Modal */}
            {imageViewerOpen && previewUrls.length > 0 && (
                <div
                    onClick={() => setImageViewerOpen(false)}
                    className="fixed inset-0 w-screen h-screen bg-black bg-opacity-90 flex justify-center items-center z-50 select-none p-4"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full h-full flex flex-col items-center justify-center"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setImageViewerOpen(false)}
                            className="fixed top-6 right-6 z-20 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
                            aria-label="Close image viewer"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Fixed Zoom Controls - Bottom Right */}
                        <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-2 bg-black bg-opacity-40 p-2 rounded-lg backdrop-blur-sm">
                            <button
                                onClick={zoomIn}
                                disabled={zoom >= maxZoom}
                                className={`w-10 h-10 text-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white flex items-center justify-center ${zoom >= maxZoom ? 'cursor-not-allowed opacity-50 hover:scale-100' : 'cursor-pointer'
                                    }`}
                                aria-label="Zoom in"
                            >
                                +
                            </button>

                            <span className="text-white font-semibold text-xs bg-black bg-opacity-30 px-2 py-1 rounded text-center">
                                {(zoom * 100).toFixed(0)}%
                            </span>

                            <button
                                onClick={zoomOut}
                                disabled={zoom <= minZoom}
                                className={`w-10 h-10 text-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white flex items-center justify-center ${zoom <= minZoom ? 'cursor-not-allowed opacity-50 hover:scale-100' : 'cursor-pointer'
                                    }`}
                                aria-label="Zoom out"
                            >
                                −
                            </button>

                            {/* Reset View Button */}
                            {(zoom > 1 || position.x !== 0 || position.y !== 0) && (
                                <button
                                    onClick={resetImageView}
                                    className="w-10 h-10 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white flex items-center justify-center cursor-pointer"
                                    aria-label="Reset view"
                                    title="Reset view"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Image Container with Pan Support */}
                        <div
                            className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh] overflow-hidden"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <img
                                src={previewUrls[currentImageIndex]}
                                alt={`artwork-viewer-${currentImageIndex}`}
                                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl select-none transition-transform duration-200 ease-out"
                                style={{
                                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                                    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                                    boxShadow: '0 0 30px rgba(255,255,255,0.3)',
                                }}
                                draggable="false"
                            />
                        </div>

                        {/* Navigation Controls - Bottom Center */}
                        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-3 items-center bg-black bg-opacity-40 px-4 py-2 rounded-lg backdrop-blur-sm">
                            <button
                                onClick={goToPrevImage}
                                className="px-4 py-2 text-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white"
                                aria-label="Previous image"
                            >
                                ‹
                            </button>

                            <span className="text-white text-sm bg-black bg-opacity-30 px-3 py-1 rounded-lg">
                                {currentImageIndex + 1} / {previewUrls.length}
                            </span>

                            <button
                                onClick={goToNextImage}
                                className="px-4 py-2 text-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white"
                                aria-label="Next image"
                            >
                                ›
                            </button>
                        </div>

                        {/* Pan Hint - Shows when zoomed in */}
                        {zoom > 1 && !isDragging && (
                            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-20 text-white text-sm bg-black bg-opacity-40 px-4 py-2 rounded-lg backdrop-blur-sm animate-fade-in">
                                Click and drag to pan
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}