// État du quiz
let quizScore = 0;
let currentQuestion = 1;

// Navigation entre sections
function goToSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');

        // Scroll vers le haut
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Expansion des piliers NIRD
function togglePillar(pillarElement) {
    const isExpanded = pillarElement.classList.contains('expanded');

    // Fermer tous les piliers
    document.querySelectorAll('.pillar').forEach(pillar => {
        pillar.classList.remove('expanded');
    });

    // Ouvrir le pilier cliqué s'il n'était pas déjà ouvert
    if (!isExpanded) {
        pillarElement.classList.add('expanded');
    }
}

// Vérification de réponse du quiz
function checkAnswer(questionNumber, answer) {
    const questionDiv = document.getElementById(`q${questionNumber}`);
    const buttons = questionDiv.querySelectorAll('.quiz-btn');
    const feedback = questionDiv.querySelector('.answer-feedback');

    // Désactiver tous les boutons
    buttons.forEach(btn => {
        btn.disabled = true;
    });

    // Marquer la bonne et la mauvaise réponse
    buttons.forEach(btn => {
        const btnAnswer = btn.getAttribute('onclick').includes('correct') ? 'correct' : 'wrong';
        if (btnAnswer === 'correct') {
            btn.classList.add('correct');
        }
    });

    // Feedback
    if (answer === 'correct') {
        quizScore++;
        feedback.innerHTML = '✅ Bravo ! C\'est la bonne réponse !';
        feedback.className = 'answer-feedback correct';

        // Effet sonore visuel
        questionDiv.style.animation = 'none';
        setTimeout(() => {
            questionDiv.style.animation = 'pulse 0.5s ease';
        }, 10);
    } else {
        feedback.innerHTML = '❌ Pas tout à fait... La bonne réponse est mise en vert ci-dessus.';
        feedback.className = 'answer-feedback wrong';
    }

    // Passer à la question suivante après 2 secondes
    setTimeout(() => {
        nextQuestion(questionNumber);
    }, 2000);
}

// Passer à la question suivante
function nextQuestion(currentQuestionNumber) {
    const currentQ = document.getElementById(`q${currentQuestionNumber}`);
    const nextQ = document.getElementById(`q${currentQuestionNumber + 1}`);

    if (currentQ) {
        currentQ.classList.add('hidden');
    }

    if (nextQ) {
        nextQ.classList.remove('hidden');
    } else {
        // Fin du quiz
        showQuizResult();
    }
}

// Afficher le résultat du quiz
function showQuizResult() {
    const resultDiv = document.getElementById('result');
    const scoreSpan = document.getElementById('score');
    const messageP = resultDiv.querySelector('.result-message');
    const nextButton = document.getElementById('quiz-next');

    scoreSpan.textContent = quizScore;

    // Message selon le score
    if (quizScore === 3) {
        messageP.innerHTML = '🏆 Parfait ! Vous êtes un·e vrai·e résistant·e numérique !';
    } else if (quizScore === 2) {
        messageP.innerHTML = '👍 Très bien ! Vous êtes sur la bonne voie pour rejoindre la résistance !';
    } else {
        messageP.innerHTML = '💪 Continuez à apprendre ! Chaque petit pas compte dans la résistance !';
    }

    resultDiv.classList.remove('hidden');
    nextButton.classList.remove('hidden');
}

// Animation de pulse
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏛️ Bienvenue dans le Village Numérique Résistant !');
    console.log('Projet NIRD - Numérique Inclusif, Responsable et Durable');

    // Afficher la section intro par défaut
    goToSection('intro');
});

// Easter egg : Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);

    if (konamiCode.join(',') === konamiSequence.join(',')) {
        const body = document.body;
        body.style.animation = 'rainbow 3s linear infinite';

        const rainbowStyle = document.createElement('style');
        rainbowStyle.textContent = `
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(rainbowStyle);

        setTimeout(() => {
            body.style.animation = '';
        }, 3000);

        console.log('🎉 Easter egg trouvé ! La résistance vous remercie !');
    }
});
