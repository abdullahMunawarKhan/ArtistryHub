import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

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

  useEffect(() => {
    async function loadUserAndArtist() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) return;
      const { data: artist } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();
      setArtistId(artist?.id || null);
    }
    loadUserAndArtist();
  }, []);

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
        setCost(data.cost?.toString() || "");
        setMaterial(data.material || "");
        setPreviewUrls(Array.isArray(data.image_urls) ? data.image_urls : data.image_urls ? [data.image_urls] : []);
        setVideoPreview(data.video_url || "");
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

  function handleVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert("Video size must be less than 50MB");
      return;
    }
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  }

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

  async function uploadVideo() {
    if (!video) return videoPreview || "";
    const filename = `artworks/videos/${Date.now()}_${video.name}`;
    await supabase.storage.from("artist-assets").upload(filename, video, { upsert: true });
    const { data } = supabase.storage.from("artist-assets").getPublicUrl(filename);
    return data.publicUrl;
  }



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
    if (!length || !width || !height || !weight) {
      alert("All dimensions are required.");
      return;
    }


    setLoading(true);

    try {
      // Upload new images if any
      const uploadedImageUrls = images.length > 0 ? await uploadImages() : previewUrls;

      // Upload video if changed or new uploaded
      const uploadedVideoUrl = video ? await uploadVideo() : videoPreview;

      if (productId) {
        // Update existing artwork
        const { error: artworkError } = await supabase
          .from("artworks")
          .update({
            title: title.trim(),
            description,
            category,
            cost: Number(cost),
            material,
            image_urls: uploadedImageUrls,
            video_url: uploadedVideoUrl,
            updated_at: new Date().toISOString(),
            length: Number(length),
            width: Number(width),
            height: Number(height),
            weight: Number(weight),
          })
          .eq("id", productId);

        if (artworkError) throw artworkError;

        // Update pickup address in orders
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            pickup_address: pickupAddress.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("artwork_id", productId);

        if (orderError) throw orderError;

        alert("Artwork & pickup address updated successfully!");
      } else {
        // Insert new artwork
        const { data: newArtwork, error: artworkError } = await supabase
          .from("artworks")
          .insert({
            artist_id: artistId,
            title: title.trim(),
            description,
            category,
            cost: Number(cost),
            material,
            image_urls: uploadedImageUrls,
            video_url: uploadedVideoUrl,
            created_at: new Date().toISOString(),
            length: Number(length),
            width: Number(width),
            height: Number(height),
            weight: Number(weight),
          })
          .select()
          .single();

        if (artworkError) throw artworkError;

        // also insert pickup address into orders
        const { error: orderError } = await supabase
          .from("orders")
          .insert({
            artwork_id: newArtwork.id,
            pickup_address: pickupAddress.trim(),
            created_at: new Date().toISOString(),
          });

        if (orderError) throw orderError;

        alert("Artwork & pickup address saved successfully!");
      }


      // Reset or redirect
      setTitle("");
      setDescription("");
      setCategory("");
      setCost("");
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
    <div style={{ maxWidth: 720, margin: "2rem auto", padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", borderRadius: 10, backgroundColor: "white", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ marginBottom: 24, color: "#222" }}>{productId ? "Edit Artwork" : "Upload Artwork"}</h2>
      <form onSubmit={handleSubmit}>
        <label>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter title"
          required
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc", fontSize: 15 }}
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          rows={3}
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc", fontSize: 15 }}
        />

        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc", fontSize: 15, cursor: "pointer" }}
        >
          <option value="">Select category</option>
          {selectableCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input type="number" value={length} onChange={e => setLength(e.target.value)}
          required min="1" placeholder="Length (cm) *after packing" />

        <input type="number" value={width} onChange={e => setWidth(e.target.value)}
          required min="1" placeholder="Width/Thickness(cm) *after packing" />

        <input type="number" value={height} onChange={e => setHeight(e.target.value)}
          required min="1" placeholder="Height (cm) **after packing" />

        <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
          required min="1" placeholder="dead Weight (kg) **after packing" />

        <label>Cost (INR)</label>
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Enter cost"
          required
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc", fontSize: 15 }}
        />

        <label>Material</label>
        <input
          type="text"
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Enter material"
          style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc", fontSize: 15 }}
        />
        <label>Pickup Address(provide precise and also include pin code) *</label>
        <textarea
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          placeholder="Enter pickup address"
          rows={3}
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 16,
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 15
          }}
        />

        <label>Upload Images (Max 3, each under 10MB)</label>
        <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {previewUrls.map((url, i) => (
            <img key={i} src={url} alt={`preview-${i}`} style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 6, cursor: "pointer" }} onClick={() => setImageViewerOpen(true)} />
          ))}
        </div>

        <label>Upload Video (optional, max 50MB)</label>
        <input type="file" accept="video/*" onChange={handleVideoChange} style={{ marginBottom: 16 }} />
        {videoPreview && (
          <video src={videoPreview} controls style={{ width: 320, borderRadius: 8, marginBottom: 16 }} />
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 14, backgroundColor: "#F59E0B", color: "white", fontWeight: "700", fontSize: 18, borderRadius: 8, border: "none", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? (productId ? "Updating..." : "Uploading...") : productId ? "Update Artwork" : "Upload Artwork"}
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
                –
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
