import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

function StarRating({ value }) {
  const full = Math.floor(value || 0);
  const half = (value || 0) % 1 >= 0.25;
  
  return (
    <div className="flex items-center">
      {[...Array(full)].map((_, i) => (
        <span key={i} className="text-yellow-500">★</span>
      ))}
      {half && (
        <span className="text-yellow-500">☆</span>
      )}
      {[...Array(5 - full - (half ? 1 : 0))].map((_, i) => (
        <span key={i} className="text-gray-300">☆</span>
      ))}
    </div>
  );
}

function ComingSoonModal({ isVisible, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
        <p>This feature will be available soon!</p>
      </div>
    </div>
  );
}

// New component for artwork card in horizontal scroll
function ArtworkCard({ artwork, onClick }) {
  return (
    <div 
      className="flex-shrink-0 w-48 bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden">
        <img 
          src={artwork.image_url} 
          alt={artwork.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate mb-1">{artwork.title}</h3>
        <p className="text-lg font-bold text-green-600">₹{artwork.cost}</p>
        {artwork.artist_name && (
          <p className="text-xs text-gray-600 truncate mt-1">by {artwork.artist_name}</p>
        )}
      </div>
    </div>
  );
}




function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New states for artwork sections
  const [artistArtworks, setArtistArtworks] = useState([]);
  const [relatedArtworks, setRelatedArtworks] = useState([]);
  const [artistArtworksLoading, setArtistArtworksLoading] = useState(true);
  const [relatedArtworksLoading, setRelatedArtworksLoading] = useState(true);

  const artworkId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('artwork_id');
  }, [location.search]);

  const isAvailable = useMemo(() => artwork?.availability, [artwork]);

  // Fetch main artwork details
  useEffect(() => {
    if (!artworkId) return;

    const fetchArtworkDetails = async () => {
      setLoading(true);
      try {
        // Fetch artwork with artist details
        const { data: artworkData, error: artworkError } = await supabase
          .from('artworks')
          .select(`
            *,
            artists (
              id,
              name,
              location,
              email,
              mobile,
              experience,
              avg_rating,
              followers,
              paintings_sold
            )
          `)
          .eq('id', artworkId)
          .single();

        if (artworkError) throw artworkError;
        
        setArtwork(artworkData);
        setArtist(artworkData.artists);
      } catch (error) {
        console.error('Error fetching artwork details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworkDetails();
  }, [artworkId]);

  // Fetch more artworks by the same artist
  useEffect(() => {
    if (!artwork?.artist_id) return;

    const fetchArtistArtworks = async () => {
      setArtistArtworksLoading(true);
      try {
        const { data, error } = await supabase
          .from('artworks')
          .select(`
            id,
            title,
            cost,
            image_url,
            artist_id,
            artists (name)
          `)
          .eq('artist_id', artwork.artist_id)
          .neq('id', artworkId) // Exclude current artwork
          .limit(10);

        if (error) throw error;
        
        // Add artist name to artwork objects for easier access
        const artworksWithArtist = data.map(art => ({
          ...art,
          artist_name: art.artists?.name
        }));
        
        setArtistArtworks(artworksWithArtist);
      } catch (error) {
        console.error('Error fetching artist artworks:', error);
        setArtistArtworks([]);
      } finally {
        setArtistArtworksLoading(false);
      }
    };

    fetchArtistArtworks();
  }, [artwork?.artist_id, artworkId]);

  // Fetch related artworks by category
  useEffect(() => {
    if (!artwork?.category) return;

    const fetchRelatedArtworks = async () => {
      setRelatedArtworksLoading(true);
      try {
        const { data, error } = await supabase
          .from('artworks')
          .select(`
            id,
            title,
            cost,
            image_url,
            artist_id,
            artists (id, name)
          `)
          .eq('category', artwork.category)
          .neq('id', artworkId) // Exclude current artwork
          .neq('artist_id', artwork.artist_id) // Exclude same artist artworks
          .limit(10);

        if (error) throw error;
        
        // Add artist name and id to artwork objects
        const artworksWithArtist = data.map(art => ({
          ...art,
          artist_name: art.artists?.name,
          artist_id: art.artists?.id
        }));
        
        setRelatedArtworks(artworksWithArtist);
      } catch (error) {
        console.error('Error fetching related artworks:', error);
        setRelatedArtworks([]);
      } finally {
        setRelatedArtworksLoading(false);
      }
    };

    fetchRelatedArtworks();
  }, [artwork?.category, artworkId, artwork?.artist_id]);

  const handleArtworkClick = (clickedArtworkId) => {
    navigate(`/product-details?artwork_id=${clickedArtworkId}`);
  };

  const handleArtistClick = (artistId) => {
    navigate(`/artist-profile?artist_id=${artistId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading artwork details...</div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-500">Artwork not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Main Product Details Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            {/* Artwork Image */}
            <div className="md:w-1/2">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="w-full h-96 md:h-full object-cover"
              />
            </div>
            
            {/* Artwork Details */}
            <div className="md:w-1/2 p-6">
              <h1 className="text-3xl font-bold mb-2">{artwork.title}</h1>
              
              {/* Artist Info */}
              {artist && (
                <div className="mb-4">
                  <button
                    onClick={() => handleArtistClick(artist.id)}
                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                  >
                    by {artist.name}
                  </button>
                  {artist.avg_rating > 0 && (
                    <div className="flex items-center mt-1">
                      <StarRating value={artist.avg_rating} />
                      <span className="ml-2 text-sm text-gray-600">
                        ({artist.avg_rating.toFixed(1)})
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="text-3xl font-bold text-green-600 mb-4">
                ₹{artwork.cost}
              </div>

              {/* Availability */}
              <div className="mb-4">
                <span className="font-semibold">Availability: </span>
                {isAvailable ? (
                  <span className="text-green-600 font-semibold">Yes</span>
                ) : (
                  <span className="text-red-600 font-semibold">No</span>
                )}
              </div>

              {/* Category */}
              <div className="mb-4">
                <span className="font-semibold">Category: </span>
                <span className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {artwork.category}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{artwork.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  onClick={() => setShowModal(true)}
                >
                  Purchase Now
                </button>
                <button 
                  className="w-full border border-blue-600 text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  onClick={() => setShowModal(true)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* More Artworks by This Artist Section */}
        {artist && (
          <HorizontalArtworkSection
            title={`More artworks by ${artist.name}`}
            artworks={artistArtworks}
            loading={artistArtworksLoading}
            onArtworkClick={handleArtworkClick}
            onArtistClick={handleArtistClick}
          />
        )}

        {/* Related Artworks Section */}
        <HorizontalArtworkSection
          title={`Related ${artwork.category} artworks`}
          artworks={relatedArtworks}
          loading={relatedArtworksLoading}
          onArtworkClick={handleArtworkClick}
          onArtistClick={handleArtistClick}
          showArtistName={true}
        />

        {/* Coming Soon Modal */}
        <ComingSoonModal 
          isVisible={showModal} 
          onClose={() => setShowModal(false)} 
        />
      </div>
    </div>
  );
}

// Enhanced Horizontal Artwork Section Component
function HorizontalArtworkSection({ title, artworks, loading, onArtworkClick, onArtistClick, showArtistName = false }) {
  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 h-72 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
        <p className="text-gray-500 bg-gray-100 p-4 rounded-lg">No artworks found in this section.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
      <div 
        className="flex space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        style={{ scrollbarWidth: 'thin' }}
      >
        {artworks.map((artwork) => (
          <div key={artwork.id} className="flex-shrink-0 w-48">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              {/* Clickable Image */}
              <div 
                className="aspect-square overflow-hidden cursor-pointer"
                onClick={() => onArtworkClick(artwork.id)}
              >
                <img 
                  src={artwork.image_url} 
                  alt={artwork.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              <div className="p-3">
                {/* Clickable Title */}
                <h3 
                  className="font-semibold text-sm truncate mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => onArtworkClick(artwork.id)}
                >
                  {artwork.title}
                </h3>
                
                {/* Clickable Cost */}
                <p 
                  className="text-lg font-bold text-green-600 cursor-pointer hover:text-green-700 transition-colors"
                  onClick={() => onArtworkClick(artwork.id)}
                >
                  ₹{artwork.cost}
                </p>
                
                {/* Clickable Artist Name (for related artworks) */}
                {showArtistName && artwork.artist_name && (
                  <button
                    className="text-xs text-gray-600 truncate mt-1 hover:text-blue-600 transition-colors artist-name-click"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArtistClick(artwork.artist_id);
                    }}
                  >
                    by {artwork.artist_name}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductDetails;
