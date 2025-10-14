/**
 * Mautic Form Success Handler
 * Automatically detects form submissions and displays success messages
 * Works with all Mautic forms on the site
 */

(function() {
    'use strict';

    // Configuration
    const config = {
        successMessage: 'Thank you! Your submission has been received. A confirmation email has been sent.',
        checkInterval: 500,
        maxChecks: 10,
        validationDelay: 100
    };

    // Store processed forms to avoid duplicate handlers
    const processedForms = new Set();

    /**
     * Initialize form handlers when DOM is ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAllForms);
        } else {
            setupAllForms();
        }

        // Watch for dynamically loaded forms
        observeForNewForms();
    }

    /**
     * Find and set up all Mautic forms on the page
     */
    function setupAllForms() {
        const forms = document.querySelectorAll('form[data-mautic-form]');
        forms.forEach(form => {
            if (!processedForms.has(form.id)) {
                setupForm(form);
                processedForms.add(form.id);
            }
        });
    }

    /**
     * Set up a single Mautic form
     */
    function setupForm(form) {
        if (!form || !form.id) return;

        const formId = form.id;
        const wrapperId = 'mauticform_wrapper_' + formId.replace('mauticform_', '');
        const wrapper = document.getElementById(wrapperId);

        if (!wrapper) return;

        // Check for existing custom success message
        let successDiv = findCustomSuccessMessage(wrapper);
        
        // If no custom message exists, create default one
        if (!successDiv) {
            successDiv = createSuccessMessage(formId);
            wrapper.parentNode.insertBefore(successDiv, wrapper);
        }

        let formSubmitted = false;
        let observer = null;

        // Handle form submission
        form.addEventListener('submit', function(e) {
            formSubmitted = true;

            setTimeout(function() {
                // Check for validation errors
                if (hasValidationErrors(form)) {
                    formSubmitted = false;
                    if (observer) {
                        observer.disconnect();
                        observer = null;
                    }
                    return;
                }

                // Start watching for submission indicators
                startObserving();

                // Periodically check for success
                let checkCount = 0;
                const checkInterval = setInterval(function() {
                    checkCount++;
                    if (checkForSuccess() || checkCount > config.maxChecks) {
                        clearInterval(checkInterval);
                    }
                }, config.checkInterval);
            }, config.validationDelay);
        });

        /**
         * Check if form has validation errors
         */
        function hasValidationErrors(form) {
            // Check error messages
            const errorMessages = form.querySelectorAll('.mauticform-errormsg');
            let hasErrors = false;

            errorMessages.forEach(function(error) {
                const style = window.getComputedStyle(error);
                if (style.display !== 'none') {
                    hasErrors = true;
                }
            });

            // Check Mautic's error div
            const errorDiv = document.getElementById(formId + '_error');
            if (errorDiv && errorDiv.innerHTML.trim() !== '') {
                hasErrors = true;
            }

            return hasErrors;
        }

        /**
         * Check for successful submission indicators
         */
        function checkForSuccess() {
            if (!formSubmitted) return false;

            // Check for "Please wait..." message
            const messageDiv = document.getElementById(formId + '_message');
            if (messageDiv && messageDiv.innerHTML.includes('Please wait')) {
                showSuccess();
                return true;
            }

            // Check for iframe (submission complete)
            const iframeId = 'mauticiframe_' + formId.replace('mauticform_', '');
            const iframe = document.getElementById(iframeId);
            if (iframe) {
                showSuccess();
                return true;
            }

            return false;
        }

        /**
         * Show success message and hide form
         */
        function showSuccess() {
            if (wrapper) {
                wrapper.style.display = 'none';
            }
            if (successDiv) {
                successDiv.style.display = 'block';
                successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            if (observer) {
                observer.disconnect();
            }
        }

        /**
         * Start observing DOM for submission indicators
         */
        function startObserving() {
            observer = new MutationObserver(function(mutations) {
                if (!formSubmitted) return;

                mutations.forEach(function(mutation) {
                    // Check for iframe creation
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(function(node) {
                            const iframeId = 'mauticiframe_' + formId.replace('mauticform_', '');
                            if (node.id === iframeId) {
                                checkForSuccess();
                            }
                        });
                    }

                    // Check for message changes
                    if (mutation.target.id === formId + '_message') {
                        checkForSuccess();
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    }

    /**
     * Find custom success message near the form
     */
    function findCustomSuccessMessage(wrapper) {
        // Look for common success message patterns near the form
        const parent = wrapper.parentNode;
        if (!parent) return null;

        // Check for elements with IDs like "successMessage" or "success_*"
        const customMessage = parent.querySelector('#successMessage, [id^="success_"], [id*="Success"]');
        
        if (customMessage) {
            // Verify it's an alert/message element
            const isAlert = customMessage.classList.contains('alert') || 
                          customMessage.classList.contains('message') ||
                          customMessage.getAttribute('role') === 'alert';
            
            if (isAlert && window.getComputedStyle(customMessage).display === 'none') {
                return customMessage;
            }
        }

        return null;
    }

    /**
     * Create success message element
     */
    function createSuccessMessage(formId) {
        const div = document.createElement('div');
        div.id = 'success_' + formId;
        div.className = 'alert alert-success shadow-sm';
        div.style.display = 'none';
        div.setAttribute('role', 'alert');

        div.innerHTML = `
            <h4 class="alert-heading">
                <i class="bi bi-check-circle-fill me-2"></i>
                Thank You!
            </h4>
            <p class="mb-0">${config.successMessage}</p>
        `;

        return div;
    }

    /**
     * Watch for dynamically loaded forms
     */
    function observeForNewForms() {
        const formObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            // Check if the node itself is a form
                            if (node.matches && node.matches('form[data-mautic-form]')) {
                                if (!processedForms.has(node.id)) {
                                    setupForm(node);
                                    processedForms.add(node.id);
                                }
                            }
                            // Check for forms within the added node
                            const forms = node.querySelectorAll && node.querySelectorAll('form[data-mautic-form]');
                            if (forms) {
                                forms.forEach(form => {
                                    if (!processedForms.has(form.id)) {
                                        setupForm(form);
                                        processedForms.add(form.id);
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });

        formObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize when script loads
    init();
})();