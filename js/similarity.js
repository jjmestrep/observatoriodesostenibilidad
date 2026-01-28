// Similarity analysis tool for ESG Observatory

let allMessages = [];

async function initSimilarity() {
    const competitors = await loadCompetitors();

    // Extract all messages from competitors
    allMessages = [];
    competitors.forEach(competitor => {
        // Add tagline
        if (competitor.tagline) {
            allMessages.push({
                text: competitor.tagline,
                type: 'tagline',
                competitor: competitor.name
            });
        }

        // Add headlines
        (competitor.messaging?.headlines || []).forEach(headline => {
            allMessages.push({
                text: headline,
                type: 'headline',
                competitor: competitor.name
            });
        });

        // Add value propositions
        (competitor.valueProposition || []).forEach(vp => {
            allMessages.push({
                text: vp,
                type: 'value_proposition',
                competitor: competitor.name
            });
        });
    });

    // Update summary
    document.getElementById('total-messages').textContent = allMessages.length;
    document.getElementById('total-competitors').textContent = competitors.length;

    // Setup analyze button
    document.getElementById('analyze-btn').addEventListener('click', analyzeSimilarity);

    // Allow Enter key to trigger analysis
    document.getElementById('input-text').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            analyzeSimilarity();
        }
    });
}

function analyzeSimilarity() {
    const inputText = document.getElementById('input-text').value.trim();

    if (!inputText) {
        alert('Por favor, introduce un texto para analizar');
        return;
    }

    // Calculate similarity for each message
    const results = allMessages.map(msg => ({
        ...msg,
        jaccardScore: jaccardSimilarity(inputText, msg.text),
        cosineScore: cosineSimilarity(inputText, msg.text)
    }));

    // Calculate combined score (average of both)
    results.forEach(r => {
        r.combinedScore = (r.jaccardScore + r.cosineScore) / 2;
    });

    // Sort by combined score
    results.sort((a, b) => b.combinedScore - a.combinedScore);

    // Render results
    renderSimilarityResults(results.slice(0, 15)); // Top 15 results
}

// Tokenize text into words
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2); // Remove very short words
}

// Jaccard Similarity: |A ∩ B| / |A ∪ B|
function jaccardSimilarity(text1, text2) {
    const tokens1 = new Set(tokenize(text1));
    const tokens2 = new Set(tokenize(text2));

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
}

// Cosine Similarity using TF vectors
function cosineSimilarity(text1, text2) {
    const tokens1 = tokenize(text1);
    const tokens2 = tokenize(text2);

    // Build vocabulary
    const vocabulary = new Set([...tokens1, ...tokens2]);

    if (vocabulary.size === 0) return 0;

    // Create term frequency vectors
    const tf1 = {};
    const tf2 = {};

    vocabulary.forEach(term => {
        tf1[term] = 0;
        tf2[term] = 0;
    });

    tokens1.forEach(token => tf1[token]++);
    tokens2.forEach(token => tf2[token]++);

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    vocabulary.forEach(term => {
        dotProduct += tf1[term] * tf2[term];
        norm1 += tf1[term] * tf1[term];
        norm2 += tf2[term] * tf2[term];
    });

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

function renderSimilarityResults(results) {
    const container = document.getElementById('results-list');
    const resultsSection = document.getElementById('similarity-results');

    if (results.length === 0) {
        container.innerHTML = '<p>No se encontraron resultados similares.</p>';
        resultsSection.classList.remove('hidden');
        return;
    }

    container.innerHTML = results.map(result => {
        const percentage = Math.round(result.combinedScore * 100);
        let scoreClass = 'score-low';
        if (percentage >= 50) scoreClass = 'score-high';
        else if (percentage >= 25) scoreClass = 'score-medium';

        const typeLabels = {
            'tagline': 'Tagline',
            'headline': 'Headline',
            'value_proposition': 'Propuesta de valor'
        };

        return `
            <div class="result-item">
                <div class="result-score ${scoreClass}">
                    ${percentage}%
                </div>
                <div class="result-content">
                    <h4>${result.competitor}</h4>
                    <span class="competitor-name">${typeLabels[result.type] || result.type}</span>
                    <p class="matched-text">"${result.text}"</p>
                    <p style="font-size: 0.75rem; color: var(--color-gray-500); margin-top: 0.5rem;">
                        Jaccard: ${Math.round(result.jaccardScore * 100)}% |
                        Cosine: ${Math.round(result.cosineScore * 100)}%
                    </p>
                </div>
            </div>
        `;
    }).join('');

    resultsSection.classList.remove('hidden');
}
