import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

const proofOptions = [
  { value: 'PAN', label: 'PAN Card' },
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'Voter ID', label: 'Voter ID Card' },
];

const TERMS_TEXT = `
Artist Registration Terms and Conditions

By registering as an artist on our platform, you agree to the following terms and conditions:

1. Accuracy of Information
You confirm that all information provided during the registration process is complete, accurate, and truthful to the best of your knowledge. You are solely responsible for maintaining the correctness and updating any changes promptly.

2. Compliance with Legal Requirements
You affirm that all documents submitted for verification and registration are authentic, valid, and legally compliant. You understand that submission of fraudulent or forged documents may lead to immediate suspension or termination of your account.

3. Intellectual Property Rights
You warrant that the artworks and content you upload do not infringe upon the intellectual property rights or copyrights of any third party. You retain ownership of your work but grant our platform a license to display and promote your art as part of our services.

4. Acceptance of Platform Policies
By registering, you acknowledge that you have read, understood, and accepted all platform policies, including but not limited to privacy, content guidelines, payment, and dispute resolution policies, as outlined in our Terms of Service.

5. Responsibility and Liability
You agree to hold the platform harmless from any claims, damages, or losses arising from inaccuracies in the information or documents you provide. It is your responsibility to ensure compliance with all applicable laws and regulations pertaining to your participation.

6. Account Suspension and Termination
The platform reserves the right to suspend, block, or terminate your artist account at its sole discretion if any violation of these terms or platform policies is detected.

By proceeding with the registration, you confirm that you accept these terms and agree to abide by them strictly.
`;

