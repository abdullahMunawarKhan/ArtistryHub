// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  FileText,
  Image as ImageIcon,
  IdCard,
  CheckCircle2,
  X,
} from "lucide-react";

const proofOptions = [
  { value: 'Aadhar', label: 'Aadhar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'Voter ID', label: 'Voter ID Card' },
  { value: 'Passport', label: 'Passport' },
  { value: 'Driving License', label: 'Driving License' },
];

const TERMS_TEXT = `
Artist Registration Terms and Conditions

1. Accuracy of Information
   You must provide accurate and complete information during registration.

2. Document Authenticity
   All submitted documents must be authentic and belong to you.

3. Intellectual Property Rights
   You retain full ownership of your artwork and creative content.

4. Platform Compliance
   You agree to comply with all platform policies and guidelines.

5. Legal Compliance
   You must remain compliant with all applicable laws and regulations.

6. Account Suspension
   Accounts may be suspended or terminated for policy violations.

7. Content Guidelines
   All artwork must be original and not infringe on others' rights.

8. Commission Structure
   Platform commission rates apply as per current pricing policy.

9. Shipment charges 
   As our team will come to your doorstep for picking product so 50 rupess will be dedected from your payment per order along with platfrom charges.
`;

const FormField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  icon: Icon,
  placeholder = '',
  options = null,
  error = null
}) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
      {Icon && <Icon className="w-4 h-4 text-purple-600" />}
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>

    <div className="relative">
      {options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white shadow-sm appearance-none ${error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 shadow-sm ${error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}
          required={required}
        />
      )}
      {options && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </div>
    {error && <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 animate-fadeIn"><X size={12} strokeWidth={3} /> {error}</p>}
  </div>
);

const FileUpload = ({ label, accept, onChange, preview, icon: Icon, required = true, description, error }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
      <Icon className="w-4 h-4 text-purple-600" />
      {label}
      {required && <span className="text-rose-500">*</span>}
    </label>
    {description && <p className="text-[11px] text-slate-500 leading-tight">{description}</p>}

    <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 min-h-[160px] flex items-center justify-center relative overflow-hidden group ${preview ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/50 hover:border-purple-300 hover:bg-white'
      } ${error ? 'border-rose-200 bg-rose-50/30' : ''}`}>
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        id={label.replace(/\s+/g, '-').toLowerCase()}
      />
      <label
        htmlFor={label.replace(/\s+/g, '-').toLowerCase()}
        className="cursor-pointer block w-full h-full"
      >
        {preview ? (
          preview.startsWith('data:image') || preview.startsWith('blob') || preview.includes('image') || preview.startsWith('http') ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img src={preview} alt="Preview" className="w-24 h-24 rounded-2xl object-cover mx-auto ring-4 ring-white shadow-md" />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">File Selected</p>
              <p className="text-[10px] text-slate-400 font-medium">Click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <FileText className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Document Added</p>
              <p className="text-[10px] text-slate-400 font-medium">Click to replace</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-purple-500 transition-colors">
              <Icon className="w-7 h-7" />
            </div>
            <p className="text-xs text-slate-600 font-bold">Standard Upload</p>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">Tap to browse or drop file</p>
          </div>
        )}
      </label>
    </div>
    {error && <p className="text-rose-500 text-[11px] font-semibold flex items-center gap-1 animate-fadeIn"><X size={12} strokeWidth={3} /> {error}</p>}
  </div>
);



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
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState(null);


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
        if (existing.artist_qr) setQrCodePreview(existing.artist_qr);
      }

    })();
  }, [location, navigate]);

  const validationTimeout = React.useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    let newErrors = { ...errors };

    // Clear any pending timeout
    if (validationTimeout.current) clearTimeout(validationTimeout.current);

    // Real-time Input Restriction & Validation
    if (name === 'mobile') {
      // 1. Restriction: Only allow digits and max 10 chars
      newValue = value.replace(/\D/g, '').slice(0, 10);

      // 2. Real-time Validation Message for invalid action
      if (/\D/.test(value)) {
        newErrors.mobile = "Only digits are allowed";
      } else if (newValue.length === 10 && !/^[6-9]\d{9}$/.test(newValue)) {
        newErrors.mobile = "Only 10 digits are allowed";
      } else {
        delete newErrors.mobile;
      }
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (newValue.length > 0 && !emailRegex.test(newValue)) {
        newErrors.email = "Please enter a valid email format";
      } else {
        delete newErrors.email;
      }
    }

    // Generic clear error for other fields
    if (name !== 'mobile' && name !== 'email' && errors[name]) {
      delete newErrors[name];
    }

    setForm({ ...form, [name]: newValue });
    setErrors(newErrors);

    // Set timeout to clear error after 0.5s if it was a real-time validation error
    if (name === 'mobile' || name === 'email') {
      validationTimeout.current = setTimeout(() => {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }, 500);
    }
  };

  const handleFile = (e, setter, previewSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    setter(file);
    if (file.type.startsWith('image/')) {
      previewSetter(URL.createObjectURL(file));
    } else {
      previewSetter('uploaded');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid email format';
    }

    // Mobile validation
    if (form.mobile && (form.mobile.length !== 10 || !/^[6-9]\d{9}$/.test(form.mobile))) {
      newErrors.mobile = 'Only digits are allowed and limit will be 10';
    }

    if (!isEdit) {
      if (!profileImage) newErrors.profileImage = 'Profile image is required';
      if (!idFile) newErrors.idFile = 'ID proof document is required';
      if (!qrCodeFile) newErrors.qrCodeFile = 'Payment QR code image is required';
    } else {
      // If editing, allow submission if either a new file is chosen or existing preview exists
      if (!profileImage && !profilePreview) newErrors.profileImage = 'Profile image is required';
      if (!idFile && !idPreview) newErrors.idFile = 'ID proof document is required';
      if (!qrCodeFile && !qrCodePreview) newErrors.qrCodeFile = 'Payment QR code image is required';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(newErrors).length === 0;
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
    if (!validateForm()) return;
    setShowTerms(true);
  };

  const confirmSubmit = async () => {
    if (!termsAccepted) return alert('Please accept the terms and conditions to proceed.');

    setLoading(true);
    try {
      const profileUrl = await uploadFile(profileImage, 'profiles');
      const idUrl = await uploadFile(idFile, 'id-proofs');
      const qrCodeUrl = await uploadFile(qrCodeFile, 'qr-codes');

      let error;
      if (isEdit) {
        ({ error } = await supabase
          .from('artists')
          .update({
            ...form,
            profile_image_url: profileUrl || profilePreview,
            id_proof_url: idUrl || idPreview,
            artist_qr: qrCodeUrl || qrCodePreview,
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
            artist_qr: qrCodeUrl,
            registered_at: new Date().toISOString(),
          }]));
      }

      if (error) throw error;

      // Success message
      setShowTerms(false);
      alert(isEdit ? '🎉 Profile updated successfully!' : '🎉 Registration completed successfully!');
      navigate('/main-dashboard');

    } catch (err) {
      console.error('Registration error:', err);
      alert('Error: ' + err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text mb-2">
            {isEdit ? "Edit Profile" : "Artist Registration"}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            {isEdit
              ? "Update your information"
              : "Join our community of artists & showcase your creativity to the world."}
          </p>
        </div>

        {/* Registration Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8 border border-gray-100">
            <form onSubmit={handleSubmit} noValidate className="space-y-8">

              {/* PERSONAL INFO */}
              <section>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800 mb-6">
                  <User size={20} className="text-purple-600" />
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    icon={User}
                    placeholder="Enter your full name"
                    required
                    error={errors.name}
                  />

                  <FormField
                    label="Mobile Number"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    icon={Phone}
                    placeholder="Enter 10-digit mobile number"
                    required
                    error={errors.mobile}
                  />

                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    icon={Mail}
                    placeholder="Enter your email"
                    required
                    error={errors.email}
                  />

                  <FormField
                    label="Location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    icon={MapPin}
                    placeholder="City"
                    required
                    error={errors.location}
                  />
                </div>
              </section>

              {/* PROFESSIONAL INFO */}
              <section>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800 mb-6">
                  <GraduationCap size={20} className="text-purple-600" />
                  Professional Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <FormField
                    label="Qualification"
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    icon={GraduationCap}
                    placeholder="e.g., Bachelor of Fine Arts"
                    error={errors.qualification}
                  />

                  <FormField
                    label="ID Proof Type"
                    name="id_proof_type"
                    value={form.id_proof_type}
                    onChange={handleChange}
                    icon={IdCard}
                    options={proofOptions}
                    required
                  />
                </div>
              </section>

              {/* DOCUMENT UPLOADS */}
              <section>
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-800 mb-6">
                  <FileText size={20} className="text-purple-600" />
                  Document Uploads
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <FileUpload
                    label="Profile Image"
                    accept="image/*"
                    onChange={(e) => handleFile(e, setProfileImage, setProfilePreview)}
                    preview={profilePreview}
                    icon={ImageIcon}
                    required={!isEdit}
                    description="Upload a clear profile photo"
                    error={errors.profileImage}
                  />

                  <FileUpload
                    label={`${form.id_proof_type} Document`}
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(e) => handleFile(e, setIdFile, setIdPreview)}
                    preview={idPreview}
                    icon={IdCard}
                    required={!isEdit}
                    description="Upload your ID proof document"
                    error={errors.idFile}
                  />

                  <FileUpload
                    label="Payment QR Code"
                    accept="image/*"
                    onChange={(e) => handleFile(e, setQrCodeFile, setQrCodePreview)}
                    preview={qrCodePreview}
                    icon={ImageIcon}
                    required={!isEdit}
                    description="Upload payment QR code"
                    error={errors.qrCodeFile}
                  />
                </div>
              </section>

              {/* SUBMIT BUTTON */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-sm sm:text-base hover:opacity-90 transition shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      {isEdit ? "Update Profile" : "Submit Registration"}
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* TERMS MODAL */}
      {
        showTerms && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl">

              {/* Header */}
              <div className="p-4 border-b flex justify-between">
                <h2 className="text-xl font-semibold">Terms & Conditions</h2>
                <button onClick={() => setShowTerms(false)}>
                  <X size={20} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto text-sm leading-relaxed text-gray-700">
                <pre className="whitespace-pre-wrap">{TERMS_TEXT}</pre>
              </div>

              {/* Footer */}
              <div className="p-4 border-t bg-gray-50 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-purple-600"
                  />
                  I accept the terms and conditions
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowTerms(false)}
                    className="px-5 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSubmit}
                    disabled={!termsAccepted || loading}
                    className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Confirm Registration
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )
      }
    </div >
  );
}
