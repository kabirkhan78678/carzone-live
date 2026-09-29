import fetch from 'node-fetch';

const EUROTAX_USERNAME = process.env.EUROTAX_USERNAME;
const EUROTAX_PASSWORD = process.env.EUROTAX_PASSWORD;
const BASE_URL = process.env.EUROTAX_BASE_URL;

const authHeader = "Basic " + Buffer.from(`${EUROTAX_USERNAME}:${EUROTAX_PASSWORD}`).toString("base64");

export async function getVehicleDataByVRN(vrn) {
  const res = await fetch(`${BASE_URL}/vehicles?vrn=${vrn}`, {
    headers: { "Authorization": authHeader }
  });
  return res.json();
}