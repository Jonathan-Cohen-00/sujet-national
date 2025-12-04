// Real AI Service using Gemini API

const API_KEY = "AIzaSyBPSOpQs3e6ur9UHykuNMrOPbOUAOOZ9Y0";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export async function analyzeText(text) {
    const prompt = `
    Tu es TruthBot, un expert en vérification de faits et en détection de désinformation.
    Analyse le texte suivant et évalue sa fiabilité.
    
    Texte à analyser:
    "${text.substring(0, 4000)}"

    Réponds UNIQUEMENT au format JSON valide sans markdown (pas de \`\`\`json au début), avec la structure suivante:
    {
      "score": (nombre entre 0 et 100, où 100 est très fiable et 0 est une fake news totale),
      "verdict": (court texte: "Fiable", "Douteux", "Fake News", "Satire", etc.),
      "explanation": (explication concise de 2-3 phrases sur pourquoi tu as donné ce score. Mentionne les indicateurs de fiabilité ou de doute.)
    }
  `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Parse Gemini response
        const generatedText = data.candidates[0].content.parts[0].text;

        // Clean up potential markdown formatting if Gemini adds it despite instructions
        const jsonString = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

        const result = JSON.parse(jsonString);
        return result;

    } catch (error) {
        console.error("Gemini API Error:", error);
        // Fallback in case of error
        return {
            score: 0,
            verdict: "Erreur",
            explanation: `Erreur technique: ${error.message}. Vérifiez la console pour plus de détails.`
        };
    }
}
