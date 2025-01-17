require("dotenv").config(); // Charge les variables d'environnement avant tout

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Import du module cookie-parser
const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // URL de votre frontend
    credentials: true, // Autorise les cookies pour les tokens (si nécessaire)
  })
);
app.use(cookieParser()); // Utilisation de cookie-parser pour gérer les cookies
app.use(express.json());

// Route test pour vérifier que l'API fonctionne
app.get("/api/v1", (req, res) => {
  res.status(200).json({ message: "ok" });
});

// Routes d'authentification
app.use("/api/v1/auth", authRoutes);

// Test de connexion à la base de données
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Erreur de connexion à la base de données :", err.stack);
  } else {
    console.log("Connexion à la base de données réussie :", res.rows[0]);
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(`Erreur : ${err.message}`);
  res.status(500).send("Erreur interne du serveur");
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Le serveur fonctionne sur http://localhost:${PORT}`);
  
});

app.use(cors({
  origin: "http://localhost:3000", // URL de ton frontend
  credentials: true, // Pour permettre l'envoi des cookies (ex. : refreshToken)
}));