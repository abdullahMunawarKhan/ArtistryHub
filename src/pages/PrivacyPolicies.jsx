import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';      // Security / Privacy
import { DocumentTextIcon } from '@heroicons/react/24/outline';     // Document / Policy
import { LockClosedIcon } from '@heroicons/react/24/outline';       // Lock / Security
import { UserIcon } from '@heroicons/react/24/outline';             // User / Person
import { GlobeAltIcon } from '@heroicons/react/24/outline';         // Globe / Global access
import { ArrowPathIcon } from '@heroicons/react/24/outline';        // Refresh / Update
import { EnvelopeIcon } from '@heroicons/react/24/outline';         // Mail / Contact

export default function PrivacyPolicies() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-10 flex justify-center items-start">
            <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-8 border border-gray-200">
                <div className="flex items-center mb-6 space-x-3">
                    <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-800">Privacy Policy</h1>
                </div>
                <p className="text-sm text-gray-500 mb-8">Last updated: <span className="font-semibold text-blue-700">12-09-2025</span></p>

                <section className="mb-8">
                    <p className="text-gray-600 leading-relaxed">
                        This Privacy Policy describes how <span className="font-medium">Scopebrush</span> collects, uses, and protects personal information when you visit <a href="https://scopebrush.vercel.app" target="_blank" rel="noopener" className="text-blue-600 underline">scopebrush.vercel.app</a>.
                    </p>
                </section>

                <Section icon={DocumentTextIcon} title="Information We Collect">
                    <ul className="list-disc ml-6 text-gray-700 space-y-1">
                        <li>Personal Data (name, email address, etc.) you voluntarily submit via forms.</li>
                        <li>Automatically collected data (your following and likes to enhance our services).</li>
                    </ul>
                </Section>

                <Section icon={UserIcon} title="How We Use Information">
                    <ul className="list-disc ml-6 text-gray-700 space-y-1">
                        <li>To provide, operate, and maintain our Website.</li>
                        <li>To improve, personalize, and expand our Website.</li>
                        <li>To communicate with you (support, updates, etc.).</li>
                        <li>For analytics and user experience enhancement.</li>
                    </ul>
                </Section>

                <Section icon={GlobeAltIcon} title="Who We Share Your Data With">
                    <ul className="list-disc ml-6 text-gray-700 space-y-1">
                        <li>Third-party service providers (such as Razorpay for payments).</li>
                        <li>Website hosting and analytics partners.</li>
                        <li>Legal authorities (if required by law).</li>
                    </ul>
                </Section>

                <Section icon={LockClosedIcon} title="Cookies and Tracking Technologies">
                    <p className="text-gray-700">
                        We use cookies and similar tracking technologies. You may set your browser to refuse cookies.
                    </p>
                </Section>

                <Section icon={LockClosedIcon} title="Data Security">
                    <p className="text-gray-700">
                        We use industry-standard measures to secure your personal data. However, no method of transmission over the internet is 100% secure.
                    </p>
                </Section>

                <Section icon={UserIcon} title="Your Rights">
                    <ul className="list-disc ml-6 text-gray-700 space-y-1">
                        <li>Access, update, or delete your personal data by contacting us.</li>
                        <li>Opt-out of email communications at any time.</li>
                    </ul>
                </Section>

                <Section icon={GlobeAltIcon} title="Links to Other Sites">
                    <p className="text-gray-700">
                        Our Website may contain links to external sites not operated by us. We are not responsible for their content or privacy practices.
                    </p>
                </Section>

                <Section icon={ArrowPathIcon} title="Policy Updates">
                    <p className="text-gray-700">
                        We may update our Privacy Policy. Updates will be posted on this page with a revised “Last updated” date.
                    </p>
                </Section>

                <Section icon={EnvelopeIcon} title="Contact Us">
                    <p className="text-gray-700">
                        For questions about this Privacy Policy, email us at <a href="mailto:abdullahk4503@gmail.com" className="text-blue-600 underline">abdullahk4503@gmail.com</a>.
                    </p>
                </Section>
            </div>
        </div>
    );
}

function Section({ icon: Icon, title, children }) {
    return (
        <div className="mb-8">
            <div className="flex items-center mb-2">
                <Icon className="w-5 h-5 text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            <div>{children}</div>
            <hr className="mt-4 border-gray-100" />
        </div>
    );
}
