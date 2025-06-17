// server.js - FINAL DEPLOYMENT VERSION
const express = require('express');
const cors = require('cors');
const Papa = require('papaparse');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Connect to the PostgreSQL database from Render ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// --- Create the 'results' table if it doesn't exist ---
const createTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        course TEXT,
        section TEXT,
        idNumber TEXT NOT NULL,
        examTitle TEXT NOT NULL,
        score INTEGER NOT NULL,
        totalQuestions INTEGER NOT NULL,
        submissionTime TIMESTAMPTZ DEFAULT NOW()
    );`;
    try {
        await pool.query(queryText);
        console.log("Table 'results' is ready.");
    } catch (err) {
        console.error("Error creating table", err);
    }
};
createTable();

// --- Middleware ---
const corsOptions = {
  origin: 'https://araah21.github.io', // Your frontend's exact address
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Routes ---
app.get('/', (req, res) => {
    res.redirect('/admin');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

app.post('/submit-exam', async (req, res) => {
    const studentData = req.body;
    console.log(`Received submission from: ${studentData.name}`);

    const sql = `INSERT INTO results (name, course, section, idNumber, examTitle, score, totalQuestions)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
    const params = [
        studentData.name, studentData.course, studentData.section,
        studentData.idNumber, studentData.examTitle, studentData.score,
        studentData.totalQuestions
    ];

    try {
        const result = await pool.query(sql, params);
        console.log(`Saved submission with ID: ${result.rows[0].id}`);
        res.status(200).json({ status: 'success', message: 'Exam data received and saved.' });
    } catch (err) {
        console.error("Database insert error", err);
        res.status(500).json({ status: 'error', message: 'Failed to save results.' });
    }
});

app.get('/download-results', async (req, res) => {
    console.log("Request received to download results.");
    const sql = `SELECT id, name, course, section, idNumber, examTitle, score, totalQuestions, submissionTime FROM results ORDER BY submissionTime DESC`;

    try {
        const { rows } = await pool.query(sql);
        if (rows.length === 0) {
            return res.status(404).send("No results found to download.");
        }
        const csv = Papa.unparse(rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="exam_results.csv"');
        res.status(200).send(csv);
    } catch (err) {
        console.error("Database read error for download", err);
        res.status(500).send("Failed to retrieve data from the database.");
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});