import React, { useEffect, useState } from "react";
import { testAPI } from "../services/api"; // Importez la fonction testAPI depuis api.ts

const Home: React.FC = () => {
  // État pour stocker le message de l'API
  const [apiMessage, setApiMessage] = useState<string>("");

  useEffect(() => {
    // Fonction pour appeler l'API au chargement du composant
    const fetchAPI = async () => {
      try {
        const response = await testAPI(); // Appel à l'API
        setApiMessage(response.message); // Mise à jour de l'état avec le message
      } catch (error) {
        setApiMessage("Erreur lors de l'appel à l'API");
      }
    };

    fetchAPI();
  }, []); // Le tableau vide [] signifie que cet effet s'exécute une seule fois au chargement du composant

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome to My App</h1>
      <p className="mt-4">This is the home page.</p>
      <h2 className="text-2xl font-bold mt-8">Test de l'API</h2>
      <p className="mt-4">Message de l'API : {apiMessage}</p>
    </div>
  );
};

export default Home;
