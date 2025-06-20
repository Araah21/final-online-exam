// server.js - COMPLETE, FINAL, AND SECURED VERSION
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Papa = require('papaparse');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

// --- Database Connection ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- Create ALL tables if they don't exist on startup ---
const createTables = async () => {
    try {
        await pool.query(`
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
            );`);
        console.log("Table 'results' is ready.");

         await pool.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                id_number VARCHAR(50) UNIQUE NOT NULL,
                lastname VARCHAR(100) NOT NULL,
                firstname VARCHAR(100) NOT NULL,
                course VARCHAR(100),
                section VARCHAR(50),
                exam_started_at TIMESTAMPTZ NULL, -- ADD THIS LINE
                exam_taken_at TIMESTAMPTZ NULL
            );`);
        console.log("Table 'students' is ready.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS student_answers (
                id SERIAL PRIMARY KEY,
                result_id INTEGER REFERENCES results(id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                student_answer TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                is_correct BOOLEAN NOT NULL
            );`);
        console.log("Table 'student_answers' is ready.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            );`);
        console.log("Table 'teachers' is ready.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS saved_progress (
                student_id_number VARCHAR(50) PRIMARY KEY,
                exam_type VARCHAR(10) NOT NULL,
                answers_json TEXT
            );`);
        console.log("Table 'saved_progress' is ready.");

    } catch (err) {
        console.error("Error creating tables on startup:", err);
    }
};
createTables();

// --- Middleware ---
const corsOptions = {
    origin: 'https://araah21.github.io',
    credentials: true, // Important for cookies
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
    // This is the authentication for STUDENTS
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); // If no token, reject the request

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // If token is invalid, reject
        req.user = user;
        next(); // Token is valid, proceed
    });
}


function authenticateAdmin(req, res, next) {
    const token = req.cookies.adminAuthToken;
    if (token == null) return res.redirect('/admin/login');
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.redirect('/admin/login');
        }
        req.user = user;
        next();
    });
}

// --- STUDENT-FACING ROUTES ---
app.post('/login', async (req, res) => {
    const { lastname, idNumber } = req.body;
    if (!lastname || !idNumber) {
        return res.status(400).json({ message: "Lastname and ID Number are required." });
    }
    try {
        const result = await pool.query('SELECT * FROM students WHERE id_number = $1', [idNumber]);
        const student = result.rows[0];

        if (student && student.lastname.toLowerCase() === lastname.toLowerCase()) {
            // Check 1: Has the exam already been completed?
            if (student.exam_taken_at) {
                return res.status(403).json({ message: "You have already completed the exam and cannot log in again." });
            }

            // Check 2: Has the exam been started before? If not, mark it as started now.
            // This is the key logic to prevent a fresh retake.
            if (!student.exam_started_at) {
                await pool.query('UPDATE students SET exam_started_at = NOW() WHERE id_number = $1', [idNumber]);
            }
            
            // If the checks pass, issue the token to allow the student to start or resume.
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
    const { studentData, answers } = req.body;
    const studentIdNumber = req.user.idNumber;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertResultQuery = `INSERT INTO results (name, course, section, idNumber, examTitle, score, totalQuestions) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
        const resultParams = [studentData.name, studentData.course, studentData.section, studentData.idNumber, studentData.examTitle, studentData.score, studentData.totalQuestions];
        const result = await client.query(insertResultQuery, resultParams);
        const resultId = result.rows[0].id;

        for (const answer of answers) {
            const answerQuery = `INSERT INTO student_answers (result_id, question_text, student_answer, correct_answer, is_correct) VALUES ($1, $2, $3, $4, $5)`;
            await client.query(answerQuery, [resultId, answer.question, answer.studentAnswer, answer.correctAnswer, answer.isCorrect]);
        }

        await client.query('UPDATE students SET exam_taken_at = NOW() WHERE id_number = $1', [studentIdNumber]);
        await client.query('DELETE FROM saved_progress WHERE student_id_number = $1', [studentIdNumber]);
        
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

app.get('/api/progress', authenticateToken, async (req, res) => {
    const studentIdNumber = req.user.idNumber;
    try {
        const result = await pool.query('SELECT answers_json FROM saved_progress WHERE student_id_number = $1', [studentIdNumber]);
        res.json(result.rows.length > 0 ? JSON.parse(result.rows[0].answers_json) : null);
    } catch (err) {
        res.status(500).json({ message: 'Could not retrieve progress.' });
    }
});

app.post('/api/progress', authenticateToken, async (req, res) => {
    const studentIdNumber = req.user.idNumber;
    const { examType, answers } = req.body;
    const answersJson = JSON.stringify(answers);
    const query = `INSERT INTO saved_progress (student_id_number, exam_type, answers_json) VALUES ($1, $2, $3) ON CONFLICT (student_id_number) DO UPDATE SET answers_json = $3;`;
    try {
        await pool.query(query, [studentIdNumber, examType, answersJson]);
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    }
});

// --- ADMIN ROUTES ---
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM teachers WHERE username = $1', [username]);
        const teacher = result.rows[0];
        if (teacher && await bcrypt.compare(password, teacher.password_hash)) {
            const accessToken = jwt.sign({ username: teacher.username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
            res.cookie('adminAuthToken', accessToken, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 8 * 60 * 60 * 1000 });
            res.status(200).json({ message: "Login successful" });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error during admin login." });
    }
});

