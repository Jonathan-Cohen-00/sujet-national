// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractContent") {
        const content = extractPageContent();
        sendResponse({ content: content });
    }
    return true;
});

function extractPageContent() {
    // Simple extraction strategy: Get all paragraphs and headers
    // In a real scenario, we might use Readability.js or similar libraries

    const article = document.querySelector('article');
    let text = "";

    if (article) {
        text = article.innerText;
    } else {
        // Fallback to body text, trying to avoid menus/footers if possible
        // This is a naive implementation for the hackathon
        const paragraphs = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
        text = Array.from(paragraphs).map(p => p.innerText).join('\n\n');
    }

    // Limit text length to avoid token limits in a real API
    return text.substring(0, 5000);
}
