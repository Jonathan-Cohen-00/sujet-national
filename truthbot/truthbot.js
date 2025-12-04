/**
 * TruthBot - AI-Powered Fact-Checking Widget
 * Défi AI4GOOD - Nuit de l'Info 2024
 *
 * Widget pluggable pour détecter la désinformation sur n'importe quel site web.
 * Analyse du texte et des images au survol avec multiple APIs de fact-checking.
 */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================

    const CONFIG = {
        position: 'bottom-right', // Position du widget
        theme: 'nird', // Thème visuel
        apis: {
            // Google Gemini API pour fact-checking intelligent
            geminiFactCheck: {
                enabled: true,
                apiKey: 'AIzaSyBt1a6mcCXCHAoPV6K6cW5Ogc4oT_Hy2yM', // À configurer par l'utilisateur
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
                model: 'gemini-2.5-flash', // Ce modèle fonctionne, on augmente juste les tokens
                fallbackModels: [] // Pas de fallback
            },
            // Analyse heuristique locale (toujours activée)
            localAnalysis: {
                enabled: true
            },
            // Analyse sémantique avancée (utilise une API externe)
            semanticAnalysis: {
                enabled: true,
                endpoint: 'https://api.semanticscholar.org/v1/paper/search'
            }
        },
        // Seuils de détection
        thresholds: {
            minTextLength: 20, // Longueur minimale de texte à analyser
            credibilityWarning: 50, // Seuil d'alerte (< 50% = suspect)
            credibilityDanger: 30 // Seuil de danger (< 30% = très suspect)
        },
        // Configuration du hover
        hover: {
            delay: 500, // Délai avant activation (ms)
            enabled: true
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================

    let widgetInitialized = false;
    let currentAnalysis = null;
    let hoverTimeout = null;
    let selectedElement = null;

    // ========================================
    // ANALYSEURS DE CONTENU
    // ========================================

    /**
     * Analyseur heuristique local
     * Détecte des patterns suspects dans le texte
     */
    class LocalAnalyzer {
        constructor() {
            // Patterns suspects
            this.suspiciousPatterns = [
                /TOUT EN MAJUSCULES/g,
                /!!!+/g,
                /\?\?\?+/g,
                /URGENT/gi,
                /INCROYABLE/gi,
                /CHOQUANT/gi,
                /SCANDALE/gi,
                /RÉVÉLATION/gi,
                /ILS NE VEULENT PAS QUE/gi,
                /PARTAGEZ AVANT/gi,
                /CENSURÉ/gi,
                /LA VÉRITÉ/gi
            ];

            // Mots-clés sensationnalistes
            this.clickbaitWords = [
                'incroyable', 'choquant', 'vous n\'allez pas croire',
                'secret', 'caché', 'révélé', 'enfin', 'urgent',
                'interdit', 'censuré', 'complot', 'scandale'
            ];

            // Sources fiables (domaines)
            this.trustedDomains = [
                'gov.fr', 'education.fr', 'legifrance.gouv.fr',
                'who.int', 'afp.com', 'lemonde.fr', 'lefigaro.fr',
                'liberation.fr', 'francetvinfo.fr', 'wikipedia.org'
            ];
        }

        /**
         * Analyse le texte pour détecter des signes de désinformation
         */
        async analyze(text) {
            let score = 100; // Score initial parfait
            const warnings = [];
            const details = [];

            // Préparer l'affichage du texte analysé
            const textPreview = text.length > 150
                ? `"${text.substring(0, 150)}..."`
                : `"${text}"`;
            details.push(`Texte analysé : ${textPreview}`);

            // 1. Vérifier la longueur du texte
            if (text.length < 50) {
                return {
                    score: null,
                    confidence: 0,
                    message: 'Texte trop court pour analyse',
                    warnings: [],
                    details: []
                };
            }

            // 2. Détecter les patterns suspects
            let suspiciousCount = 0;
            this.suspiciousPatterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) {
                    suspiciousCount += matches.length;
                }
            });

            if (suspiciousCount > 0) {
                const penalty = Math.min(suspiciousCount * 10, 30);
                score -= penalty;
                warnings.push(`${suspiciousCount} pattern(s) suspect(s) détecté(s)`);
                details.push('Utilisation excessive de ponctuation ou majuscules');
            }

            // 3. Détecter les mots sensationnalistes
            const lowerText = text.toLowerCase();
            let clickbaitCount = 0;
            this.clickbaitWords.forEach(word => {
                if (lowerText.includes(word)) {
                    clickbaitCount++;
                }
            });

            if (clickbaitCount > 2) {
                score -= 20;
                warnings.push(`${clickbaitCount} mot(s) sensationnaliste(s)`);
                details.push('Langage émotionnel ou sensationnaliste détecté');
            }

            // 4. Vérifier la présence d'URLs
            const urlPattern = /(https?:\/\/[^\s]+)/g;
            const urls = text.match(urlPattern);

            if (urls) {
                let trustedCount = 0;
                urls.forEach(url => {
                    const isTrusted = this.trustedDomains.some(domain =>
                        url.includes(domain)
                    );
                    if (isTrusted) trustedCount++;
                });

                if (trustedCount > 0) {
                    score += 10;
                    details.push(`${trustedCount} source(s) fiable(s) détectée(s)`);
                } else if (urls.length > 0) {
                    score -= 10;
                    warnings.push('Aucune source vérifiable');
                }
            } else {
                score -= 15;
                warnings.push('Absence de sources');
                details.push('Aucune source ou référence fournie');
            }

            // 5. Vérifier la structure du texte
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            if (sentences.length < 2) {
                score -= 10;
                warnings.push('Texte trop court ou mal structuré');
            }

            // Normaliser le score
            score = Math.max(0, Math.min(100, score));

            return {
                score: score,
                confidence: 75, // Confiance dans l'analyse locale
                source: 'Analyse Heuristique',
                message: this.getScoreMessage(score),
                warnings: warnings,
                details: details
            };
        }

        getScoreMessage(score) {
            if (score >= 70) return 'Contenu probablement fiable';
            if (score >= 50) return 'Contenu à vérifier avec prudence';
            if (score >= 30) return 'Contenu suspect, vérification recommandée';
            return 'Contenu très suspect, ne pas partager';
        }
    }

    /**
     * Analyseur Google Gemini API pour fact-checking intelligent
     */
    class GeminiFactCheckAnalyzer {
        constructor(apiKey) {
            this.apiKey = apiKey;
            this.endpoint = CONFIG.apis.geminiFactCheck.endpoint;
            this.model = CONFIG.apis.geminiFactCheck.model;
            this.fallbackModels = CONFIG.apis.geminiFactCheck.fallbackModels || [];
            this.currentModelIndex = 0;
        }

        async analyze(text) {
            if (!this.apiKey) {
                return {
                    score: null,
                    confidence: 0,
                    source: 'Gemini AI',
                    message: 'Clé API non configurée',
                    warnings: ['Configuration requise'],
                    details: []
                };
            }

            try {
                // Préparer le prompt pour Gemini
                const prompt = this.buildFactCheckPrompt(text);

                // Utiliser le format REST API officiel avec x-goog-api-key header
                const response = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 8192, // Très augmenté pour gérer thinking (1000+) + réponse complète
                            responseModalities: ["TEXT"], // Forcer uniquement du texte
                        },
                        // Instruction pour obtenir une réponse concise au format demandé
                        systemInstruction: {
                            parts: [{
                                text: "Tu es un fact-checker. Réponds EXACTEMENT dans le format demandé (SCORE, CONFIANCE, VERDICT, RAISON), sans texte avant ou après."
                            }]
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_NONE"
                            }
                        ]
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();

                    // Gestion spécifique pour l'erreur d'API non activée
                    if (errorData.error && errorData.error.code === 403) {
                        const projectId = errorData.error.details?.[0]?.metadata?.consumer?.replace('projects/', '');
                        return {
                            score: null,
                            confidence: 0,
                            source: 'Gemini AI',
                            message: 'API non activée',
                            warnings: ['L\'API Generative Language doit être activée'],
                            details: [
                                'Pour activer l\'API Gemini :',
                                '1. Visitez https://console.developers.google.com/apis/api/generativelanguage.googleapis.com',
                                '2. Sélectionnez votre projet',
                                '3. Cliquez sur "Activer"',
                                '4. Attendez quelques minutes puis réessayez'
                            ]
                        };
                    }

                    // Gestion spécifique pour quota dépassé (429)
                    if (errorData.error && errorData.error.code === 429) {
                        return {
                            score: null,
                            confidence: 0,
                            source: 'Gemini AI',
                            message: 'Quota dépassé',
                            warnings: ['Limite d\'utilisation Gemini atteinte'],
                            details: [
                                'Les autres analyseurs fonctionnent toujours',
                                'Attendez quelques minutes ou vérifiez votre quota sur:',
                                'https://ai.dev/usage'
                            ]
                        };
                    }

                    // Gestion spécifique pour modèle non trouvé (404)
                    if (errorData.error && errorData.error.code === 404) {
                        return {
                            score: null,
                            confidence: 0,
                            source: 'Gemini AI',
                            message: 'Modèle non disponible',
                            warnings: ['Le modèle Gemini n\'est pas accessible'],
                            details: [
                                `Modèle demandé: ${this.model}`,
                                'Les autres analyseurs fonctionnent toujours',
                                'Vérifiez la disponibilité des modèles sur:',
                                'https://ai.google.dev/gemini-api/docs/models/gemini'
                            ]
                        };
                    }

                    throw new Error(`API Error ${response.status}: ${JSON.stringify(errorData)}`);
                }

                const data = await response.json();

                // DEBUG: Afficher la réponse complète
                console.log('Gemini full response:', JSON.stringify(data, null, 2));

                // Extraire la réponse de Gemini
                if (!data.candidates || data.candidates.length === 0) {
                    console.error('Gemini: Aucun candidat dans la réponse');
                    return {
                        score: 50,
                        confidence: 30,
                        source: 'Gemini AI',
                        message: 'Aucune analyse disponible',
                        warnings: [],
                        details: ['Gemini n\'a pas pu analyser ce contenu']
                    };
                }

                const candidate = data.candidates[0];
                console.log('Gemini candidate:', candidate);
                console.log('Gemini content:', candidate.content);
                console.log('Gemini parts:', candidate.content?.parts);

                // Vérifier si la réponse est incomplète
                if (!candidate.content?.parts ||
                    candidate.content.parts.length === 0) {
                    console.error('Gemini: Pas de parts dans content');
                    return {
                        score: 50,
                        confidence: 40,
                        source: 'Gemini AI',
                        message: 'Réponse vide (pas de parts)',
                        warnings: ['Gemini n\'a pas retourné de contenu'],
                        details: [
                            `Raison: ${candidate.finishReason || 'inconnue'}`,
                            'Les autres analyseurs fonctionnent normalement'
                        ]
                    };
                }

                const textContent = candidate.content.parts[0]?.text;
                console.log('Gemini text content:', textContent);

                if (!textContent || textContent.trim().length === 0) {
                    console.error('Gemini: Text vide ou absent');
                    return {
                        score: 50,
                        confidence: 40,
                        source: 'Gemini AI',
                        message: 'Réponse vide (text absent)',
                        warnings: ['Gemini n\'a pas retourné de texte'],
                        details: [
                            `Raison: ${candidate.finishReason || 'inconnue'}`,
                            `Parts length: ${candidate.content.parts.length}`,
                            'Les autres analyseurs fonctionnent normalement'
                        ]
                    };
                }

                // Vérifier spécifiquement MAX_TOKENS (mais continuer quand même si on a du texte)
                if (candidate.finishReason === 'MAX_TOKENS') {
                    console.warn('Gemini: Réponse tronquée (MAX_TOKENS), mais contenu présent');
                }

                return this.parseGeminiResponse(textContent, text);

            } catch (error) {
                console.error('Gemini Fact Check API Error:', error);
                return {
                    score: null,
                    confidence: 0,
                    source: 'Gemini AI',
                    message: 'Erreur API',
                    warnings: [error.message],
                    details: []
                };
            }
        }

        buildFactCheckPrompt(text) {
            return `Tu es un expert en fact-checking et détection de désinformation.

Analyse ce texte selon ces critères :
1. Véracité factuelle des affirmations
2. Présence et qualité des sources
3. Détection de clickbait, sensationnalisme, théories du complot
4. Cohérence logique et scientifique
5. Langage émotionnel manipulatoire

Texte à analyser :
"${text.substring(0, 500)}"

INSTRUCTIONS POUR LE SCORE :
- 0-20 : Désinformation avérée, théories du complot, clickbait extrême
- 20-40 : Contenu très suspect, sources douteuses, manipulation évidente
- 40-60 : Contenu neutre ou impossible à vérifier factuellement
- 60-80 : Contenu plutôt fiable avec quelques réserves
- 80-100 : Contenu vérifié, sources solides, affirmations vraies

VERDICTS :
- VRAI : Affirmations vérifiées comme vraies
- FAUX : Affirmations vérifiées comme fausses
- PARTIELLEMENT_VRAI : Mélange de vrai et faux
- IMPOSSIBLE_A_VERIFIER : Uniquement si le contenu est neutre et non vérifiable (ex: opinion personnelle, texte générique). Si c'est du clickbait/complot, utilise FAUX avec score 0-20.

RÉPONDS DANS CE FORMAT EXACT :
SCORE: [0-100]
CONFIANCE: [0-100]
VERDICT: [VRAI/FAUX/PARTIELLEMENT_VRAI/IMPOSSIBLE_A_VERIFIER]
RAISON: [Explication concise en une phrase]

Exemples :

Contenu fiable :
Texte : "L'OMS recommande de se laver les mains pendant au moins 20 secondes avec du savon."
SCORE: 95
CONFIANCE: 95
VERDICT: VRAI
RAISON: Information vérifiée et conforme aux recommandations officielles de l'OMS.

Contenu suspect :
Texte : "INCROYABLE ! Les médias cachent la vérité ! Cliquez vite avant censure !"
SCORE: 5
CONFIANCE: 95
VERDICT: FAUX
RAISON: Clickbait utilisant langage émotionnel et théorie du complot sans aucune source.`;
        }

        parseGeminiResponse(responseText, originalText) {
            try {
                console.log('Gemini raw response:', responseText.substring(0, 300));

                // Extraction simple par regex - beaucoup plus fiable que JSON
                const scoreMatch = responseText.match(/SCORE\s*:\s*(\d+)/i);
                const confidenceMatch = responseText.match(/CONFIANCE\s*:\s*(\d+)/i);
                const verdictMatch = responseText.match(/VERDICT\s*:\s*(VRAI|FAUX|PARTIELLEMENT_VRAI|IMPOSSIBLE_A_VERIFIER)/i);
                const raisonMatch = responseText.match(/RAISON\s*:\s*(.+?)(?:\n|$)/i);

                // Score est obligatoire
                if (!scoreMatch) {
                    console.warn('Gemini: Pas de score trouvé, analyse de secours');
                    // Analyse de secours basée sur des mots-clés
                    const lowerResponse = responseText.toLowerCase();
                    let score = 50;

                    if (lowerResponse.includes('vrai') || lowerResponse.includes('fiable') ||
                        lowerResponse.includes('vérifié')) {
                        score = 75;
                    } else if (lowerResponse.includes('faux') || lowerResponse.includes('suspect') ||
                               lowerResponse.includes('désinformation')) {
                        score = 25;
                    }

                    // Préparer l'affichage du texte analysé
                    const textPreview = originalText.length > 150
                        ? `"${originalText.substring(0, 150)}..."`
                        : `"${originalText}"`;

                    return {
                        score: score,
                        confidence: 60,
                        source: 'Gemini AI',
                        message: 'Analyse basique effectuée',
                        warnings: ['Format de réponse inattendu'],
                        details: [
                            `Texte analysé : ${textPreview}`,
                            responseText.substring(0, 200)
                        ]
                    };
                }

                // Extraction réussie !
                const score = parseInt(scoreMatch[1]);
                const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70;
                const verdict = verdictMatch ? verdictMatch[1].toUpperCase() : 'INCONNU';
                const raison = raisonMatch ? raisonMatch[1].trim() : '';

                console.log('Gemini extraction réussie - score:', score, 'confidence:', confidence, 'verdict:', verdict);

                // Détection spéciale : IMPOSSIBLE_A_VERIFIER mais avec score très bas = contenu suspect
                const suspiciousKeywords = ['clickbait', 'complot', 'sensationnaliste', 'manipulation',
                                           'désinformation', 'suspect', 'théorie', 'fake'];
                const isSuspiciousContent = suspiciousKeywords.some(keyword =>
                    raison.toLowerCase().includes(keyword)
                );

                // Si impossible à vérifier MAIS score bas (<= 30) ou raison suspecte
                if (verdict === 'IMPOSSIBLE_A_VERIFIER') {
                    const textPreview = originalText.length > 150
                        ? `"${originalText.substring(0, 150)}..."`
                        : `"${originalText}"`;

                    // Cas 1 : Score très bas OU contenu clairement suspect
                    if (score <= 30 || isSuspiciousContent) {
                        return {
                            score: score, // UTILISER le score donné par Gemini
                            confidence: confidence,
                            source: 'Gemini AI',
                            message: 'Gemini : contenu suspect non vérifiable',
                            warnings: [
                                'ATTENTION : Contenu détecté comme suspect',
                                'Impossible à fact-checker mais présente des signes de désinformation'
                            ],
                            details: [
                                `Texte analysé : ${textPreview}`,
                                `ALERTE: ${raison}`
                            ]
                        };
                    }

                    // Cas 2 : Vraiment impossible à vérifier (score neutre 40-60)
                    return {
                        score: null,
                        confidence: 0,
                        source: 'Gemini AI',
                        message: 'Non évalué par Gemini',
                        warnings: ['Gemini ne peut pas évaluer ce contenu'],
                        details: [
                            `Texte analysé : ${textPreview}`,
                            raison || 'Contenu impossible à vérifier avec certitude'
                        ]
                    };
                }

                const warnings = [];
                const details = [];

                // Toujours afficher le texte analysé en premier
                const textPreview = originalText.length > 150
                    ? `"${originalText.substring(0, 150)}..."`
                    : `"${originalText}"`;
                details.push(`Texte analysé : ${textPreview}`);

                // Ajouter la raison si présente (avec préfixe si score très bas)
                if (raison) {
                    if (score <= 20) {
                        details.push(`ALERTE: ${raison}`);
                    } else {
                        details.push(raison);
                    }
                }

                // Ajouter des warnings si nécessaire (plus explicites selon le score)
                if (score <= 20) {
                    warnings.push('ALERTE : Désinformation probable détectée par Gemini');
                    if (verdict === 'FAUX') {
                        warnings.push('Affirmations vérifiées comme FAUSSES');
                    }
                } else if (score < 40) {
                    warnings.push('Contenu très suspect selon Gemini');
                    if (verdict === 'FAUX') {
                        warnings.push('Affirmations identifiées comme fausses');
                    }
                } else if (score < 50) {
                    warnings.push('Contenu jugé peu fiable par Gemini');
                    if (verdict === 'FAUX') {
                        warnings.push('Affirmations identifiées comme fausses');
                    }
                } else if (verdict === 'FAUX') {
                    warnings.push('Certaines affirmations sont fausses');
                }

                return {
                    score: score,
                    confidence: confidence,
                    source: 'Gemini AI',
                    message: this.getScoreMessage(score, verdict),
                    warnings: warnings,
                    details: details
                };

            } catch (error) {
                console.error('Erreur parsing Gemini:', error);
                return {
                    score: 50,
                    confidence: 40,
                    source: 'Gemini AI',
                    message: 'Erreur de parsing',
                    warnings: ['Impossible de parser la réponse Gemini'],
                    details: [error.message]
                };
            }
        }

        getScoreMessage(score, verdict) {
            if (verdict === 'VRAI') {
                return 'Gemini confirme : contenu vraisemblable';
            }
            if (verdict === 'FAUX') {
                return 'Gemini alerte : contenu probablement faux';
            }
            if (verdict === 'PARTIELLEMENT_VRAI') {
                return 'Gemini nuance : partiellement vrai';
            }
            if (verdict === 'IMPOSSIBLE_A_VERIFIER') {
                return 'Gemini : impossible à vérifier';
            }

            // Fallback basé sur le score
            if (score >= 75) return 'Gemini : contenu fiable';
            if (score >= 50) return 'Gemini : contenu neutre';
            if (score >= 25) return 'Gemini : contenu suspect';
            return 'Gemini : contenu très suspect';
        }
    }

    /**
     * Analyseur Sémantique Avancé
     * Vérifie les affirmations scientifiques et factuelles connues
     */
    class SemanticFactCheckAnalyzer {
        constructor() {
            // Base de connaissances de faits vérifiés
            this.knownFacts = {
                'terre plate': { verified: false, score: 0, confidence: 95, explanation: 'La Terre est un sphéroïde - fait scientifique établi' },
                'vaccins autisme': { verified: false, score: 0, confidence: 95, explanation: 'Aucun lien scientifique entre vaccins et autisme (études multiples)' },
                'lune fausse': { verified: false, score: 0, confidence: 95, explanation: 'Les alunissages Apollo sont documentés et vérifiés' },
                'climat changement': { verified: true, score: 90, confidence: 95, explanation: 'Consensus scientifique sur le changement climatique' },
                '5g dangereux': { verified: false, score: 20, confidence: 85, explanation: 'Pas de preuves scientifiques de danger de la 5G selon l\'OMS' },
                'covid microchip': { verified: false, score: 0, confidence: 95, explanation: 'Théorie du complot démentie - impossible techniquement' },
                'covid laboratoire': { verified: 'partial', score: 50, confidence: 60, explanation: 'Origine du COVID-19 encore débattue par la communauté scientifique' },
                'oms organisation': { verified: true, score: 85, confidence: 90, explanation: 'OMS est une agence spécialisée de l\'ONU reconnue' },
                'afp agence': { verified: true, score: 90, confidence: 95, explanation: 'AFP est une agence de presse reconnue internationalement' },
                'stanford université': { verified: true, score: 95, confidence: 95, explanation: 'Stanford est une université prestigieuse reconnue' }
            };

            // Patterns de désinformation courante
            this.misinformationPatterns = {
                'scientifiques cachent': { score: 20, confidence: 70 },
                'médias mentent': { score: 30, confidence: 60 },
                'big pharma': { score: 35, confidence: 55 },
                'nouvel ordre mondial': { score: 15, confidence: 80 },
                'illuminati': { score: 10, confidence: 90 },
                'gouvernement secret': { score: 25, confidence: 65 },
                'grand remplacement': { score: 20, confidence: 75 },
                'théorie complot': { score: 30, confidence: 70 }
            };

            // Sources fiables reconnues
            this.trustedSources = {
                'who.int': { boost: 20, name: 'OMS' },
                'oms': { boost: 20, name: 'OMS' },
                'unesco': { boost: 20, name: 'UNESCO' },
                'afp.com': { boost: 18, name: 'AFP' },
                'reuters': { boost: 18, name: 'Reuters' },
                'lemonde.fr': { boost: 15, name: 'Le Monde' },
                'nature.com': { boost: 20, name: 'Nature' },
                'science.org': { boost: 20, name: 'Science' },
                'stanford': { boost: 18, name: 'Stanford University' },
                'mit.edu': { boost: 18, name: 'MIT' },
                'harvard': { boost: 18, name: 'Harvard' },
                'gouv.fr': { boost: 15, name: 'Gouvernement français' }
            };
        }

        async analyze(text) {
            const lowerText = text.toLowerCase();
            let score = 50; // Score neutre de départ
            let confidence = 60;
            const details = [];
            const warnings = [];

            // Préparer l'affichage du texte analysé
            const textPreview = text.length > 150
                ? `"${text.substring(0, 150)}..."`
                : `"${text}"`;
            details.push(`Texte analysé : ${textPreview}`);

            // 1. Vérifier les faits connus
            let factMatches = 0;
            for (const [key, fact] of Object.entries(this.knownFacts)) {
                if (lowerText.includes(key)) {
                    factMatches++;
                    if (fact.verified === false) {
                        score -= 30;
                        warnings.push(`Affirmation fausse détectée: "${key}"`);
                        details.push(fact.explanation);
                        confidence = Math.max(confidence, fact.confidence);
                    } else if (fact.verified === true) {
                        score += 15;
                        details.push(fact.explanation);
                        confidence = Math.max(confidence, fact.confidence);
                    } else if (fact.verified === 'partial') {
                        details.push(fact.explanation);
                        confidence = Math.min(confidence, fact.confidence);
                    }
                }
            }

            // 2. Détecter les patterns de désinformation
            let misinfoMatches = 0;
            for (const [pattern, info] of Object.entries(this.misinformationPatterns)) {
                if (lowerText.includes(pattern)) {
                    misinfoMatches++;
                    score -= 15;
                    warnings.push(`Pattern suspect: "${pattern}"`);
                    confidence = Math.max(confidence, info.confidence);
                }
            }

            // 3. Bonus pour sources fiables
            let trustedSourcesFound = 0;
            for (const [source, info] of Object.entries(this.trustedSources)) {
                if (lowerText.includes(source)) {
                    trustedSourcesFound++;
                    score += info.boost;
                    details.push(`Source fiable mentionnée: ${info.name}`);
                }
            }

            // 4. Analyse de la structure
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
            const hasQuestions = text.includes('?');
            const hasExclamations = text.includes('!');
            const avgSentenceLength = sentences.length > 0
                ? text.length / sentences.length
                : 0;

            // Texte très court ou très long
            if (avgSentenceLength < 20) {
                score -= 5;
                details.push('Phrases courtes - peut indiquer simplification excessive');
            } else if (avgSentenceLength > 200) {
                score -= 5;
                details.push('Phrases très longues - structure atypique');
            }

            // Présence de questions (peut être légitime ou rhétorique)
            if (hasQuestions && text.split('?').length > 3) {
                score -= 10;
                warnings.push('Nombreuses questions rhétoriques');
            }

            // 5. Détection de dates récentes (indicateur de fraîcheur)
            const currentYear = new Date().getFullYear();
            const yearRegex = new RegExp(`(${currentYear}|${currentYear-1}|${currentYear-2})`, 'g');
            const recentDates = text.match(yearRegex);
            if (recentDates && recentDates.length > 0) {
                score += 5;
                details.push('Références temporelles récentes détectées');
            }

            // Normaliser le score
            score = Math.max(0, Math.min(100, score));

            // Ajuster la confiance selon le nombre d'indicateurs trouvés
            const totalIndicators = factMatches + misinfoMatches + trustedSourcesFound;
            if (totalIndicators === 0) {
                confidence = 40; // Peu d'informations pour juger
                details.push('Peu d\'indicateurs spécifiques détectés');
            } else if (totalIndicators >= 3) {
                confidence = Math.min(95, confidence + 10);
            }

            return {
                score: score,
                confidence: confidence,
                source: 'Analyse Sémantique',
                message: this.getScoreMessage(score),
                warnings: warnings,
                details: details
            };
        }

        getScoreMessage(score) {
            if (score >= 75) return 'Contenu sémantiquement cohérent et fiable';
            if (score >= 55) return 'Contenu neutre sans indicateurs majeurs';
            if (score >= 35) return 'Contenu avec des indicateurs suspects';
            return 'Contenu avec des affirmations problématiques';
        }
    }

    /**
     * Agrégateur de résultats
     * Combine les résultats de plusieurs analyseurs
     */
    class ResultAggregator {
        aggregate(results) {
            const validResults = results.filter(r => r.score !== null && r.confidence > 0);

            if (validResults.length === 0) {
                return {
                    finalScore: null,
                    confidence: 0,
                    message: 'Impossible d\'analyser ce contenu',
                    breakdown: results,
                    warnings: ['Aucune analyse disponible'],
                    details: []
                };
            }

            // Calculer le score pondéré par la confiance
            let totalWeight = 0;
            let weightedSum = 0;

            validResults.forEach(result => {
                const weight = result.confidence / 100;
                weightedSum += result.score * weight;
                totalWeight += weight;
            });

            const finalScore = Math.round(weightedSum / totalWeight);
            const avgConfidence = Math.round(
                validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length
            );

            // Collecter tous les avertissements et détails
            const allWarnings = [];
            const allDetails = [];

            validResults.forEach(result => {
                if (result.warnings) allWarnings.push(...result.warnings);
                if (result.details) allDetails.push(...result.details);
            });

            // Déterminer le niveau de fiabilité
            const reliability = this.getReliabilityLevel(finalScore, validResults.length, results.length);

            return {
                finalScore: finalScore,
                confidence: avgConfidence,
                reliability: reliability,
                message: this.getFinalMessage(finalScore),
                breakdown: results,
                warnings: [...new Set(allWarnings)], // Dédupliquer
                details: [...new Set(allDetails)],
                checkedBy: validResults.length,
                totalCheckers: results.length
            };
        }

        getReliabilityLevel(score, checkerCount, totalCheckers) {
            // Format: "66%" si 2/3 APIs sont OK
            const percentage = Math.round(score);
            const ratio = checkerCount > 1 ? `${checkerCount}/${totalCheckers} APIs` : '1 analyse';

            return {
                percentage: percentage,
                ratio: ratio,
                level: this.getLevel(score)
            };
        }

        getLevel(score) {
            if (score >= 70) return 'high';
            if (score >= 50) return 'medium';
            if (score >= 30) return 'low';
            return 'very-low';
        }

        getFinalMessage(score) {
            if (score >= 70) {
                return 'Contenu fiable - Informations probablement vérifiées';
            }
            if (score >= 50) {
                return 'Contenu à vérifier - Restez prudent';
            }
            if (score >= 30) {
                return 'Contenu suspect - Vérification fortement recommandée';
            }
            return 'Contenu très suspect - Ne pas partager sans vérifier';
        }
    }

    // ========================================
    // MOTEUR D'ANALYSE PRINCIPAL
    // ========================================

    class TruthBotEngine {
        constructor() {
            this.analyzers = [];
            this.aggregator = new ResultAggregator();

            // Initialiser les analyseurs
            this.initializeAnalyzers();
        }

        initializeAnalyzers() {
            // Analyseur local (toujours actif)
            if (CONFIG.apis.localAnalysis.enabled) {
                this.analyzers.push(new LocalAnalyzer());
            }

            // Analyseur sémantique (toujours actif)
            if (CONFIG.apis.semanticAnalysis.enabled) {
                this.analyzers.push(new SemanticFactCheckAnalyzer());
            }

            // Gemini AI Fact Check (si clé API disponible)
            if (CONFIG.apis.geminiFactCheck.enabled &&
                CONFIG.apis.geminiFactCheck.apiKey) {
                this.analyzers.push(
                    new GeminiFactCheckAnalyzer(CONFIG.apis.geminiFactCheck.apiKey)
                );
            }
        }

        async analyzeText(text) {
            if (!text || text.length < CONFIG.thresholds.minTextLength) {
                return {
                    error: true,
                    message: 'Texte trop court pour analyse'
                };
            }

            // Lancer toutes les analyses en parallèle
            const analysisPromises = this.analyzers.map(analyzer =>
                analyzer.analyze(text).catch(error => ({
                    score: null,
                    confidence: 0,
                    source: analyzer.constructor.name,
                    message: 'Erreur d\'analyse',
                    warnings: [error.message],
                    details: []
                }))
            );

            const results = await Promise.all(analysisPromises);

            // Agréger les résultats
            return this.aggregator.aggregate(results);
        }

        async analyzeImage(imageUrl) {
            // TODO: Implémenter l'analyse d'images si des APIs sont disponibles
            return {
                finalScore: null,
                confidence: 0,
                message: 'Analyse d\'images en cours de développement',
                warnings: ['Fonctionnalité à venir'],
                details: []
            };
        }
    }

    // ========================================
    // INTERFACE UTILISATEUR
    // ========================================

    class TruthBotUI {
        constructor(engine) {
            this.engine = engine;
            this.widget = null;
            this.tooltip = null;
            this.modal = null;
        }

        initialize() {
            this.createWidget();
            this.createTooltip();
            this.createModal();
            this.attachEventListeners();
        }

        createWidget() {
            // Bouton flottant en bas à droite
            this.widget = document.createElement('div');
            this.widget.id = 'truthbot-widget';
            this.widget.className = 'truthbot-widget';
            this.widget.innerHTML = `
                <button class="truthbot-btn" title="TruthBot - Détecteur de désinformation">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <span>TruthBot</span>
                </button>
            `;
            document.body.appendChild(this.widget);
        }

        createTooltip() {
            // Tooltip pour affichage rapide au survol
            this.tooltip = document.createElement('div');
            this.tooltip.id = 'truthbot-tooltip';
            this.tooltip.className = 'truthbot-tooltip';
            this.tooltip.style.display = 'none';
            document.body.appendChild(this.tooltip);
        }

        createModal() {
            // Modal pour résultats détaillés
            this.modal = document.createElement('div');
            this.modal.id = 'truthbot-modal';
            this.modal.className = 'truthbot-modal';
            this.modal.style.display = 'none';
            this.modal.innerHTML = `
                <div class="truthbot-modal-content">
                    <div class="truthbot-modal-header">
                        <h3>Analyse TruthBot</h3>
                        <button class="truthbot-close">&times;</button>
                    </div>
                    <div class="truthbot-modal-body">
                        <!-- Contenu dynamique -->
                    </div>
                </div>
            `;
            document.body.appendChild(this.modal);
        }

        attachEventListeners() {
            // Click sur le widget principal
            const btn = this.widget.querySelector('.truthbot-btn');
            btn.addEventListener('click', () => this.openAnalysisModal());

            // Fermeture du modal
            const closeBtn = this.modal.querySelector('.truthbot-close');
            closeBtn.addEventListener('click', () => this.closeModal());

            // Fermeture en cliquant à l'extérieur
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });

            // Détection du hover sur le texte
            if (CONFIG.hover.enabled) {
                this.attachHoverListeners();
            }
        }

        attachHoverListeners() {
            let lastHoveredElement = null;
            let isTooltipHovered = false;
            let hideTooltipTimeout = null;

            // Détecter quand la souris entre sur le tooltip
            document.addEventListener('mouseover', (e) => {
                if (e.target.closest('#truthbot-tooltip')) {
                    isTooltipHovered = true;
                    // Annuler le timeout de disparition
                    if (hideTooltipTimeout) {
                        clearTimeout(hideTooltipTimeout);
                        hideTooltipTimeout = null;
                    }
                }
            }, true);

            // Détecter quand la souris quitte le tooltip
            document.addEventListener('mouseout', (e) => {
                if (e.target.closest('#truthbot-tooltip')) {
                    isTooltipHovered = false;
                    // Laisser un délai avant de cacher
                    hideTooltipTimeout = setTimeout(() => {
                        this.hideTooltip();
                    }, 300);
                }
            }, true);

            document.addEventListener('mouseover', (e) => {
                // Ignorer les éléments TruthBot
                if (e.target.closest('#truthbot-widget') ||
                    e.target.closest('#truthbot-tooltip') ||
                    e.target.closest('#truthbot-modal')) {
                    return;
                }

                // Annuler le timeout précédent
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }

                // Définir un nouveau timeout
                hoverTimeout = setTimeout(() => {
                    this.handleHover(e.target);
                }, CONFIG.hover.delay);

                lastHoveredElement = e.target;
            });

            document.addEventListener('mouseout', (e) => {
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }

                // Ne cacher le tooltip que si on quitte l'élément ET que la souris n'est pas sur le tooltip
                if (e.target === lastHoveredElement) {
                    // Attendre un peu pour voir si la souris va sur le tooltip
                    hideTooltipTimeout = setTimeout(() => {
                        if (!isTooltipHovered) {
                            this.hideTooltip();
                        }
                    }, 200);
                }
            });
        }

        async handleHover(element) {
            // Extraire le texte de l'élément
            const text = this.extractText(element);

            if (!text || text.length < CONFIG.thresholds.minTextLength) {
                return;
            }

            // Vérifier si c'est une image
            const isImage = element.tagName === 'IMG';

            if (isImage) {
                // TODO: Analyser l'image
                return;
            }

            // Afficher un loader
            this.showTooltipLoader(element);

            // Analyser le texte
            try {
                const result = await this.engine.analyzeText(text);
                this.showTooltipResult(element, result);
                selectedElement = { element, text, result };
            } catch (error) {
                console.error('TruthBot Analysis Error:', error);
                this.hideTooltip();
            }
        }

        extractText(element) {
            // Extraire le texte visible de l'élément
            let text = '';

            // Vérifier d'abord si l'élément a une classe spécifique (comme example-box)
            if (element.classList.contains('example-box') ||
                element.tagName === 'P' ||
                element.tagName === 'DIV' ||
                element.tagName === 'ARTICLE' ||
                element.tagName === 'SECTION' ||
                element.tagName === 'SPAN' ||
                element.tagName === 'H1' ||
                element.tagName === 'H2' ||
                element.tagName === 'H3' ||
                element.tagName === 'H4' ||
                element.tagName === 'H5' ||
                element.tagName === 'H6' ||
                element.tagName === 'LI') {
                text = element.textContent?.trim() || '';
            } else {
                // Pour les autres éléments, prendre le innerText
                text = element.innerText?.trim() || element.textContent?.trim() || '';
            }

            return text;
        }

        showTooltipLoader(element) {
            const rect = element.getBoundingClientRect();
            this.tooltip.innerHTML = `
                <div class="truthbot-loader">
                    <div class="spinner"></div>
                    <span>Analyse en cours...</span>
                </div>
            `;
            this.positionTooltip(rect);
            this.tooltip.style.display = 'block';
        }

        showTooltipResult(element, result) {
            if (result.error) {
                this.hideTooltip();
                return;
            }

            const rect = element.getBoundingClientRect();
            const levelClass = result.reliability?.level || 'medium';

            // Construire le résumé par source
            let sourcesSummary = '';
            if (result.breakdown && result.breakdown.length > 0) {
                sourcesSummary = '<div class="sources-breakdown">';
                result.breakdown.forEach(item => {
                    if (item.score !== null && item.confidence > 0) {
                        const sourceIcon = this.getSourceIcon(item.source);
                        const scoreClass = this.getScoreClass(item.score);
                        sourcesSummary += `
                            <div class="source-item">
                                <span class="source-icon">${sourceIcon}</span>
                                <span class="source-name">${item.source}</span>
                                <span class="source-score ${scoreClass}">${item.score}/100</span>
                                <span class="source-confidence">(${item.confidence}%)</span>
                            </div>
                        `;
                    }
                });
                sourcesSummary += '</div>';
            }

            this.tooltip.innerHTML = `
                <div class="truthbot-quick-result ${levelClass}">
                    <div class="score-badge">
                        <div class="score-number">${result.finalScore || '?'}</div>
                        <div class="score-label">Score Global</div>
                    </div>
                    <div class="result-info">
                        <p class="result-message">${result.message}</p>
                        <p class="result-meta">
                            ${result.checkedBy}/${result.totalCheckers} analyseur(s) ·
                            Confiance: ${result.confidence}%
                        </p>
                        ${sourcesSummary}
                        <button class="truthbot-details-btn" onclick="window.TruthBot.showDetails()">
                            Voir les détails →
                        </button>
                    </div>
                </div>
            `;

            this.positionTooltip(rect);
            this.tooltip.style.display = 'block';
        }

        getSourceIcon(sourceName) {
            if (sourceName.includes('Heuristique')) return '[H]';
            if (sourceName.includes('Sémantique')) return '[S]';
            if (sourceName.includes('Gemini')) return '[G]';
            if (sourceName.includes('Google')) return '[G]';
            return '[A]';
        }

        getScoreClass(score) {
            if (score >= 70) return 'score-high';
            if (score >= 50) return 'score-medium';
            if (score >= 30) return 'score-low';
            return 'score-very-low';
        }

        positionTooltip(rect) {
            const tooltipHeight = 250; // Estimation augmentée pour le résumé par source
            const tooltipWidth = 400; // Largeur augmentée

            let top = rect.top - tooltipHeight - 10;
            let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

            // Ajustements si le tooltip sort de l'écran
            if (top < 0) {
                top = rect.bottom + 10;
            }
            if (left < 10) {
                left = 10;
            }
            if (left + tooltipWidth > window.innerWidth - 10) {
                left = window.innerWidth - tooltipWidth - 10;
            }

            this.tooltip.style.top = `${top + window.scrollY}px`;
            this.tooltip.style.left = `${left}px`;
        }

        hideTooltip() {
            this.tooltip.style.display = 'none';
        }

        showDetails() {
            if (!selectedElement) {
                return;
            }

            const { text, result } = selectedElement;
            this.openDetailModal(text, result);
        }

        async openAnalysisModal() {
            // Ouvrir le modal avec un formulaire pour analyser du texte
            const modalBody = this.modal.querySelector('.truthbot-modal-body');
            modalBody.innerHTML = `
                <div class="truthbot-input-section">
                    <h4>Analysez un texte ou une URL</h4>
                    <textarea id="truthbot-input-text"
                              placeholder="Collez ici le texte ou l'URL à vérifier..."
                              rows="6"></textarea>
                    <button id="truthbot-analyze-btn" class="truthbot-btn-primary">
                        Analyser
                    </button>
                </div>
                <div id="truthbot-result-section" style="display:none;">
                    <!-- Résultats ici -->
                </div>
            `;

            this.modal.style.display = 'flex';

            // Attacher l'événement d'analyse
            const analyzeBtn = modalBody.querySelector('#truthbot-analyze-btn');
            analyzeBtn.addEventListener('click', async () => {
                const input = modalBody.querySelector('#truthbot-input-text').value;
                if (!input || input.trim().length < CONFIG.thresholds.minTextLength) {
                    alert('Veuillez entrer au moins 20 caractères à analyser.');
                    return;
                }

                // Afficher un loader
                analyzeBtn.disabled = true;
                analyzeBtn.textContent = '⏳ Analyse en cours...';

                try {
                    const result = await this.engine.analyzeText(input.trim());
                    this.displayDetailedResult(input.trim(), result);
                } catch (error) {
                    alert('Erreur lors de l\'analyse: ' + error.message);
                } finally {
                    analyzeBtn.disabled = false;
                    analyzeBtn.textContent = 'Analyser';
                }
            });
        }

        openDetailModal(text, result) {
            this.hideTooltip(); // Cacher le tooltip avant d'ouvrir le modal
            this.displayDetailedResult(text, result);
            this.modal.style.display = 'flex';
        }

        displayDetailedResult(text, result) {
            const modalBody = this.modal.querySelector('.truthbot-modal-body');
            const levelClass = result.reliability?.level || 'medium';
            const levelIcon = this.getLevelIcon(result.finalScore);

            let breakdownHTML = '';
            if (result.breakdown && result.breakdown.length > 0) {
                breakdownHTML = '<div class="breakdown-section"><h4>Détails par analyseur:</h4>';
                result.breakdown.forEach(item => {
                    if (item.score !== null) {
                        breakdownHTML += `
                            <div class="breakdown-item">
                                <div class="breakdown-header">
                                    <strong>${item.source}</strong>
                                    <span class="breakdown-score">${item.score}/100</span>
                                </div>
                                <p class="breakdown-message">${item.message}</p>
                                <p class="breakdown-confidence">Confiance: ${item.confidence}%</p>
                            </div>
                        `;
                    }
                });
                breakdownHTML += '</div>';
            }

            let warningsHTML = '';
            if (result.warnings && result.warnings.length > 0) {
                warningsHTML = '<div class="warnings-section"><h4>Avertissements:</h4><ul>';
                result.warnings.forEach(warning => {
                    warningsHTML += `<li>${warning}</li>`;
                });
                warningsHTML += '</ul></div>';
            }

            let detailsHTML = '';
            if (result.details && result.details.length > 0) {
                detailsHTML = '<div class="details-section"><h4>Détails:</h4><ul>';
                result.details.forEach(detail => {
                    detailsHTML += `<li>${detail}</li>`;
                });
                detailsHTML += '</ul></div>';
            }

            modalBody.innerHTML = `
                <div class="truthbot-detailed-result">
                    <div class="result-header ${levelClass}">
                        <div class="result-icon">${levelIcon}</div>
                        <div class="result-score-large">
                            <div class="score-number-large">${result.finalScore || '?'}</div>
                            <div class="score-label">/ 100</div>
                        </div>
                        <div class="result-summary">
                            <h3>${result.message}</h3>
                            <p class="result-meta">
                                Analysé par ${result.checkedBy}/${result.totalCheckers} source(s) ·
                                Confiance globale: ${result.confidence}%
                            </p>
                        </div>
                    </div>

                    <div class="analyzed-text">
                        <h4>Texte analysé:</h4>
                        <div class="text-preview">${this.escapeHtml(text.substring(0, 300))}${text.length > 300 ? '...' : ''}</div>
                    </div>

                    ${breakdownHTML}
                    ${warningsHTML}
                    ${detailsHTML}

                    <div class="truthbot-footer">
                        <p class="disclaimer">
                            Cette analyse est fournie à titre indicatif.
                            Vérifiez toujours les sources et recoupez les informations.
                        </p>
                        <p class="ai4good-credit">
                            Développé pour le défi <strong>AI4GOOD</strong> - Nuit de l'Info 2024<br>
                            <em>Intelligence Artificielle au service du bien commun</em>
                        </p>
                    </div>
                </div>
            `;
        }

        getLevelIcon(score) {
            if (score >= 70) return '●';
            if (score >= 50) return '●';
            if (score >= 30) return '●';
            return '●';
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        closeModal() {
            this.modal.style.display = 'none';
        }
    }

    // ========================================
    // INITIALISATION
    // ========================================

    class TruthBot {
        constructor(userConfig = {}) {
            // Fusionner la configuration utilisateur
            Object.assign(CONFIG, userConfig);

            this.engine = new TruthBotEngine();
            this.ui = null;
        }

        init() {
            if (widgetInitialized) {
                console.warn('TruthBot: Already initialized');
                return;
            }

            // Attendre que le DOM soit prêt
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initialize());
            } else {
                this.initialize();
            }
        }

        initialize() {
            console.log('TruthBot initialized - Fighting misinformation!');

            // Charger le CSS
            this.loadStyles();

            // Initialiser l'UI
            this.ui = new TruthBotUI(this.engine);
            this.ui.initialize();

            widgetInitialized = true;
        }

        loadStyles() {
            // Vérifier si le CSS est déjà chargé
            if (document.getElementById('truthbot-styles')) {
                return;
            }

            const link = document.createElement('link');
            link.id = 'truthbot-styles';
            link.rel = 'stylesheet';
            link.href = this.getScriptPath() + 'truthbot.css';
            document.head.appendChild(link);
        }

        getScriptPath() {
            const scripts = document.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.src.includes('truthbot.js')) {
                    return script.src.substring(0, script.src.lastIndexOf('/') + 1);
                }
            }
            return '';
        }

        // API publique
        showDetails() {
            if (this.ui) {
                this.ui.showDetails();
            }
        }

        async analyze(text) {
            return await this.engine.analyzeText(text);
        }

        configure(newConfig) {
            Object.assign(CONFIG, newConfig);
        }
    }

    // ========================================
    // EXPORT ET AUTO-INITIALISATION
    // ========================================

    // Exposer TruthBot globalement
    window.TruthBot = new TruthBot();

    // Auto-initialisation
    window.TruthBot.init();

})();
