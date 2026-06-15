const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configure marked options
marked.setOptions({
    gfm: true,
    breaks: false
});

const mdPath = 'docs/UNKNOWN_ADVENTURE_RPG_DOCUMENTATION.md';
const tempContentPath = 'docs/temp_content.html';
const fullManualPath = 'docs/full-manual.html';

console.log("Reading UNKNOWN_ADVENTURE_RPG_DOCUMENTATION.md...");
const md = fs.readFileSync(mdPath, 'utf8');

console.log("Compiling Markdown to HTML...");
let htmlContent = marked.parse(md);

// Write docs/temp_content.html
console.log("Writing temp_content.html...");
fs.writeFileSync(tempContentPath, htmlContent, 'utf8');

// Build docs/full-manual.html
console.log("Reading full-manual.html shell...");
const fullManual = fs.readFileSync(fullManualPath, 'utf8');

// Find the boundary of the main title header content
const splitPattern = '<h1>Unknown Adventure RPG';
const splitIndex = fullManual.indexOf(splitPattern);
if (splitIndex === -1) {
    throw new Error("Could not find content boundary (<h1>Unknown Adventure RPG) in full-manual.html");
}

// Extract header shell up to the start of the compiled manual content
const shellHeader = fullManual.substring(0, splitIndex);

// Combine header shell, the compiled HTML body, and closing tags
const newFullManual = shellHeader + htmlContent + '\n\n</body>\n</html>';

console.log("Writing full-manual.html...");
fs.writeFileSync(fullManualPath, newFullManual, 'utf8');

console.log("Regenerating doc sections and search index...");
// Run split-docs.js to split temp_content.html into the individual sections
const splitDocs = require('./js/split-docs.js');

console.log("Compilation complete!");
