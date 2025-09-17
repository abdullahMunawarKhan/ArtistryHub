// src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  IdentificationIcon,
  PhotoIcon,
  DocumentIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const proofOptions = [
  { value: 'PAN', label: 'PAN Card' },
  { value: 'Aadhar', label: 'Aadhar Card' },
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
  options = null
}) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>

    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
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
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
        required={required}
      />
    )}
  </div>
);

const FileUpload = ({
  label,
  accept,
  onChange,
  preview,
  icon: Icon,
  required = false,
  description = ''
}) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {description && <p className="text-xs text-gray-500">{description}</p>}

    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        className="hidden"
        id={label.replace(/\s+/g, '-').toLowerCase()}

      />
      <label
        htmlFor={label.replace(/\s+/g, '-').toLowerCase()}
        className="cursor-pointer block"
      >
        {preview ? (
          <div className="space-y-2">
            {preview.startsWith('data:image') || preview.includes('image') ? (
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 mx-auto rounded-lg object-cover border-2 border-gray-200"
              />
            ) : (
              <DocumentIcon className="w-12 h-12 mx-auto text-green-500" />
            )}
            <p className="text-sm text-green-600 font-medium">File uploaded</p>
            <p className="text-xs text-gray-500">Click to change</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Icon && <Icon className="w-12 h-12 mx-auto text-gray-400" />}
            <p className="text-gray-600">Click to upload</p>
            <p className="text-xs text-gray-400">or drag and drop</p>
          </div>
        )}
      </label>
    </div>
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
      }
    })();
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
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
    // if (!form.qualification.trim()) newErrors.qualification = 'Qualification is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Mobile validation
    const mobileRegex = /^[6-9]\d{9}$/;
    if (form.mobile && !mobileRegex.test(form.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!isEdit) {
      if (!profileImage) newErrors.profileImage = 'Profile image is required';
      if (!idFile) newErrors.idFile = 'ID proof document is required';
      if (!qrCodeFile) newErrors.qrCodeFile = 'Payment QR code image is required';
    }

    setErrors(newErrors);
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
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[90vh] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-primary mb-2">
            {isEdit ? '✏️ Edit Artist Profile' : '🎨 Artist Registration'}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isEdit
              ? 'Update your artist profile information and documents'
              : 'Join our community of talented artists and showcase your work to the world'
            }
          </p>
        </div>

        {/* Registration Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-8">

              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    icon={UserIcon}
                    placeholder="Enter your full name"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}

                  <FormField
                    label="Mobile Number"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    icon={PhoneIcon}
                    placeholder="Enter 10-digit mobile number"
                    required
                  />
                  {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}

                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    icon={EnvelopeIcon}
                    placeholder="Enter your email address"
                    required
                  />
                  {/* {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>} */}

                  <FormField
                    label="Location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    icon={MapPinIcon}
                    placeholder="City, State"
                    required
                  />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5" />
                  Professional Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Qualification"
                    name="qualification"
                    value={form.qualification}
                    onChange={handleChange}
                    icon={AcademicCapIcon}
                    placeholder="e.g., Bachelor of Fine Arts"

                  />
                  {errors.qualification && <p className="text-red-500 text-sm mt-1">{errors.qualification}</p>}

                  <FormField
                    label="ID Proof Type"
                    name="id_proof_type"
                    value={form.id_proof_type}
                    onChange={handleChange}
                    icon={IdentificationIcon}
                    options={proofOptions}
                    required
                  />
                </div>
              </div>

              {/* Document Uploads */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <DocumentIcon className="w-5 h-5" />
                  Document Uploads
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FileUpload
                      label="Profile Image"
                      accept="image/*"
                      onChange={(e) => handleFile(e, setProfileImage, setProfilePreview)}
                      preview={profilePreview}
                      icon={PhotoIcon}
                      required={!isEdit}
                      description="Upload a clear photo of yourself (JPG, PNG)"
                    />
                    {errors.profileImage && <p className="text-red-500 text-sm mt-1">{errors.profileImage}</p>}
                  </div>

                  <div>
                    <FileUpload
                      label={`${form.id_proof_type} Document`}
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => handleFile(e, setIdFile, setIdPreview)}
                      preview={idPreview}
                      icon={IdentificationIcon}
                      required={!isEdit}
                      description="Upload your ID proof document (JPG, PNG, PDF)"
                    />
                    {errors.idFile && <p className="text-red-500 text-sm mt-1">{errors.idFile}</p>}
                  </div>
                  <div>
                    <FileUpload
                      label="Payment QR Code"
                      accept="image/*"
                      onChange={(e) => handleFile(e, setQrCodeFile, setQrCodePreview)}
                      preview={qrCodePreview}
                      icon={PhotoIcon}
                      required={!isEdit}  // optionally required if new registration
                      description="Upload your payment QR code image (JPG, PNG)"
                    />
                    {errors.qrCodeFile && <p className="text-red-500 text-sm mt-1">{errors.qrCodeFile}</p>}
                  </div>

                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      {isEdit ? 'Update Profile' : 'Submit Registration'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Terms & Conditions</h2>
                <button
                  onClick={() => setShowTerms(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              <pre className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {TERMS_TEXT}
              </pre>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={() => setTermsAccepted(!termsAccepted)}
                  id="terms"
                  className="mr-3 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 font-medium">
                  I have read and accept the terms and conditions
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTerms(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={!termsAccepted || loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4" />
                      Confirm Registration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
