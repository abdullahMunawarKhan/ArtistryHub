import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";
import Autocomplete from "react-google-autocomplete";
import { useRef } from 'react';
import ImageViewer from "../components/ImageViewer";

// import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

function roundToNearest9(num) {
  let rounded = Math.round(num);
  const lastDigit = rounded % 10;
  if (lastDigit === 9) return rounded;
  if (lastDigit < 9) return rounded + (9 - lastDigit);
  return rounded + (19 - lastDigit);
}



// const AddressAutocomplete = ({ value, onChange, onAddressSelect }) => {
//   const [placeAutocomplete, setPlaceAutocomplete] = useState(null);
//   const inputRef = useRef(null);
//   const places = useMapsLibrary('places');

//   useEffect(() => {
//     if (!places || !inputRef.current) return;

//     const options = {
//       types: ['address'],
//       componentRestrictions: { country: ['in'] },
//       fields: ['formatted_address', 'address_components', 'geometry']
//     };

//     setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
//   }, [places]);

//   useEffect(() => {
//     if (!placeAutocomplete) return;

//     placeAutocomplete.addListener('place_changed', () => {
//       const place = placeAutocomplete.getPlace();
//       if (place.formatted_address) {
//         onAddressSelect(place.formatted_address);
//       }
//     });
//   }, [placeAutocomplete, onAddressSelect]);

