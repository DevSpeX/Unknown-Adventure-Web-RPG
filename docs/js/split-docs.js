const fs = require('fs');
const path = require('path');

const srcFile = 'docs/temp_content.html';
const content = fs.readFileSync(srcFile, 'utf8');

// Extract all sections
const sections = [];
const h2Regex = /<h2>(.*?)<\/h2>([\s\S]*?)(?=<h2>|$)/g;

let match;
while ((match = h2Regex.exec(content)) !== null) {
    let title = match[1].trim();
    let cleanTitle = title.replace(/&amp;/g, 'and').replace(/<[^>]+>/g, '');
    let id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    sections.push({
        id: id,
        title: title,
        body: match[2].trim()
    });
}

console.log(`Found ${sections.length} sections. Regenerating for PERFECTION...`);

const searchIndex = [];

// Template with ROOT-RELATIVE PATHS and Cache Buster
const getTemplate = (section, prev, next) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${section.title} - Unknown Adventure RPG</title>
    <link rel="stylesheet" href="/docs/docs.css?v=1.0.1">
</head>
<body>
    <header class="global-header">
        <div class="header-left">
            <a href="/docs/" class="logo">Unknown Adventure Documentation</a>
        </div>
        <div class="search-container">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" placeholder="Search documentation... (Press / to focus)">
            <div id="search-results"></div>
        </div>
    </header>

    <div class="doc-container">
        <aside class="sidebar">
            <div class="sidebar-group">
                <h3 style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px; margin-bottom: 15px;">Sections</h3>
                <ul style="list-style: none; margin: 0; padding: 0;">
                    ${sections.map(s => `
                        <li style="margin-bottom: 8px;">
                            <a href="/docs/sections/${s.id}" style="font-size: 0.9rem; color: ${s.id === section.id ? 'var(--accent)' : 'var(--text-main)'}; font-weight: ${s.id === section.id ? '600' : '400'}">${s.title}</a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </aside>

        <main class="main-content">
            <h2 id="${section.id}">${section.title}</h2>
            ${section.body}

            <nav class="step-nav">
                ${prev ? `
                    <a href="/docs/sections/${prev.id}" class="nav-btn prev">
                        <span class="dir">Previous</span>
                        <span class="title">${prev.title}</span>
                    </a>
                ` : '<div></div>'}
                
                ${next ? `
                    <a href="/docs/sections/${next.id}" class="nav-btn next" style="text-align: right;">
                        <span class="dir">Next</span>
                        <span class="title">${next.title}</span>
                    </a>
                ` : '<div></div>'}
            </nav>

            <footer class="footer">
                <p>Unknown Adventure RPG — Documentation v1.1.1 · June 15, 2026</p>
                <p style="margin-top: 10px;"><a href="/docs/">Back to Portal</a> · <a href="/">Play Game</a></p>
            </footer>
        </main>
    </div>

    <script src="/docs/js/search.js"></script>
</body>
</html>`;

// Write sections
sections.forEach((section, index) => {
    const prev = sections[index - 1];
    const next = sections[index + 1];
    const fileName = `docs/sections/${section.id}.html`;
    
    fs.writeFileSync(fileName, getTemplate(section, prev, next));
    
    const cleanBody = section.body.replace(/<[^>]+>/g, ' ');
    const bodyKeywords = cleanBody.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const uniqueKeywords = [...new Set([
        ...section.title.toLowerCase().split(/\s+/),
        ...bodyKeywords // Take ALL significant words as keywords
    ])];

    searchIndex.push({
        title: section.title,
        id: section.id,
        url: `/docs/sections/${section.id}`,
        category: "Manual Section",
        content: cleanBody.substring(0, 2000).trim(), // Increase snippet size for search matching
        keywords: uniqueKeywords
    });
});

fs.writeFileSync('docs/search-index.json', JSON.stringify(searchIndex, null, 4));

console.log("Final perfect regeneration complete.");
