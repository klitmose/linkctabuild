(function() {
    function updateElementText(element, newText) {
        if (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button')) {
            element.value = newText;
            return;
        }
        if (element.isContentEditable) {
            element.textContent = newText;
            return;
        }
        if (element.shadowRoot) {
            updateElementText(element.shadowRoot, newText);
            return;
        }
        let textNodes = [];
        function collectTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            } else {
                for (let child of node.childNodes) {
                    collectTextNodes(child);
                }
            }
        }
        collectTextNodes(element);
        if (textNodes.length > 0) {
            textNodes[0].textContent = newText;
            for (let i = 1; i < textNodes.length; i++) {
                textNodes[i].textContent = '';
            }
        } else {
            element.appendChild(document.createTextNode(newText));
        }
    }

    function applyVariationData(data) {
        data.variations.forEach(variation => {
            const elements = document.querySelectorAll(variation.selector);
            elements.forEach(element => {
                if (variation.text) {
                    updateElementText(element, variation.text);
                }
            });
        });
        console.log('Variations applied successfully');
    }

    async function applyVariations() {
        const currentUrl = window.location.href;
        const cachedData = localStorage.getItem(currentUrl);

        if (cachedData) {
            applyVariationData(JSON.parse(cachedData));
        } else {
            const apiUrl = 'https://www.ctabuild.com/api/variations';
            try {
                const response = await fetch(apiUrl, { 
                    method: 'POST', 
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: currentUrl })
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                if (data.variations && data.variations.length > 0) {
                    localStorage.setItem(currentUrl, JSON.stringify(data));
                    applyVariationData(data);
                } else {
                    console.log('No variations found for this URL');
                }
            } catch (error) {
                console.error('Error applying variations:', error);
            }
        }
    }

    function observeDOMChanges() {
        const observer = new MutationObserver((mutationsList, observer) => {
            applyVariations();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        applyVariations(); // Run immediately for the current state of the DOM
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeDOMChanges);
    } else {
        observeDOMChanges();
    }
})();
