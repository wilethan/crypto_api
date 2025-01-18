import React, { useState, useEffect } from "react";
import API from "../services/api"; // Importer API pour centraliser les requêtes
import { useParams, useNavigate } from "react-router-dom";
import { AxiosError } from "axios"; // Importation correcte d'AxiosError

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>(); // Récupérer le token depuis l'URL avec le type correct
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setMessage("Token manquant !");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setMessage("Les mots de passe ne correspondent pas.");
    }

    setLoading(true);
    try {
      // Utiliser API pour faire la requête POST
      const response = await API.post(`/auth/reset-password/${token}`, { password });
      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/login");  // Rediriger l'utilisateur vers la page de login après un délai
      }, 2000);
    } catch (error: unknown) {
      // Gestion des erreurs Axios avec vérification du type
      if (error instanceof AxiosError) {
        setMessage(error.response?.data?.message || "Une erreur est survenue.");
      } else {
        setMessage("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Réinitialisation du mot de passe</h1>

      {/* Affichage des messages */}
      {message && <div className={`text-center ${message.includes("❌") ? 'text-red-500' : 'text-green-500'}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Nouveau mot de passe */}
        <div>
          <label htmlFor="password" className="block font-medium mb-1">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
            placeholder="Entrez votre nouveau mot de passe"
          />
        </div>

        {/* Champ Confirmation du mot de passe */}
        <div>
          <label htmlFor="confirmPassword" className="block font-medium mb-1">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
            placeholder="Confirmez votre mot de passe"
          />
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "⏳ Réinitialisation..." : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
