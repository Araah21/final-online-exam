const sqlite3 = require('sqlite3').verbose();
const DB_FILE = 'exams.db';

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error("Error opening database", err.message);
        return;
    }

    const sql = `SELECT id, name, idNumber, examTitle, score, totalQuestions, submissionTime 
                 FROM results 
                 ORDER BY submissionTime DESC`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error reading results", err.message);
            return;
        }

        if (rows.length === 0) {
            console.log("No results found in the database.");
        } else {
            console.log("--- EXAM RESULTS ---");
            rows.forEach((row) => {
                console.log(
                    `ID: ${row.id} | Name: ${row.name} | Student ID: ${row.idNumber} | Exam: ${row.examTitle} | Score: ${row.score}/${row.totalQuestions} | Time: ${row.submissionTime}`
                );
            });
            console.log("--------------------");
        }
    });

    // Close the database connection
    db.close();
});