require('dotenv').config();
const { TransactionBlock } = require('@mysten/sui.js'); // SUI.js library to handle transactions
const axios = require('axios');

const PRIVATE_KEY = process.env.COMPROMISED_PRIVATE_KEY;
const NEW_WALLET_ADDRESS = process.env.NEW_WALLET_ADDRESS;
const COMPROMISED_WALLET_ADDRESS = process.env.COMPROMISED_WALLET_ADDRESS; // Fetch from .env file
const SUI_RPC = process.env.SUI_RPC;

const DEEP_TOKEN_CONTRACT = process.env.DEEP_TOKEN_CONTRACT;
const SPAM_TOKEN_CONTRACT = process.env.SPAM_TOKEN_CONTRACT;

const MINIMUM_GAS_FEES = 0.01; // Set a minimum threshold for gas fees in SUI

// Function to get the $SUI balance (used for gas fees)
async function getGasBalance(address) {
  try {
    const response = await axios.post(SUI_RPC, {
      jsonrpc: "2.0",
      method: "sui_getBalance",
      params: [address],
      id: 1
    });

    const suiBalance = response.data.result.coins.find(coin => coin.coinType === '0x2::sui::SUI');
    return suiBalance ? suiBalance.totalBalance : 0;
  } catch (error) {
    console.error("Error fetching gas (SUI) balance:", error);
    return 0;
  }
}

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
    try {
      // Check for sufficient gas balance in SUI
      const gasBalance = await getGasBalance(address);
      if (gasBalance < MINIMUM_GAS_FEES) {
        console.log(`Insufficient gas ($SUI): ${gasBalance}. Waiting for gas to accumulate...`);
        return; // Stop execution if not enough gas
      }
      
      console.log(`Sufficient gas ($SUI): ${gasBalance}. Checking token balances...`);

      // Check for DEEP and SPAM token balances
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
    } catch (error) {
      console.error("Error during monitoring process:", error);
    }
  }, 5000); // Check every 5 seconds
}

// Start monitoring the compromised wallet using the address from .env file
monitorWallet(COMPROMISED_WALLET_ADDRESS);
