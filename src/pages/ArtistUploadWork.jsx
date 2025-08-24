import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function ArtistUploadWork({ categories, onUploadSuccess }) {
  const [user, setUser] = useState(null);
  const [artistId, setArtistId] = useState(null);
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [cost, setCost] = useState('');
  const [material, setMaterial] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultCategories = [
    'Portrait', 'Landscape', 'Abstract', 'Watercolor', 'Oil', 'Digital',
    'Sketch', 'Modern', 'Classic', 'Calligraphy'
  ];
  const selectableCategories = categories ?? defaultCategories;

  // Fetch the user and artist when component mounts
  useEffect(() => {
    const fetchUserAndArtist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) return;

      // Fetch artist where user_id == this user id
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!artistId) {
      alert('Artist ID missing. Are you registered as an artist?');
      return;
    }
    if (images.length === 0) { alert('Please upload at least one image'); return; }
    if (!category) { alert('Please select a category'); return; }
    if (!cost || cost <= 0) { alert('Please enter a valid cost'); return; }

    setLoading(true);
    try {
      const imageUrls = await uploadImages();

      const { error } = await supabase.from('artworks').insert([{
        artist_id: artistId,
        title: description.slice(0, 50) || 'Untitled',
        description,
        category,
        cost: Number(cost),
        material,
        image_urls: imageUrls, // store multiple image URLs (if your column supports array or JSON)
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      alert('Artwork uploaded successfully');
      setImages([]);
      setPreviewUrls([]);
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-lg mx-auto space-y-4">
      <label className="block font-semibold">Upload Images (Max 3, Each{"<"}10MB ):</label>
      <input
        type="file"
        accept="image/png,image/jpeg"
        multiple
        onChange={handleImageChange}
        disabled={loading}
      />
      <div className="flex gap-4 mt-2">
        {previewUrls.map((url, i) => (
          <img key={i} src={url} alt={`Preview ${i + 1}`} className="w-20 h-20 object-cover rounded" />
        ))}
      </div>

      <label className="block font-semibold">Description:</label>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={loading}
        rows={3}
        className="w-full border p-2 rounded"
        placeholder="Describe your artwork..."
      ></textarea>

      <label className="block font-semibold">Category:</label>
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        disabled={loading}
        className="w-full border p-2 rounded"
        required
      >
        <option value="">Select Category</option>
        {selectableCategories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <label className="block font-semibold">Price (INR):</label>
      <input
        type="number"
        value={cost}
        onChange={e => setCost(e.target.value)}
        disabled={loading}
        className="w-full border p-2 rounded"
        min="1"
        step="0.01"
        required
      />

      <label className="block font-semibold">Material:</label>
      <input
        type="text"
        value={material}
        onChange={e => setMaterial(e.target.value)}
        disabled={loading}
        className="w-full border p-2 rounded"
        placeholder="Material used"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-yellow-400 text-white rounded font-semibold hover:bg-yellow-500 transition"
      >
        {loading ? 'Uploading...' : 'Upload Artwork'}
      </button>
    </form>
  );
}
