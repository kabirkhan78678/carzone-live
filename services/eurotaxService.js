import axios from 'axios';

const EUROTAX_API = "https://api.eurotax.com"; // sample, replace with real endpoint
const API_KEY = "your_api_key_here";

export async function getMakes() {
  const { data } = await axios.get(`${EUROTAX_API}/makes`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  return data;
}

export async function getModels(makeId) {
  const { data } = await axios.get(`${EUROTAX_API}/models?make=${makeId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  return data;
}

export async function detectEngine(vrn) {
  const { data } = await axios.get(`${EUROTAX_API}/engine?vrn=${vrn}`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  return data;
}
