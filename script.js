// ========================================
// ÉTAT GLOBAL DE L'APPLICATION
// ========================================

// État du quiz
let quizScore = 0;
let currentQuestion = 1;

// État utilisateur
let userScore = 0;
let co2Saved = 0;
let unlockedBadges = new Set();

// État des simulations
let simulationRunning = false;
let animationFrameId = null;
let vulnerableNodes = [];
let nirdNodes = [];

// Définition des badges
const badges = [
    { id: 'first_visit', icon: '🌟', name: 'Premier Pas', desc: 'Bienvenue dans le village NIRD !' },
    { id: 'quiz_master', icon: '🎓', name: 'Expert NIRD', desc: 'Score parfait au quiz' },
    { id: 'simulation_view', icon: '🔬', name: 'Scientifique', desc: 'Lancé une simulation' },
    { id: 'lab_explorer', icon: '🧪', name: 'Explorateur', desc: 'Visité le laboratoire' },
    { id: 'all_tabs', icon: '🗺️', name: 'Cartographe', desc: 'Exploré tous les onglets du lab' },
    { id: 'eco_warrior', icon: '🌱', name: 'Guerrier Écolo', desc: '500kg CO₂ économisé' },
    { id: 'resistance', icon: '⚔️', name: 'Résistant', desc: 'Complété tout le parcours' },
    { id: 'konami', icon: '🎮', name: 'Code Secret', desc: 'Trouvé le code Konami' }
];

let visitedLabTabs = new Set(['impact']); // On commence sur impact

// ========================================
// NAVIGATION ENTRE SECTIONS
// ========================================

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

        // Déverrouiller des badges selon la section
        if (sectionId === 'lab') {
            unlockBadge('lab_explorer');
            // Initialiser les graphiques si nécessaire
            setTimeout(() => {
                drawCO2Chart();
                drawEconomyChart();
                drawAutonomyGauge();
            }, 100);
        }
    }
}

// ========================================
// SYSTÈME DE BADGES ET GAMIFICATION
// ========================================

function unlockBadge(badgeId) {
    if (!unlockedBadges.has(badgeId)) {
        unlockedBadges.add(badgeId);
        updateBadgesCount();

        const badge = badges.find(b => b.id === badgeId);
        if (badge) {
            showToast(`🎉 Badge débloqué: ${badge.name}!`);
            addScore(100);
        }
    }
}

function updateBadgesCount() {
    document.getElementById('badges-count').textContent = unlockedBadges.size;
}

function addScore(points) {
    userScore += points;
    document.getElementById('user-score').textContent = userScore;
}

function addCO2Saved(kg) {
    co2Saved += kg;
    document.getElementById('co2-saved').textContent = Math.round(co2Saved);

    if (co2Saved >= 500 && !unlockedBadges.has('eco_warrior')) {
        unlockBadge('eco_warrior');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showBadges() {
    const modal = document.getElementById('badge-modal');
    const container = document.getElementById('badges-container');

    // Générer la grille de badges
    container.innerHTML = badges.map(badge => {
        const unlocked = unlockedBadges.has(badge.id);
        return `
            <div class="badge-item ${unlocked ? 'unlocked' : ''}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            </div>
        `;
    }).join('');

    modal.style.display = 'block';
}

function closeBadgeModal() {
    document.getElementById('badge-modal').style.display = 'none';
}

// Fermer le modal en cliquant à l'extérieur
window.onclick = function(event) {
    const modal = document.getElementById('badge-modal');
    if (event.target === modal) {
        closeBadgeModal();
    }
}

// ========================================
// QUIZ SECTION
// ========================================

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
        addScore(50);
        addCO2Saved(10);

        // Effet sonore visuel
        questionDiv.style.animation = 'none';
        setTimeout(() => {
            questionDiv.style.animation = 'pulse 0.5s ease';
        }, 10);
    } else {
        feedback.innerHTML = '❌ Pas tout à fait... La bonne réponse est mise en vert ci-dessus.';
        feedback.className = 'answer-feedback wrong';
        addScore(10); // On donne quand même des points pour avoir essayé
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
        unlockBadge('quiz_master');
        addCO2Saved(50);
    } else if (quizScore === 2) {
        messageP.innerHTML = '👍 Très bien ! Vous êtes sur la bonne voie pour rejoindre la résistance !';
        addCO2Saved(30);
    } else {
        messageP.innerHTML = '💪 Continuez à apprendre ! Chaque petit pas compte dans la résistance !';
        addCO2Saved(15);
    }

    resultDiv.classList.remove('hidden');
    nextButton.classList.remove('hidden');
}

