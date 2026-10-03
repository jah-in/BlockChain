import {
  BrowserProvider,
  JsonRpcProvider,
  Contract,
} from "ethers";

export const RELIEFTRACK_CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const ANVIL_RPC_URL =
  "http://127.0.0.1:8545";

export const reliefTrackABI = [
  "function owner() view returns (address)",
  "function isAdmin(address account) view returns (bool)",
  "function getDistribution(string distributionId) view returns (string,string,string,uint256,string,string,uint256,address)",
  "function recordDistribution(string distributionId,string warehouseId,string item,uint256 quantity,string unit,string destination)",
];

// Read-only provider connected directly to Anvil
export const provider =
  new JsonRpcProvider(ANVIL_RPC_URL);

export const reliefTrackContract =
  new Contract(
    RELIEFTRACK_CONTRACT_ADDRESS,
    reliefTrackABI,
    provider
  );

// Connect MetaMask
export async function connectWallet() {
  if (
    typeof window === "undefined" ||
    !window.ethereum
  ) {
    throw new Error("MetaMask is not installed.");
  }

  // Switch MetaMask to Anvil Local
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: "0x7a69",
        },
      ],
    });
  } catch (switchError) {
    // Anvil is not registered in MetaMask yet
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x7a69",
            chainName: "Anvil Local",
            nativeCurrency: {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [
              "http://127.0.0.1:8545",
            ],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }

  // IMPORTANT:
  // Create the BrowserProvider AFTER switching networks.
  const browserProvider =
    new BrowserProvider(window.ethereum);

  const network =
    await browserProvider.getNetwork();

  const chainId =
    Number(network.chainId);

  console.log(
    "MetaMask Chain ID:",
    chainId
  );

  if (chainId !== 31337) {
    throw new Error(
      `Wrong MetaMask network. Please switch to Anvil Local (Chain ID 31337). Current Chain ID: ${chainId}`
    );
  }

  await browserProvider.send(
    "eth_requestAccounts",
    []
  );

  const signer =
    await browserProvider.getSigner();

  const address =
    await signer.getAddress();

  console.log(
    "MetaMask Wallet:",
    address
  );

  return {
    provider: browserProvider,
    signer,
    address,
  };
}

// Record a distribution through MetaMask
export async function recordDistributionOnBlockchain(
  distribution
) {
  const {
    signer,
    address,
  } = await connectWallet();

  const network =
    await signer.provider.getNetwork();

  const chainId =
    Number(network.chainId);

  console.log(
    "========== RELIEFTRACK DEBUG =========="
  );

  console.log(
    "MetaMask Chain ID:",
    chainId
  );

  console.log(
    "MetaMask Wallet:",
    address
  );

  console.log(
    "ReliefTrack Contract:",
    RELIEFTRACK_CONTRACT_ADDRESS
  );

  // Check whether the contract exists
  // on the network MetaMask is connected to.
  const contractCode =
    await signer.provider.getCode(
      RELIEFTRACK_CONTRACT_ADDRESS
    );

  console.log(
    "Contract Code:",
    contractCode
  );

  if (
    contractCode === "0x"
  ) {
    throw new Error(
      "ReliefTrack contract was NOT found on the MetaMask network. Make sure MetaMask is connected to Anvil Local (Chain ID 31337)."
    );
  }

  const contract =
    new Contract(
      RELIEFTRACK_CONTRACT_ADDRESS,
      reliefTrackABI,
      signer
    );

  // Check whether the connected wallet is an authorized admin.
  const isAdmin =
    await contract.isAdmin(address);

  console.log(
    "Is Admin:",
    isAdmin
  );

  if (!isAdmin) {
    throw new Error(
      "This MetaMask wallet is not an authorized ReliefTrack administrator."
    );
  }

  const quantity =
    Number(distribution.quantity);

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "Distribution quantity must be greater than zero."
    );
  }

  if (!Number.isInteger(quantity)) {
    throw new Error(
      "Blockchain recording currently requires a whole-number quantity."
    );
  }

  const transaction =
    await contract.recordDistribution(
      String(distribution.reference),
      String(distribution.warehouseId),
      String(distribution.item),
      quantity,
      String(distribution.unit),
      String(distribution.destination)
    );

  console.log(
    "Transaction submitted:",
    transaction.hash
  );

  const receipt =
    await transaction.wait();

  console.log(
    "Transaction confirmed:",
    receipt.hash
  );

  return {
    transactionHash:
      receipt.hash,
    walletAddress:
      address,
    blockNumber:
      receipt.blockNumber,
  };
}