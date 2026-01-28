// Main application logic for ESG Observatory

let competitorsData = [];

// Load competitor data
async function loadCompetitors() {
    try {
        const response = await fetch('data/competitors.json');
        competitorsData = await response.json();
        return competitorsData;
    } catch (error) {
        console.error('Error loading competitors:', error);
        return [];
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// =====================
// DASHBOARD
// =====================

async function initDashboard() {
    const competitors = await loadCompetitors();
    renderCompetitorCards(competitors);
    setupFilters();
    setupModal();

    // Update last scraped date
    const lastUpdate = competitors.reduce((latest, c) => {
        const date = new Date(c.lastScraped);
        return date > latest ? date : latest;
    }, new Date(0));
    document.getElementById('last-update').textContent = formatDate(lastUpdate);
}

function renderCompetitorCards(competitors) {
    const grid = document.getElementById('competitors-grid');
    grid.innerHTML = competitors.map(competitor => `
        <div class="competitor-card" data-id="${competitor.name}">
            <div class="card-header">
                <h3>${competitor.name}</h3>
                <a href="${competitor.url}" target="_blank" rel="noopener">Visitar</a>
            </div>
            <p class="card-tagline">"${competitor.tagline || 'Sin tagline'}"</p>
            <div class="card-features">
                ${(competitor.keyFeatures || []).slice(0, 3).map(f =>
                    `<span class="feature-tag">${f}</span>`
                ).join('')}
            </div>
            <div class="card-reviews">
                ${competitor.reviews?.g2 ? `
                    <span class="review-badge">
                        <span class="star">★</span> G2: ${competitor.reviews.g2.rating}
                    </span>
                ` : ''}
                ${competitor.reviews?.capterra ? `
                    <span class="review-badge">
                        <span class="star">★</span> Capterra: ${competitor.reviews.capterra.rating}
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.competitor-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const competitor = competitorsData.find(c => c.name === id);
            showCompetitorDetail(competitor);
        });
    });
}

function setupFilters() {
    const searchInput = document.getElementById('search');
    const marketFilter = document.getElementById('filter-market');

    const filterCompetitors = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const market = marketFilter.value;

        const filtered = competitorsData.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm) ||
                (c.tagline && c.tagline.toLowerCase().includes(searchTerm));
            const matchesMarket = !market ||
                (c.strategy?.targetMarket?.toLowerCase().includes(market));
            return matchesSearch && matchesMarket;
        });

        renderCompetitorCards(filtered);
    };

    searchInput.addEventListener('input', filterCompetitors);
    marketFilter.addEventListener('change', filterCompetitors);
}

function setupModal() {
    const modal = document.getElementById('detail-modal');
    const closeBtn = modal.querySelector('.modal-close');

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.add('hidden');
        }
    });
}

function showCompetitorDetail(competitor) {
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');

    body.innerHTML = `
        <h2>${competitor.name}</h2>
        <p><a href="${competitor.url}" target="_blank">${competitor.url}</a></p>
        <p class="card-tagline" style="margin: 1rem 0;">"${competitor.tagline || 'Sin tagline'}"</p>

        <div class="detail-section">
            <h3>Propuesta de valor</h3>
            <ul class="detail-list">
                ${(competitor.valueProposition || []).map(v => `<li>${v}</li>`).join('')}
            </ul>
        </div>

        <div class="detail-section">
            <h3>Características principales</h3>
            <ul class="detail-list">
                ${(competitor.keyFeatures || []).map(f => `<li>${f}</li>`).join('')}
            </ul>
        </div>

        <div class="detail-section">
            <h3>Pricing</h3>
            <p><strong>Modelo:</strong> ${competitor.pricing?.model || 'No disponible'}</p>
            <p><strong>Precios públicos:</strong> ${competitor.pricing?.publicPrices ? 'Sí' : 'No'}</p>
            ${competitor.pricing?.plans?.length ? `
                <ul class="detail-list">
                    ${competitor.pricing.plans.map(p => `<li>${p}</li>`).join('')}
                </ul>
            ` : ''}
        </div>

        <div class="detail-section">
            <h3>Messaging</h3>
            <p><strong>Headlines:</strong></p>
            <ul class="detail-list">
                ${(competitor.messaging?.headlines || []).map(h => `<li>${h}</li>`).join('')}
            </ul>
            <p style="margin-top: 1rem;"><strong>Keywords:</strong></p>
            <div class="card-features">
                ${(competitor.messaging?.keywords || []).map(k =>
                    `<span class="feature-tag">${k}</span>`
                ).join('')}
            </div>
        </div>

        <div class="detail-section">
            <h3>Reviews</h3>
            <div class="card-reviews">
                ${competitor.reviews?.g2 ? `
                    <span class="review-badge">
                        <span class="star">★</span> G2: ${competitor.reviews.g2.rating} (${competitor.reviews.g2.count} reviews)
                    </span>
                ` : ''}
                ${competitor.reviews?.capterra ? `
                    <span class="review-badge">
                        <span class="star">★</span> Capterra: ${competitor.reviews.capterra.rating} (${competitor.reviews.capterra.count} reviews)
                    </span>
                ` : ''}
            </div>
        </div>

        <div class="detail-section">
            <h3>Estrategia</h3>
            <p><strong>Mercado objetivo:</strong> ${competitor.strategy?.targetMarket || 'No disponible'}</p>
            <p><strong>Diferenciadores:</strong></p>
            <ul class="detail-list">
                ${(competitor.strategy?.differentiators || []).map(d => `<li>${d}</li>`).join('')}
            </ul>
        </div>

        <p style="margin-top: 2rem; color: var(--color-gray-500); font-size: 0.875rem;">
            Última actualización: ${formatDate(competitor.lastScraped)}
        </p>
    `;

    modal.classList.remove('hidden');
}

