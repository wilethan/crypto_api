import React, { useState } from "react";
import API from "../services/api"; // Assure-toi d'importer correctement le fichier API
import { AxiosError } from "axios"; // Importation correcte d'AxiosError

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Envoi de l'email pour la réinitialisation du mot de passe
      const response = await API.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
    } catch (error: unknown) {
      // Vérification du type de l'erreur
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
      <h1 className="text-2xl font-bold text-center">Mot de passe oublié</h1>

      {/* Affichage des messages */}
      {message && <div className={`text-center ${message.includes("❌") ? 'text-red-500' : 'text-green-500'}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Email */}
        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Adresse email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
            placeholder="exemple@email.com"
          />
        </div>

        {/* Bouton d'envoi */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "⏳ Envoi en cours..." : "Envoyer le lien de réinitialisation"}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
