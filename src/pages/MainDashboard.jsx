import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';




function MainDashboard() {
  const navigate = useNavigate();
  // Example tags (can be fetched from DB later)
  const [tags, setTags] = useState([
    'Portrait', 'Landscape', 'Abstract', 'Watercolor', 'Oil', 'Digital', 'Sketch', 'Modern', 'Classic', 'Calligraphy'
  ]);
  const [selectedTag, setSelectedTag] = useState('');
  const [artists, setArtists] = useState([]); // Placeholder for filtered artists
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Example: fetch artists (replace with real DB fetch)
  useEffect(() => {
    // Simulate fetch
    setArtists([
      { name: '', tags: ['Portrait', 'Watercolor'], image: '/images/artist1.jpg' },
      { name: 'Ali Raza', tags: ['Landscape', 'Oil'], image: '/images/artist2.jpg' },
      { name: 'Sara Malik', tags: ['Abstract', 'Digital'], image: '/images/artist3.jpg' },
      { name: 'Bilal Ahmed', tags: ['Sketch', 'Classic'], image: '/images/artist4.jpg' },
      { name: 'Fatima Noor', tags: ['Calligraphy', 'Modern'], image: '/images/artist5.jpg' },
    ]);
  }, []);

  // Filter artists by selected tag
  const filteredArtists = selectedTag
    ? artists.filter(a => a.tags.includes(selectedTag))
    : artists;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 py-8 px-4 relative">
      {/* Corner menu for login */}
      <div className="absolute top-6 right-8 z-40">
        <div className="relative">
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl text-gray-800 ring-1 ring-black ring-opacity-5 overflow-hidden z-50">
              {!user ? (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/user-login'); }}
                    className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                  >Login as User</button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/admin-login'); }}
                    className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                  >Login as Admin</button>
                </>
              ) : (
                <>
                  <div className="px-5 py-4 bg-yellow-50 border-b border-yellow-100">
                    <div className="text-xs text-gray-500">Signed in as</div>
                    <div className="font-semibold text-gray-900 truncate text-xs break-all leading-tight" style={{ maxWidth: '170px' }}>{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (user.role === 'admin') {
                        navigate('/admin-dashboard');
                      } else {
                        navigate('/main-dashboard');
                      }
                    }}
                    className="w-full px-5 py-3 text-left hover:bg-yellow-50 transition text-base font-medium"
                  >{user.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}</button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setMenuOpen(false);
                      navigate('/');
                    }}
                    className="w-full px-5 py-3 text-left hover:bg-red-50 transition text-base font-semibold text-red-600"
                  >Logout</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section header */}
      <h1 className="section-header text-center text-gradient mb-2">Discover Arts</h1>
      <p className="section-subtitle text-center mb-8">Find your perfect art by style, medium, or theme. Filter below:</p>

      {/* Tag filter system */}
      <div className="flex flex-wrap gap-3 justify-center mb-10">
        {tags.map(tag => (
          <button
            key={tag}
            className={`badge-primary px-4 py-2 font-semibold shadow-construction-lg transition-all duration-200 ${selectedTag === tag ? 'bg-yellow-400 text-white scale-105' : ''}`}
            onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Artist cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
        {filteredArtists.length === 0 ? (
          <div className="col-span-full text-center text-lg text-gray-500 py-10">No artists found for selected tag.</div>
        ) : (
          filteredArtists.map(artist => (
            <div key={artist.name} className="construction-card p-6 flex flex-col items-center text-center">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-24 h-24 rounded-full object-cover mb-4 shadow-construction-lg border-4 border-yellow-200"
                onError={e => { e.target.src = '/images/background.png'; }}
              />
              <h2 className="text-xl font-bold text-gradient mb-2">{artist.name}</h2>
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {artist.tags.map(t => (
                  <span key={t} className="badge-secondary px-3 py-1">{t}</span>
                ))}
              </div>
              <Link
                to="/artist-list"
                className="btn-outline mt-3"
              >View Profile</Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MainDashboard;