// =====================
// COMPARATOR
// =====================

let selectedCompetitors = [];

async function initComparator() {
    const competitors = await loadCompetitors();
    renderCompetitorChips(competitors);
    setupCompareButton();
}

function renderCompetitorChips(competitors) {
    const container = document.getElementById('competitor-selector');
    container.innerHTML = competitors.map(c => `
        <button class="chip" data-id="${c.name}">${c.name}</button>
    `).join('');

    container.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => toggleChip(chip));
    });
}

function toggleChip(chip) {
    const id = chip.dataset.id;
    const isSelected = chip.classList.contains('selected');

    if (isSelected) {
        chip.classList.remove('selected');
        selectedCompetitors = selectedCompetitors.filter(c => c !== id);
    } else {
        if (selectedCompetitors.length >= 4) {
            alert('Máximo 4 competidores');
            return;
        }
        chip.classList.add('selected');
        selectedCompetitors.push(id);
    }

    updateCompareButton();
}

function updateCompareButton() {
    const btn = document.getElementById('compare-btn');
    btn.disabled = selectedCompetitors.length < 2;
    btn.textContent = `Comparar seleccionados (${selectedCompetitors.length})`;
}

function setupCompareButton() {
    document.getElementById('compare-btn').addEventListener('click', () => {
        renderComparisonTable();
    });
}

function renderComparisonTable() {
    const container = document.getElementById('comparison-table');
    const competitors = selectedCompetitors.map(id =>
        competitorsData.find(c => c.name === id)
    );

    const rows = [
        { category: 'General', isCategory: true },
        { label: 'URL', getValue: c => `<a href="${c.url}" target="_blank">${c.url}</a>` },
        { label: 'Tagline', getValue: c => c.tagline || '-' },
        { label: 'Mercado objetivo', getValue: c => c.strategy?.targetMarket || '-' },

        { category: 'Características', isCategory: true },
        { label: 'Features principales', getValue: c => (c.keyFeatures || []).join(', ') || '-' },
        { label: 'Propuesta de valor', getValue: c => (c.valueProposition || []).join(' | ') || '-' },
        { label: 'Diferenciadores', getValue: c => (c.strategy?.differentiators || []).join(', ') || '-' },

        { category: 'Pricing', isCategory: true },
        { label: 'Modelo', getValue: c => c.pricing?.model || '-' },
        { label: 'Precios públicos', getValue: c => c.pricing?.publicPrices ? 'Sí' : 'No' },
        { label: 'Planes', getValue: c => (c.pricing?.plans || []).join(', ') || '-' },

        { category: 'Reviews', isCategory: true },
        { label: 'G2 Rating', getValue: c => c.reviews?.g2 ? `${c.reviews.g2.rating} (${c.reviews.g2.count})` : '-' },
        { label: 'Capterra Rating', getValue: c => c.reviews?.capterra ? `${c.reviews.capterra.rating} (${c.reviews.capterra.count})` : '-' },

        { category: 'Messaging', isCategory: true },
        { label: 'Headlines', getValue: c => (c.messaging?.headlines || []).slice(0, 2).join(' | ') || '-' },
        { label: 'Keywords', getValue: c => (c.messaging?.keywords || []).join(', ') || '-' },
    ];

    const table = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th></th>
                    ${competitors.map(c => `<th>${c.name}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map(row => {
                    if (row.isCategory) {
                        return `<tr class="category-row"><td colspan="${competitors.length + 1}">${row.category}</td></tr>`;
                    }
                    return `
                        <tr>
                            <td><strong>${row.label}</strong></td>
                            ${competitors.map(c => `<td>${row.getValue(c)}</td>`).join('')}
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
    container.classList.remove('hidden');
}