// ========================================
// SIMULATION DE PROPAGATION DE VERS
// ========================================

class Node {
    constructor(x, y, type = 'vulnerable') {
        this.x = x;
        this.y = y;
        this.infected = false;
        this.isolated = false;
        this.type = type; // 'vulnerable' ou 'nird'
        this.infectionTime = 0;
        this.connections = [];
        this.radius = 8;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        if (this.isolated) {
            ctx.fillStyle = '#ffc107'; // Jaune pour isolé
            ctx.strokeStyle = '#ff9800';
        } else if (this.infected) {
            ctx.fillStyle = '#e74c3c'; // Rouge pour infecté
            ctx.strokeStyle = '#c0392b';
        } else {
            ctx.fillStyle = '#27ae60'; // Vert pour sain
            ctx.strokeStyle = '#229954';
        }

        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    update(nodes) {
        if (this.infected && !this.isolated) {
            this.infectionTime++;

            // Propager l'infection
            this.connections.forEach(connectedNode => {
                if (!connectedNode.infected && !connectedNode.isolated) {
                    const distance = Math.hypot(this.x - connectedNode.x, this.y - connectedNode.y);

                    if (this.type === 'vulnerable') {
                        // Réseau vulnérable : infection rapide
                        if (Math.random() < 0.05) {
                            connectedNode.infected = true;
                        }
                    } else {
                        // Réseau NIRD : détection et isolation
                        if (Math.random() < 0.3) {
                            // Le système NIRD détecte et isole
                            this.isolated = true;
                            // Isoler aussi les voisins suspects
                            this.connections.forEach(c => {
                                if (Math.random() < 0.5) {
                                    c.isolated = true;
                                }
                            });
                        } else if (Math.random() < 0.01) {
                            // Infection rare dans réseau NIRD
                            connectedNode.infected = true;
                        }
                    }
                }
            });
        }
    }
}

function createNetwork(canvasId, type, count = 100) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const nodes = [];

    // Créer les nœuds
    for (let i = 0; i < count; i++) {
        const x = Math.random() * (canvas.width - 40) + 20;
        const y = Math.random() * (canvas.height - 40) + 20;
        nodes.push(new Node(x, y, type));
    }

    // Créer des connexions
    nodes.forEach((node, i) => {
        // Connecter à 3-5 nœuds proches
        const connectionCount = Math.floor(Math.random() * 3) + 3;
        const distances = nodes
            .map((n, idx) => ({ node: n, dist: Math.hypot(n.x - node.x, n.y - node.y), idx }))
            .filter(d => d.idx !== i)
            .sort((a, b) => a.dist - b.dist);

        for (let j = 0; j < Math.min(connectionCount, distances.length); j++) {
            if (!node.connections.includes(distances[j].node)) {
                node.connections.push(distances[j].node);
            }
        }
    });

    // Infecter un nœud au hasard pour commencer
    const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
    randomNode.infected = true;

    return { canvas, ctx, nodes };
}

function drawNetwork(ctx, canvas, nodes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner les connexions
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    ctx.lineWidth = 1;
    nodes.forEach(node => {
        node.connections.forEach(connected => {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connected.x, connected.y);
            ctx.stroke();
        });
    });

    // Dessiner les nœuds
    nodes.forEach(node => node.draw(ctx));
}

