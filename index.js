process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import route from './routes/index.js';
import { fileURLToPath } from 'url';
import { getLocalIP } from './utils/user_helper.js';
import { stripeWebhook } from './controllers/user_controller.js';
import './utils/cronJob.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Stripe Webhook (Must be before express.json())
app.post("/api/webhook", express.raw({ type: "application/json" }), stripeWebhook);

const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use('/profile', express.static(path.join(__dirname, 'public/profile')));

// Routes
app.use('/api', route);

const port = process.env.PORT || 4000;

server.listen(port, () => {
  const localIp = getLocalIP();
  const rawPublicUrl = process.env.APP_URL || process.env.BASE_URL || `http://13.51.226.81:${port}`;
  const publicUrl = String(rawPublicUrl).trim().replace(/\/+$/, '');

  const border = "=".repeat(62);
  console.log("\x1b[34m%s\x1b[0m", border);
  console.log("\x1b[1m\x1b[33m%s\x1b[0m", " 🚗  CARZONE LIVE BACKEND SERVER");
  console.log("\x1b[34m%s\x1b[0m", border);
  console.log(` 🌐  Server Status     : \x1b[32mONLINE\x1b[0m`);
  console.log(` 🌍  Public / Server   : \x1b[36m${publicUrl}\x1b[0m`);
  console.log(` 🚀  Localhost URL     : http://localhost:${port}`);
  if (localIp && localIp !== 'localhost' && !publicUrl.includes(localIp)) {
    console.log(` 📱  Internal / LAN IP : http://${localIp}:${port}`);
  }
  console.log(` 📡  Environment       : ${process.env.NODE_ENV || 'development'}`);
  console.log(` 🗄️  Database Name     : ${process.env.DB_DATABASE || 'carzone'}`);
  console.log(` 🔌  Database Host     : ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}`);
  console.log("\x1b[34m%s\x1b[0m", "-".repeat(62));
  console.log("\x1b[35m%s\x1b[0m", " ⚡  Active Modules & Features:");
  console.log("   ✔ Quality Seals System (Swiss Verified Quality Seals)");
  console.log("   ✔ Faceted Filter & Car Search Engine (/api/user/faceted-filters)");
  console.log("   ✔ Subscription Plans & 10-Day Grace Period Cron Job");
  console.log("   ✔ MFK Calculator & Daily Recalculation Cron (02:00 AM)");
  console.log("   ✔ Saved Search Instant Alerts & Notifications");
  console.log("   ✔ Stripe Webhooks & Billing (/api/webhook)");
  console.log("   ✔ AWS S3 & Rekognition Services");
  console.log("\x1b[34m%s\x1b[0m", border);
});
