import React, { useState } from "react";
import API from "../services/api"; // Service pour appeler l'API backend
import { useAuth } from "../hooks/useAuth"; // Hook personnalisé pour gérer l'état d'authentification
import { Navigate } from "react-router-dom";

const Login = () => {
    const { user, login } = useAuth(); // Récupération de l'utilisateur connecté et de la fonction login
    const [email, setEmail] = useState(""); // État pour l'email
    const [password, setPassword] = useState(""); // État pour le mot de passe
    const [error, setError] = useState<string | null>(null); // État pour les erreurs éventuelles

    // Gestion de la soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Empêche le rechargement de la page
        setError(null); // Réinitialise les erreurs

        try {
            // Appel à l'endpoint /auth/login
            const { data } = await API.post("/auth/login", { email, password }, { withCredentials: true });

            // Sauvegarde du token d'accès dans le localStorage
            localStorage.setItem("accessToken", data.accessToken);

            // Mise à jour de l'état d'authentification
            login(data.user); // Passe les informations utilisateur à votre contexte d'authentification

            console.log("Connexion réussie :", data);
        } catch (err: any) {
            console.error("Échec de la connexion :", err.response?.data?.message || err.message);
            // Affiche un message d'erreur
            setError(err.response?.data?.error || "Connexion échouée. Vérifiez vos informations.");
        }
    };

    // Redirige si l'utilisateur est déjà connecté
    if (user) {
        return <Navigate to="/dashboard" />;
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4">
            <h1 className="text-2xl font-bold text-center">Connexion</h1>

            {/* Affiche les erreurs si elles existent */}
            {error && <div className="text-red-500 text-center">{error}</div>}

            {/* Champ Email */}
            <div>
                <label htmlFor="email" className="block font-medium mb-1">Email</label>
                <input
                    id="email"
                    type="email"
                    placeholder="Entrez votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>

            {/* Champ Mot de passe */}
            <div>
                <label htmlFor="password" className="block font-medium mb-1">Mot de passe</label>
                <input
                    id="password"
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
            </div>

            {/* Bouton de soumission */}
            <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
                Se connecter
            </button>
        </form>
    );
};

export default Login;