function updateNetworkStats(nodes, type) {
    const healthy = nodes.filter(n => !n.infected && !n.isolated).length;
    const infected = nodes.filter(n => n.infected).length;
    const isolated = nodes.filter(n => n.isolated).length;

    document.getElementById(`healthy-${type}`).textContent = healthy;
    document.getElementById(`infected-${type}`).textContent = infected;

    if (type === 'nird') {
        document.getElementById(`isolated-${type}`).textContent = isolated;
    } else {
        const speed = (infected / nodes.length * 100).toFixed(1);
        document.getElementById(`speed-${type}`).textContent = speed;
    }
}

function animateSimulation() {
    if (!simulationRunning) return;

    if (vulnerableNodes.nodes) {
        vulnerableNodes.nodes.forEach(node => node.update(vulnerableNodes.nodes));
        drawNetwork(vulnerableNodes.ctx, vulnerableNodes.canvas, vulnerableNodes.nodes);
        updateNetworkStats(vulnerableNodes.nodes, 'vulnerable');
    }

    if (nirdNodes.nodes) {
        nirdNodes.nodes.forEach(node => node.update(nirdNodes.nodes));
        drawNetwork(nirdNodes.ctx, nirdNodes.canvas, nirdNodes.nodes);
        updateNetworkStats(nirdNodes.nodes, 'nird');
    }

    animationFrameId = requestAnimationFrame(animateSimulation);
}

function startSimulation(mode) {
    resetSimulation();

    simulationRunning = true;
    unlockBadge('simulation_view');
    addScore(75);

    if (mode === 'vulnerable' || mode === 'compare') {
        document.getElementById('vulnerable-network').style.display = 'block';
        vulnerableNodes = createNetwork('canvas-vulnerable', 'vulnerable');
    }

    if (mode === 'nird' || mode === 'compare') {
        document.getElementById('nird-network').style.display = 'block';
        nirdNodes = createNetwork('canvas-nird', 'nird');
    }

    animateSimulation();

    // Ajouter du CO2 économisé au fil du temps
    const co2Interval = setInterval(() => {
        if (simulationRunning) {
            addCO2Saved(5);
        } else {
            clearInterval(co2Interval);
        }
    }, 2000);
}

function resetSimulation() {
    simulationRunning = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    document.getElementById('vulnerable-network').style.display = 'none';
    document.getElementById('nird-network').style.display = 'none';

    vulnerableNodes = [];
    nirdNodes = [];
}

// ========================================
// LABORATOIRE - GRAPHIQUES
// ========================================

function switchLabTab(tabName) {
    // Gérer les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Gérer le contenu
    document.querySelectorAll('.lab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.getElementById(`lab-${tabName}`).style.display = 'block';

    // Track les onglets visités
    visitedLabTabs.add(tabName);
    if (visitedLabTabs.size >= 4) {
        unlockBadge('all_tabs');
    }

    // Redessiner les graphiques si nécessaire
    setTimeout(() => {
        if (tabName === 'impact') drawCO2Chart();
        if (tabName === 'economy') drawEconomyChart();
        if (tabName === 'autonomy') drawAutonomyGauge();
    }, 100);

    addScore(25);
}

function drawCO2Chart() {
    const canvas = document.getElementById('chart-co2');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Données
    const traditionalData = [850, 920, 880, 950, 900, 940];
    const nirdData = [850, 720, 650, 580, 520, 480];
    const labels = ['An 1', 'An 2', 'An 3', 'An 4', 'An 5', 'An 6'];

    const maxValue = Math.max(...traditionalData, ...nirdData);
    const barWidth = width / (labels.length * 2.5);
    const graphHeight = height - 60;

    // Titre
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Émissions CO₂ (kg/an)', 10, 20);

    // Légende
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(width - 200, 10, 20, 20);
    ctx.fillStyle = '#2d3436';
    ctx.font = '12px sans-serif';
    ctx.fillText('Approche Traditionnelle', width - 175, 25);

    ctx.fillStyle = '#27ae60';
    ctx.fillRect(width - 200, 35, 20, 20);
    ctx.fillStyle = '#2d3436';
    ctx.fillText('Approche NIRD', width - 175, 50);

    // Barres
    labels.forEach((label, i) => {
        const x = (i * 2.5 * barWidth) + 40;
        const tradHeight = (traditionalData[i] / maxValue) * graphHeight;
        const nirdHeight = (nirdData[i] / maxValue) * graphHeight;

        // Barre traditionnelle
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x, height - tradHeight - 40, barWidth, tradHeight);

        // Barre NIRD
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + barWidth + 5, height - nirdHeight - 40, barWidth, nirdHeight);

        // Label
        ctx.fillStyle = '#2d3436';
        ctx.font = '11px sans-serif';
        ctx.fillText(label, x, height - 20);
    });
}

