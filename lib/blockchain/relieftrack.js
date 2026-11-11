
"use client";

import { BrowserProvider, Contract } from "ethers";
import abi from "./ReliefTrackABI.json";

export const RELIEFTRACK_CONTRACT_ADDRESS =
  "0xc998f9E4141B7E8E9A955b4D3AB548404449ad7a";

export const SEPOLIA_CHAIN_ID = 11155111n;

let provider = null;
let signer = null;

/**
 * Connect MetaMask and make sure the wallet is using Ethereum Sepolia.
 */
export async function connectWallet() {
  if (typeof window === "undefined") {
    throw new Error("Wallet connection is only available in the browser.");
  }

  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install MetaMask and try again."
    );
  }

  // Create MetaMask provider
  provider = new BrowserProvider(window.ethereum);

  // Request wallet connection
  await provider.send("eth_requestAccounts", []);

  // Check current network
  let network = await provider.getNetwork();

  console.log(
    "MetaMask current chain ID:",
    network.chainId.toString()
  );

  // Sepolia = 11155111 = 0xaa36a7
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    try {
      console.log("Switching MetaMask to Ethereum Sepolia...");

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: "0xaa36a7",
          },
        ],
      });

      // Re-create provider after switching networks
      provider = new BrowserProvider(window.ethereum);

      network = await provider.getNetwork();

      console.log(
        "MetaMask chain ID after switch:",
        network.chainId.toString()
      );
    } catch (switchError) {
      console.error("Failed to switch MetaMask network:", switchError);

      throw new Error(
        "Please switch MetaMask to the Ethereum Sepolia network."
      );
    }
  }

  // Final safety check
  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    throw new Error(
      `Wrong network. MetaMask is on chain ${network.chainId.toString()}, but Sepolia is required.`
    );
  }

  // Get signer
  signer = await provider.getSigner();

  // Get wallet address
  const address = await signer.getAddress();

  console.log("Connected MetaMask address:", address);

  return address;
}

/**
 * Get the MetaMask provider.
 */
export function getProvider() {
  if (!provider) {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not available.");
    }

    provider = new BrowserProvider(window.ethereum);
  }

  return provider;
}

/**
 * Get the connected signer.
 */
export async function getSigner() {
  if (!signer) {
    await connectWallet();
  }

  return signer;
}

/**
 * Get the ReliefTrack contract using the connected wallet.
 */
export async function getReliefTrackContract() {
  const currentSigner = await getSigner();

  return new Contract(
    RELIEFTRACK_CONTRACT_ADDRESS,
    abi,
    currentSigner
  );
}

/**
 * Compatibility export for existing pages.
 *
 * This allows existing pages to continue using:
 *
 * reliefTrackContract.recordDistribution(...)
 * reliefTrackContract.getDistribution(...)
 * reliefTrackContract.owner()
 */
export const reliefTrackContract = {
  /**
   * Record a distribution on the blockchain.
   */
  async recordDistribution(
    distributionId,
    warehouseId,
    item,
    quantity,
    unit,
    destination
  ) {
    const contract = await getReliefTrackContract();

    const tx = await contract.recordDistribution(
      distributionId,
      warehouseId,
      item,
      BigInt(quantity),
      unit,
      destination
    );

    console.log("Blockchain transaction submitted:", tx.hash);

    return await tx.wait();
  },

  /**
   * Read a distribution from the blockchain.
   */
  async getDistribution(distributionId) {
    const currentProvider = getProvider();

    const contract = new Contract(
      RELIEFTRACK_CONTRACT_ADDRESS,
      abi,
      currentProvider
    );

    return await contract.getDistribution(distributionId);
  },

  /**
   * Get the smart contract owner.
   */
  async owner() {
    const currentProvider = getProvider();

    const contract = new Contract(
      RELIEFTRACK_CONTRACT_ADDRESS,
      abi,
      currentProvider
    );

    return await contract.owner();
  },
};

/**
 * Record a distribution on the blockchain.
 */
export async function recordDistributionOnBlockchain(
  distribution
) {
  if (!distribution) {
    throw new Error(
      "Distribution data is required."
    );
  }

  const {
    id,
    reference,
    warehouseId,
    item,
    quantity,
    unit,
    destination,
  } = distribution;

  const distributionId =
    reference || id;

  if (!distributionId) {
    throw new Error(
      "Distribution ID/reference is missing."
    );
  }

  if (!warehouseId) {
    throw new Error(
      "Warehouse ID is missing."
    );
  }

  if (!item) {
    throw new Error(
      "Relief item is missing."
    );
  }

  if (
    quantity === undefined ||
    quantity === null ||
    Number(quantity) <= 0
  ) {
    throw new Error(
      "Distribution quantity must be greater than zero."
    );
  }

  if (!unit) {
    throw new Error(
      "Distribution unit is missing."
    );
  }

  if (!destination) {
    throw new Error(
      "Distribution destination is missing."
    );
  }

  const currentSigner =
    await getSigner();

  const walletAddress =
    await currentSigner.getAddress();

  const contract =
    new Contract(
      RELIEFTRACK_CONTRACT_ADDRESS,
      abi,
      currentSigner
    );

  // Check that the connected wallet is the
  // owner of the ReliefTrack smart contract.
  const owner =
    await contract.owner();

  if (
    owner.toLowerCase() !==
    walletAddress.toLowerCase()
  ) {
    throw new Error(
      `Connected wallet is not the contract owner. Contract owner: ${owner}. Connected wallet: ${walletAddress}.`
    );
  }

  console.log(
    "Recording distribution on Sepolia:",
    {
      distributionId,
      warehouseId,
      item,
      quantity,
      unit,
      destination,
      walletAddress,
      contractAddress:
        RELIEFTRACK_CONTRACT_ADDRESS,
    }
  );

  const tx =
    await contract.recordDistribution(
      String(distributionId),
      String(warehouseId),
      String(item),
      BigInt(quantity),
      String(unit),
      String(destination)
    );

  console.log(
    "Blockchain transaction submitted:",
    tx.hash
  );

  const receipt =
    await tx.wait();

  console.log(
    "Blockchain transaction confirmed:",
    receipt
  );

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    walletAddress,
    contractAddress:
      RELIEFTRACK_CONTRACT_ADDRESS,
    chainId: Number(
      SEPOLIA_CHAIN_ID
    ),
    receipt,
  };
}

/**
 * Get a distribution from the blockchain.
 */
export async function getDistribution(distributionId) {
  const currentProvider = getProvider();

  const contract = new Contract(
    RELIEFTRACK_CONTRACT_ADDRESS,
    abi,
    currentProvider
  );

  const result = await contract.getDistribution(distributionId);

  return {
    distributionId: result[0],
    warehouseId: result[1],
    item: result[2],
    quantity: result[3].toString(),
    unit: result[4],
    destination: result[5],
    timestamp: result[6].toString(),
    recordedBy: result[7],
  };
}

