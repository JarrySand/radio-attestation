<template>
  <div id="app">
    <h1>on AIR/CHAIN</h1>
    <nav>
      <ul>
        <div>
          <li>
            <div class="nav-flex-container">
              <div v-if="recipientAddress">Your Address:</div>
              <div v-if="recipientAddress" :title="recipientAddress">{{ recipientAddress }}</div>
              <div v-if="!isRadioStation && userPenName">Pen name:</div>
              <div v-if="!isRadioStation && userPenName">{{ userPenName }}</div>
              <div v-if="isRadioStation && radioStation && radioStation.name">Station name:</div>
              <div v-if="isRadioStation && radioStation && radioStation.name">{{ radioStation.name }}</div>
            </div>
          </li>
          <li v-if="!isRadioStation && attestations.length > 0"><a href="#attestations">Attestations ({{ attestationCount }})</a></li>
          <li v-if="!isRadioStation && recipientAddress"><a href="#makeAPost">Make a post</a></li>
          <li v-if="!isRadioStation && listenerPosts.length > 0 && recipientAddress"><a href="#yourPosts">Your Posts</a></li>
          <li v-if="isRadioStation && recipientAddress && radioStationPosts.length > 0"><a href="#listenerPosts">Listner posts</a></li>
          <li v-if="isRadioStation && recipientAddress && radioStationAttestations.length > 0"><a href="#issuedAttestations">Issued attestations</a></li>
          <li v-if="isRadioStation && recipientAddress"><a href="#settings">Settings</a></li>
          <li v-if="recipientAddress"><a href="#feedback">Feedback</a></li>
        </div>
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
      </ul>
    </nav>

    <div v-if="!isRadioStation">
      <!-- Listener UI -->
      <button v-if="!recipientAddress" @click="connectWallet">Connect Wallet</button>
      <p v-if="recipientAddress">Your Address: {{ recipientAddress }}</p>
      <p v-if="userPenName">Welcome, {{ userPenName }}!</p>

      <div v-if="!userPenName && recipientAddress">
        <h2>Sign Up</h2>
        <form @submit.prevent="signUp">
          <label for="penName">Pen Name:</label>
          <input type="text" id="penName" v-model="signUpForm.penName" required />
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <!-- <button v-if="recipientAddress" v-on:click="toggleRadioStations">
      {{ isButtonClicked ? 'Exit' : 'Explore Radio Stations' }}
      </button>
      <div v-if="isButtonClicked">
          <div class="card-container">
              <div v-for="(station, index) in radioStations" :key="index" class="card">
                  <a :href="`/${station.walletAddress}`" target="_blank">
                      <h3>{{ station.name }}</h3>
                      <p>{{ station.description }}</p>
                  </a>
              </div>
          </div>
      </div>-->


      <div v-if="attestations.length > 0">
        <h2 id="attestations">Attestations ({{ attestationCount }}):</h2>
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
          <h2 id="makeAPost">Make a post</h2>
          <form @submit.prevent="submitListenerPost" class="form">
              <div class="form-row">
                  <div class="form-group half-width">
                      <label for="station">Choose a radio station:</label>
                      <div class="select-container">
                          <select id="station" v-model="listenerPostForm.station" required>
                              <option value="">Select a station</option>
                              <option v-for="station in radioStations" :key="station.id" :value="station.name">
                              {{ station.name }}
                              </option>
                          </select>
                      </div>
                  </div>
                  <div class="form-group half-width">
                      <label for="postType">Choose a type of post:</label>
                      <div class="select-container">
                          <select id="postType" v-model="listenerPostForm.postType" required>
                              <option value="">Select a post type</option>
                              <option v-for="option in computedPostTypeOptions" :key="option.id || option">
                              {{ option.name || option }}
                              </option>
                          </select>
                      </div>
                  </div>
              </div>
              <div class="form-group">
                  <label for="postContent">Post content:</label>
                  <textarea id="postContent" v-model="listenerPostForm.content" rows="10" cols="190" class="textarea" required></textarea>
              </div>
              <button type="submit" class="submit-button">Submit Post</button>
          </form>
      </div>
      <div v-if="listenerPosts.length > 0 && recipientAddress">
        <h2 id="yourPosts">Your Posts:</h2>
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
      <div class="feedback-section">
        <h2 id="feedback">We'd love to hear your feedback</h2>
        <p>Your input helps us improve. Please take a moment to share your thoughts on our platform.</p>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSf1OZuDeuVU9Q6wnRQVEZ46jOlWEgXbnoQ2QYPsay5BxiuSmQ/viewform" target="_blank" class="feedback-button">Leave Feedback</a>
      </div>
    </div>
    <div v-else>
      <!-- Radio Station UI -->
      <button v-if="!radioStation" @click="connectWallet">Connect Wallet</button>
      <p v-if="recipientAddress">Your Address: {{ recipientAddress }}</p>
      <p v-if="radioStation && radioStation.name">Welcome, {{ radioStation.name }}!</p>

      <div v-if="!radioStation && recipientAddress">
        <h2>Sign Up</h2>
        <form @submit.prevent="signUpRadioStation">
          <label for="radioStationName">Radio Station Name:</label>
          <input type="text" id="radioStationName" v-model="radioStationSignUpForm.name" required />
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <div v-if="isRadioStation && recipientAddress">
        <div v-if="radioStationPosts.length > 0">
            <h2 id="listenerPosts">Listener Posts for {{ radioStation.name }}:</h2>
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
                      <select v-model="post.participationType" required>
                          <option value="Post">Post</option>
                          <option value="Selected post">Selected post</option>
                          <option value="The best post">The best post</option>
                      </select>
                      <button @click="createAttestation(post)">Attest</button>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>

        <div v-if="radioStationAttestations.length > 0">
          <h2 id="issuedAttestations">Issued Attestations ({{ radioStationAttestations.length }}):</h2>
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
        <h2 id="settings">Settings</h2>
        <button @click="showEditPage = !showEditPage">
            {{ showEditPage ? 'Back to Dashboard' : 'Edit My Page' }}
        </button>

        <div v-if="showEditPage">
          <h2>Edit Radio Station Page</h2>
          <form @submit.prevent="updateRadioStation">
              <label for="description">Description:</label>
              <textarea id="description" v-model="radioStationForm.description" required class="large-textarea"></textarea>
              
              <label for="podcastLink">Podcast Link:</label>
              <input type="url" id="podcastLink" v-model="radioStationForm.podcastLink" required />
              
              <button type="submit">Save Changes</button>
          </form>
        </div>

        <button @click="viewMyPage" class="view-my-page-button">View My Page</button>
        
        <button @click="showPostTypeOptionSetting = !showPostTypeOptionSetting">
          {{ showPostTypeOptionSetting ? 'Hide Post Type Option Setting' : 'Post Type Option Setting' }}
        </button>

        <div v-if="showPostTypeOptionSetting">
          <h2>Define Post Type Options</h2>
          <form @submit.prevent="definePostTypeOptions">
              <label for="postTypeOption">Post Type Option:</label>
              <input type="text" id="postTypeOption" v-model="postTypeOptionForm.name" required />
              <button type="submit">Add Post Type Option</button>
          </form>
  
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
        </div>
      </div> 
      <div class="feedback-section">
        <h2 id="feedback">We'd love to hear your feedback</h2>
        <p>Your input helps us improve. Please take a moment to share your thoughts on our platform.</p>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSf1OZuDeuVU9Q6wnRQVEZ46jOlWEgXbnoQ2QYPsay5BxiuSmQ/viewform" target="_blank" class="feedback-button">Leave Feedback</a>
      </div>
    </div> 
  </div>
