import { Web3Provider } from '@ethersproject/providers';

export async function setupMetamask() {
  if (typeof window.ethereum !== "undefined") {
    window.ethereum.autoRefreshOnNetworkChange = false;
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.error("User denied account access");
    }
  } else {
    console.error("Non-Ethereum browser detected. Please install MetaMask.");
  }
}

export function getMetamaskProvider() {
    if (typeof window.ethereum !== "undefined") {
      return new Web3Provider(window.ethereum);
    } else {
      return null;
    }
}
