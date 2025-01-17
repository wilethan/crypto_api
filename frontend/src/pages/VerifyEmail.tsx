import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importer le hook pour la redirection
import API from "../services/api";

const VerifyEmail = () => {
    const [message, setMessage] = useState("");
    const navigate = useNavigate(); // Hook pour la redirection

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const token = window.location.pathname.split("/").pop();
                const { data } = await API.post("/auth/verify-email", { token });
                setMessage(data.message);

                // Rediriger vers la page de connexion après 3 secondes
                setTimeout(() => {
                    navigate("/login"); // Redirection vers la page de login
                }, 3000);
            } catch (error) {
                setMessage("Échec de la vérification de l'e-mail.");
            }
        };

        verifyEmail(); // Appeler la fonction de vérification dès le chargement du composant
    }, [navigate]); // Dépendance au hook navigate pour s'assurer de la redirection correcte

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 text-center">
            <h1 className="text-2xl font-bold">Vérification de l'Email</h1>
            <p className="text-green-600">{message}</p>
            {message && <p className="text-gray-500">Redirection vers la page de connexion...</p>}
        </div>
    );
};

export default VerifyEmail;
