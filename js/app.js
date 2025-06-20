// app.js - COMPLETE AND FINAL VERSION
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

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.textContent = '';
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        const lastname = document.getElementById('lastname').value;
        const idNumber = document.getElementById('idNumber').value;
        const examType = document.getElementById('exam-select').value;
        
        try {
            const response = await fetch('https://csuaparr-final-online-exam.onrender.com/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastname, idNumber })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed.');
            }
            
            localStorage.setItem('authToken', data.accessToken);
            localStorage.setItem('studentInfo', JSON.stringify(data.studentDetails));
            localStorage.setItem('examType', examType);

            window.location.href = 'exam.html';

        } catch (error) {
            errorMessageDiv.textContent = error.message;
            submitButton.disabled = false;
            submitButton.textContent = 'Login and Start Exam';
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
    const allQuestions = examData.parts.flatMap(part => part.questions);
    let currentQuestionIndex = 0;

    const examForm = document.getElementById('exam-form');
    const navigatorGrid = document.getElementById('navigator-grid');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-exam');

    document.getElementById('exam-title').textContent = examData.title;
    document.getElementById('student-name').textContent = `${studentInfo.firstname} ${studentInfo.lastname}`;
    document.getElementById('student-id').textContent = studentInfo.id_number;
    

    // --- Create all question elements and navigator buttons ---
    allQuestions.forEach((q, index) => {
        const questionWrapper = document.createElement('div');
        questionWrapper.className = 'question-wrapper';
        questionWrapper.id = `question-wrapper-${index}`;
        
        const questionBlock = document.createElement('div');
        questionBlock.className = 'question-block';
        questionBlock.innerHTML = `<p>${index + 1}. ${q.q}</p>`;

        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
        
        const choices = q.o ? q.o.map((opt, i) => ({ label: `${['A','B','C','D'][i]}) ${opt}`, value: ['A','B','C','D'][i] })) : [{label: 'True', value: 'True'}, {label: 'False', value: 'False'}];
        
        choices.forEach(choice => {
            const label = document.createElement('label');
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `question${index}`;
            radio.value = choice.value;
            label.appendChild(radio);
            label.append(` ${choice.label}`);
            optionsDiv.appendChild(label);
        });

        questionBlock.appendChild(optionsDiv);
        questionWrapper.appendChild(questionBlock);
        examForm.appendChild(questionWrapper);

        const navBtn = document.createElement('button');
        navBtn.className = 'nav-btn';
        navBtn.textContent = index + 1;
        navBtn.dataset.index = index;
        navigatorGrid.appendChild(navBtn);
    });

// --- NEW: Load saved progress when page starts ---
    async function loadProgress() {
        console.log("Checking for saved progress...");
        try {
            const response = await fetch('https://csuaparr-final-online-exam.onrender.com/api/progress', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) return;
            const savedAnswers = await response.json();
            if (savedAnswers) {
                console.log("Saved progress found. Repopulating answers.");
                Object.entries(savedAnswers).forEach(([questionIndex, answerValue]) => {
                    const radio = document.querySelector(`input[name="question${questionIndex}"][value="${answerValue}"]`);
                    if (radio) {
                        radio.checked = true;
                        document.querySelector(`.nav-btn[data-index='${questionIndex}']`).classList.add('answered');
                    }
                });
            }
        } catch (error) {
            console.error("Could not load progress:", error);
        }
    }

    // --- NEW: Auto-save progress periodically ---
    function saveProgress() {
        const currentAnswers = {};
        allQuestions.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            if (selectedOption) {
                currentAnswers[index] = selectedOption.value;
            }
        });

        // Send to server without blocking user
        navigator.sendBeacon('https://csuaparr-final-online-exam.onrender.com/api/progress', JSON.stringify({
            examType,
            answers: currentAnswers
        }));
        // Note: Using sendBeacon is more reliable for background tasks than fetch.
        // We need to adjust the backend to get the token differently or make the endpoint public for this specific use case if needed.
        // For now, let's stick with fetch for simplicity in this example.
        fetch('https://csuaparr-final-online-exam.onrender.com/api/progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ examType, answers: currentAnswers }),
            keepalive: true // Helps ensure request completes if page is closed
        }).then(res => {
            if(res.ok) console.log("Progress saved at", new Date().toLocaleTimeString());
        });
    }

    // --- Initial Setup ---
    showQuestion(0);
    loadProgress().then(() => {
        // Start auto-save AFTER loading progress to avoid race conditions
        autoSaveInterval = setInterval(saveProgress, 60000); // Save every 60 seconds
    });

    function showQuestion(index) {
        document.querySelectorAll('.question-wrapper').forEach(qw => qw.style.display = 'none');
        document.getElementById(`question-wrapper-${index}`).style.display = 'block';
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.nav-btn[data-index='${index}']`).classList.add('active');
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === allQuestions.length - 1;
    }

    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    navigatorGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('nav-btn')) {
            currentQuestionIndex = parseInt(event.target.dataset.index);
            showQuestion(currentQuestionIndex);
        }
    });
    
    examForm.addEventListener('change', (event) => {
        if (event.target.type === 'radio') {
            const questionName = event.target.name;
            const questionIndex = parseInt(questionName.replace('question', ''));
            document.querySelector(`.nav-btn[data-index='${questionIndex}']`).classList.add('answered');
        }
    });
    
    showQuestion(0);

    const timerElement = document.getElementById('time');
    const examDurationInSeconds = 3600; // 60 minutes
    let timerInterval;

    function startPersistentTimer() {
        // Stop any existing timer to prevent duplicates
        if (timerInterval) clearInterval(timerInterval);

        // Get the exam end time from localStorage
        let examEndTime = localStorage.getItem('examEndTime');

        // If it doesn't exist, this is the first time. Set it now.
        if (!examEndTime) {
            examEndTime = Date.now() + (examDurationInSeconds * 1000);
            localStorage.setItem('examEndTime', examEndTime);
        }

        // Function to update the timer display
        const updateTimer = () => {
            const currentTime = Date.now();
            const timeLeft = Math.round((examEndTime - currentTime) / 1000);

            if (timeLeft <= 0) {
                timerElement.textContent = "0:00";
                clearInterval(timerInterval);
                alert('Time is up! The exam will now be submitted.');
                submitExam();
            } else {
                const minutes = Math.floor(timeLeft / 60);
                let seconds = timeLeft % 60;
                seconds = seconds < 10 ? '0' + seconds : seconds;
                timerElement.textContent = `${minutes}:${seconds}`;
            }
        };

        // Update the timer immediately and then every second
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // --- SERVER-SIDE HEARTBEAT LOGIC ---
    let heartbeatInterval;

    function startHeartbeat() {
        // Stop any previous interval
        if (heartbeatInterval) clearInterval(heartbeatInterval);

        const sendHeartbeat = () => {
            fetch('https://csuaparr-final-online-exam.onrender.com/api/heartbeat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })
            .then(response => {
                if (response.status === 409) {
                    // Another device has taken over the session. Lock this page.
                    clearInterval(heartbeatInterval);
                    if (timerInterval) clearInterval(timerInterval); // Stop the timer
                    document.getElementById('exam-container').style.display = 'none';
                    // You can reuse the multi-tab message div or create a new one
                    const msgDiv = document.getElementById('multi-tab-message');
                    msgDiv.innerHTML = '<h1>Session Expired</h1><p style="font-size: 1.2rem; color: #dc3545;">This exam session has been taken over by a new login on another device or browser. This tab is now inactive.</p>';
                    msgDiv.style.display = 'block';
                } else if (!response.ok) {
                    console.error('Heartbeat failed.', response.status);
                }
            })
            .catch(err => console.error('Network error during heartbeat:', err));
        };

        // Send a heartbeat immediately and then every 15 seconds
        sendHeartbeat();
        heartbeatInterval = setInterval(sendHeartbeat, 15000); 
    }

    // Start the heartbeat when the page loads
    startHeartbeat();

    // Also, clear the heartbeat interval when the user submits the exam
    // Find the submitExam function and add this line at the top:
    // function submitExam() {
    //     clearInterval(heartbeatInterval); // <-- ADD THIS
    //     ... rest of the function
    // }
    
    // Start the timer when the exam page loads
    startPersistentTimer();

    // --- Security Features ---
    let tabSwitchCount = 0;
    const maxSwitches = 3;

    document.addEventListener('visibilitychange', () => {
        // This event fires both when the user leaves and when they return.

        if (document.hidden) {
            // The user has switched AWAY from the tab.
            // We just silently increment the counter. We don't show an alert here.
            tabSwitchCount++;
        } else {
            // The user has RETURNED to the tab.
            // NOW we check the count and show a warning if necessary.
            if (tabSwitchCount >= maxSwitches) {
                // The user has returned after the final allowed switch.
                // Show the final alert and then submit.
                alert(`You have switched tabs ${maxSwitches} or more times. The exam will now be submitted automatically.`);
                submitExam();
            } else if (tabSwitchCount > 0) {
                // Show a warning for the first and second switches upon returning.
                const remaining = maxSwitches - tabSwitchCount;
                alert(`Warning: You have switched away from the exam tab ${tabSwitchCount} time(s).\n\nSwitching away ${remaining} more time(s) will result in automatic submission.`);
            }
        }
    });

    document.addEventListener('copy', (e) => e.preventDefault());
    
    submitBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to submit your exam?")) {
            submitExam();
        }
    });

    function submitExam() {
        submitBtn.disabled = true;
        clearInterval(timerInterval);
        
        let score = 0;
        const studentAnswers = [];
        
        allQuestions.forEach((q, index) => {
            const selectedOption = document.querySelector(`input[name="question${index}"]:checked`);
            const studentAnswer = selectedOption ? selectedOption.value : "No Answer";
            const isCorrect = studentAnswer.toLowerCase() === q.a.toLowerCase();
            
            if (isCorrect) {
                score++;
            }
            studentAnswers.push({
                question: q.q,
                studentAnswer: studentAnswer,
                correctAnswer: q.a,
                isCorrect: isCorrect
            });
        });
        
        const finalResults = {
            name: `${studentInfo.firstname} ${studentInfo.lastname}`,
            course: studentInfo.course,
            section: studentInfo.section,
            idNumber: studentInfo.id_number,
            examTitle: examData.title,
            score: score,
            totalQuestions: allQuestions.length
        };
        
        const submissionBody = {
            studentData: finalResults,
            answers: studentAnswers
        };

        fetch('https://csuaparr-final-online-exam.onrender.com/submit-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(submissionBody)
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
            alert('There was an error submitting your exam. Your token may have expired or there was a network issue. Please log in again.');
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
        localStorage.removeItem('examEndTime');
        window.location.href = 'index.html';
    });
}