// create-admin.js - Run this once locally to create your account
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const readline = require('readline');

const pool = new Pool({
    connectionString: process.env.DATABASE_EXTERNAL_URL,
    ssl: { rejectUnauthorized: false }
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter a username for the admin account: ', (username) => {
    rl.question('Enter a secure password for the admin account: ', async (password) => {
        if (!username || !password) {
            console.error("Username and password cannot be empty.");
            rl.close();
            return;
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        try {
            const query = 'INSERT INTO teachers (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = $2';
            await pool.query(query, [username, password_hash]);
            console.log(`Admin user '${username}' has been created/updated successfully.`);
        } catch (err) {
            console.error("Error creating admin user:", err);
        } finally {
            await pool.end();
            rl.close();
        }
    });
});