</template>
  
<script>
import Web3Modal from "web3modal";
import { getAttestationsByRecipient, getAttestationsByAttester } from "../utils/easscan";
import Web3 from "web3";
import { Buffer } from "buffer";
import { db } from "../firebase";
import { collection, addDoc, where, query, getDocs, updateDoc, onSnapshot, doc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
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
      currentListener: null, 
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
      showEditPage: false,
      radioStationForm: {
        description: '',
        podcastLink: '',
      },
      showRadioStationPage: false,
      isButtonClicked: false,
      showPostTypeOptionSetting: false,
    };
  },
  async created() {
    // Listener Posts
    const q = query(
      collection(db, "listenerPosts"),
      orderBy("timestamp", "desc")
    );
    
    onSnapshot(q, (snapshot) => {
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
        timestamp: serverTimestamp(), 
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
        { name: "TypeofParticipation", value: post.participationType, type: "string" },
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
    },
    async updateRadioStation() {
        if (!this.radioStation || !this.radioStation.walletAddress) {
            console.error('Radio station walletAddress is not available');
            return;
        }
        const radioStationData = {
            description: this.radioStationForm.description,
            podcastLink: this.radioStationForm.podcastLink,
        };

        // Get a reference to the Firestore collection
        const radioStationsCollection = collection(db, 'radioStations');

        // Query for the radio station document with the matching walletAddress
        const q = query(radioStationsCollection, where("walletAddress", "==", this.radioStation.walletAddress));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.error('No matching documents.');
            return;
        }  

        // Update the "description" and "podcastLink" fields of the radio station
        querySnapshot.forEach((doc) => {
            updateDoc(doc.ref, radioStationData);
        });

        // Update local radio station data
        this.radioStation = {
            ...this.radioStation,
            ...radioStationData
        };
    },
    //async fetchRadioStations() {
  
      //this.radioStations = [];

      //const db = getFirestore();
      //const querySnapshot = await getDocs(collection(db, 'radioStations'));

      // Create a temporary array to hold stations
      //let stations = [];

      //querySnapshot.forEach((doc) => {
          //const stationData = doc.data();
          //if (stationData.description && stationData.podcastLink) {
          // Push stations into the temporary array
          //stations.push(stationData);
          //}
      //});

      // Assign the temporary array to this.radioStations
      //this.radioStations = stations;
    //},
    //toggleRadioStations() {
      //this.isButtonClicked = !this.isButtonClicked;
      //this.fetchRadioStations();
    //},
    viewMyPage() {
      const url = window.location.origin + `/${this.radioStation.walletAddress}`;
      window.open(url, '_blank');
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
    //radioStation: {
      //handler(newVal) {
          //this.filteredRadioStationPostTypeOptions = this.getFilteredRadioStationPostTypeOptions();
          //if (newVal) {
             //this.radioStationForm.description = newVal.description;
             //this.radioStationForm.podcastLink = newVal.podcastLink;
          //}
      //},
      //deep: true,
      //immediate: true,
    //},
  },
};
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

  :root {
    --main-bg-color: #F5F5F5; /* Light Grey for main background */
    --secondary-bg-color: #CCCCCC; /* Medium Grey for secondary backgrounds */
    --primary-color: #1A1A1A; /* Very Dark Grey for primary text */
    --secondary-color: #666666; /* Medium Dark Grey for secondary text elements */
    --tertiary-color: #999999; /* Medium Grey for tertiary elements */
    --highlight-color: #333333; /* Dark Grey for highlights */
    --gradient-color: linear-gradient(315deg, #F5F5F5 0%, #CCCCCC 74%); /* Gradient from Light Grey to Medium Grey */
    --primary-font: 'DotGothic16', sans-serif; /* Dot Gothic 16 for main font */
    --secondary-font: 'Roboto Mono', monospace; /* Roboto Mono as fallback font */
  }

  body {
    font-family: var(--primary-font);
    margin: 0;
    padding: 0;
    background-color: var(--main-bg-color);
    color: var(--primary-color);
    font-size: 14px;
    padding-left: 240px; /* equal to the width of your navigation bar */
    box-sizing: border-box; /* added to include padding in total width */
  }

  html{
    margin: 0;
    padding: 0;
  }

  #app {
    text-align: center;
    padding: 2rem;
    position: relative;
    padding-top: 0px;
  }

  button, .feedback-button {
    font-family: var(--primary-font), cursive;
    background-color: var(--secondary-bg-color);
    border: 1px solid var(--secondary-color);
    color: var(--primary-color);
    padding: 8px 16px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 14px;
    margin: 4px 2px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .switch-button{
    font-family: var(--primary-font), cursive;
    background-color: var(--secondary-bg-color);
    border: 1px solid var(--secondary-color);
    color: var(--primary-color);
    padding: 8px 16px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    width: 150px; /* adjust as needed */
    height: 30px; /* adjust as needed */
    margin: 10px 10px; /* 10px horizontal margin, adjust as needed */
  }

  .feedback-button {
      background-color: var(--secondary-color);
      color: var(--main-bg-color);
      padding: 12px 24px;
      margin-top: 1rem;
      border-radius: 4px;
  }

  button:active {
    border: 1px solid var(--highlight-color);
  }

  .submit-button {
    align-self: center;
    margin-top: 1rem;
  }

  .switch-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
    flex-direction: column; /* add this line */
  }

  .switch-button:hover {
    background-color: var(--primary-color);
  }

  .switch-button.active {
    background-color: var(--highlight-color);
    color: white;
  }

  .switch-button.active:active {
    border: 1px solid var(--highlight-color);
  }

  .switch-wrapper {
    position: relative; /* Changed from absolute */
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;  /* Add full width to make sure it's contained in nav */
    margin-bottom: 20px; /* Add a margin to the bottom */
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--primary-font), cursive;
    color: var(--highlight-color);
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
    background-color: var(--primary-color);
    font-weight: bold;
    color: var(--main-bg-color);
  }

  table tr:hover {
    background-color: var(--secondary-bg-color);
  }

  .form {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 800px; /* Adjust this value to your liking */
    margin: 0 auto; /* This will center the form horizontally */
    font-family: var(--primary-font);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .form-group label {
    color: var(--primary-color);
    margin-bottom: 0.5rem;
    text-align: left;
  }

  .form-group select,
  .form-group textarea {
    font-family: var(--primary-font);
    color: var(--primary-color);
    background-color: var(--secondary-bg-color);
    border: 1px solid var(--secondary-color);
    border-radius: 4px;
    padding: 8px;
    width: 100%;
  }

  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--highlight-color);
  }

  .form-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .half-width {
    width: 48%; 
  }

  .post-header,
  .post-content,
  .post-footer {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .card-container {
    display: flex;
    flex-wrap: wrap; /* allow cards to wrap to the next line */
    justify-content: space-around; /* center cards with space around them */
    overflow-x: auto;
  }

  .card {
    flex: 0 0 auto;
    width: 90%; /* on small screens, make cards 90% of the container's width */
    margin: 16px auto; /* center cards with auto margins */
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 16px;
    box-sizing: border-box;
    background-color: var(--main-bg-color);
  }

  .card h3 {
    margin-top: 0;
    color: var(--highlight-color);
  }

  .card p {
    margin-bottom: 0;
    color: var(--secondary-color);
  }

  .large-textarea {
    width: 100%; /* Set width to 100% to fill the width of its container */
    height: 200px; /* Set a fixed height, or use min-height to allow it to grow */
  }

  .feedback-section {
    text-align: center;
    padding: 2rem;
    background-color: var(--secondary-bg-color);
    margin-top: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .feedback-button:hover {
    background-color: var(--primary-color);
  }

  .feedback-section h2, .feedback-section p {
    color: var(--primary-color);
    margin: 0.5rem 0;
  }

  nav {
    position: fixed;
    left: 0;
    top: 0; /* make the nav bar start at the top of the page */
    bottom: 0; /* make the nav bar end at the bottom of the page */
    width: 240px; /* adjust as needed */
    z-index: 9999;
    background-color: var(--primary-color);
  }

  nav ul {
      list-style-type: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: space-between;
  }

  nav ul li {
    color: var(--main-bg-color);
    text-decoration: none;
    font-family: var(--primary-font);
    padding: 0;  /* set padding to 0 */
    display: block;
    word-wrap: break-word;
    white-space: pre-wrap;
    text-align: center;  /* Center the text */
    overflow-wrap: break-word; /* Add for better word breaking */
  }

  nav ul li a {
    color: var(--main-bg-color);
    text-decoration: none;
    font-family: var(--primary-font);
    padding: 30px 5px;
    display: block;
    word-wrap: break-word;
    white-space: nowrap;
    text-align: left;
    max-width: 200px;
  }

  nav ul li a:hover {
    background-color: var(--main-bg-color);
    color: var(--highlight-color);
  }

  .nav-flex-container {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    margin-bottom: 40px;
  }

  nav ul li div {
      color: var(--main-bg-color);
      text-decoration: none;
      font-family: var(--primary-font);
      padding: 5px 3px;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;  /* adjust this value as needed */
      text-align: left;
  }

  @media (max-width: 767px) {
    body {
      font-size: 14px;
      padding: 1rem;
    }

    .form {
      max-width: 90%;
      margin: 0 auto;
    }
    
    button {
      padding: 12px 24px; /* Increase button size */
    }

    h1, h2, h3, h4, h5, h6 {
      font-size: 2rem; /* Adjust heading sizes */
    }
    
    .card-container {
      flex-direction: column; /* Stack cards vertically */
    }

    .card {
      width: 100%; /* Make cards full width */
      margin-bottom: 16px; /* Add vertical spacing between cards */
    }
    
    .form, .form-group {
      align-items: stretch; /* Full width form elements */
    }

    #app {
      text-align: left; /* Left align text */
    }

    textarea {
      height: 250px; /* Increase height */
    }

    .switch-button {
      padding: 6px 12px; /* Increase size */
      font-size: 12px; /* Increase font size */
    }

    .switch-wrapper {
      position: static; /* Remove the absolute positioning */
      /* Center the element */
      display: flex;
      justify-content: center;
    }
  }

</style>


  
  
  
  
  
  