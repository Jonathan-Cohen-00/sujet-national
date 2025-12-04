document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const initialState = document.getElementById('initial-state');
    const resultState = document.getElementById('result-state');
    const resetBtn = document.getElementById('reset-btn');

    const scoreValue = document.getElementById('score-value');
    const verdictText = document.getElementById('verdict-text');
    const explanationText = document.getElementById('explanation-text');
    const scoreCircle = document.querySelector('.score-circle');

    analyzeBtn.addEventListener('click', async () => {
        // Show loading state
        analyzeBtn.querySelector('.btn-text').style.display = 'none';
        analyzeBtn.querySelector('.loader').style.display = 'block';
        analyzeBtn.disabled = true;

        try {
            // 1. Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                throw new Error("Impossible d'accéder à l'onglet actif.");
            }

            // 2. Execute content script to get text
            // We use sendMessage to the tab. 
            // Note: We need to ensure content script is injected. 
            // For this demo, we assume it is via manifest matches.

            chrome.tabs.sendMessage(tab.id, { action: "extractContent" }, (response) => {
                if (chrome.runtime.lastError) {
                    // If content script is not ready (e.g. restricted page), handle error
                    showError("Impossible de lire cette page. Essayez de recharger.");
                    return;
                }

                if (response && response.content) {
                    // 3. Send text to background for analysis
                    chrome.runtime.sendMessage({
                        action: "analyzeContent",
                        text: response.content
                    }, (analysisResult) => {
                        if (analysisResult.success) {
                            displayResults(analysisResult.data);
                        } else {
                            showError("Erreur lors de l'analyse: " + analysisResult.error);
                        }
                    });
                } else {
                    showError("Aucun contenu texte trouvé.");
                }
            });

        } catch (error) {
            showError(error.message);
        }
    });

    resetBtn.addEventListener('click', () => {
        initialState.classList.remove('hidden');
        resultState.classList.add('hidden');
        resetButtonState();
    });

    function displayResults(data) {
        initialState.classList.add('hidden');
        resultState.classList.remove('hidden');

        scoreValue.textContent = data.score + '%';
        verdictText.textContent = data.verdict;
        explanationText.textContent = data.explanation;

        // Update colors based on score
        let color = '#10b981'; // Green
        if (data.score < 50) color = '#ef4444'; // Red
        else if (data.score < 70) color = '#f59e0b'; // Orange

        scoreCircle.style.background = `conic-gradient(${color} ${data.score}%, #e2e8f0 ${data.score}%)`;
        verdictText.style.color = color;

        resetButtonState();
    }

    function showError(msg) {
        alert(msg); // Simple alert for MVP
        resetButtonState();
    }

    function resetButtonState() {
        analyzeBtn.querySelector('.btn-text').style.display = 'block';
        analyzeBtn.querySelector('.loader').style.display = 'none';
        analyzeBtn.disabled = false;
    }
});
