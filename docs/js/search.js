/**
 * Documentation Search & Navigation System
 */

class SearchEngine {
    constructor() {
        this.index = [];
        this.input = document.querySelector('.search-input');
        this.resultsContainer = document.querySelector('#search-results');
        this.init();
    }

    async init() {
        try {
            // Use root-relative path for the search index
            const response = await fetch('/docs/search-index.json');
            this.index = await response.json();
            this.bindEvents();
        } catch (e) {
            console.error("Failed to load search index:", e);
        }
    }

    bindEvents() {
        this.input.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.resultsContainer.style.display = 'none';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== this.input) {
                e.preventDefault();
                this.input.focus();
            }
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.resultsContainer.style.display = 'none';
            return;
        }

        const filtered = this.index.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.content.toLowerCase().includes(query.toLowerCase()) ||
            item.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 8);

        this.renderResults(filtered);
    }

    renderResults(results) {
        if (results.length === 0) {
            this.resultsContainer.innerHTML = '<div class="search-item"><span class="item-title">No results found</span></div>';
        } else {
            this.resultsContainer.innerHTML = results.map(item => `
                <a href="${item.url}" class="search-item">
                    <span class="item-title">${item.title}</span>
                    <span class="item-desc">${item.category}</span>
                </a>
            `).join('');
        }
        this.resultsContainer.style.display = 'block';
    }
}

// Initialize search
document.addEventListener('DOMContentLoaded', () => {
    new SearchEngine();
});
