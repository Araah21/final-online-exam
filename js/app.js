document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split("/").pop();

    if (page === 'index.html' || page === '') {
        handleLoginPage();
    } else if (page === 'exam.html') {
        handleExamPage();
    } else if (page === 'results.html') {
        handleResultsPage();
    }
});

function handleLoginPage() {
    const form = document.getElementById('student-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentInfo = {
            name: document.getElementById('name').value,
            course: document.getElementById('course').value,
            section: document.getElementById('section').value,
            idNumber: document.getElementById('idNumber').value,
            examType: document.getElementById('exam-select').value
        };
        localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
        window.location.href = 'exam.html';
    });
}

function handleExamPage() {
    const studentInfo = JSON.parse(localStorage.getItem('studentInfo'));
    if (!studentInfo) {
        window.location.href = 'index.html';
        return;
    }

    const examData = exams[studentInfo.examType];
    const examForm = document.getElementById('exam-form');
    let questionCounter = 0;

    // Display student info and exam title
    document.getElementById('exam-title').textContent = examData.title;
    document.getElementById('student-name').textContent = studentInfo.name;
    document.getElementById('student-id').textContent = studentInfo.idNumber;

    // Generate questions HTML
    examData.parts.forEach(part => {
        const partTitle = document.createElement('h2');
        partTitle.textContent = part.title;
        examForm.appendChild(partTitle);

        part.questions.forEach(q => {
            questionCounter++;
            const questionBlock = document.createElement('div');
            questionBlock.className = 'question-block';
            questionBlock.innerHTML = `<p>${questionCounter}. ${q.q}</p>`;

            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'options';

            if (q.o) { // Multiple Choice
                const optionLetters = ['A', 'B', 'C', 'D'];
                q.o.forEach((option, index) => {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `question${questionCounter}`;
                    radio.value = optionLetters[index];
                    label.appendChild(radio);
                    label.append(` ${optionLetters[index]}) ${option}`);
                    optionsDiv.appendChild(label);
                });
            } else { // True/False
                const options = ['True', 'False'];
                options.forEach(option => {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `question${questionCounter}`;
                    radio.value = option;
                    label.appendChild(radio);
                    label.append(` ${option}`);
                    optionsDiv.appendChild(label);
                });
            }
            questionBlock.appendChild(optionsDiv);
            examForm.appendChild(questionBlock);
        });
    });

    // Security Features
    let tabSwitchCount = 0;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            tabSwitchCount++;
            if (tabSwitchCount === 1) {
                alert('Warning: Switching tabs is not allowed. This is your first warning.');
            } else if (tabSwitchCount === 2) {
                alert('Warning: You have switched tabs again. One more time and the exam will be submitted automatically.');
            } else if (tabSwitchCount >= 3) {
                alert('You have switched tabs three times. Your exam will now be submitted.');
                submitExam();
            }
        }
    });

    // Disable copy and screenshot (basic)
    document.addEventListener('copy', (e) => e.preventDefault());
    window.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            alert('Screenshots are disabled.');
        }
    });


    // Timer
    let timeLeft = 3600; // 60 minutes in seconds
    const timerElement = document.getElementById('time');
    const timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        timerElement.textContent = `${minutes}:${seconds}`;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timerInterval);
            alert('Time is up! The exam will now be submitted.');
            submitExam();
        }
    }, 1000);

    // Submission logic
    const submitButton = document.getElementById('submit-exam');
    submitButton.addEventListener('click', submitExam);

    // This is the NEW submitExam function in js/app.js
function submitExam() {
    document.getElementById('submit-exam').disabled = true;
    clearInterval(timerInterval); // Stop the timer

    let score = 0;
    const totalQuestions = questionCounter;
    const allQuestions = examData.parts.flatMap(p => p.questions);
    
    for (let i = 1; i <= totalQuestions; i++) {
        const selectedOption = document.querySelector(`input[name="question${i}"]:checked`);
        if (selectedOption) {
            if (selectedOption.value.toLowerCase() === allQuestions[i - 1].a.toLowerCase()) {
                score++;
            }
        }
    }
    
    const finalResults = {
    name: `${studentInfo.firstname} ${studentInfo.lastname}`, // From login
    course: studentInfo.course,                             // From login
    section: studentInfo.section,                           // From login
    idNumber: studentInfo.id_number,                        // From login
    examTitle: examData.title,
    score: score,
    totalQuestions: totalQuestions

    };

    // Use fetch() to send the data to your server
 fetch('https://csuaparr-final-online-exam.onrender.com/submit-exam', { // <-- IMPORTANT: Use your server's actual URL
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalResults),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Save results for the results page and redirect
        localStorage.setItem('examResults', JSON.stringify(finalResults));
        window.location.href = 'results.html';
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('There was an error submitting your exam. Please contact your teacher.');
    });
}
}


// REPLACE your old handleResultsPage function with this corrected version

function handleResultsPage() {
    // The key 'examResults' might not exist if the user didn't submit via the backend version
    // We'll check for the student info object to be more robust
    const studentInfo = JSON.parse(localStorage.getItem('studentInfo'));
    const results = JSON.parse(localStorage.getItem('examResults'));

    if (!results || !studentInfo) {
        window.location.href = 'index.html';
        return;
    }

    // Use the correct key: results.totalQuestions instead of results.total
    const score = results.score;
    const total = results.totalQuestions; // <-- FIX IS HERE

    document.getElementById('result-name').textContent = results.studentName || studentInfo.name;
    document.getElementById('result-exam-title').textContent = results.examTitle;
    document.getElementById('score').textContent = score;
    document.getElementById('total-questions').textContent = total; // <-- FIX IS HERE

    // Check if total is not zero to avoid division by zero errors
    const percentage = (total > 0) ? ((score / total) * 100).toFixed(2) : 0; // <-- FIX IS HERE

    document.getElementById('percentage').textContent = percentage;

    const finishBtn = document.getElementById('finish-btn');
    finishBtn.addEventListener('click', () => {
        localStorage.removeItem('studentInfo');
        localStorage.removeItem('examResults');
        window.location.href = 'index.html';
    });
}