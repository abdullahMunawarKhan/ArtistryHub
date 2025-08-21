import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

function ArtistList() {
	const [artists, setArtists] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchArtists = async () => {
			// Fetch artist info from Supabase 'artists' table
			const { data, error } = await supabase
				.from('artists')
				.select('id, name, experience, registered_at, paintings_sold, paintings (id, title, image_url)');
			if (!error && data) {
				setArtists(data);
			}
			setLoading(false);
		};
		fetchArtists();
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100">
				<div className="text-xl text-gray-700 font-bold animate-pulse">Loading artists...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 p-8">
			<h1 className="section-header text-center text-gradient mb-8">Meet Our Artists</h1>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-center">
				{artists.length === 0 ? (
					<div className="col-span-full text-center text-lg text-gray-500 py-10">No artists found.</div>
				) : (
					artists.map(artist => (
						<div key={artist.id} className="construction-card p-6 flex flex-col items-center text-center">
							<img
								src={artist.paintings?.[0]?.image_url || '/images/background.png'}
								alt={artist.name}
								className="w-24 h-24 rounded-full object-cover mb-4 shadow-construction-lg border-4 border-yellow-200"
								onError={e => { e.target.src = '/images/background.png'; }}
							/>
							<h2 className="text-xl font-bold text-gradient mb-2">{artist.name}</h2>
							<div className="mb-2 text-gray-700 text-sm">
								<span className="badge-primary mr-2">Experience: {artist.experience} yrs</span>
								<span className="badge-secondary mr-2">Registered: {artist.registered_at ? new Date(artist.registered_at).toLocaleDateString() : 'N/A'}</span>
							</div>
							<div className="mb-2 text-gray-700 text-sm">
								<span className="badge-primary mr-2">Paintings Sold: {artist.paintings_sold}</span>
								<span className="badge-secondary">Current Paintings: {artist.paintings?.length || 0}</span>
							</div>
							<div className="grid grid-cols-2 gap-2 mt-3">
								{artist.paintings?.slice(0, 4).map(painting => (
									<img
										key={painting.id}
										src={painting.image_url || '/images/background.png'}
										alt={painting.title}
										className="w-16 h-16 rounded-lg object-cover border border-yellow-100 shadow-construction"
										title={painting.title}
									/>
								))}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

export default ArtistList;
