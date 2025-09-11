import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useNavigate } from 'react-router-dom';



export default function ContactUs() {



    return (
        <div className="flex flex-col gap-8">
            <div className="sm:flex sm:gap-6 sm:items-center">
                <div className="sm:w-3/5 flex flex-col justify-center">
                    <h2 className="text-lg font-bold text-white mb-3">Contact Us</h2>
                    <p className="text-sm leading-relaxed">
                        <span className="font-semibold">Address:</span> NMIET campus, near Latis housing society, Talegaon
                        Dabhade, Pune.
                    </p>
                    <p className="text-sm leading-relaxed">
                        <span className="font-semibold">Email:</span>{' '}
                        <span className="italic text-gray-400">abdullahk4503@gmail.com</span>
                    </p>
                    <p className="text-sm leading-relaxed">
                        <span className="font-semibold">Mobile:</span>{' '}
                        <span className="italic text-gray-400">+91 8180826531, +91 7498890871</span>
                    </p>
                </div>
                <div className="sm:w-2/5 flex justify-center items-center">
                    <a
                        href="https://maps.app.goo.gl/k42FcH4jt3BThurA8"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <img
                            src="/images/location.png"
                            alt="Map preview"
                            className="w-full h-40 object-cover rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
                        />
                    </a>
                </div>
            </div>
            
        </div>
    );



}