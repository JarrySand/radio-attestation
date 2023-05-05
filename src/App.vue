<template>
  <div id="app">
    <h1>Attestation Verifier</h1>
    <button @click="connectWallet">Connect Wallet</button>
    <p v-if="recipientAddress">Recipient Address: {{ recipientAddress }}</p>
    <div v-if="attestations.length > 0">
      <h2>Attestations:</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Attester</th>
            <th>Recipient</th>
            <th>RefUID</th>
            <th>Revocable</th>
            <th>Revocation Time</th>
            <th>Expiration Time</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="attestation in attestations" :key="attestation.id">
            <td>{{ attestation.id }}</td>
            <td>{{ attestation.attester }}</td>
            <td>{{ attestation.recipient }}</td>
            <td>{{ attestation.refUID }}</td>
            <td>{{ attestation.revocable }}</td>
            <td>{{ attestation.revocationTime }}</td>
            <td>{{ attestation.expirationTime }}</td>
            <td>{{ attestation.data }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { getAttestationsByRecipient } from "./utils/easscan";
import Web3 from "web3";
import { Buffer } from "buffer";

export default {
  name: "App",
  data() {
    return {
      recipientAddress: "",
      attestations: [],
      web3: null,
    };
  },
  methods: {
    async connectWallet() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          this.web3 = new Web3(window.ethereum); // Initialize the web3 instance
          const rawAddress = accounts[0];
          const checksumAddress = this.toChecksumAddress(rawAddress);
          this.recipientAddress = checksumAddress;
          const attestations = await getAttestationsByRecipient(checksumAddress);
          this.attestations = attestations.map((attestation) => ({
            ...attestation,
            data: this.decodeAttestationData(attestation.data),
          }));
        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        console.error(
          "Ethereum provider not found. Please install MetaMask."
        );
      }
    },
    decodeAttestationData(hexData) {
      const dataBuffer = Buffer.from(hexData.slice(2), "hex");

      if (hexData.length === 66) {
        return { value: parseInt(hexData, 16) };
      }

      const stationLength = dataBuffer.readUInt32BE(32);
      const station = dataBuffer
        .slice(64, 64 + stationLength)
        .toString("utf8");
      const posting = dataBuffer.readUInt32BE(96 + stationLength) === 1 ? "yes" : "no";

      return {
        station,
        posting,
      };
    },
    toChecksumAddress(address) {
      return this.web3.utils.toChecksumAddress(address);
    },
  },
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}

#app {
  text-align: center;
  padding: 2rem;
}

button {
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 1rem;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
}

tr:nth-child(even) {
  background-color: #f2f2f2;
}
</style>
