import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';

export default function ArtistUploadWork({ categories, onUploadSuccess }) {
  const [user, setUser] = useState(null);
  const [artistId, setArtistId] = useState(null);

  // New state for Title
  const [title, setTitle] = useState('');

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState('');
  const [material, setMaterial] = useState('');
  const [loading, setLoading] = useState(false);

  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const zoomStep = 0.25;
  const maxZoom = 3;
  const minZoom = 1;

  const defaultCategories = [
    'Portrait', 'Landscape', 'Abstract', 'Watercolor', 'Oil',
    'Digital', 'Sketch', 'Modern', 'Classic', 'Calligraphy',
  ];
  const selectableCategories = categories ?? defaultCategories;

  useEffect(() => {
    const fetchUserAndArtist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) return;

      const { data: artistData, error } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (artistData && artistData.id) {
        setArtistId(artistData.id);
      } else {
        alert('You must complete your artist registration first.');
      }
    };
    fetchUserAndArtist();
  }, []);

  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
    if (validFiles.length < files.length) alert("Some files exceed 10MB and were ignored.");
    setImages(validFiles);
    setPreviewUrls(validFiles.map(file => URL.createObjectURL(file)));
  }

  function handleVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert('Video size must be less than 50MB');
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
      const { error } = await supabase.storage.from('artist-assets').upload(filename, file, { upsert: true });
      if (error) throw error;
      const { publicUrl } = supabase.storage.from('artist-assets').getPublicUrl(filename).data;
      urls.push(publicUrl);
    }
    return urls;
  }

  async function uploadVideo() {
    if (!video) return '';
    const filename = `artworks/videos/${Date.now()}_${video.name}`;
    const { error } = await supabase.storage.from('artist-assets').upload(filename, video, { upsert: true });
    if (error) throw error;
    const { publicUrl } = supabase.storage.from('artist-assets').getPublicUrl(filename).data;
    return publicUrl;
  }

  function openImageViewer(index) {
    setCurrentImageIndex(index);
    setZoom(1);
    setImageViewerOpen(true);
  }

  function goToPrevImage() {
    setCurrentImageIndex((prev) => (prev === 0 ? previewUrls.length - 1 : prev - 1));
    setZoom(1);
  }
  function goToNextImage() {
    setCurrentImageIndex((prev) => (prev === previewUrls.length - 1 ? 0 : prev + 1));
    setZoom(1);
  }
  function zoomIn() {
    setZoom((z) => Math.min(maxZoom, z + zoomStep));
  }
  function zoomOut() {
    setZoom((z) => Math.max(minZoom, z - zoomStep));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!artistId) {
      alert('Artist ID missing. Are you registered as an artist?');
      return;
    }
    if (!title.trim()) {
      alert('Title is required.');
      return;
    }
    if (images.length === 0) {
      alert('Please upload at least one image');
      return;
    }
    if (!category) {
      alert('Please select a category');
      return;
    }
    if (!cost || Number(cost) <= 0) {
      alert('Please enter a valid cost');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = await uploadImages();
      const videoUrl = await uploadVideo();

      const { error } = await supabase.from('artworks').insert([
        {
          artist_id: artistId,
          title: title.trim(),
          description,
          category,
          cost: Number(cost),
          material,
          image_urls: imageUrls,
          video_url: videoUrl,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;

      alert('Artwork uploaded successfully');

      // Reset form fields:
      setTitle('');
      setImages([]);
      setPreviewUrls([]);
      setVideo(null);
      setVideoPreview(null);
      setDescription('');
      setCategory('');
      setCost('');
      setMaterial('');

      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderRadius: 10, backgroundColor: 'white', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h2 style={{ marginBottom: 24, color: '#222' }}>Upload Artwork</h2>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <label style={{ fontWeight: '600', marginBottom: 6, display: 'block', color: '#444' }}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter artwork title"
          style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
          required
        />

        {/* Description */}
        <label style={{ fontWeight: '600', marginBottom: 6, display: 'block', color: '#444' }}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Enter artwork description"
          rows={3}
          style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        />

        {/* Category */}
        <label style={{ fontWeight: '600', marginBottom: 6, display: 'block', color: '#444' }}>Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, cursor: 'pointer' }}
          required
        >
          <option value="">Select category</option>
          {selectableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Cost */}
        <label style={{ fontWeight: '600', marginBottom: 6, display: 'block', color: '#444' }}>Cost (INR)</label>
        <input
          type="number"
          min={0}
          value={cost}
          onChange={e => setCost(e.target.value)}
          placeholder="Enter cost"
          style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
          required
        />

        {/* Material */}
        <label style={{ fontWeight: '600', marginBottom: 6, display: 'block', color: '#444' }}>Material</label>
        <input
          value={material}
          onChange={e => setMaterial(e.target.value)}
          placeholder="Enter material used"
          style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }}
        />

        {/* Image Upload */}
        <label style={{ fontWeight: '600', marginBottom: 6, display: 'block', color: '#444' }}>Upload Images (Max 3, each &lt; 10MB)</label>
        <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {previewUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`artwork-preview-${idx}`}
              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              onClick={() => openImageViewer(idx)}
            />
          ))}
        </div>

        {/* Video Upload */}
        <label style={{ fontWeight: '600', marginBottom: 6, display: 'block', color: '#444' }}>
          Upload Video (optional, max 50MB)
        </label>
        <input type="file" accept="video/*" onChange={handleVideoChange} style={{ marginBottom: 12 }} />
        {videoPreview && (
          <video
            src={videoPreview}
            controls
            style={{ width: 320, height: 'auto', borderRadius: 8, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
          />
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            backgroundColor: '#F59E0B',
            color: 'white',
            fontWeight: '700',
            fontSize: 18,
            borderRadius: 8,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Uploading...' : 'Upload Artwork'}
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
