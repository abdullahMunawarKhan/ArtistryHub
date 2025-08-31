import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";

function ArtistDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [artistId, setArtistId] = useState(null);

    useEffect(() => {
        async function loadUserAndArtist() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (!user) return;
            const { data: artist } = await supabase
                .from("artists")
                .select("id")
                .eq("user_id", user.id)
                .single();
            setArtistId(artist?.id || null);
        }
        loadUserAndArtist();
    }, []);
    return (
        <div>
            <h1>welcome to artist Dashboard</h1>
        </div>
    );
}

export default ArtistDashboard;
