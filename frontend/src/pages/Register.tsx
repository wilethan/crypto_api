import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "", // Champ ajouté pour le nom
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    // Validation côté client
    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    try {
      const { name, email, password } = formData; // Inclure le champ "name" dans l'API

      await API.post("/auth/register", { name, email, password });
      setMessage("✅ Inscription réussie ! Vérifiez votre email pour activer votre compte.");
      
      // Redirection vers la page de login après quelques secondes
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      console.error(error); // Affiche les détails de l'erreur dans la console
      setMessage(error.response?.data?.message || "❌ Échec de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Inscription</h1>

      {/* Affichage des messages */}
      {message && <div className={`text-center ${message.includes("❌") ? 'text-red-500' : 'text-green-500'}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Champ Nom */}
        <div>
          <label htmlFor="name" className="block font-medium mb-1">
            Nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="Entrez votre nom"
          />
        </div>

        {/* Champ Email */}
        <div>
          <label htmlFor="email" className="block font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="exemple@email.com"
          />
        </div>

        {/* Champ Mot de passe */}
        <div>
          <label htmlFor="password" className="block font-medium mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="Entrez votre mot de passe"
          />
        </div>

        {/* Champ Confirmation du mot de passe */}
        <div>
          <label htmlFor="confirmPassword" className="block font-medium mb-1">
            Confirmez le mot de passe
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="Confirmez votre mot de passe"
          />
        </div>

        {/* Bouton d'inscription */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "⏳ Inscription..." : "S'inscrire"}
        </button>
      </form>
    </div>
  );
};

export default Register;
