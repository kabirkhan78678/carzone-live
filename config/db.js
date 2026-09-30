import mysql from 'mysql2';
import util from 'util';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 3306,
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
    console.error('\x1b[31m%s\x1b[0m', '❌ Database Connection Failed: ' + err.message);
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✔ Database Connected Successfully!');
    console.log('\x1b[36m%s\x1b[0m', `   Database : ${process.env.DB_DATABASE} | Host: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306} | User: ${process.env.DB_USER}`);
    connection.release();
  }
});

pool.on('error', (err) => {
  console.error('❌ Database Pool Error:', err);
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
      return util.promisify(pool.end).call(pool);
    },
    pool
  };
}

const db = makeDb();

export default db;
