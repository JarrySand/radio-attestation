<template>
  <div id="app">
    <h1>Attestation Verifier</h1>

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

    <div v-if="!isRadioStation">
      <!-- Listener UI -->
      <button @click="connectWallet">Connect Wallet</button>
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
                  <strong>Expiration Time:</strong> {{ attestation.expirationTime }}
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
      <div v-if="listenerPosts.length > 0">
        <h2>Listener Posts:</h2>
        <ul class="listener-posts">
          <li v-for="post in currentListenerPosts" :key="post.id" class="listener-post">
            <div class="post-header">
              <strong class="post-station">Station: {{ post.station }}</strong>
              <strong class="post-type">Type: {{ post.postType }}</strong>
            </div>
            <div class="post-content">
              <strong>Content:</strong> {{ post.content }}
            </div>
            <div class="post-footer">
              <strong>Pen Name:</strong> {{ post.penName }}<br>
              <strong>Wallet Address:</strong> {{ post.walletAddress }}
            </div>
            <button @click="deletePost(post.id)">Delete</button>
          </li>
        </ul>
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

      <div v-if="isRadioStation">
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
        <ul class="listener-posts">
          <li v-for="post in radioStationPosts" :key="post.id" class="listener-post">
            <div class="post-header">
              <strong class="post-station">Station: {{ post.station }}</strong>
              <strong class="post-type">Type: {{ post.postType }}</strong>
            </div>
            <div class="post-content">
              <strong>Content:</strong> {{ post.content }}
            </div>
            <div class="post-footer">
              <strong>Pen Name:</strong> {{ post.penName }}<br>
              <strong>Wallet Address:</strong> {{ post.walletAddress }}
            </div>
          </li>
        </ul>
      </div>      
      <!-- Add the Radio Station specific UI here -->
    </div>
  </div>
</template>

<script>
import { getAttestationsByRecipient } from "./utils/easscan";
import Web3 from "web3";
import { Buffer } from "buffer";
import { db } from "./firebase";
import { collection, addDoc, where, query, getDocs, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import WalletConnectProvider from '@walletconnect/web3-provider';

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
  },
  methods: {
    async connectWallet() {
      try {
        if (window.ethereum) {
          await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          this.web3 = new Web3(window.ethereum);
        } else {
          const providerOptions = {
            rpc: {
              // Add your desired network's RPC URL here
              1: "https://mainnet.infura.io/v3/2ff2983fb66349749d43fcb0a3402469",
            },
          };

          const walletConnectProvider = new WalletConnectProvider(providerOptions);
          await walletConnectProvider.enable();
          this.web3 = new Web3(walletConnectProvider);
        }

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

.listener-posts {
  list-style-type: none;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.listener-post {
  background-color: #f2f2f2;
  border: 1px solid #ddd;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 5px;
  width: 80%;
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
  background-color: #f1f1f1;
  border: 1px solid #ccc;
  color: #333;
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
</style>
