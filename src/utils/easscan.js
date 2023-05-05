// src/utils/easscan.js

const API_URL = "https://sepolia.easscan.org/graphql";

export async function getAttestationsByRecipient(recipient) {
    const query = `
        query AttestationsByRecipient($recipient: String!) {
            attestations(
            where: { recipient: { equals: $recipient } },
            orderBy: { time: desc }
            ) {
            id
            attester
            recipient
            refUID
            revocable
            revocationTime
            expirationTime
            data
            }
        }
    `;

  const variables = {
    recipient,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  return data.data.attestations;
}
