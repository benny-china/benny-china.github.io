// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Code highlighting functionality
    highlightCode();
    
    // Contact form handling
    handleContactForm();
    
    // Smooth scrolling
    setupSmoothScroll();
    
    // Mobile navigation
    setupMobileNav();
    
    // Search functionality (if needed)
    setupSearch();
    
    // Back to top button
    setupBackToTop();
});

// Simple code highlighting functionality
function highlightCode() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
        // Add line numbers
        if (!block.classList.contains('no-line-numbers')) {
            addLineNumbers(block);
        }
        
        // Syntax highlighting
        highlightSyntax(block);
        
        // Add copy button
        addCopyButton(block);
    });
}

// Add line numbers
function addLineNumbers(codeBlock) {
    const code = codeBlock.textContent;
    const lines = code.split('\n');
    
    // Remove the last empty line
    if (lines[lines.length - 1] === '') {
        lines.pop();
    }
    
    const numberedLines = lines.map((line, index) => {
        return `<span class="line-number">${index + 1}</span>${line}`;
    }).join('\n');
    
    codeBlock.innerHTML = numberedLines;
    codeBlock.parentElement.classList.add('has-line-numbers');
}

// Simple syntax highlighting
function highlightSyntax(codeBlock) {
    let html = codeBlock.innerHTML;
    
    // JavaScript/TypeScript keywords
    const jsKeywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'static'];
    
    // CSS properties
    const cssProperties = ['display', 'position', 'width', 'height', 'margin', 'padding', 'border', 'background', 'color', 'font-size', 'text-align', 'flex', 'grid'];
    
    // Highlight keywords
    jsKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        html = html.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    // Highlight strings
    html = html.replace(/(["'])((?:(?!\1)[^\\]|\\.)*)(\1)/g, '<span class="string">$1$2$3</span>');
    
    // Highlight comments
    html = html.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="comment">$1</span>');
    
    // Highlight numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
    
    // Highlight function names
    html = html.replace(/(\w+)(?=\s*\()/g, '<span class="function">$1</span>');
    
    codeBlock.innerHTML = html;
}

// Add copy button
function addCopyButton(codeBlock) {
    const pre = codeBlock.parentElement;
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code');
    
    button.addEventListener('click', function() {
        const code = codeBlock.textContent;
        
        // Use modern API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                showCopySuccess(button);
            }).catch(() => {
                fallbackCopy(code, button);
            });
        } else {
            fallbackCopy(code, button);
        }
    });
    
    pre.style.position = 'relative';
    pre.appendChild(button);
}

// Copy success notification
function showCopySuccess(button) {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#27ae60';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
}

// Fallback copy method
function fallbackCopy(text, button) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess(button);
    } catch (err) {
        console.error('Copy failed:', err);
        button.textContent = 'Copy failed';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    }
    
    document.body.removeChild(textarea);
}

// Handle contact form
function handleContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Simple validation
        if (!validateForm(data)) {
            return;
        }
        
        // Show sending state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        // Simulate sending (in real project this would call an API)
        setTimeout(() => {
            alert('Thank you for your message! I will get back to you soon.');
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1000);
    });
}

// Form validation
function validateForm(data) {
    const { name, email, message } = data;
    
    if (!name.trim()) {
        alert('Please enter your name');
        return false;
    }
    
    if (!email.trim() || !isValidEmail(email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    if (!message.trim()) {
        alert('Please enter a message');
        return false;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Smooth scrolling
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Mobile navigation (if hamburger menu is needed)
function setupMobileNav() {
    // Mobile navigation interaction logic can be added here
    // Current CSS already handles responsive layout
}

// Search functionality (basic version)
function setupSearch() {
    const searchInput = document.getElementById('search');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(this.value);
        }, 300);
    });
}

// Perform search
function performSearch(query) {
    if (!query.trim()) return;
    
    // Real search logic can be implemented here
    // e.g., filter article list, highlight matching text, etc.
    console.log('Search:', query);
}

// Back to top button
function setupBackToTop() {
    // Create back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '↑';
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(backToTopBtn);
    
    // Scroll listener
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
        } else {
            backToTopBtn.style.opacity = '0';
        }
    });
    
    // Click to go back to top
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Utility function: debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility function: throttle
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Add additional CSS styles
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced code block styles */
        .has-line-numbers {
            position: relative;
            padding-left: 3rem;
        }
        
        .line-number {
            position: absolute;
            left: 0;
            width: 2.5rem;
            text-align: right;
            color: #666;
            user-select: none;
            padding-right: 0.5rem;
        }
        
        .copy-button {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #555;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.3s ease, background 0.3s ease;
        }
        
        .copy-button:hover {
            opacity: 1;
            background: #333;
        }
        
        pre:hover .copy-button {
            opacity: 1;
        }
        
        /* Responsive enhancements */
        @media (max-width: 768px) {
            .back-to-top {
                width: 40px !important;
                height: 40px !important;
                font-size: 16px !important;
                bottom: 15px !important;
                right: 15px !important;
            }
            
            .copy-button {
                position: static;
                display: block;
                margin: 8px 0 0 0;
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Add styles after page loads
document.addEventListener('DOMContentLoaded', addDynamicStyles);