app.get('/', (req, res) => res.redirect('/admin'));
app.get('/admin', authenticateAdmin, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.get('/api/students', authenticateAdmin, async (req, res) => {
    // Select the new column so the frontend can use it
    const { rows } = await pool.query('SELECT id, firstname, lastname, id_number, exam_started_at, exam_taken_at FROM students ORDER BY lastname, firstname');
    res.json(rows);
});

app.put('/api/students/:id/reset', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { adminKey } = req.body;
    if (adminKey !== ADMIN_SECRET_KEY) return res.status(401).json({ message: "Unauthorized: Invalid Admin Key." });
    // Clear both timestamps to allow a full retake
    await pool.query('UPDATE students SET exam_taken_at = NULL, exam_started_at = NULL WHERE id = $1', [id]);
    res.status(200).json({ message: `Student ID #${id} has been reset and can start a new exam.` });
});
app.get('/api/results', authenticateAdmin, async (req, res) => {
    const { rows } = await pool.query('SELECT id, name, idnumber, examtitle, score, totalquestions, submissiontime FROM results ORDER BY submissiontime DESC');
    res.json(rows);
});

app.get('/api/analysis', authenticateAdmin, async (req, res) => {
    const query = `SELECT question_text, COUNT(*) AS total_attempts, SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) AS correct_answers FROM student_answers GROUP BY question_text ORDER BY total_attempts DESC;`;
    const { rows } = await pool.query(query);
    res.json(rows);
});

app.delete('/api/results/all', authenticateAdmin, async (req, res) => {
    const { adminKey } = req.body;
    if (adminKey !== ADMIN_SECRET_KEY) return res.status(401).json({ message: "Unauthorized: Invalid Admin Key." });
    await pool.query('TRUNCATE TABLE results, student_answers RESTART IDENTITY');
    res.status(200).json({ message: "All results have been cleared." });
});

app.delete('/api/results/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { adminKey } = req.body;
    if (adminKey !== ADMIN_SECRET_KEY) return res.status(401).json({ message: "Unauthorized: Invalid Admin Key." });
    await pool.query('DELETE FROM results WHERE id = $1', [id]);
    res.status(200).json({ message: `Result with ID ${id} deleted.` });
});

app.get('/download-results', authenticateAdmin, async (req, res) => {
    const { rows } = await pool.query('SELECT id, name, course, section, idNumber, examTitle, score, totalQuestions, submissionTime FROM results ORDER BY submissionTime DESC');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="exam_results.csv"');
    res.status(200).send(Papa.unparse(rows));
});

app.get('/api/analysis/download', authenticateAdmin, async (req, res) => {
    const query = `SELECT question_text, COUNT(*) AS total_attempts, SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) AS correct_answers, (SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS success_rate_percent FROM student_answers GROUP BY question_text ORDER BY total_attempts DESC;`;
    const { rows } = await pool.query(query);
    const formattedRows = rows.map(row => ({
        Question: row.question_text, 'Total Attempts': row.total_attempts,
        'Correct Answers': row.correct_answers, 'Success Rate (%)': parseFloat(row.success_rate_percent).toFixed(2)
    }));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="exam_question_analysis.csv"');
    res.status(200).send(Papa.unparse(formattedRows));
});

app.listen(PORT, () => console.log(`Backend server is running on port ${PORT}`));