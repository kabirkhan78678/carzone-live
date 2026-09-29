import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import route from './routes/index.js';
import msg from './utils/message.js'
import { fileURLToPath } from 'url';
import { getLocalIP, getMessage } from './utils/user_helper.js';
import { stripeWebhook } from './controllers/user_controller.js';
import './utils/cronJob.js'
import https from 'https';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

const app = express();
// Must be before express.json()
app.post("/api/webhook", express.raw({ type: "application/json" }), stripeWebhook);
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views'));

app.use(cors());
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use('/profile', express.static(path.join(__dirname, 'public/profile')));


// Use routes
app.use('/api', route);

const port = process.env.PORT || 4000;
const lang = 'en';
server.listen(port, () => {
  console.log(`${getMessage(lang, 'serverRunning')} http://13.51.226.81:${port}`);

});

// https
//   .createServer(
//     {
//       ca: fs.readFileSync("/var/www/html/ssl/ca_bundle.crt"),
//       key: fs.readFileSync("/var/www/html/ssl/private.key"),
//       cert: fs.readFileSync("/var/www/html/ssl/certificate.crt"),
//     },
//     app
//   )
//   .listen(port, () => {
//     console.log(`${getMessage(lang, 'serverRunning')} https://13.51.226.81:${port}`);
//   });
