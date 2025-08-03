class KeywordConverter {
    constructor() {
        this.invalidChars = ['!', '@', '%', ',', '(', ')', '=', '{', '}', ';', '~', '`', '<', '>', '?', '\\', '|'];
        this.maxInputLength = 10000; // 10KB limit
        this.maxKeywords = 1000; // Maximum number of keywords
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
    }

    bindEvents() {
        document.getElementById('convertBroad').addEventListener('click', () => this.convertKeywords('broad'));
        document.getElementById('convertPhrase').addEventListener('click', () => this.convertKeywords('phrase'));
        document.getElementById('convertExact').addEventListener('click', () => this.convertKeywords('exact'));
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearOutput());
        
        // Add input validation on keyup
        document.getElementById('keywordInput').addEventListener('input', (e) => {
            this.validateInputSize(e.target.value);
        });
    }

    validateInputSize(input) {
        if (input.length > this.maxInputLength) {
            this.showError(`Input too large. Maximum ${this.maxInputLength} characters allowed.`);
            return false;
        }
        return true;
    }

    showError(message) {
        // Create a temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e53e3e;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    parseKeywords(input) {
        // Security: Validate input size first
        if (!this.validateInputSize(input)) {
            return [];
        }

        // Split by commas and newlines, then clean up
        const keywords = input
            .split(/[,\n]/)
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0);
        
        // Security: Limit number of keywords
        if (keywords.length > this.maxKeywords) {
            this.showError(`Too many keywords. Maximum ${this.maxKeywords} keywords allowed.`);
            return keywords.slice(0, this.maxKeywords);
        }
        
        return keywords;
    }

    detectMatchType(keyword) {
        // Security: Sanitize input before processing
        const sanitizedKeyword = this.sanitizeInput(keyword);
        
        // Remove any trailing (broad) notation first
        let cleanKeyword = sanitizedKeyword.replace(/\s*\(broad\)\s*$/i, '');
        
        if (cleanKeyword.startsWith('[') && cleanKeyword.endsWith(']')) {
            return {
                type: 'exact',
                keyword: cleanKeyword.slice(1, -1)
            };
        } else if (cleanKeyword.startsWith('"') && cleanKeyword.endsWith('"')) {
            return {
                type: 'phrase',
                keyword: cleanKeyword.slice(1, -1)
            };
        } else {
            return {
                type: 'broad',
                keyword: cleanKeyword
            };
        }
    }

    sanitizeInput(input) {
        // Remove any potential script tags and other dangerous content
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }

    convertToMatchType(keyword, targetType) {
        const detected = this.detectMatchType(keyword);
        const cleanKeyword = detected.keyword;

        // Security: Validate target type
        const validTypes = ['broad', 'phrase', 'exact'];
        if (!validTypes.includes(targetType)) {
            return cleanKeyword; // Default to broad if invalid type
        }

        switch (targetType) {
            case 'broad':
                return cleanKeyword;
            case 'phrase':
                return `"${cleanKeyword}"`;
            case 'exact':
                return `[${cleanKeyword}]`;
            default:
                return cleanKeyword;
        }
    }

    validateKeyword(keyword) {
        const detected = this.detectMatchType(keyword);
        const cleanKeyword = detected.keyword;
        
        // Security: Check for excessive length
        if (cleanKeyword.length > 100) {
            return {
                isValid: false,
                error: 'Keyword too long (max 100 characters)',
                type: 'invalid'
            };
        }
        
        // Check for invalid characters
        const invalidCharFound = this.invalidChars.find(char => cleanKeyword.includes(char));
        if (invalidCharFound) {
            return {
                isValid: false,
                error: `Contains invalid character: ${invalidCharFound}`,
                type: 'invalid'
            };
        }

        // Check for match type signifiers within the keyword
        if (cleanKeyword.includes('"') || cleanKeyword.includes('[') || cleanKeyword.includes(']')) {
            return {
                isValid: false,
                error: 'Contains match type signifiers within keyword',
                type: 'invalid'
            };
        }

        // Check for empty keyword after cleaning
        if (cleanKeyword.trim().length === 0) {
            return {
                isValid: false,
                error: 'Empty keyword after cleaning',
                type: 'invalid'
            };
        }

        return {
            isValid: true,
            error: null,
            type: 'valid'
        };
    }

    convertKeywords(targetType) {
        const input = document.getElementById('keywordInput').value;
        if (!input.trim()) {
            this.showValidationResults([{ isValid: false, error: 'No keywords entered', type: 'warning' }]);
            return;
        }

        // Security: Rate limiting (simple implementation)
        if (this.isRateLimited()) {
            this.showError('Please wait a moment before processing more keywords.');
            return;
        }

        const rawKeywords = this.parseKeywords(input);
        const validationResults = [];
        const convertedKeywords = new Set();
        let invalidCount = 0;
        let duplicateCount = 0;

        rawKeywords.forEach((keyword, index) => {
            const validation = this.validateKeyword(keyword);
            validationResults.push({
                original: keyword,
                ...validation
            });

            if (validation.isValid) {
                const converted = this.convertToMatchType(keyword, targetType);
                const originalSize = convertedKeywords.size;
                convertedKeywords.add(converted);
                
                if (convertedKeywords.size === originalSize) {
                    duplicateCount++;
                }
            } else {
                invalidCount++;
            }
        });

        // Convert Set to Array and sort
        const finalKeywords = Array.from(convertedKeywords).sort();

        // Update output
        document.getElementById('keywordOutput').value = finalKeywords.join('\n');
        
        // Update stats
        this.updateStats(finalKeywords.length, duplicateCount, invalidCount);
        
        // Show validation results
        this.showValidationResults(validationResults);
    }

    isRateLimited() {
        // Simple rate limiting - prevent processing more than 10 times per second
        const now = Date.now();
        if (this.lastProcessTime && (now - this.lastProcessTime) < 100) {
            return true;
        }
        this.lastProcessTime = now;
        return false;
    }

    showValidationResults(results) {
        const container = document.getElementById('validationResults');
        
        if (results.length === 0) {
            container.innerHTML = '<p class="no-results">No validation results yet</p>';
            return;
        }

        // Security: Use textContent instead of innerHTML where possible
        const fragment = document.createDocumentFragment();
        
        results.forEach(result => {
            const div = document.createElement('div');
            div.className = `validation-item ${result.type}`;
            
            const statusSpan = document.createElement('strong');
            statusSpan.textContent = result.isValid ? '✓ Valid' : '✗ Invalid';
            
            const errorSpan = document.createElement('span');
            if (result.error) {
                errorSpan.textContent = ` - ${result.error}`;
            }
            
            const codeElement = document.createElement('code');
            codeElement.textContent = result.original;
            
            div.appendChild(statusSpan);
            div.appendChild(errorSpan);
            div.appendChild(document.createElement('br'));
            div.appendChild(codeElement);
            
            fragment.appendChild(div);
        });

        // Clear and append new content
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats(keywordCount = 0, duplicateCount = 0, invalidCount = 0) {
        // Security: Use textContent instead of innerHTML
        document.getElementById('keywordCount').textContent = `${keywordCount} keywords`;
        document.getElementById('duplicateCount').textContent = `${duplicateCount} duplicates removed`;
        document.getElementById('invalidCount').textContent = `${invalidCount} invalid keywords`;
    }

    async copyToClipboard() {
        const output = document.getElementById('keywordOutput');
        const text = output.value;
        
        if (!text.trim()) {
            this.showCopyFeedback('No keywords to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            this.showCopyFeedback('Copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            output.select();
            document.execCommand('copy');
            this.showCopyFeedback('Copied to clipboard!');
        }
    }

    showCopyFeedback(message) {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.textContent;
        
        copyBtn.textContent = message;
        copyBtn.classList.add('copy-feedback');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copy-feedback');
        }, 1000);
    }

    clearOutput() {
        document.getElementById('keywordOutput').value = '';
        document.getElementById('keywordInput').value = '';
        document.getElementById('validationResults').innerHTML = '<p class="no-results">No validation results yet</p>';
        this.updateStats();
    }
}

// Initialize the converter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new KeywordConverter();
}); 