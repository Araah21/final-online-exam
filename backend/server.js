// server.js - FINAL VERSION WITH "ALLOW RETAKE" FEATURE
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Papa = require('papaparse');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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

// --- General & Login Routes ---
app.get('/', (req, res) => res.redirect('/admin'));

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

// --- Exam Submission Route ---
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

// --- Admin Routes ---
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

// --- NEW --- API endpoint to get the full student roster
app.get('/api/students', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, firstname, lastname, id_number, exam_taken_at FROM students ORDER BY lastname, firstname');
        res.json(rows);
    } catch (err) {
        console.error("API Error fetching students:", err);
        res.status(500).json({ message: "Failed to fetch student list." });
    }
});

// --- NEW --- API endpoint to reset a student's exam status
app.put('/api/students/:id/reset', async (req, res) => {
    const { id } = req.params;
    const { adminKey } = req.body;

    if (adminKey !== ADMIN_SECRET_KEY) {
        return res.status(401).json({ message: "Unauthorized: Invalid Admin Key." });
    }

    try {
        await pool.query('UPDATE students SET exam_taken_at = NULL WHERE id = $1', [id]);
        res.status(200).json({ message: `Student ID #${id} has been reset and can now retake the exam.` });
    } catch (err) {
        console.error(`API Error resetting student ${id}:`, err);
        res.status(500).json({ message: "Failed to reset student status." });
    }
});

app.get('/api/results', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name, idnumber, examtitle, score, totalquestions, submissiontime FROM results ORDER BY submissiontime DESC');
        res.json(rows);
    } catch (err) {
        console.error("API Error fetching results:", err);
        res.status(500).json({ message: "Failed to fetch results." });
    }
});

app.delete('/api/results/all', async (req, res) => {
    const { adminKey } = req.body;
    if (adminKey !== ADMIN_SECRET_KEY) {
        return res.status(401).json({ message: "Unauthorized: Invalid Admin Key." });
    }
    try {
        await pool.query('TRUNCATE TABLE results RESTART IDENTITY');
        res.status(200).json({ message: "All results have been cleared successfully." });
    } catch (err) {
        console.error("API Error clearing results table:", err);
        res.status(500).json({ message: "Failed to clear results." });
    }
});

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

app.get('/download-results', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, name, course, section, idNumber, examTitle, score, totalQuestions, submissionTime FROM results ORDER BY submissionTime DESC');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="exam_results.csv"');
        res.status(200).send(Papa.unparse(rows));
    } catch (err) {
        console.error("Database read error for download:", err);
        res.status(500).send("Failed to retrieve data from the database.");
    }
});

app.listen(PORT, () => console.log(`Backend server is running on port ${PORT}`));