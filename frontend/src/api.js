const axios = require("axios");

const ETHERSCAN_API_KEY = "C7JYVESN2C3ZFAFGEP3UDKDH66BVDGFF1K";
const ADDRESS = "0xbb3afde35eb9f5feb5377485a3bd18a3eb0fe248";

async function fetchCryptoData() {
  const response = await axios.get(
    "https://min-api.cryptocompare.com/data/v2/histoday?fsym=ETH&tsym=EUR&limit=1000&toTs=1736942400"
  );
  return response.data;
}

async function getTransactions() {
  try {
    // Récupérer les transactions normales
    const txUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=${ADDRESS}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    const { data: txData } = await axios.get(txUrl);

    // Récupérer les transactions internes
    const internalTxUrl = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlistinternal&address=${ADDRESS}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    const { data: internalTxData } = await axios.get(internalTxUrl);

    // Fusionner les deux listes de transactions
    const transactions = [...txData.result, ...internalTxData.result];

    return transactions;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des transactions :",
      error.message
    );
    throw new Error("Impossible de récupérer les transactions");
  }
}

module.exports = { fetchCryptoData, getTransactions };
