import { analyzeText } from './ai_service.js';

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzeContent") {
        handleAnalysis(request.text, sendResponse);
        return true; // Will respond asynchronously
    }
});

async function handleAnalysis(text, sendResponse) {
    try {
        const result = await analyzeText(text);
        sendResponse({ success: true, data: result });
    } catch (error) {
        console.error("Analysis failed:", error);
        sendResponse({ success: false, error: error.message });
    }
}
