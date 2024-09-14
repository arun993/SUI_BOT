require('dotenv').config();
const { TransactionBlock } = require('@mysten/sui.js'); // SUI.js library to handle transactions
const axios = require('axios');

const PRIVATE_KEY = process.env.COMPROMISED_PRIVATE_KEY;
const NEW_WALLET_ADDRESS = process.env.NEW_WALLET_ADDRESS;
const SUI_RPC = process.env.SUI_RPC;

const DEEP_TOKEN_CONTRACT = process.env.DEEP_TOKEN_CONTRACT;
const SPAM_TOKEN_CONTRACT = process.env.SPAM_TOKEN_CONTRACT;

// Function to get the wallet's token balances (DEEP and SPAM)
async function getTokenBalances(address) {
  try {
    const response = await axios.post(SUI_RPC, {
      jsonrpc: "2.0",
      method: "sui_getBalance",
      params: [address],
      id: 1
    });

    const tokens = response.data.result;
    const deepBalance = tokens.find(token => token.coinType === DEEP_TOKEN_CONTRACT);
    const spamBalance = tokens.find(token => token.coinType === SPAM_TOKEN_CONTRACT);

    return {
      deep: deepBalance ? deepBalance.totalBalance : 0,
      spam: spamBalance ? spamBalance.totalBalance : 0
    };
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return { deep: 0, spam: 0 };
  }
}

// Function to transfer specific tokens (DEEP or SPAM) from the compromised wallet to the new wallet
async function transferTokens(tokenType, tokenAmount) {
  try {
    const transaction = new TransactionBlock();
    // Build the transfer transaction
    transaction.transfer({
      to: NEW_WALLET_ADDRESS,
      amount: tokenAmount,
      coinType: tokenType,
    });

    // Sign the transaction with the compromised wallet's private key
    const signedTransaction = await transaction.sign(PRIVATE_KEY);

    // Send the transaction
    const response = await signedTransaction.send();
    console.log(`Transfer of ${tokenAmount} ${tokenType} successful. Transaction ID:`, response.txHash);
  } catch (error) {
    console.error(`Error transferring ${tokenType}:`, error);
  }
}

// Function to monitor the wallet
async function monitorWallet(address) {
  console.log("Monitoring wallet:", address);
  setInterval(async () => {
    const balances = await getTokenBalances(address);

    if (balances.deep > 0) {
      console.log(`Detected ${balances.deep} DEEP tokens. Initiating transfer...`);
      await transferTokens(DEEP_TOKEN_CONTRACT, balances.deep);
    } else {
      console.log("No DEEP tokens detected.");
    }

    if (balances.spam > 0) {
      console.log(`Detected ${balances.spam} SPAM tokens. Initiating transfer...`);
      await transferTokens(SPAM_TOKEN_CONTRACT, balances.spam);
    } else {
      console.log("No SPAM tokens detected.");
    }
  }, 5000); // Check every 5 seconds
}

// Start monitoring the compromised wallet
const compromisedWalletAddress = "YOUR_COMPROMISED_WALLET_ADDRESS"; // Replace with actual wallet address
monitorWallet(compromisedWalletAddress);

