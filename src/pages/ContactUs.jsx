import React from "react";
import { MapPinIcon, EnvelopeIcon, DevicePhoneMobileIcon } from "@heroicons/react/24/outline";

// Example assumes your map image is at /images/location.png

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-50 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white/80 shadow-xl rounded-2xl p-8 flex flex-col md:flex-row gap-8 border border-blue-100 backdrop-blur-md">
        {/* Contact Details */}
        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 flex items-center">
            <EnvelopeIcon className="w-8 h-8 text-purple-500 mr-3" />
            Contact Us
          </h2>
          <div className="space-y-5">
            <p className="text-base flex items-start">
              <MapPinIcon className="w-6 h-6 text-blue-500 mr-2 mt-1" />
              <span>
                <span className="font-semibold text-gray-800">Address:</span> NMIET campus, near Latis housing society, Talegaon Dabhade, Pune.
              </span>
            </p>
            <p className="text-base flex items-center">
              <EnvelopeIcon className="w-6 h-6 text-purple-500 mr-2" />
              <span>
                <span className="font-semibold text-gray-800">Email:</span>
                <a href="mailto:abdullahk4503@gmail.com" className="underline text-blue-700 ml-1">abdullahk4503@gmail.com</a>
              </span>
            </p>
            <p className="text-base flex items-center">
              <DevicePhoneMobileIcon className="w-6 h-6 text-green-500 mr-2" />
              <span>
                <span className="font-semibold text-gray-800">Mobile:</span>
                <a href="tel:+918180826531" className="underline text-blue-700 ml-1">+91 8180826531</a>, 
                <a href="tel:+917498890871" className="underline text-blue-700 ml-1">+91 7498890871</a>
              </span>
            </p>
          </div>
        </div>

        {/* Map Card */}
        <div className="flex-1 flex items-start justify-center">
          <a
            href="https://maps.app.goo.gl/k42FcH4jt3BThurA8"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl shadow-md overflow-hidden border-2 border-blue-100 hover:border-blue-400 transition duration-300"
            style={{ minWidth: 300 }}
          >
            <img
              src="/images/location.png"
              alt="Map preview"
              className="w-full max-w-xs h-48 object-cover hover:scale-105 transition-transform duration-500"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
