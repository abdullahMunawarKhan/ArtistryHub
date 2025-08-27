// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

const proofOptions = [
  { value: 'PAN', label: 'PAN Card' },
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'Voter ID', label: 'Voter ID Card' },
];

const TERMS_TEXT = `
Artist Registration Terms and Conditions
1. Provide accurate information.
2. Submit authentic documents.
3. You retain ownership of your work.
4. Accept all platform policies.
5. Remain compliant with laws.
6. Accounts may be suspended for violations.
`;

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    location: '',
    qualification: '',
    id_proof_type: proofOptions[0].value,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/user-login');
      setUserId(user.id);

      // check edit mode
      const params = new URLSearchParams(location.search);
      if (params.get('edit') === '1') setIsEdit(true);

      const { data: existing } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setIsEdit(true);
        setForm({
          name: existing.name || '',
          mobile: existing.mobile || '',
          email: existing.email || '',
          location: existing.location || '',
          qualification: existing.qualification || '',
          id_proof_type: existing.id_proof_type || proofOptions[0].value,
        });
        if (existing.profile_image_url) setProfilePreview(existing.profile_image_url);
        if (existing.id_proof_url) setIdPreview(existing.id_proof_url);
      }
    })();
  }, [location, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFile = (e, setter, previewSetter) => {
    const file = e.target.files[0];
    if (!file) return;
    setter(file);
    if (file.type.startsWith('image/')) {
      previewSetter(URL.createObjectURL(file));
    } else {
      previewSetter(null);
    }
  };

  const uploadFile = async (file, folder) => {
    if (!file) return '';
    const name = `${folder}/${Date.now()}_${file.name}`;
    await supabase.storage.from('artist-assets').upload(name, file, { upsert: true });
    const { data } = supabase.storage.from('artist-assets').getPublicUrl(name);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.email || !form.location) {
      return alert('Please fill all required fields.');
    }
    if (!isEdit && (!profileImage || !idFile)) {
      return alert('Profile image and ID proof are required.');
    }
    setShowTerms(true);
  };

  const confirmSubmit = async () => {
    if (!termsAccepted) return alert('Accept terms to proceed.');
    setLoading(true);
    try {
      const profileUrl = await uploadFile(profileImage, 'profiles');
      const idUrl = await uploadFile(idFile, 'id-proofs');
      let error;
      if (isEdit) {
        ({ error } = await supabase
          .from('artists')
          .update({
            ...form,
            profile_image_url: profileUrl || profilePreview,
            id_proof_url: idUrl || idPreview,
          })
          .eq('user_id', userId));
      } else {
        ({ error } = await supabase
          .from('artists')
          .insert([{
            user_id: userId,
            ...form,
            profile_image_url: profileUrl,
            id_proof_url: idUrl,
            registered_at: new Date().toISOString(),
          }]));
      }
      if (error) throw error;
      alert(isEdit ? 'Profile updated!' : 'Registered successfully!');
      navigate('/main-dashboard');
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold text-gradient-primary mb-4">
        {isEdit ? 'Edit Artist Profile' : 'Artist Registration'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {['name','mobile','email','location','qualification'].map((field) => (
          <div key={field}>
            <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input
              name={field}
              value={form[field]}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        ))}
        <div>
          <label className="form-label">ID Proof Type</label>
          <select
            name="id_proof_type"
            value={form.id_proof_type}
            onChange={handleChange}
            className="form-input"
          >
            {proofOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e, setProfileImage, setProfilePreview)}
            className="form-input"
          />
          {profilePreview && (
            <img src={profilePreview} alt="Profile preview" className="w-24 h-24 mt-2 rounded" />
          )}
        </div>
        <div>
          <label className="form-label">ID Proof Document</label>
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={(e) => handleFile(e, setIdFile, setIdPreview)}
            className="form-input"
          />
          {idPreview && (
            <p className="text-gray-600 mt-2">Preview not available for non-image</p>
          )}
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Processing...' : isEdit ? 'Update Profile' : 'Register'}
        </button>
      </form>

      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
            <pre className="text-gray-700 whitespace-pre-wrap mb-4">{TERMS_TEXT}</pre>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
                id="terms"
                className="mr-2"
              />
              <label htmlFor="terms">I accept the terms and conditions</label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowTerms(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
