// server.js - Add this line at the very top

require('dotenv').config(); // This loads variables from .env for local testing


// server.js - FINAL VERSION WITH AUTHENTICATION (Syntax Corrected)
const express = require('express');
const cors = require('cors');
const Papa = require('papaparse');
const { Pool } = require('pg');
const jwt =require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const createTables = async () => {
    const createResultsTableQuery = `
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
    const createStudentsTableQuery = `
    CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        lastname VARCHAR(100) NOT NULL,
        firstname VARCHAR(100) NOT NULL,
        course VARCHAR(100),
        section VARCHAR(50),
        exam_taken_at TIMESTAMPTZ NULL
    );`;
    try {
        await pool.query(createResultsTableQuery);
        console.log("Table 'results' is ready.");
        await pool.query(createStudentsTableQuery);
        console.log("Table 'students' is ready.");
    } catch (err) {
        console.error("Error creating tables", err);
    }
};
createTables();

const corsOptions = {
  origin: 'https://araah21.github.io',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get('/', (req, res) => res.redirect('/admin'));
app.get('/admin', (req, res) => res.sendFile(__dirname + '/admin.html'));

app.post('/login', async (req, res) => {
    const { lastname, idNumber } = req.body;
    if (!lastname || !idNumber) {
        return res.status(400).json({ message: "Lastname and ID Number are required." });
    }
    try {
        const result = await pool.query('SELECT * FROM students WHERE id_number = $1', [idNumber]);
        const student = result.rows[0];
        if (student && student.lastname.toLowerCase() === lastname.toLowerCase()) {
            if (student.exam_taken_at) {
                return res.status(403).json({ message: "You have already completed the exam and cannot log in again." });
            }
            const userPayload = { idNumber: student.id_number, name: `${student.firstname} ${student.lastname}` };
            const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '3h' });
            res.json({ accessToken: accessToken, studentDetails: student });
        } else {
            res.status(401).json({ message: "Invalid credentials. Please check your Lastname and ID Number." });
        }
    } catch (err) {
        console.error("Login database error:", err);
        res.status(500).json({ message: "A server error occurred during login." });
    }
});

app.post('/submit-exam', authenticateToken, async (req, res) => {
    const studentData = req.body;
    const studentIdNumber = req.user.idNumber;
    console.log(`Received submission from authenticated user: ${req.user.name} (${studentIdNumber})`);
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertResultQuery = `INSERT INTO results (name, course, section, idNumber, examTitle, score, totalQuestions)
                                   VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
        const resultParams = [
            studentData.name, studentData.course, studentData.section,
            studentData.idNumber, studentData.examTitle, studentData.score,
            studentData.totalQuestions
        ];
        const result = await client.query(insertResultQuery, resultParams);
        console.log(`Saved submission with ID: ${result.rows[0].id}`);

        const updateStudentQuery = 'UPDATE students SET exam_taken_at = NOW() WHERE id_number = $1';
        await client.query(updateStudentQuery, [studentIdNumber]);
        console.log(`Marked student ${studentIdNumber} as completed.`);

        await client.query('COMMIT');
        res.status(200).json({ status: 'success', message: 'Exam data received and saved.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Database transaction error on submit:", err);
        res.status(500).json({ status: 'error', message: 'Failed to save results.' });
    } finally {
        client.release();
    }
});

app.get('/download-results', async (req, res) => {
    const sql = `SELECT id, name, course, section, idNumber, examTitle, score, totalQuestions, submissionTime FROM results ORDER BY submissionTime DESC`;
    try {
        const { rows } = await pool.query(sql);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="exam_results.csv"');
        res.status(200).send(Papa.unparse(rows));
    } catch (err) {
        console.error("Database read error for download", err);
        res.status(500).send("Failed to retrieve data from the database.");
    }
});

// --- START: NEW AND UPDATED ADMIN ROUTES ---

// NEW: API endpoint to get results as JSON for the table
app.get('/api/results', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name, idNumber, examTitle, score, totalQuestions, submissionTime FROM results ORDER BY submissionTime DESC');
        res.json(rows);
    } catch (err) {
        console.error("API Error fetching results:", err);
        res.status(500).json({ message: "Failed to fetch results." });
    }
});

// NEW: API endpoint to delete a single result
app.delete('/api/results/:id', async (req, res) => {
    const { id } = req.params;
    const { adminKey } = req.body;

    if (adminKey !== ADMIN_SECRET_KEY) {
        return res.status(401).json({ message: "Unauthorized: Invalid Admin Key." });
    }

    try {
        await pool.query('DELETE FROM results WHERE id = $1', [id]);
        res.status(200).json({ message: `Result with ID ${id} deleted successfully.` });
    } catch (err) {
        console.error(`API Error deleting result ${id}:`, err);
        res.status(500).json({ message: "Failed to delete result." });
    }
});

// NEW: API endpoint to delete all results
app.delete('/api/results/all', async (req, res) => {
    const { adminKey } = req.body;

    if (adminKey !== ADMIN_SECRET_KEY) {
        return res.status(401).json({ message: "Unauthorized: Invalid Admin Key." });
    }

    try {
        await pool.query('TRUNCATE TABLE results'); // TRUNCATE is faster than DELETE for clearing a whole table
        res.status(200).json({ message: "All results have been cleared successfully." });
    } catch (err) {
        console.error("API Error clearing results table:", err);
        res.status(500).json({ message: "Failed to clear results." });
    }
});


// This route for the admin page itself remains the same
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

// This route for downloading also remains the same
app.get('/download-results', async (req, res) => {
    // ... download logic remains the same ...
    const sql = `SELECT id, name, course, section, idNumber, examTitle, score, totalQuestions, submissionTime FROM results ORDER BY submissionTime DESC`;
    try {
        const { rows } = await pool.query(sql);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="exam_results.csv"');
        res.status(200).send(Papa.unparse(rows));
    } catch (err) {
        res.status(500).send("Failed to retrieve data from the database.");
    }
});

// --- END: NEW AND UPDATED ADMIN ROUTES ---

app.listen(PORT, () => console.log(`Backend server is running on port ${PORT}`));