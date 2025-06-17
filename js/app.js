// app.js - FINAL VERSION WITH AUTHENTICATION
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
    const loginForm = document.getElementById('student-login-form');
    const errorMessageDiv = document.getElementById('error-message');

    // This prevents an error if the element doesn't exist on other pages
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.textContent = ''; // Clear previous errors
        document.querySelector('#student-login-form button').disabled = true; // Disable button

        const lastname = document.getElementById('lastname').value;
        const idNumber = document.getElementById('idNumber').value;
        const examType = document.getElementById('exam-select').value;
        
        try {
            const response = await fetch('https://csuaparr-final-online-exam.onrender.com/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastname, idNumber })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed.');
            }

            const data = await response.json();
            
            // Login successful, save token and student info
            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('studentInfo', JSON.stringify(data.studentDetails));
            localStorage.setItem('examType', examType);

            window.location.href = 'exam.html';

        } catch (error) {
            errorMessageDiv.textContent = error.message;
            document.querySelector('#student-login-form button').disabled = false; // Re-enable button on error
            console.error('Login Error:', error);
        }
    });
}

function handleExamPage() {
    const studentInfo = JSON.parse(localStorage.getItem('studentInfo'));
    const examType = localStorage.getItem('examType');
    const authToken = localStorage.getItem('authToken');

    if (!authToken || !studentInfo || !examType) {
        window.location.href = 'index.html';
        return;
    }
    
    const examData = exams[examType];
    const examForm = document.getElementById('exam-form');
    let questionCounter = 0;

    document.getElementById('exam-title').textContent = examData.title;
    document.getElementById('student-name').textContent = `${studentInfo.firstname} ${studentInfo.lastname}`;
    document.getElementById('student-id').textContent = studentInfo.id_number;

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
            if (q.o) {
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
            } else {
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
    
    let timeLeft = 3600;
    const timerElement = document.getElementById('time');
    const timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        timerElement.textContent = `${minutes}:${seconds}`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            alert('Time is up!');
            submitExam();
        }
    }, 1000);

    let tabSwitchCount = 0;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            tabSwitchCount++;
            if (tabSwitchCount >= 3) {
                alert('You have switched tabs three times. Your exam will now be submitted.');
                submitExam();
            }
        }
    });
    document.addEventListener('copy', (e) => e.preventDefault());
    
    document.getElementById('submit-exam').addEventListener('click', submitExam);

    function submitExam() {
        document.getElementById('submit-exam').disabled = true;
        clearInterval(timerInterval);
        
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
            name: `${studentInfo.firstname} ${studentInfo.lastname}`,
            course: studentInfo.course,
            section: studentInfo.section,
            idNumber: studentInfo.id_number,
            examTitle: examData.title,
            score: score,
            totalQuestions: totalQuestions
        };

        fetch('https://csuaparr-final-online-exam.onrender.com/submit-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(finalResults)
        })
        .then(response => {
            if (!response.ok) throw new Error('Submission failed. Server responded with an error.');
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            localStorage.setItem('examResults', JSON.stringify(finalResults));
            window.location.href = 'results.html';
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('There was an error submitting your exam. Your token may have expired. Please log in again.');
            window.location.href = 'index.html';
        });
    }
}

function handleResultsPage() {
    const results = JSON.parse(localStorage.getItem('examResults'));
    if (!results) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('result-name').textContent = results.name;
    document.getElementById('result-exam-title').textContent = results.examTitle;
    document.getElementById('score').textContent = results.score;
    document.getElementById('total-questions').textContent = results.totalQuestions;
    const percentage = (results.totalQuestions > 0) ? ((results.score / results.totalQuestions) * 100).toFixed(2) : 0;
    document.getElementById('percentage').textContent = percentage;

    document.getElementById('finish-btn').addEventListener('click', () => {
        localStorage.removeItem('studentInfo');
        localStorage.removeItem('examResults');
        localStorage.removeItem('authToken');
        localStorage.removeItem('examType');
        window.location.href = 'index.html';
    });
}