//   return (
//     <textarea
//       ref={inputRef}
//       value={value}
//       onChange={onChange}
//       placeholder="Enter pickup address"
//       rows={3}
//       required
//       className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
//     />
//   );
// };





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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
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
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [imageToRemoveIdx, setImageToRemoveIdx] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);


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
        setVideoPreview(data.video_url || "");
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

  async function handleVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // File size validation
    if (file.size > 50 * 1024 * 1024) {
      alert("Video size must be less than 50MB");
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }// Clear the input
      return;
    }

    // File type validation
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];
    if (!validVideoTypes.includes(file.type)) {
      alert("Invalid video format. Please upload MP4, WebM, OGG, AVI, MOV, or WMV files only.");
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      } // Clear the input
      return;
    }

    try {
      // Duration validation
      const duration = await getVideoDuration(file);
      const maxDurationSeconds = 30; // 30 seconds max

      if (duration > maxDurationSeconds) {
        alert(`Video duration exceeds ${maxDurationSeconds} seconds. Please upload a video of 30 seconds or less.`);
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        } // Clear the input
        return;
      }

      // If all validations pass, set the video
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));

    } catch (error) {
      console.error("Error validating video:", error);
      alert("Error validating video file. Please try uploading a different video.");
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }// Clear the input
    }
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

  // Reset position when image changes or zoom resets
  const resetImageView = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Update zoom functions to reset position when zooming out to minimum
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

  // Touch handlers for mobile
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

  // Update navigation functions to reset view
  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % previewUrls.length);
    resetImageView();
  };

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length);
    resetImageView();
  };



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
    if (!productId && !video) {
      alert("Video upload is mandatory for new artworks.");
      return;
    }

    // For existing products, check if there's either an existing video or new video upload
    if (productId && !video && !videoPreview) {
      alert("Video is required. Please upload a video file.");
      return;
    }
    if (video) {
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv'];

      if (!validVideoTypes.includes(video.type)) {
        alert("Invalid video format. Please upload MP4, WebM, OGG, AVI, MOV, or WMV files only.");
        return;
      }

      // Check video file size (example: max 50MB)
      const maxVideoSize = 50 * 1024 * 1024; // 50MB in bytes
      if (video.size > maxVideoSize) {
        alert("Video file is too large. Please upload a video smaller than 50MB.");
        return;
      }

      // Updated video duration validation for 30 seconds maximum
      try {
        const videoDuration = await getVideoDuration(video);
        const maxDurationSeconds = 30; // 30 seconds max

        if (videoDuration > maxDurationSeconds) {
          alert(`Video duration exceeds ${maxDurationSeconds} seconds. Please upload a video of 30 seconds or less.`);
          return;
        }
      } catch (error) {
        console.error("Error validating video duration:", error);
        alert("Error validating video file. Please try uploading a different video.");
        return;
      }
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
            base_price: Number(basePrice),
            cost: Number(cost),
            material,
            pickupAddress,
            image_urls: uploadedImageUrls,
            video_url: uploadedVideoUrl,
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
            video_url: uploadedVideoUrl,
            created_at: new Date().toISOString(),
            length: Number(length),
            width: Number(width),
            height: Number(height),
            weight: Number(weight),
            actual_length: Number(actualLength),
            actual_height: Number(actualHeight),
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
  // const addressInputRef = useGoogleAutocomplete((address) => {
  //   setPickupAddress(address);
  // });



  async function handleRemoveImage(idx) {
    const toRemove = previewUrls[idx];
    // Confirm deletion
    const confirmed = window.confirm("Are you sure you want to delete this image?");
    if (!confirmed) return;

    // Remove preview URL locally
    const updatedUrls = previewUrls.filter((_, i) => i !== idx);
    setPreviewUrls(updatedUrls);

    // For images uploaded but not saved yet, remove from `images` state as well
    setImages(prev => prev.filter((_, i) => previewUrls.indexOf(prev[i]?.name) !== idx));

    if (productId) {
      // Update artwork record's image_urls to new array
      const { error: updateError } = await supabase
        .from("artworks")
        .update({ image_urls: updatedUrls })
        .eq("id", productId);

      if (updateError) {
        alert("Failed to update artwork images in database.");
        return;
      }

      // Remove image file from Supabase storage
      const filename = extractFilenameFromUrl(toRemove);
      if (filename) {
        const { error: storageError } = await supabase.storage
          .from("artist-assets")
          .remove([filename]);
        if (storageError) {
          alert("Failed to delete image from storage.");
        }
      }
    }
  }

  async function handleConfirmRemove() {
    const idx = imageToRemoveIdx;
    const toRemove = previewUrls[idx];
    const updatedUrls = previewUrls.filter((_, i) => i !== idx);
    setPreviewUrls(updatedUrls);
    setImages(prev => prev.filter((_, i) => i !== idx));

    // Clear the file input if no images remain
    if (updatedUrls.length === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (productId) {
      const { error: updateError } = await supabase
        .from("artworks")
        .update({ image_urls: updatedUrls })
        .eq("id", productId);

      if (!updateError) {
        // Remove from storage
        const filename = extractFilenameFromUrl(toRemove);
        if (filename) {
          await supabase.storage.from("artist-assets").remove([filename]);
        }
      } else {
        alert("Failed to update artwork images in database.");
      }
    }
    setShowRemoveModal(false);
    setImageToRemoveIdx(null);
  }


  function extractFilenameFromUrl(url) {
    try {
      const decodedUrl = decodeURIComponent(url);
      const parts = decodedUrl.split('/o/');
      if (parts.length < 2) return null;
      const filenameWithQuery = parts[1];
      const filename = filenameWithQuery.split('?')[0];
      return filename;
    } catch {
      return null;
    }
  }
  // Helper function to get video duration from file
  async function getVideoDuration(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };

      video.onerror = function () {
        reject(new Error('Invalid video file'));
      };

      video.src = URL.createObjectURL(file);
    });
  }


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
            {/* <APIProvider apiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY}>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Pickup Address <span className="text-red-500">*</span>{" "}
                  <span className="text-xs text-gray-400">(with Pin code, precise)</span>
                </label>
                <AddressAutocomplete
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  onAddressSelect={(address) => setPickupAddress(address)}
                />
              </div>
            </APIProvider> */}
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
            <br />


            <div className="mb-6">

              <label htmlFor="video-input" className="block font-semibold text-gray-700 mb-2">
                Video Upload <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-1">( Max 50 MB )</span>
              </label>

              <input
                ref={videoInputRef}
                id="video-input"
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/avi,video/mov,video/wmv"
                onChange={handleVideoChange}
                required={!videoPreview}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!video && !videoPreview
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
                  }`}
              />

              {!video && !videoPreview && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Video upload is mandatory (max 30 seconds)
                </p>
              )}

              {videoPreview && (
                <div className="mt-4">
                  <video
                    controls
                    width="300"
                    className="max-w-full rounded-lg shadow-md"
                    onLoadedMetadata={(e) => {
                      const duration = Math.round(e.target.duration);
                      console.log(`Video duration: ${duration} seconds`);
                    }}
                  >
                    <source src={videoPreview} />
                    Your browser does not support video preview.
                  </video>
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Video selected successfully
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">📋 Video Requirements:</div>
                  <div className="space-y-1">
                    <div>• <span className="font-medium">Format:</span> MP4 </div>
                    <div>• <span className="font-medium">Max file size:</span> 50 MB</div>
                    <div>• <span className="font-medium">Max duration:</span> 30 seconds</div>
                  </div>
                </div>
              </div>
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

            <div className="mb-6">
              <label className="block font-semibold text-gray-700 mb-2">
                Upload Images (Max 3, each under 10MB) <br />
                <span className="text-xs text-gray-500">
                  *Don't upload with any social media ID tag or watermark — will be provided by our platform
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />


              <div className="flex gap-3 flex-wrap">
                {previewUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`preview-${i}`}
                      className="w-28 h-28 object-cover rounded-lg shadow cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => {
                        setCurrentImageIndex(i);
                        setImageViewerOpen(true);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowRemoveModal(true);
                        setImageToRemoveIdx(i);
                      }}
                      className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-100 transition"
                      title="Remove image"
                    >
                      &times;
                    </button>


                  </div>
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

      {imageViewerOpen && previewUrls.length > 0 && (
        <ImageViewer
          images={previewUrls}
          idx={currentImageIndex}
          setIdx={setCurrentImageIndex}
          setViewerOpen={setImageViewerOpen}
          watermarkText="@ScopeBrush • Preview"
        />
      )}



      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-lg font-bold mb-4">Are you sure you want to delete this image?</h3>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

