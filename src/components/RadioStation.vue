<template>
  <div id="app">
    <nav>
      <ul>
        <li id="navFlexContainerLi">
          <div class="nav-flex-container" id="navFlexContainer">
            <div v-if="recipientAddress">Your Address:</div>
            <div v-if="recipientAddress" :title="recipientAddress">{{ recipientAddress }}</div>
            <div v-if="userPenName">Pen name:</div>
            <div v-if="userPenName">{{ userPenName }}</div>
          </div>
        </li>
        <li v-if="recipientAddress"><a href="#yourPosts">Your posts</a></li>
        <li><a href="#feedback">Feedback</a></li>
        <li><router-link to="/">Go back to main page</router-link></li>
      </ul>
    </nav>
    <h1>{{ radioStation.name }}</h1>
    <p v-html="formattedDescription"></p>
    <a :href="radioStation.podcastLink">Go and listen to the podcast</a>

    <div v-if="!recipientAddress">
      <button @click="connectWallet">Connect Wallet to make a post</button>
    </div>

    <div v-if="recipientAddress">
      <p>Your Address: {{ recipientAddress }}</p>
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
        <div class="form-group half-width">
          <label for="postType">Choose a post type:</label>
          <select id="postType" v-model="postForm.postType" required>
            <option value="">Select a post type</option>
            <option v-for="option in finalPostTypeOptions" :key="option">
              {{ option }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="postContent">Post content:</label>
          <textarea id="postContent" v-model="postForm.content" rows="10" cols="200" required></textarea>
        </div>
        <button type="submit" class="submit-button">Submit Post</button>
      </form>
    </div>

    <div>
      <h2 id="yourPosts">Your Posts for {{ radioStation.name }}:</h2>
      <table v-if="userPosts.length > 0">
        <thead>
          <tr>
            <th>Post Type</th>
            <th>Content</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(post, index) in userPosts" :key="index">
            <td>{{ post.postType }}</td>
            <td>{{ post.content }}</td>
            <td>
              <button @click="deletePost(post)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="feedback-section">
      <h2>We'd love to hear your feedback</h2>
      <p>Your input helps us improve. Please take a moment to share your thoughts on our platform.</p>
      <a href="https://docs.google.com/forms/d/e/1FAIpQLSf1OZuDeuVU9Q6wnRQVEZ46jOlWEgXbnoQ2QYPsay5BxiuSmQ/viewform" target="_blank" class="feedback-button">Leave Feedback</a>
    </div>
  </div>
</template>


<script>
import { getFirestore, collection, query, where, getDocs, addDoc, doc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
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
      userPosts: [],
    }
  },
  computed: {
    userPenName() {
      return this.user ? this.user.penName : null;
    },
    finalPostTypeOptions() {
      return this.postTypeOptions.length > 0 ? this.postTypeOptions : ['Questions', 'Opinions', 'Request'];
    },
    formattedDescription() {
      return this.radioStation && this.radioStation.description ? this.radioStation.description.replace(/\n/g, '<br>') : '';
    },
  },
  async created() {
    await this.fetchRadioStationInfo();
    await this.fetchPostTypeOptions();
    this.fetchUserPosts();
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

      await this.fetchUserPosts();
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
          timestamp: serverTimestamp(),
        };
        // Save post data to Firebase Firestore
        await addDoc(collection(db, "listenerPosts"), postData);
        // Clear the form
        this.postForm.content = "";
        this.postForm.postType = "";

        // Fetch user posts again after making a new post
        this.fetchUserPosts();
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
    async fetchUserPosts() {

      if(!this.userPenName || !this.radioStation || !this.radioStation.name) {
        return;
      }

      const db = getFirestore();
      const q = query(
        collection(db, 'listenerPosts'),
        where('penName', '==', this.userPenName),
        where('station', '==', this.radioStation.name),
        orderBy("timestamp", "desc") // order posts by timestamp, most recent first
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        this.userPosts = querySnapshot.docs.map(doc => {
          // Get data and id
          let data = doc.data();
          let id = doc.id;
          // Return combined object
          return { id, ...data };
        });
      } else {
        console.log("No posts found!");
      }
    },
    async deletePost(post) {
      const db = getFirestore();
      const postRef = doc(db, 'listenerPosts', post.id);
      await deleteDoc(postRef);

      // Also update userPosts array
      this.userPosts = this.userPosts.filter(item => item.id !== post.id);
    },
  },
  watch: {
    userPenName: {
      immediate: true,
      handler() {
        this.fetchUserPosts();
      },
    },
    'radioStation.name': {
      immediate: true,
      handler() {
        if(this.userPenName && this.radioStation && this.radioStation.name) {
          this.fetchUserPosts();
        }
      },
    },
  },
}  
</script>

<style>

</style>
