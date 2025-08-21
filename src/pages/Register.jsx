import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const proofOptions = [
  { value: 'PAN', label: 'PAN Card' },
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'Voter ID', label: 'Voter ID Card' }
];

function Register() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    location: '',
    qualification: '',
    id_proof_type: proofOptions[0].value
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/user-login');
      else setUser(user);
    };
    getUser();
  }, [navigate]);

  // Input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Profile image upload/preview
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Profile image must be JPG or PNG');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Profile image must be less than 10MB');
      return;
    }
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  // ID proof file upload/preview
const handleIdProofChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    alert('ID proof must be PDF or JPG/PNG image');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    alert('ID proof document must be less than 10MB');
    return;
  }
  setIdProofFile(file);
  if (file.type.startsWith('image/')) {
    setIdProofPreview(URL.createObjectURL(file));
  } else {
    setIdProofPreview(null);
  }
};


  // File upload
  const uploadFile = async (file, folder) => {
    if (!file) return '';
    const filename = `${folder}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('artist-assets').upload(filename, file, { upsert: true });
    if (error) {
      console.error('Upload error:', error);
      return '';
    }
    const { publicUrl } = supabase.storage.from('artist-assets').getPublicUrl(filename).data;
    return publicUrl;
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to register as an artist.');
      navigate('/user-login');
      return;
    }
    if (!profileImage) {
      alert('Profile image is required.');
      return;
    }
    if (!idProofFile) {
      alert('ID proof document is required.');
      return;
    }
    setLoading(true);
    try {
      const profileImageUrl = await uploadFile(profileImage, 'profile-images');
      const idProofUrl = await uploadFile(idProofFile, 'id-proofs');
      console.log("ProfileImageUrl:", profileImageUrl);
      console.log("IDProofUrl:", idProofUrl);
      if (!profileImageUrl || !idProofUrl) {
        alert("Image or ID proof upload failed, please try again.");
        setLoading(false);
        return;
      }

      // Insert to Supabase artists table
      const { error } = await supabase.from('artists').insert([{
        user_id: user.id,
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        location: form.location,
        qualification: form.qualification,
        id_proof_type: form.id_proof_type,
        profile_image_url: profileImageUrl,
        id_proof_url: idProofUrl,
        registered_at: new Date().toISOString(),
        // experience and paintings_sold left as null for now - can be populated on edit/profile update
      }]);
      if (error) {
        alert('Error registering artist: ' + error.message);
      } else {
        alert('Artist registered successfully!');
        navigate('/main-dashboard');
        window.location.reload();
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Register as Artist</h1>
      <form className="bg-white rounded-xl shadow p-8" onSubmit={handleSubmit}>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Profile Photo <span className="text-red-500">*</span></label>
          <input type="file" accept="image/png, image/jpeg" required disabled={loading} onChange={handleProfileImageChange} />
          {profileImagePreview && (
            <img src={profileImagePreview} alt="Profile Preview" className="mt-2 w-32 h-32 object-cover rounded-full border" />
          )}
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Name <span className="text-red-500">*</span></label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required disabled={loading}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Email <span className="text-red-500">*</span></label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={loading}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Mobile Number <span className="text-red-500">*</span></label>
          <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} required disabled={loading}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Qualification (Optional)</label>
          <input type="text" name="qualification" value={form.qualification} onChange={handleChange} disabled={loading}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Location <span className="text-red-500">*</span></label>
          <input type="text" name="location" value={form.location} onChange={handleChange} required disabled={loading}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400" />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">ID Proof Type <span className="text-red-500">*</span></label>
          <select name="id_proof_type" value={form.id_proof_type} onChange={handleChange} required disabled={loading}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400">
            {proofOptions.map(opt => (
              <option value={opt.value} key={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">ID Proof Document (Max 10MB) <span className="text-red-500">*</span></label>
          <input type="file" accept=".pdf,image/png,image/jpeg" required disabled={loading} onChange={handleIdProofChange} />
          {idProofPreview && (
            <img src={idProofPreview} alt="ID Proof Preview" className="mt-2 max-w-full max-h-48 object-contain border" />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-yellow-400 text-white font-semibold rounded-lg shadow hover:bg-yellow-500 transition"
        >
          {loading ? 'Registering...' : 'Register'}

        </button>
      </form>
    </div>
  );
}

export default Register;