function drawEconomyChart() {
    const canvas = document.getElementById('chart-economy');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Données cumulatives
    const years = ['An 1', 'An 2', 'An 3', 'An 4', 'An 5'];
    const traditionalCost = [890, 2080, 3270, 4460, 5650]; // Coût cumulatif
    const nirdCost = [150, 150, 150, 300, 300]; // Coût cumulatif

    const maxCost = Math.max(...traditionalCost);
    const graphHeight = height - 80;
    const graphWidth = width - 100;
    const xStep = graphWidth / (years.length - 1);

    // Titre
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Coûts Cumulés (€)', 10, 20);

    // Axes
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 40);
    ctx.lineTo(50, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();

    // Courbe traditionnelle
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    years.forEach((year, i) => {
        const x = 50 + (i * xStep);
        const y = height - 40 - ((traditionalCost[i] / maxCost) * graphHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Courbe NIRD
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    years.forEach((year, i) => {
        const x = 50 + (i * xStep);
        const y = height - 40 - ((nirdCost[i] / maxCost) * graphHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#2d3436';
    ctx.font = '12px sans-serif';
    years.forEach((year, i) => {
        const x = 50 + (i * xStep);
        ctx.fillText(year, x - 15, height - 20);
    });

    // Légende
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(width - 180, 10, 20, 3);
    ctx.fillStyle = '#2d3436';
    ctx.fillText('Traditionnel', width - 155, 15);

    ctx.fillStyle = '#27ae60';
    ctx.fillRect(width - 180, 30, 20, 3);
    ctx.fillStyle = '#2d3436';
    ctx.fillText('NIRD', width - 155, 35);
}

function drawAutonomyGauge() {
    const canvas = document.getElementById('gauge-autonomy');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 40;
    const radius = Math.min(width, height) / 2 - 40;

    ctx.clearRect(0, 0, width, height);

    // Arc de fond
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.lineWidth = 30;
    ctx.strokeStyle = '#e9ecef';
    ctx.stroke();

    // Arc de progression (92% pour NIRD)
    const autonomyLevel = 0.92;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + (Math.PI * autonomyLevel));
    ctx.lineWidth = 30;
    ctx.strokeStyle = '#27ae60';
    ctx.stroke();

    // Texte central
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('92%', centerX, centerY - 20);

    ctx.font = '16px sans-serif';
    ctx.fillText('Autonomie NIRD', centerX, centerY + 10);

    // Labels
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0%', centerX - radius - 20, centerY + 5);
    ctx.textAlign = 'right';
    ctx.fillText('100%', centerX + radius + 20, centerY + 5);
}

// ========================================
// ANIMATIONS ET EFFETS
// ========================================

// Animation de pulse
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);

// ========================================
// INITIALISATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏛️ Bienvenue dans le Village Numérique Résistant !');
    console.log('Projet NIRD - Numérique Inclusif, Responsable et Durable');

    // Débloquer le badge de première visite
    unlockBadge('first_visit');

    // Afficher la section intro par défaut
    goToSection('intro');

    // Initialiser les graphiques du laboratoire
    setTimeout(() => {
        drawCO2Chart();
        drawEconomyChart();
        drawAutonomyGauge();
    }, 500);
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

        unlockBadge('konami');
        addScore(500);
        showToast('🎮 Code Konami activé ! +500 points !');

        console.log('🎉 Easter egg trouvé ! La résistance vous remercie !');
    }
});

// Vérifier si l'utilisateur a complété tout le parcours
setInterval(() => {
    if (unlockedBadges.size >= 6 && !unlockedBadges.has('resistance')) {
        unlockBadge('resistance');
        addCO2Saved(200);
    }
}, 5000);
