const express = require("express");
const { getTransactions } = require("../../client/api");
const { getAvgFromHistory } = require("../db");
const router = express.Router();

router.get("/get_data", async (req, res) => {
  try {
    const transactions = await getTransactions();

    // Vérifier si des transactions ont été récupérées
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ error: "Aucune transaction trouvée" });
    }

    const chartData = [];
    const dailyBalances = {};
    let currentBalance = BigInt(0);

    // Trier les transactions par timestamp (au cas où elles ne le seraient pas)
    transactions.sort(
      (a, b) => parseInt(a.timeStamp, 10) - parseInt(b.timeStamp, 10)
    );

    for (let tx of transactions) {
      const timestamp = parseInt(tx.timeStamp, 10);
      const date = new Date(timestamp * 1000).toISOString().split("T")[0];
      const ethValue = BigInt(tx.value); // Valeur en Wei
      let change = BigInt(0);

      if (
        tx.from.toLowerCase() === "0xbb3afde35eb9f5feb5377485a3bd18a3eb0fe248"
      ) {
        const gasPrice = BigInt(tx.gasPrice);
        const gasUsed = BigInt(tx.gasUsed);
        const gasCostEthValue = gasPrice * gasUsed;
        change = -(ethValue + gasCostEthValue);
      } else if (
        tx.to.toLowerCase() === "0xbb3afde35eb9f5feb5377485a3bd18a3eb0fe248"
      ) {
        change = ethValue;
      }

      currentBalance += change;
      dailyBalances[date] = currentBalance;

      // Obtenir la moyenne du prix de l'ETH en EUR pour la date donnée
      const avg = await getAvgFromHistory(date);

      // Convertir le solde ETH (en Wei) en EUR
      const valueEUR = (Number(currentBalance) / 1e18) * avg;

      chartData.push({
        date: date,
        value: valueEUR,
      });
    }

    res.json(chartData);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des transactions :",
      error.message
    );
    res.status(500).json({
      error: `Erreur lors de la récupération des transactions: ${error.message}`,
    });
  }
});

module.exports = router;
