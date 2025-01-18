require("dotenv").config(); // Charge les variables d'environnement avant tout

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Import du module cookie-parser
const authRoutes = require("./routes/authRoutes");
const pool = require("./config/db");
const axios = require("axios");

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);

const app = express();
const moment = require("moment");

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

// Fonction pour insérer les données historiques dans la base
async function insertHistory(date, crypto, avg) {
  const query = "INSERT INTO history (date, type, avg) VALUES ($1, $2, $3)";
  const values = [date, crypto, avg];
  try {
    await pool.query(query, values);
    console.log(`Données insérées pour la date: ${date}`);
  } catch (err) {
    console.error("Erreur lors de l'insertion des données :", err);
  }
}

// Fonction pour récupérer les données historiques des cryptos
async function fetchCryptoData() {
  const url =
    "https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=EUR&limit=1000&toTs=1736942400";
  try {
    const response = await axios.get(url);
    const data = response.data.Data.Data;

    // Insérer chaque donnée dans la base
    for (const item of data) {
      const date = moment.unix(item.time).format("YYYY-MM-DD");
      const avg = item.close; // Exemple : on prend le prix moyen de clôture
      await insertHistory(date, "ETH", avg);
    }

    console.log("Données historiques insérées.");
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données : ${error.message}`
    );
  }
}

// Fonction pour récupérer les transactions selon l'action
async function getTransactions(action) {
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=${action}&address=0xbb3afde35eb9f5feb5377485a3bd18a3eb0fe248&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=C7JYVESN2C3ZFAFGEP3UDKDH66BVDGFF1K`;
  try {
    const response = await axios.get(url);
    return response.data.result || [];
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des ${action} : ${error.message}`
    );
    return [];
  }
}

// Fonction pour récupérer et fusionner toutes les transactions
async function getAllTransactions() {
  const txList = await getTransactions("txlist"); // Transactions externes
  const txInternList = await getTransactions("txinternlist"); // Transactions internes
  return [...txList, ...txInternList]; // Fusionner les deux tableaux
}

// Fonction pour afficher les transactions fusionnées
async function displayTransactions() {
  const transactions = await getAllTransactions();
  const WALLET_ADDRESS = "0xbb3afde35eb9f5feb5377485a3bd18a3eb0fe248";
  let currentBalance = 0;

  console.log("\nTransactions Ethereum fusionnées:");
  transactions.sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp)); // Tri par date

  for (const tx of transactions) {
    const date = moment.unix(tx.timeStamp).format("YYYY-MM-DD");
    const ethValue = parseFloat(tx.value) / 1e18; // Conversion de Wei à ETH
    let change = 0;
    let transactionType = "";
    let gasCostEthValue = 0;

    if (tx.from?.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
      // Vente
      const gasCost = (parseFloat(tx.gasPrice) * parseInt(tx.gasUsed)) / 1e18; // Utilisation de gasUsed ici
      gasCostEthValue = gasCost;
      change = -(ethValue + gasCostEthValue);
      transactionType = "VENTE";
    } else if (tx.to?.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
      // Achat
      change = ethValue;
      transactionType = "ACHAT";
    }

    currentBalance += change;
    console.log(
      `Date: ${date} | Type: ${transactionType} | Montant: ${ethValue.toFixed(
        8
      )} ETH | Frais de gaz: ${gasCostEthValue.toFixed(
        8
      )} ETH | Nouveau solde: ${currentBalance.toFixed(8)} ETH`
    );
  }
}

// Fonction pour récupérer la valeur moyenne (avg) du prix de l'Ethereum pour une date donnée
async function getAvgFromHistory(date) {
  // Vérification de la validité de la date
  if (!moment(date, "YYYY-MM-DD", true).isValid()) {
    console.log(`Date invalide: ${date}`);
    return 0; // Retourner 0 si la date est invalide
  }

  const query = "SELECT avg FROM history WHERE date = $1 AND type = $2";
  const values = [date, "ETH"]; // On suppose que 'ETH' est l'identifiant pour Ethereum

  try {
    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
      return result.rows[0].avg; // Retourner la valeur moyenne trouvée
    } else {
      console.log(`Aucune donnée historique trouvée pour la date ${date}`);
      return 0; // Retourner 0 si aucune donnée n'est trouvée
    }
  } catch (err) {
    console.error("Erreur lors de la récupération de la donnée moyenne :", err);
    return 0; // Retourner 0 en cas d'erreur
  }
}

// Route pour récupérer les données pour le graphique
app.get("/wallet/get_data", async (req, res) => {
  const transactions = await getAllTransactions();
  const dailyBalances = {};
  let currentBalance = 0;
  const WALLET_ADDRESS = "0x9FC3da866e7DF3a1c57adE1a97c9f00a70f010c8";

  for (const tx of transactions) {
    const date = moment.unix(tx.timeStamp).format("YYYY-MM-DD");
    const ethValue = parseFloat(tx.value) / 1e18; // Conversion de Wei à ETH
    let change = 0;

    if (tx.from?.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
      // Vente
      const gasCost = (parseFloat(tx.gasPrice) * parseInt(tx.gasUsed)) / 1e18; // Utilisation de gasUsed ici
      change = -(ethValue + gasCost);
    } else if (tx.to?.toLowerCase() === WALLET_ADDRESS.toLowerCase()) {
      // Achat
      change = ethValue;
    }

    currentBalance += change;
    dailyBalances[date] = currentBalance;
  }

  // Préparer les données pour le graphique
  const chartData = [];
  for (const date in dailyBalances) {
    const avg = await getAvgFromHistory(date);
    const valueEUR = dailyBalances[date] * avg;

    chartData.push({ date, value: valueEUR });
  }

  res.json(chartData);
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

app.use(
  cors({
    origin: "http://localhost:3000", // URL de ton frontend
    credentials: true, // Pour permettre l'envoi des cookies (ex. : refreshToken)
  })
);
