import React, { useState, useEffect } from "react";
import API from "../services/api";

const Profile = () => {
    const [wallet, setWallet] = useState<string>("");

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const { data } = await API.get("/profile/get_wallet");
                setWallet(data.wallet);
            } catch (error) {
                console.error("Failed to fetch wallet");
            }
        };

        fetchWallet();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await API.put("/profile/update_wallet", { wallet });
        } catch (error) {
            console.error("Failed to update wallet");
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold">Profile</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Wallet"
                    value={wallet}
                    onChange={(e) => setWallet(e.target.value)}
                    className="w-full p-2 border rounded"
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                    Update Wallet
                </button>
            </form>
        </div>
    );
};

export default Profile;