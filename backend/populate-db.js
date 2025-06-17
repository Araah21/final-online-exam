// populate-db.js - A one-time script to upload your classlist
require('dotenv').config(); // Use this to read .env files
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');

// IMPORTANT: We use the EXTERNAL Database URL for running this script locally
const pool = new Pool({
    connectionString: process.env.DATABASE_EXTERNAL_URL,
    ssl: { rejectUnauthorized: false }
});

const students = [];

fs.createReadStream(path.join(__dirname, 'classlist.csv'))
    .pipe(csv())
    .on('data', (row) => {
        students.push(row);
    })
    .on('end', async () => {
        console.log('CSV file successfully processed. Starting database population...');

        for (const student of students) {
            const query = `
                INSERT INTO students (id_number, lastname, firstname, course, section)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id_number) DO NOTHING;
            `;
            try {
                await pool.query(query, [
                    student.id_number,
                    student.lastname,
                    student.firstname,
                    student.course,
                    student.section
                ]);
                console.log(`Processed student: ${student.firstname} ${student.lastname}`);
            } catch (err) {
                console.error(`Error inserting student ${student.id_number}:`, err);
            }
        }

        console.log('Database population complete.');
        await pool.end();
    });