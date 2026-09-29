import mysql from 'mysql2';
import util from 'util';
import Msg from '../utils/message.js';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

const pool = mysql.createPool(dbConfig);

// Verify pool connectivity on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error(Msg.dbConnectionError, err);
  } else {
    console.log(Msg.dbConnectionSuccess);
    connection.release();
  }
});

pool.on('error', (err) => {
  console.error(Msg.dbError, err);
});

function makeDb() {
  return {
    async query(sql, args) {
      return util.promisify(pool.query).call(pool, sql, args);
    },
    async getConnection() {
      return util.promisify(pool.getConnection).call(pool);
    },
    async close() {
      console.log(Msg.dbConnectionClosing);
      return util.promisify(pool.end).call(pool);
    },
    pool
  };
}

const db = makeDb();

export default db;
