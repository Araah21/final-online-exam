// server.js - COMPLETE AND FINAL VERSION
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

// --- Database Connection ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// --- Create ALL tables if they don't exist on startup ---
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
    const createAnswersTableQuery = `
    CREATE TABLE IF NOT EXISTS student_answers (
        id SERIAL PRIMARY KEY,
        result_id INTEGER REFERENCES results(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        student_answer TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        is_correct BOOLEAN NOT NULL
    );`;

    const createTeachersTableQuery = `
    CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
    );`;

    const createProgressTableQuery = `
    CREATE TABLE IF NOT EXISTS saved_progress (
        student_id_number VARCHAR(50) PRIMARY KEY,
        exam_type VARCHAR(10) NOT NULL,
        answers_json TEXT
    );`;

    try {
        await pool.query(createResultsTableQuery);
        console.log("Table 'results' is ready.");
        await pool.query(createStudentsTableQuery);
        console.log("Table 'students' is ready.");
        await pool.query(createAnswersTableQuery);
        console.log("Table 'student_answers' is ready.");
        await pool.query(createTeachersTableQuery);
        console.log("Table 'teachers' is ready."); 
        await pool.query(createProgressTableQuery);
        console.log("Table 'saved_progress' is ready.");
    } catch (err) {
        console.error("Error creating tables on startup:", err);
    }
};
createTables();

// --- Middleware ---
const corsOptions = { origin: 'https://araah21.github.io', optionsSuccessStatus: 200 };
app.use(cors(corsOptions));
app.use(express.json());

// --- Authentication Middleware ---
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

function authenticateAdmin(req, res, next) {
    // This function runs on every secure admin route.
    // It looks for the token. If it doesn't exist or is invalid,
    // it redirects to the login page.
    const token = req.headers.cookie?.split('; ').find(row => row.startsWith('adminAuthToken='))?.split('=')[1];

    if (token == null) {
        return res.redirect('/admin/login');
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || user.role !== 'admin') {
            return res.redirect('/admin/login');
        }
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

// --- NEW AUTO-SAVE ROUTES (for students) ---
app.get('/api/progress', authenticateToken, async (req, res) => {
    const studentIdNumber = req.user.idNumber;
    try {
        const result = await pool.query('SELECT answers_json FROM saved_progress WHERE student_id_number = $1', [studentIdNumber]);
        if (result.rows.length > 0) {
            res.json(JSON.parse(result.rows[0].answers_json));
        } else {
            res.json(null); // No saved progress
        }
    } catch (err) {
        res.status(500).json({ message: 'Could not retrieve progress.' });
    }
});
app.post('/api/progress', authenticateToken, async (req, res) => {
    const studentIdNumber = req.user.idNumber;
    const { examType, answers } = req.body;
    const answersJson = JSON.stringify(answers);
    const query = `
        INSERT INTO saved_progress (student_id_number, exam_type, answers_json)
        VALUES ($1, $2, $3)
        ON CONFLICT (student_id_number) DO UPDATE SET answers_json = $3;
    `;
    try {
        await pool.query(query, [studentIdNumber, examType, answersJson]);
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    }
});

// --- ADMIN ROUTES (Now Secured) ---
app.get('/admin/login', (req, res) => res.sendFile(__dirname + '/admin-login.html'));
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM teachers WHERE username = $1', [username]);
        const teacher = result.rows[0];
        if (teacher && await bcrypt.compare(password, teacher.password_hash)) {
            const accessToken = jwt.sign({ username: teacher.username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ accessToken });
        } else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error during admin login." });
    }
});


// --- Exam Submission Route ---
app.post('/submit-exam', authenticateToken, async (req, res) => {
    const { studentData, answers } = req.body;
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
        const resultId = result.rows[0].id;
        console.log(`Saved submission with ID: ${resultId}`);

        for (const answer of answers) {
            const answerQuery = `INSERT INTO student_answers (result_id, question_text, student_answer, correct_answer, is_correct)
                                 VALUES ($1, $2, $3, $4, $5)`;
            await client.query(answerQuery, [resultId, answer.question, answer.studentAnswer, answer.correctAnswer, answer.isCorrect]);
        }

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

app.get('/api/students', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, firstname, lastname, id_number, exam_taken_at FROM students ORDER BY lastname, firstname');
        res.json(rows);
    } catch (err) {
        console.error("API Error fetching students:", err);
        res.status(500).json({ message: "Failed to fetch student list." });
    }
});

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

app.get('/api/analysis', async (req, res) => {
    const analysisQuery = `
        SELECT
            question_text,
            COUNT(*) AS total_attempts,
            SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) AS correct_answers
        FROM
            student_answers
        GROUP BY
            question_text
        ORDER BY
            total_attempts DESC;
    `;
    try {
        const { rows } = await pool.query(analysisQuery);
        res.json(rows);
    } catch (err) {
        console.error("API Error fetching analysis:", err);
        res.status(500).json({ message: "Failed to fetch analysis." });
    }
});

    // --- NEW --- API endpoint to download the question analysis as a CSV
app.get('/api/analysis/download', async (req, res) => {
    const analysisQuery = `
        SELECT
            question_text,
            COUNT(*) AS total_attempts,
            SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) AS correct_answers,
            (SUM(CASE WHEN is_correct = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) AS success_rate_percent
        FROM
            student_answers
        GROUP BY
            question_text
        ORDER BY
            total_attempts DESC;
    `;
    try {
        const { rows } = await pool.query(analysisQuery);
        // Rename columns for a friendlier CSV header
        const formattedRows = rows.map(row => ({
            Question: row.question_text,
            'Total Attempts': row.total_attempts,
            'Correct Answers': row.correct_answers,
            'Success Rate (%)': parseFloat(row.success_rate_percent).toFixed(2)
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="exam_question_analysis.csv"');
        res.status(200).send(Papa.unparse(formattedRows));
    } catch (err) {
        console.error("API Error fetching analysis for download:", err);
        res.status(500).send("Failed to retrieve analysis data for download.");
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

// --- Start the Server ---
app.listen(PORT, () => console.log(`Backend server is running on port ${PORT}`));