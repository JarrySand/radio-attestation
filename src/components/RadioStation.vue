<template>
  <div id="app">
    <h1>{{ radioStation.name }}</h1>
    <p>{{ radioStation.description }}</p>
    <a :href="radioStation.podcastLink">Podcast Link</a>
    <p>Wallet Address: {{ radioStation.walletAddress }}</p>
    <router-link to="/">Go back to main page</router-link>

    <div v-if="!recipientAddress">
      <button @click="connectWallet">Connect Wallet to make a post</button>
    </div>

    <div v-if="recipientAddress">
      <p>Recipient Address: {{ recipientAddress }}</p>
      <p v-if="userPenName">Welcome, {{ userPenName }}!</p>

      <div v-if="!userPenName">
        <h2>Sign Up</h2>
        <form @submit.prevent="signUp" class="form">
          <div class="form-group">
            <label for="penName">Pen Name:</label>
            <input type="text" id="penName" v-model="signUpForm.penName" required />
          </div>
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <form @submit.prevent="makePost" class="form">
        <div class="form-group">
          <label for="postType">Choose a type of post:</label>
          <select id="postType" v-model="postForm.postType" required>
            <option value="">Select a post type</option>
            <option v-for="option in finalPostTypeOptions" :key="option">
              {{ option }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="postContent">Post content:</label>
          <textarea id="postContent" v-model="postForm.content" rows="4" cols="50" required></textarea>
        </div>
        <button type="submit" class="submit-button">Submit Post</button>
      </form>
    </div>
  </div>
</template>


<script>
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Web3 from 'web3';
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import { ethers } from 'ethers';
import { db } from "../firebase";

export default {
  props: ['walletAddress'],
  data() {
    return {
      radioStation: {},
      recipientAddress: "",
      signUpForm: {
        penName: "",
      },
      user: null,
      web3: null,
      signer: null,
      postForm: {
        content: "",
        postType: "",
      },
      postTypeOptions: [],
    }
  },
  computed: {
    userPenName() {
      return this.user ? this.user.penName : null;
    },
    finalPostTypeOptions() {
      return this.postTypeOptions.length > 0 ? this.postTypeOptions : ['Questions', 'Opinions', 'Request'];
    },
  },
  created() {
    this.fetchRadioStationInfo();
    this.fetchRadioStationInfo();
    this.fetchPostTypeOptions();
  },
  methods: {
    async fetchRadioStationInfo() {
      const db = getFirestore();
      const q = query(collection(db, 'radioStations'), where('walletAddress', '==', this.walletAddress));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        this.radioStation = querySnapshot.docs[0].data();
      } else {
        console.log("No such document!");
      }
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
        const checksumAddress = this.web3.utils.toChecksumAddress(rawAddress); // Use web3.js
        this.recipientAddress = checksumAddress;

        await this.login();
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

    async makePost() {
      try {
        const postData = {
          content: this.postForm.content,
          penName: this.user.penName,
          postType: this.postForm.postType,
          walletAddress: this.walletAddress,
          station: this.radioStation.name,
        };
        // Save post data to Firebase Firestore
        await addDoc(collection(db, "listenerPosts"), postData);
        // Clear the form
        this.postForm.content = "";
        this.postForm.postType = "";
      } catch (error) {
        console.error("Error making post: ", error);
      }
    },
    async fetchPostTypeOptions() {
      const q = query(collection(db, 'postTypeOptions'), where('radioStationWalletAddress', '==', this.walletAddress));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        this.postTypeOptions = querySnapshot.docs.map(doc => doc.data().name);
      } else {
        console.log("No post type options found!");
      }
    },
  },
}  
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
