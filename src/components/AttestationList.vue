<!-- src/components/AttestationList.vue -->

<template>
    <div>
      <h2>Attestations</h2>
      <ul>
        <li v-for="attestation in attestations" :key="attestation.id">
          {{ attestation }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import { getAttestationsByRecipient } from "../utils/easscan";
  
  export default {
    name: "AttestationList",
    props: {
      recipient: String,
    },
    data() {
      return {
        attestations: [],
      };
    },
    async created() {
      this.attestations = await getAttestationsByRecipient(this.recipient);
    },
  };
  </script>
  