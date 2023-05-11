<template>
  <div id="app">
    <h1>Attestation Verifier</h1>

    <div class="switch-wrapper">
      <div class="switch-container">
        <button
          class="switch-button"
          :class="{ active: !isRadioStation }"
          @click="switchToListener"
        >
          For Listeners
        </button>
        <button
          class="switch-button"
          :class="{ active: isRadioStation }"
          @click="switchToRadioStation"
        >
          For Radio Stations
        </button>
      </div>
    </div>

    <div v-if="!isRadioStation">
      <!-- Listener UI -->
      <button v-if="!recipientAddress" @click="connectWallet">Connect Wallet</button>
      <p v-if="recipientAddress">Recipient Address: {{ recipientAddress }}</p>
      <p v-if="userPenName">Welcome, {{ userPenName }}!</p>

      <div v-if="!userPenName && recipientAddress">
        <h2>Sign Up</h2>
        <form @submit.prevent="signUp">
          <label for="penName">Pen Name:</label>
          <input type="text" id="penName" v-model="signUpForm.penName" required />
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <div v-if="attestations.length > 0">
        <h2>Attestations ({{ attestationCount }}):</h2>
        <table>
          <thead>
            <tr>
              <th>Radio Station</th>
              <th>Data</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="attestation in attestations" :key="attestation.id">
              <tr v-if="getRadioStationName(attestation.attester)">
                <td>{{ getRadioStationName(attestation.attester) }}</td>
                <td>{{ attestation.data }}</td>
                <td>
                  <button @click="toggleDetails(attestation.id)">Details</button>
                </td>
              </tr>
              <tr v-if="showDetails[attestation.id] && getRadioStationName(attestation.attester)">
                <td colspan="3">
                  <strong>ID:</strong> {{ attestation.id }}<br>
                  <strong>Attester:</strong> {{ attestation.attester }}<br>
                  <strong>Recipient:</strong> {{ attestation.recipient }}<br>
                  <strong>RefUID:</strong> {{ attestation.refUID }}<br>
                  <strong>Revocable:</strong> {{ attestation.revocable }}<br>
                  <strong>Revocation Time:</strong> {{ attestation.revocationTime }}<br>
                  <strong>Expiration Time:</strong> {{ attestation.expirationTime }}<br>
                  <strong>EASscan URL:</strong> <a :href="easScanUrl(attestation.id)" target="_blank">{{ easScanUrl(attestation.id) }}</a>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div v-if="recipientAddress">
        <h2>Submit a Listener Post</h2>
        <form @submit.prevent="submitListenerPost" class="form">
          <div class="form-group">
            <label for="station">Choose a radio station:</label>
            <select id="station" v-model="listenerPostForm.station" required>
            <option value="">Select a station</option>
            <option v-for="station in radioStations" :key="station.id" :value="station.name">
              {{ station.name }}
            </option>
          </select>
          </div>
          <div class="form-group">
            <label for="postType">Choose a type of post:</label>
            <select id="postType" v-model="listenerPostForm.postType" required>
              <option value="">Select a post type</option>
              <option v-for="option in computedPostTypeOptions" :key="option.id || option">
                {{ option.name || option }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="postContent">Post content:</label>
            <textarea id="postContent" v-model="listenerPostForm.content" rows="4" cols="50" required></textarea>
          </div>
          <button type="submit" class="submit-button">Submit Post</button>
        </form>
      </div>
      <div v-if="listenerPosts.length > 0 && recipientAddress">
        <h2>Listener Posts:</h2>
        <table class="listener-posts" style="border: 1px solid #000;">
          <thead>
            <tr>
              <th>Station</th>
              <th>Type</th>
              <th>Content</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in currentListenerPosts" :key="post.id">
              <td>{{ post.station }}</td>
              <td>{{ post.postType }}</td>
              <td>{{ post.content }}</td>
              <td>
                <button @click="deletePost(post.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else>
      <!-- Radio Station UI -->
      <button v-if="!radioStation" @click="connectWallet">Connect Wallet</button>
      <p v-if="recipientAddress">Recipient Address: {{ recipientAddress }}</p>
      <p v-if="radioStation && radioStation.name">Welcome, {{ radioStation.name }}!</p>

      <div v-if="!radioStation && recipientAddress">
        <h2>Sign Up</h2>
        <form @submit.prevent="signUpRadioStation">
          <label for="radioStationName">Radio Station Name:</label>
          <input type="text" id="radioStationName" v-model="radioStationSignUpForm.name" required />
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <div v-if="radioStation">
        <h2>Define Post Type Options</h2>
        <form @submit.prevent="definePostTypeOptions">
          <label for="postTypeOption">Post Type Option:</label>
          <input type="text" id="postTypeOption" v-model="postTypeOptionForm.name" required />
          <button type="submit">Add Post Type Option</button>
        </form>
      </div>

      <div v-if="isRadioStation && recipientAddress">
        <h3>Current post type options</h3>
        <table>
          <thead>
            <tr>
              <th>Option Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="option in filteredRadioStationPostTypeOptions" :key="option.id">
              <td>{{ option.name }}</td>
              <td>
                <button @click="deletePostTypeOption(option.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="radioStationPosts.length > 0">
        <h2>Listener Posts for {{ radioStation.name }}:</h2>
        <table class="listener-posts">
          <thead>
            <tr>
              <th>Pen Name</th>
              <th>Type</th>
              <th>Content</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in radioStationPosts" :key="post.id" class="listener-post">
              <td>{{ post.penName }}</td>
              <td>{{ post.postType }}</td>
              <td>{{ post.content }}</td>
              <td>
                <button @click="createAttestation(post)">Attest</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="radioStationAttestations.length > 0">
      <h2>Radio Station Attestations ({{ radioStationAttestations.length }}):</h2>
      <table>
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Data</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="attestation in radioStationAttestations" :key="attestation.id">
            <tr>
              <td>{{ getRecipientName(attestation.recipient) }}</td>
              <td>{{ attestation.data }}</td>
              <td>
                <button @click="toggleDetails(attestation.id)">Details</button>
              </td>
            </tr>
            <tr v-if="showDetails[attestation.id]">
              <td colspan="3">
                <strong>ID:</strong> {{ attestation.id }}<br>
                <strong>Attester:</strong> {{ attestation.attester }}<br>
                <strong>Recipient:</strong> {{ attestation.recipient }}<br>
                <strong>RefUID:</strong> {{ attestation.refUID }}<br>
                <strong>Revocable:</strong> {{ attestation.revocable }}<br>
                <strong>Revocation Time:</strong> {{ attestation.revocationTime }}<br>
                <strong>Expiration Time:</strong> {{ attestation.expirationTime }}<br>
                <strong>EASscan URL:</strong> <a :href="easScanUrl(attestation.id)" target="_blank">{{ easScanUrl(attestation.id) }}</a>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
        <!-- Add the Radio Station specific UI here -->
    </div>
  </div>
</template>

<script>
import Web3Modal from "web3modal";
import { getAttestationsByRecipient, getAttestationsByAttester } from "./utils/easscan";
import Web3 from "web3";
import { Buffer } from "buffer";
import { db } from "./firebase";
import { collection, addDoc, where, query, getDocs, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import WalletConnectProvider from '@walletconnect/web3-provider';
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';

export const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia v0.26

export default {
  name: "App",
  data() {
    return {
      recipientAddress: "",
      attestations: [],
      web3: null,
      showDetails: {},
      user: null,
      signUpForm: {
        penName: "",
      },
      listenerPostForm: {
        station: "",
        postType: "",
        content: "",
      },
      listenerPosts: [],
      isRadioStation: false,
      radioStation: null,
      radioStationSignUpForm: {
        name: "",
      },
      radioStations: [],
      currentListener: null, // Add this line to define the property in your data
      postTypeOptions: [],
      postTypeOptionForm: {
        name: "",
      },
      defaultPostTypeOptions: ["Question", "Opinion", "Others"],
      selectedStationPostTypeOptions: [],
      defaultPostOptions: [
        { id: 1, name: "Opinion" },
        { id: 2, name: "Question" },
        { id: 3, name: "Request" },
      ],
      filteredRadioStationPostTypeOptions: [],
      signer: null,
      radioStationAttestations: [],
      users: [],
    };
  },
  async created() {
    // Listener Posts
    onSnapshot(collection(db, "listenerPosts"), (snapshot) => {
      this.listenerPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        penName: doc.data().penName,
      }));
    });

    // Radio Stations
    const radioStationsSnapshot = await getDocs(collection(db, "radioStations"));
    this.radioStations = radioStationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const usersSnapshot = await getDocs(collection(db, "users"));
    this.users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    await this.fetchPostTypeOptions();
    this.filteredRadioStationPostTypeOptions = this.getFilteredRadioStationPostTypeOptions();
  },
  computed: {
    userPenName() {
      return this.user ? this.user.penName : null;
    },
    attestationCount() {
      return this.attestations.length;
    },
    radioStationPosts() {
      if (!this.radioStation) {
        return [];
      }
      return this.listenerPosts.filter(post => post.station === this.radioStation.name);
    },
    currentListenerPosts() {
      if (!this.currentListener) {
        return [];
      }
      return this.listenerPosts.filter(post => post.walletAddress === this.currentListener.walletAddress);
    },
    computedPostTypeOptions() {
      if (this.selectedStationPostTypeOptions.length) {
        return this.selectedStationPostTypeOptions;
      } else if (this.postTypeOptions.length) {
        return this.postTypeOptions;
      } else {
        return this.defaultPostTypeOptions;
      }
    },
    easScanUrl() {
      return (id) => `https://sepolia.easscan.org/attestation/view/${id}`;
    },
  },
  methods: {
    async fetchRadioStationAttestations(attesterAddress) {
      const attestations = await getAttestationsByAttester(attesterAddress);
      this.radioStationAttestations = attestations.map((attestation) => ({
        ...attestation,
        data: this.decodeAttestationData(attestation.data),
      }));
    },
    async connectWallet() {
      try {
        const providerOptions = {
          walletconnect: {
            package: WalletConnectProvider,
            options: {
              rpc: {
                // Add your desired network's RPC URL here
                1: "https://mainnet.infura.io/v3/2ff2983fb66349749d43fcb0a3402469",
              },
            },
          },
        };

        const web3Modal = new Web3Modal({
          cacheProvider: true,
          providerOptions,
        });

        const provider = await web3Modal.connect();
        this.web3 = new Web3(provider);

        this.signer = new ethers.providers.Web3Provider(provider).getSigner();

        const accounts = await this.web3.eth.getAccounts();
        const rawAddress = accounts[0];
        const checksumAddress = this.toChecksumAddress(rawAddress);
        this.recipientAddress = checksumAddress;
        const attestations = await getAttestationsByRecipient(checksumAddress);

        // Log the fetched attestations to the console
        console.log(attestations);

        this.attestations = attestations.map((attestation) => ({
          ...attestation,
          data: this.decodeAttestationData(attestation.data),
        }));
        await this.login();
        await this.loginRadioStation(); // Add this line
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
      const accounts = await this.web3.eth.getAccounts();
      const rawAddress = accounts[0];
      const checksumAddress = this.toChecksumAddress(rawAddress);
      this.attesterAddress = checksumAddress;

      await this.fetchRadioStationAttestations(checksumAddress);
    },

    async signUp() {
      const penName = this.signUpForm.penName;
      if (penName) {
        const userData = {
          penName,
          walletAddress: this.recipientAddress,
        };
        // Save user data to Firebase Firestore
        await addDoc(collection(db, "users"), userData);
        this.user = userData;
      }
    },

    async login() {
      const q = query(
        collection(db, "users"),
        where("walletAddress", "==", this.recipientAddress)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await this.signUp();
      } else {
        const userData = snapshot.docs[0].data();
        this.user = userData;
        this.currentListener = userData; // Add this line
      }
    },

    async logout() {
      // Clear user data and reset recipientAddress
      this.user = null;
      this.recipientAddress = "";
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
    toggleDetails(id) {
      this.showDetails[id] = !this.showDetails[id];
    },
    async submitListenerPost() {
      const post = {
        station: this.listenerPostForm.station,
        postType: this.listenerPostForm.postType,
        content: this.listenerPostForm.content,
        walletAddress: this.recipientAddress,
        penName: this.userPenName, 
      };

      // Save listener post data to Firebase Firestore
      await addDoc(collection(db, "listenerPosts"), post);

      // Reset the form
      this.listenerPostForm = {
        station: "",
        postType: "",
        content: "",
      };
    },
    async signUpRadioStation() {
      const radioStationName = this.radioStationSignUpForm.name;
      if (radioStationName) {
        const radioStationData = {
          name: radioStationName,
          walletAddress: this.recipientAddress,
        };
        // Save radio station data to Firebase Firestore
        await addDoc(collection(db, "radioStations"), radioStationData);
        this.radioStation = radioStationData;
      }
    },
    async loginRadioStation() {
      const q = query(
        collection(db, "radioStations"),
        where("walletAddress", "==", this.recipientAddress)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        await this.signUpRadioStation();
      } else {
        const radioStationData = snapshot.docs[0].data();
        this.radioStation = radioStationData;
      }
    },
    switchToRadioStation() {
      this.isRadioStation = true;
      this.loginRadioStation(); // Add this line
    },
    switchToListener() {
      this.isRadioStation = false;
      this.radioStation = null;
    },
    getRadioStationName(attesterAddress) {
      const radioStation = this.radioStations.find(
        (station) => station.walletAddress === attesterAddress
      );
      return radioStation ? radioStation.name : null;
    },
    getRecipientName(recipientAddress) {
      const user = this.users.find(
        (user) => user.walletAddress === recipientAddress
      );
      return user ? user.penName : 'Unknown Recipient';
    },
    async definePostTypeOptions() {
      if (!this.radioStation || !this.radioStation.walletAddress) {
        console.error('Radio station walletAddress is not available');
        return;
      }
      const postTypeOptionData = {
        name: this.postTypeOptionForm.name,
        radioStationWalletAddress: this.radioStation.walletAddress,
      };
      // Save post type option data to Firebase Firestore
      const docRef = await addDoc(collection(db, "postTypeOptions"), postTypeOptionData);
      
      // Push the newly created post type option to the postTypeOptions array
      this.postTypeOptions.push({
        id: docRef.id,
        ...postTypeOptionData,
      });

      this.postTypeOptionForm.name = "";
    },
    async fetchPostTypeOptions() {
      const postTypeOptionsSnapshot = await getDocs(collection(db, "postTypeOptions"));
      this.postTypeOptions = postTypeOptionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
    getSelectedStationPostTypeOptions() {
      const selectedStation = this.listenerPostForm.station;
      const radioStation = this.radioStations.find((station) => station.name === selectedStation);
      if (!radioStation) {
        this.selectedStationPostTypeOptions = [];
        return;
      }
      const customPostOptions = this.postTypeOptions.filter((option) => option.radioStationWalletAddress === radioStation.walletAddress);
      this.selectedStationPostTypeOptions = customPostOptions.length > 0 ? customPostOptions : this.defaultPostOptions;
    },
    async deletePost(postId) {
      const postRef = doc(db, "listenerPosts", postId);
      await deleteDoc(postRef);
    },
    getFilteredRadioStationPostTypeOptions() {
      if (!this.radioStation || !this.radioStation.walletAddress) {
        return [];
      }
      return this.postTypeOptions.filter(
        (option) => option.radioStationWalletAddress === this.radioStation.walletAddress
      );
    },
    async deletePostTypeOption(optionId) {
      // Delete the post type option from the Firestore database
      const optionRef = doc(db, "postTypeOptions", optionId);
      await deleteDoc(optionRef);

      // Remove the post type option from the postTypeOptions array
      this.postTypeOptions = this.postTypeOptions.filter(
        (option) => option.id !== optionId
      );
    },
    async createAttestation(post) {

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Get the signer
      const signer = provider.getSigner();
      
      const eas = new EAS(EASContractAddress,);
      eas.connect(signer);

      const schemaEncoder = new SchemaEncoder("string[] RadioStationName,uint64 Date,string TypeofParticipation");
      const encodedData = schemaEncoder.encodeData([
        { name: "RadioStationName", value: [this.radioStation.name], type: "string[]" },
        { name: "Date", value: Math.floor(Date.now() / 1000), type: "uint64" },
        { name: "TypeofParticipation", value: "posting", type: "string" },
      ]);

      // Replace with your own schemaUID and schema string
      const schemaUID = "0x2a98ae55558be4e173402dbb3a2cbd38e1be1b815988cfb6faab22ffe6d45fc7";

      // Step 3: Provide the recipient address, expiration time, and other necessary data
      const tx = await eas.attest({
        schema: schemaUID,
        data: {
          recipient: post.walletAddress,
          expirationTime: 0,
          revocable: true,
          data: encodedData,
        },
      });

      const newAttestationUID = await tx.wait();

      console.log("New attestation UID:", newAttestationUID);
    }
  },
  watch: {
    "listenerPostForm.station": function() {
      this.getSelectedStationPostTypeOptions();
    },
    postTypeOptions: {
      handler() {
        this.filteredRadioStationPostTypeOptions = this.getFilteredRadioStationPostTypeOptions();
      },
      deep: true,
    },
    radioStation: {
      handler() {
        this.filteredRadioStationPostTypeOptions = this.getFilteredRadioStationPostTypeOptions();
      },
      deep: true,
    },
  },
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

body {
  font-family: 'Roboto Mono', Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #c0c0c0;
  color: #000;
}

#app {
  text-align: center;
  padding: 2rem;
}

button {
  background-color: #c0c0c0;
  border: 1px solid #808080;
  color: #000;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
}

button:active {
  border: 1px solid #fff;
}

table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 1rem;
}

table th,
table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  word-wrap: break-word;
  max-width: 300px;
}

table th {
  background-color: #b3b3b3;
  font-weight: bold;
}

table tr:hover {
  background-color: #ddd;
}

.form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 400px;
  margin: 0 auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

textarea {
  resize: vertical;
}

.submit-button {
  align-self: center;
  margin-top: 1rem;
}

.post-header,
.post-content,
.post-footer {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.switch-container {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.switch-button {
  background-color: #c0c0c0;
  border: 1px solid #808080;
  color: #000;
  cursor: pointer;
  font-size: 14px;
  margin: 0 5px;
  padding: 8px 16px;
  text-align: center;
  transition: background-color 0.3s;
}

.switch-button:hover {
  background-color: #ddd;
}

.switch-button.active {
  background-color: #4caf50;
  color: white;
}

.switch-button.active:active {
  border: 1px solid #fff;
}

.switch-wrapper {
  position: absolute;
  top: 1px;
  right: 1px;
  z-index: 10;
}

#app {
  position: relative;
  padding-top: 30px;
}

@media (max-width: 767px) {
  body {
    font-size: 14px;
  }

  .form {
    max-width: 90%;
    margin: 0 auto;
  }
}
</style>




