
(function() {
    'use strict';
    const initNavigationAndScrollAnimations = () => {
        const nav = document.querySelector('.navbar');
        const isSubpage = document.querySelector('.page-hero-section') !== null;
        if (nav) {
            const handleNavState = () => {
                if (isSubpage || window.scrollY > 50) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            };
            window.addEventListener('scroll', handleNavState);
            handleNavState();
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.animationDelay || '0ms';
                    entry.target.style.transitionDelay = delay;
                    entry.target.classList.add('is-visible');
                }
            });
        }, {
            threshold: 0.1
        });
        document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    };
    window.showToast = (message, type = 'info', duration = 5000, options = {}) => {
        if (options.showConfirmation) {
            const overlay = document.createElement('div');
            overlay.className = 'confirmation-modal-overlay';
            const dialog = document.createElement('div');
            dialog.className = 'confirmation-modal-dialog';
            const messageP = document.createElement('p');
            messageP.textContent = message;
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'confirmation-modal-buttons';
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Nein';
            cancelBtn.className = 'btn-cancel';
            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Ja';
            confirmBtn.className = 'btn-confirm';
            const closeModal = () => {
                overlay.classList.remove('visible');
                setTimeout(() => {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                }, 200);
            };
            cancelBtn.addEventListener('click', () => {
                if (options.onCancel) options.onCancel();
                closeModal();
            });
            confirmBtn.addEventListener('click', () => {
                if (options.onConfirm) options.onConfirm();
                closeModal();
            });
            buttonsDiv.appendChild(cancelBtn);
            buttonsDiv.appendChild(confirmBtn);
            dialog.appendChild(messageP);
            dialog.appendChild(buttonsDiv);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('visible'), 10);
            return;
        }
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        const validTypes = ['success', 'error', 'warning', 'info'];
        let normalizedType = type;
        if (!validTypes.includes(type)) {
            console.warn(`Invalid toast type "${type}". Valid types: ${validTypes.join(', ')}. Defaulting to "info".`);
            normalizedType = 'info';
        }
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${normalizedType}`;
        const iconDiv = document.createElement('div');
        iconDiv.className = 'toast-icon';
        const iconElement = document.createElement('i');
        const iconClasses = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        iconElement.className = iconClasses[normalizedType];
        iconDiv.appendChild(iconElement);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'toast-content';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'toast-title';
        const titles = {
            success: 'Erfolg',
            error: 'Fehler',
            warning: 'Warnung',
            info: 'Information'
        };
        titleDiv.textContent = titles[normalizedType];
        const messageP = document.createElement('p');
        messageP.className = 'toast-message';
        messageP.textContent = message;
        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(messageP);
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.setAttribute('aria-label', 'Schließen');
        closeBtn.textContent = '×';
        toast.appendChild(iconDiv);
        toast.appendChild(contentDiv);
        toast.appendChild(closeBtn);
        toast.setAttribute('role', normalizedType === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', normalizedType === 'error' ? 'assertive' : 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toastContainer.appendChild(toast);
        closeBtn.addEventListener('click', () => removeToast(toast));
        if (duration > 0) {
            setTimeout(() => removeToast(toast), duration);
        }
    };
    const removeToast = (toast) => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    };
    const showFormStatusMessage = (message, type = 'info', duration = 0) => {
        const statusMessageEl = document.getElementById('form-status-message');
        if (!statusMessageEl) return;
        statusMessageEl.className = 'form-status-message';
        statusMessageEl.style.display = 'none';
        statusMessageEl.classList.add(type);
        statusMessageEl.textContent = message;
        setTimeout(() => {
            statusMessageEl.style.display = 'flex';
        }, 10);
        if (duration > 0) {
            setTimeout(() => {
                statusMessageEl.style.display = 'none';
            }, duration);
        }
    };
    const initCopyButtons = () => {
        const copyButtons = document.querySelectorAll('.custom-copy-btn');
        
        // Helper function to show copy feedback
        const showCopyFeedback = (button) => {
            button.classList.add("copied");
            const pulse = document.createElement("div");
            pulse.className = "pulse";
            button.appendChild(pulse);
            setTimeout(() => pulse.remove(), 700);
            setTimeout(() => button.classList.remove("copied"), 1400);
        };
        
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async function() {
                const text = this.getAttribute('data-copy-text');
                const button = this;
                
                try {
                    // Versuche moderne Clipboard API
                    await navigator.clipboard.writeText(text);
                    showCopyFeedback(button);
                 } catch (error) {
                    // Fallback für Browser ohne Clipboard API Unterstützung
                    const ta = document.createElement("textarea");
                    ta.value = text;
                    ta.style.position = 'fixed';
                    ta.style.top = '0';
                    ta.style.left = '0';
                    ta.style.width = '2em';
                    ta.style.height = '2em';
                    ta.style.padding = '0';
                    ta.style.border = 'none';
                    ta.style.outline = 'none';
                    ta.style.boxShadow = 'none';
                    ta.style.background = 'transparent';
                    ta.setAttribute('readonly', '');
                    ta.style.opacity = '0';
                    
                    document.body.appendChild(ta);
                    ta.focus();
                    ta.select();
                    
                    // Helper function for cleanup
                    const cleanup = () => {
                        if (ta.parentNode) {
                            ta.parentNode.removeChild(ta);
                        }
                    };
                    
                    try {
                        ta.setSelectionRange(0, text.length);
                        // Versuche erneut mit Clipboard API nach Selection
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(text);
                            showCopyFeedback(button);
                            cleanup();
                        } else {
                            // Für sehr alte Browser: Text ist ausgewählt, Benutzer muss manuell kopieren
                            console.warn('Clipboard API nicht verfügbar');
                            alert('Bitte kopieren Sie den ausgewählten Text manuell mit Strg+C (Windows) oder Cmd+C (Mac).');
                            cleanup();
                        }
                    } catch (fallbackError) {
                        console.error('Kopieren fehlgeschlagen:', fallbackError);
                        alert('Kopieren fehlgeschlagen. Bitte versuchen Sie es erneut.');
                        cleanup();
                    }
                }
            });
        });
    };
    const initSocial3DButtons = () => {
        const clickDelay = 450;
        document.querySelectorAll('.social-3d a').forEach(button => {
            button.addEventListener('click', event => {
                event.preventDefault();
                const link = button.getAttribute('href');
                const newTab = button.getAttribute('target') === '_blank';
                setTimeout(() => {
                    if (newTab) {
                        window.open(link, '_blank');
                    } else {
                        window.location.href = link;
                    }
                }, clickDelay);
            });
        });
    };
    const initResetModal = () => {
        const openBtnDesktop = document.getElementById('open-modal-btn-desktop');
        const closeYesBtn = document.getElementById('modal-yes-btn');
        const closeNoBtn = document.getElementById('modal-no-btn');
        const scrim = document.getElementById('modal-scrim');
        const modalBox = document.getElementById('modal-box');
        const contactForm = document.getElementById('contact-form');
        const body = document.body;
        if (!openBtnDesktop || !modalBox) return;
        let previouslyFocusedElement;
        let scrollPos = 0;
        function openModal() {
            previouslyFocusedElement = document.activeElement;
            scrollPos = window.scrollY;
            body.style.position = 'fixed';
            body.style.top = `-${scrollPos}px`;
            body.style.width = '100%';
            body.classList.add('modal-open');
            document.documentElement.classList.add('modal-is-open');
            setTimeout(() => closeYesBtn.focus(), 100);
        }
        function closeModal() {
            scrim.style.transition = 'none';
            modalBox.style.transition = 'none';
            document.documentElement.classList.remove('modal-is-open');
            document.documentElement.style.scrollBehavior = 'auto';
            body.classList.remove('modal-open');
            body.style.position = '';
            body.style.top = '';
            body.style.width = '';
            window.scrollTo(0, scrollPos);
            setTimeout(() => {
                document.documentElement.style.scrollBehavior = '';
                scrim.style.transition = '';
                modalBox.style.transition = '';
            }, 50);
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus({ preventScroll: true });
            }
        }
        openBtnDesktop.addEventListener('click', openModal);
        if (closeYesBtn) {
            closeYesBtn.addEventListener('click', () => {
                if (contactForm) {
                    contactForm.reset();
                    contactForm.classList.remove('was-validated');
                    const allInputs = contactForm.querySelectorAll('input, select, textarea');
                    allInputs.forEach(el => {
                        el.classList.remove('is-invalid', 'is-valid');
                        el.setCustomValidity('');
                        el.style.borderColor = '';
                        el.removeAttribute('aria-invalid');
                        el.removeAttribute('aria-describedby');
                    });
                    contactForm.querySelectorAll('.invalid-label').forEach(l => l.classList.remove('invalid-label'));
                    contactForm.querySelectorAll('.form-group-animated').forEach(g => g.classList.remove('has-error'));
                    contactForm.querySelectorAll('.invalid-feedback').forEach(f => f.style.display = 'none');
                    const subjectSelect = document.getElementById('subject-select');
                    const freitextGroup = document.getElementById('subject-freitext-group');
                    const freitextInput = document.getElementById('subject-freitext');
                    if (subjectSelect) {
                        subjectSelect.value = "";
                        subjectSelect.setAttribute('name', 'subject');
                        subjectSelect.required = true;
                    }
                    if (freitextGroup) {
                        freitextGroup.classList.remove('visible');
                        freitextGroup.classList.add('d-none');
                        if (freitextInput) {
                            freitextInput.required = false;
                            freitextInput.removeAttribute('name');
                            freitextInput.value = '';
                        }
                    }
                    if (window.sendButtonInstance) {
                        window.sendButtonInstance.reset();
                    }
                    if (typeof grecaptcha !== 'undefined') {
                        try { grecaptcha.reset(); } catch (e) {}
                    }
                }
                closeModal();
            });
        }
        if (closeNoBtn) {
            closeNoBtn.addEventListener('click', closeModal);
        }
        if (scrim) {
            scrim.addEventListener('click', closeModal);
        }
        document.addEventListener('keydown', (e) => {
            if (!document.documentElement.classList.contains('modal-is-open')) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                closeModal();
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                const firstElement = closeNoBtn;
                const lastElement = closeYesBtn;
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                    } else {
                        firstElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                    } else {
                        lastElement.focus();
                    }
                }
            }
        });
    };
    const CONTACT_INFO = {
        email: 'vorstand@business-consulting.de',
        address: 'Robert-Gerwig-Platz 1, Gebäude I, 78120 Furtwangen im Schwarzwald'
    };
    window.copyEmail = () => {
        copyToClipboard(CONTACT_INFO.email, 'E-Mail-Adresse kopiert!', 'Email address copied!');
    };
    window.copyAddress = () => {
        copyToClipboard(CONTACT_INFO.address, 'Adresse kopiert!', 'Address copied!');
    };
    function copyToClipboard(text, messageDe, messageEn) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showCopyNotification(messageDe, messageEn);
            }).catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopy(text, messageDe, messageEn);
            });
        } else {
            fallbackCopy(text, messageDe, messageEn);
        }
    }
    function fallbackCopy(text, messageDe, messageEn) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.setAttribute('readonly', '');
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Helper function to clean up textarea
        const cleanup = () => {
            if (textArea.parentNode) {
                textArea.parentNode.removeChild(textArea);
            }
        };
        
        try {
            textArea.setSelectionRange(0, text.length);
            
            // Versuche erneut mit Clipboard API nach Selection
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    showCopyNotification(messageDe, messageEn);
                    cleanup();
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    cleanup();
                    // Zeige Benachrichtigung trotzdem, da Text ausgewählt ist
                    alert(messageDe + ' ' + text);
                });
            } else {
                // Für sehr alte Browser: zeige Alert
                cleanup();
                alert(messageDe + ' ' + text);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
            cleanup();
        }
    }
    function showCopyNotification(messageDe, messageEn) {
        const currentLang = document.documentElement.lang || 'de';
        const message = currentLang === 'en' ? messageEn : messageDe;
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'success', 3000);
        } else {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--ibc-green, #609744);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            `;
            const icon = document.createElement('i');
            icon.className = 'fas fa-check-circle';
            notification.appendChild(icon);
            notification.appendChild(document.createTextNode(' ' + message));
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    const initHubSpotCheckbox = () => {
        const hubspotCheckbox = document.getElementById('hubspot-consent-checkbox');
        const consentSection = document.querySelector('.hubspot-consent-section');
        if (hubspotCheckbox && consentSection) {
            const updateSectionStyle = () => {
                if (hubspotCheckbox.checked) {
                    consentSection.classList.add('consent-checked');
                } else {
                    consentSection.classList.remove('consent-checked');
                }
            };
            updateSectionStyle();
            hubspotCheckbox.addEventListener('change', updateSectionStyle);
        }
    };
    document.addEventListener('DOMContentLoaded', () => {
        initNavigationAndScrollAnimations();
        initCopyButtons();
        initSocial3DButtons();
        initResetModal();
        initHubSpotCheckbox();
    });
})();