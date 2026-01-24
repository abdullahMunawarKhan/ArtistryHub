import React, { useState, useRef } from "react";
import ImageViewer from "../components/ImageViewer";

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

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const pickupCharges = 50;
  const platformFees = basePrice ? (0.075 * Number(basePrice)).toFixed(2) : 0;
  const totalCost =
    basePrice
      ? Math.round(Number(basePrice) + pickupCharges + Number(platformFees))
      : "";

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

  /* ================= IMAGE ================= */

  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);

    if (validFiles.length < files.length) {
      alert("Some images were ignored due to size limit (max 10MB each).");
    }

    setPreviewUrls(validFiles.map(f => URL.createObjectURL(f)));
  }

  function handleRemoveImage(idx) {
    const updated = previewUrls.filter((_, i) => i !== idx);
    setPreviewUrls(updated);
    if (!updated.length && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /* ================= VIDEO ================= */

  function handleVideoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Video size must be less than 50MB");
      videoInputRef.current.value = "";
      return;
    }

    const allowed = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/avi",
      "video/mov",
      "video/wmv",
    ];

    if (!allowed.includes(file.type)) {
      alert("Invalid video format.");
      videoInputRef.current.value = "";
      return;
    }

    setVideoPreview(URL.createObjectURL(file));
  }

  function handleDemoSubmit(e) {
    e.preventDefault();
    alert("This is a demo page. Artwork upload will be enabled soon!");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">

      {/* Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white py-5 px-4 text-center">
        <h1 className="text-xl sm:text-2xl font-bold">
          Get Ready with Your Artwork!
        </h1>
        <p className="text-xs sm:text-sm mt-2 opacity-90">
          This is a demo preview to help you prepare your artwork details.
        </p>
      </div>

      {/* Main */}
      <div className="pt-6 pb-12 max-w-6xl mx-auto px-3 sm:px-6">
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-200">

          <form onSubmit={handleDemoSubmit} className="p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* LEFT */}
              <div className="space-y-5">

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Artwork Title"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your artwork"
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-yellow-500"
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select category</option>
                  {defaultCategories.map(cat => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>

                <input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Material"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                />

                <textarea
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  rows={3}
                  placeholder="Pickup address with pincode"
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-yellow-500"
                />

                {/* VIDEO */}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="block w-full text-xs"
                />

                {videoPreview && (
                  <video controls className="w-full rounded-lg mt-2">
                    <source src={videoPreview} />
                  </video>
                )}
              </div>

              {/* RIGHT */}
              <div className="space-y-6">

                {/* DIMENSIONS */}
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={length} onChange={e => setLength(e.target.value)} placeholder="Length (cm)" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="Width (cm)" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="Height (cm)" className="border rounded-lg px-3 py-2 text-sm" />
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight (kg)" className="border rounded-lg px-3 py-2 text-sm" />
                </div>

                {/* PRICING */}
                <div className="bg-yellow-50 p-4 rounded-lg border">
                  <div className="flex justify-between text-sm">
                    <span>Base Price</span>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={e => setBasePrice(e.target.value)}
                      className="w-24 border rounded px-2 py-1 text-right"
                    />
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span>Total</span>
                    <span className="font-bold">₹ {totalCost || 0}</span>
                  </div>
                </div>

                {/* IMAGES */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs"
                />

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative">
                        <img
                          src={url}
                          className="h-24 w-full object-cover rounded-lg cursor-pointer"
                          onClick={() => {
                            setCurrentImageIndex(i);
                            setImageViewerOpen(true);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* IMAGE VIEWER */}
      {imageViewerOpen && previewUrls.length > 0 && (
        <ImageViewer
          images={previewUrls}
          idx={currentImageIndex}
          setIdx={setCurrentImageIndex}
          setViewerOpen={setImageViewerOpen}
          watermarkText="@ScopeBrush • Preview"
        />
      )}
    </div>
  );
}