function Register() {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    location: '',
    qualification: '',
    id_proof_type: proofOptions[0].value,
  });
  const [isEdit, setIsEdit] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Modal & checkbox state for terms acceptance
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const navigate = useNavigate();

  // Get logged-in user and prefill if editing
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) navigate('/user-login');
      else setUser(user);

      // Check query for edit mode or existing artist
      const params = new URLSearchParams(window.location.search);
      const editMode = params.get('edit') === '1';
      if (editMode) setIsEdit(true);

      const { data: existing } = await supabase
        .from('artists')
        .select('id, name, mobile, email, location, qualification, id_proof_type, profile_image_url, id_proof_url')
        .eq('user_id', user?.id)
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
        if (existing.profile_image_url) setProfileImagePreview(existing.profile_image_url);
        if (existing.id_proof_url && existing.id_proof_url.match(/^https?:/)) setIdProofPreview(existing.id_proof_url);
      }
    };
    getUser();
  }, [navigate]);

  // Handle form input changes
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

  // File upload helper
  const uploadFile = async (file, folder) => {
    if (!file) return '';
    const filename = `${folder}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('artist-assets')
      .upload(filename, file, { upsert: true });
    if (error) {
      console.error('Upload error:', error);
      return '';
    }
    const { publicUrl } = supabase.storage.from('artist-assets').getPublicUrl(filename).data;
    return publicUrl;
  };

  // Submit handler triggers terms modal first
  const handleRegisterClick = (e) => {
    e.preventDefault();
    // Basic checks before showing terms modal
    if (!form.name || !form.mobile || !form.email || !form.location) {
      alert('Please fill all required fields.');
      return;
    }
    // In edit mode, allow skipping re-uploads
    if (!isEdit) {
      if (!profileImage) {
        alert('Profile image is required.');
        return;
      }
      if (!idProofFile) {
        alert('ID proof document is required.');
        return;
      }
    }
    setShowTermsModal(true);
  };

  // Final submit after terms accepted
  const handleSubmit = async () => {
    if (!termsAccepted) {
      alert('You must accept the terms and conditions to proceed.');
      return;
    }
    setLoading(true);
    setShowTermsModal(false);
    try {
      const uploadedProfileUrl = await uploadFile(profileImage, 'profile-images');
      const uploadedIdUrl = await uploadFile(idProofFile, 'id-proofs');

      let error;
      if (isEdit) {
        // Update existing row for this user
        const updatePayload = {
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          location: form.location,
          qualification: form.qualification,
          id_proof_type: form.id_proof_type,
        };
        if (uploadedProfileUrl) updatePayload.profile_image_url = uploadedProfileUrl;
        if (uploadedIdUrl) updatePayload.id_proof_url = uploadedIdUrl;
        ({ error } = await supabase
          .from('artists')
          .update(updatePayload)
          .eq('user_id', user.id));
      } else {
        if (!uploadedProfileUrl || !uploadedIdUrl) {
          alert('Image or ID proof upload failed, please try again.');
          setLoading(false);
          return;
        }
        ({ error } = await supabase.from('artists').insert([
          {
            user_id: user.id,
            name: form.name,
            email: form.email,
            mobile: form.mobile,
            location: form.location,
            qualification: form.qualification,
            id_proof_type: form.id_proof_type,
            profile_image_url: uploadedProfileUrl,
            id_proof_url: uploadedIdUrl,
            registered_at: new Date().toISOString(),
          },
        ]));
      }
      if (error) {
        alert('Error registering artist: ' + error.message);
      } else {
        alert(isEdit ? 'Profile updated successfully!' : 'Artist registered successfully!');
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
    <>
      <div
        style={{
          maxWidth: 680,
          margin: '2rem auto',
          padding: '2rem',
          boxShadow: '0 4px 20px #d6d6d6',
          borderRadius: 10,
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          backgroundColor: '#fff',
        }}
      >
        <h1 style={{ marginBottom: '1.5rem', color: '#222' }}>Artist Registration</h1>

        <form>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#444' }}>
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
            style={{
              width: '100%',
              padding: '10px 14px',
              marginBottom: 16,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 16,
            }}
          />

          <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#444' }}>
            Mobile Number *
          </label>
          <input
            type="tel"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
            required
            placeholder="Enter mobile number"
            style={{
              width: '100%',
              padding: '10px 14px',
              marginBottom: 16,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 16,
            }}
          />

          <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#444' }}>
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Enter email address"
            style={{
              width: '100%',
              padding: '10px 14px',
              marginBottom: 16,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 16,
            }}
          />

          <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#444' }}>
            Location *
          </label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            placeholder="City, State, Country"
            style={{
              width: '100%',
              padding: '10px 14px',
              marginBottom: 16,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 16,
            }}
          />

          <label style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#444' }}>
            Qualification (optional)
          </label>
          <input
            type="text"
            name="qualification"
            value={form.qualification}
            onChange={handleChange}
            placeholder="Your qualifications (if any)"
            style={{
              width: '100%',
              padding: '10px 14px',
              marginBottom: 16,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 16,
            }}
          />

          <label
            htmlFor="id_proof_type"
            style={{ display: 'block', marginBottom: 8, fontWeight: '600', color: '#444' }}
          >
            ID Proof Type
          </label>
          <select
            name="id_proof_type"
            value={form.id_proof_type}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              marginBottom: 20,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            {proofOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label
            style={{ display: 'block', marginBottom: 10, fontWeight: '600', color: '#444' }}
          >
            Profile Image *
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={handleProfileImageChange}
            style={{ marginBottom: 12 }}
          />
          {profileImagePreview && (
            <img
              src={profileImagePreview}
              alt="Profile Preview"
              style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, marginBottom: 16 }}
            />
          )}

          <label
            style={{ display: 'block', marginBottom: 10, fontWeight: '600', color: '#444' }}
          >
            ID Proof Document (PDF or Image) *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleIdProofChange}
            style={{ marginBottom: 12 }}
          />
          {idProofPreview && (
            <img
              src={idProofPreview}
              alt="ID Proof Preview"
              style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, marginBottom: 16 }}
            />
          )}

          <button
            onClick={handleRegisterClick}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#F59E0B',
              color: 'white',
              fontWeight: 700,
              padding: '14px 0',
              fontSize: 18,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Registering...' : 'Register as Artist'}
          </button>
        </form>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              maxWidth: 600,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 4px 30px rgba(0,0,0,0.1)',
              padding: '1.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h2 style={{ marginBottom: '1rem', color: '#222' }}>Artist Registration Terms and Conditions</h2>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: 14,
                color: '#444',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}
            >
              {TERMS_TEXT}
            </pre>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 24,
                fontSize: 15,
                color: '#444',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ accentColor: '#F59E0B', transform: 'scale(1.3)' }}
              />
              I have read and accept the terms and conditions above
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                disabled={!termsAccepted}
                onClick={handleSubmit}
                style={{
                  flex: 1,
                  backgroundColor: termsAccepted ? '#F59E0B' : '#d6a545',
                  color: 'white',
                  fontWeight: 700,
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: termsAccepted ? 'pointer' : 'not-allowed',
                }}
              >
                Submit Registration
              </button>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontWeight: 700,
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Register;
