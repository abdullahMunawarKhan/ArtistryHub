import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

function roundToNearest9(num) {
  let rounded = Math.round(num);
  const lastDigit = rounded % 10;
  if (lastDigit === 9) return rounded;
  if (lastDigit < 9) return rounded + (9 - lastDigit);
  return rounded + (19 - lastDigit);
}

export default function ArtistUploadWork({ categories, onUploadSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get("id");

  const [user, setUser] = useState(null);
  const [artistId, setArtistId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [cost, setCost] = useState("");
  const [material, setMaterial] = useState("");

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const zoomStep = 0.25;
  const maxZoom = 3;
  const minZoom = 1;
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pickupAddress, setPickupAddress] = useState("");

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
  const selectableCategories = categories ?? defaultCategories;
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [pickupCharges] = useState(50); // fixed value
  const [platformFees, setPlatformFees] = useState(0);
  const [actualLength, setActualLength] = useState("");
  const [actualHeight, setActualHeight] = useState("");



  useEffect(() => {
    async function loadUserAndArtist() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) return;
      const { data: artist } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)

      setArtistId(artist?.id || null);
    }
    loadUserAndArtist();
  }, []);
  useEffect(() => {
    const base = Number(basePrice);
    if (!isNaN(base) && base >= 0) {
      const fees = 0.075 * base;
      setPlatformFees(fees);
      const totalCost = roundToNearest9(base + pickupCharges + fees);
      setCost(totalCost.toString());
    } else {
      setPlatformFees(0);
      setCost("");
    }
  }, [basePrice, pickupCharges]);



  useEffect(() => {
    if (!productId) return;
    async function fetchArtwork() {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("id", productId)
        .single();
      if (error) {
        alert("Failed to fetch artwork data to edit");
        navigate("/artist-profile");
        return;
      }
      if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setPickupAddress(data.pickupAddress || "")
        setCost(data.cost?.toString() || "");
        setMaterial(data.material || "");
        setPreviewUrls(Array.isArray(data.image_urls) ? data.image_urls : data.image_urls ? [data.image_urls] : []);
        // setVideoPreview(data.video_url || "");
        setLength(data.length || " ");
        setHeight(data.Height || " ");
        setWeight(data.weight || " ");
        setWidth(data.width || " ");
        setActualLength(data.actual_length || "");
        setActualHeight(data.actual_height || "");

      }
    }
    fetchArtwork();
  }, [productId, navigate]);


  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
    if (validFiles.length < files.length) alert("Some images were ignored due to size limit.");
    setImages(validFiles);
    setPreviewUrls(validFiles.map((file) => URL.createObjectURL(file)));
  }

  // function handleVideoChange(e) {
  //   const file = e.target.files[0];
  //   if (!file) return;
  //   if (file.size > 50 * 1024 * 1024) {
  //     alert("Video size must be less than 50MB");
  //     return;
  //   }
  //   setVideo(file);
  //   setVideoPreview(URL.createObjectURL(file));
  // }

  async function uploadImages() {
    let urls = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const filename = `artworks/${Date.now()}_${file.name}`;
      await supabase.storage.from("artist-assets").upload(filename, file, { upsert: true });
      const { data } = supabase.storage.from("artist-assets").getPublicUrl(filename);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  // async function uploadVideo() {
  //   if (!video) return videoPreview || "";
  //   const filename = `artworks/videos/${Date.now()}_${video.name}`;
  //   await supabase.storage.from("artist-assets").upload(filename, video, { upsert: true });
  //   const { data } = supabase.storage.from("artist-assets").getPublicUrl(filename);
  //   return data.publicUrl;
  // }



  async function handleSubmit(e) {
    e.preventDefault();

    if (!artistId) {
      alert("You must be registered as an artist.");
      return;
    }

    if (!title.trim()) {
      alert("Title is required.");
      return;
    }

    if (!category) {
      alert("Select a category.");
      return;
    }

    if (!cost || isNaN(Number(cost)) || Number(cost) <= 0) {
      alert("Valid cost is required.");
      return;
    }
    if (!pickupAddress.trim()) {
      alert("Pickup address is required.");
      return;
    }
    if (!length || !width || !height || !weight || !actualLength || !actualHeight) {
      alert("All dimensions (actual and after packing) are required.");
      return;
    }
    if (!basePrice || isNaN(Number(basePrice)) || Number(basePrice) < 0) {
      alert("Valid base price is required and cannot be negative.");
      return;
    }



    setLoading(true);

    try {
      // Upload new images if any
      const uploadedImageUrls = images.length > 0 ? await uploadImages() : previewUrls;

      // Upload video if changed or new uploaded
      // const uploadedVideoUrl = video ? await uploadVideo() : videoPreview;

      if (productId) {
        // Update existing artwork
        const { error: artworkError } = await supabase
          .from("artworks")
          .update({
            title: title.trim(),
            description,
            category,
            base_price: Number(basePrice),
            cost: Number(cost),
            material,
            pickupAddress,
            image_urls: uploadedImageUrls,
            // video_url: uploadedVideoUrl,
            updated_at: new Date().toISOString(),
            length: Number(length),
            width: Number(width),
            height: Number(height),
            weight: Number(weight),
            actual_length: Number(actualLength),
            actual_height: Number(actualHeight),




          })
          .eq("id", productId);

        if (artworkError) throw artworkError;
      } else {
        // Insert new artwork
        const { data: newArtwork, error: artworkError } = await supabase
          .from("artworks")
          .insert({
            artist_id: artistId,
            title: title.trim(),
            description,
            category,
            base_price: Number(basePrice),
            cost: Number(cost),
            material,
            pickupAddress,
            image_urls: uploadedImageUrls,
            // video_url: uploadedVideoUrl,
            created_at: new Date().toISOString(),
            length: Number(length),
            width: Number(width),
            height: Number(height),
            weight: Number(weight),
          })
          .select()


        if (artworkError) throw artworkError;
        const { data: artistData, error: fetchError } = await supabase
          .from("artists")
          .select("artwork_count")
          .eq("id", artistId)
          .single();

        if (!fetchError && artistData) {
          const newCount = (artistData.artwork_count || 0) + 1;
          const { error: updateError } = await supabase
            .from("artists")
            .update({ artwork_count: newCount })
            .eq("id", artistId);
          if (updateError) console.error("Artwork count update failed:", updateError);
        }

      }

      setTitle("");
      setDescription("");
      setCategory("");
      setCost("");
      setPickupAddress("")
      setMaterial("");
      setImages([]);
      setPreviewUrls([]);
      setVideo(null);
      setVideoPreview("");

      onUploadSuccess && onUploadSuccess();

      // Navigate back to profile
      navigate(`/artist-profile?id=${artistId}`);

    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Existing zoom handling and image viewer...

  return (
    <div className="pt-20 max-w-6xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {productId ? "Edit Artwork" : "Upload Artwork"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Top Section: Responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                required
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {selectableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Material */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Material</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Enter material"
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pickup Address */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Pickup Address <span className="text-red-500">*</span>{" "}
                <span className="text-xs text-gray-400">(with Pin code, precise)</span>
              </label>
              <textarea
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Enter pickup address"
                rows={3}
                required
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-6">
            {/* Dimensions */}
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Artwork Dimensions <span className="text-xs text-gray-400">(after packing)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="number"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                  placeholder="Length (cm)"
                  min="1"
                  required
                  className="border rounded-lg px-4 py-2 text-sm"
                />
                <input
                  type="number"
                  value={width}
                  onChange={e => setWidth(e.target.value)}
                  placeholder="Width (cm)"
                  min="1"
                  required
                  className="border rounded-lg px-4 py-2 text-sm"
                />
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="Height (cm)"
                  min="1"
                  required
                  className="border rounded-lg px-4 py-2 text-sm"
                />
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Weight (kg)"
                  min="0.1"
                  step="any"
                  required
                  className="border rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Length (cm)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={actualLength}
                  onChange={e => setActualLength(e.target.value)}
                  placeholder="Actual"
                  min="1"
                  required
                  className="border rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Height (cm)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={actualHeight}
                  onChange={e => setActualHeight(e.target.value)}
                  placeholder="Actual"
                  min="1"
                  required
                  className="border rounded-lg px-4 py-2 text-sm"
                />
              </div>
            </div>

            {/* Price & Cost */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="sm:w-40 font-medium text-gray-700">Base Price *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                  className="flex-1 border rounded-lg px-4 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="sm:w-40 font-medium text-gray-700">Pickup Charges</label>
                <input
                  type="text"
                  value={pickupCharges}
                  readOnly
                  className="flex-1 border rounded-lg px-4 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="sm:w-40 font-medium text-gray-700">Platform Fees</label>
                <input
                  type="text"
                  value={platformFees.toFixed(2)}
                  readOnly
                  className="flex-1 border rounded-lg px-4 py-2 text-sm bg-gray-50"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="sm:w-40 font-medium text-gray-700">Cost for Buyer</label>
                <input
                  type="text"
                  value={cost}
                  readOnly
                  className="flex-1 border rounded-lg px-4 py-2 text-sm bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Upload Images (Max 3, under 10MB) <br />
                <span className="text-xs text-gray-500">
                  *Don't upload with any social media ID tag or watermark — one will be provided by our platform
                </span>
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mb-4"
              />
              <div className="flex gap-3 flex-wrap">
                {previewUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`preview-${i}`}
                    className="w-28 h-28 object-cover rounded-lg shadow cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setImageViewerOpen(true)}
                  />
                ))}
              </div>
            </div>
          </div>


        </div>





        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mx-auto block w-48 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg rounded-lg transition disabled:opacity-50"
        >
          {loading
            ? (productId ? "Updating..." : "Uploading...")
            : productId
              ? "Update Artwork"
              : "Upload Artwork"}
        </button>

      </form>

      {/* Image Viewer Modal */}
      {imageViewerOpen && (
        <div
          onClick={() => setImageViewerOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 10000,
            userSelect: 'none',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Close Button */}
            <button
              onClick={() => setImageViewerOpen(false)}
              style={{
                position: 'absolute', top: 10, right: 10, background: 'transparent',
                border: 'none', fontSize: 28, color: 'white', cursor: 'pointer',
              }}
              aria-label="Close image viewer"
            >
              &times;
            </button>

            <img
              src={previewUrls[currentImageIndex]}
              alt={`artwork-viewer-${currentImageIndex}`}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                transform: `scale(${zoom})`,
                transition: 'transform 0.25s ease',
                borderRadius: 10,
                boxShadow: '0 0 15px rgba(255,255,255,0.5)',
                userSelect: 'none',
              }}
              draggable={false}
            />

            {/* Controls */}
            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={goToPrevImage}
                style={{ padding: '6px 12px', fontSize: 18, borderRadius: 6, cursor: 'pointer' }}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={zoomOut}
                disabled={zoom <= minZoom}
                style={{
                  padding: '6px 12px',
                  fontSize: 14,
                  borderRadius: 6,
                  cursor: zoom <= minZoom ? 'not-allowed' : 'pointer',
                  opacity: zoom <= minZoom ? 0.5 : 1,
                }}
                aria-label="Zoom out"
              >

              </button>
              <span style={{ color: 'white', fontWeight: 600 }}>{(zoom * 100).toFixed(0)}%</span>
              <button
                onClick={zoomIn}
                disabled={zoom >= maxZoom}
                style={{
                  padding: '6px 12px',
                  fontSize: 14,
                  borderRadius: 6,
                  cursor: zoom >= maxZoom ? 'not-allowed' : 'pointer',
                  opacity: zoom >= maxZoom ? 0.5 : 1,
                }}
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                onClick={goToNextImage}
                style={{ padding: '6px 12px', fontSize: 18, borderRadius: 6, cursor: 'pointer' }}
                aria-label="Next image"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
