/**
 * Kontaktformular-Modul
 * 
 * Dieses Modul verwaltet die gesamte Funktionalität des Kontaktformulars auf der Website.
 * Es enthält:
 * - Formular-Validierung (clientseitig)
 * - AJAX-Formular-Übermittlung
 * - reCAPTCHA-Integration
 * - Toast-Benachrichtigungen
 * - Fehlermeldungs-Behandlung
 * - CSRF-Token-Validierung
 * - Benutzer-Consent-Verwaltung
 * 
 * @module ContactForm
 */
(function() {
    // Aktiviert Strict-Modus für sichereren Code
    'use strict';
    
    /**
     * Flag, um zu verfolgen, ob das Formular bereits abgeschickt wurde
     * Wird verwendet, um die Validierung beim Tippen zu aktivieren
     * @type {boolean}
     */
    let formSubmitted = false;
    /**
     * Setzt das Flag, dass das Formular abgeschickt wurde
     * Aktiviert die Live-Validierung beim Tippen
     */
    const setFormSubmittedFlag = () => {
        formSubmitted = true;
    };
    
    /**
     * Setzt das Flag für die Formular-Übermittlung zurück
     * Wird nach erfolgreicher Übermittlung aufgerufen
     */
    const resetFormSubmissionFlag = () => {
        formSubmitted = false;
    };
    
    /**
     * Gibt den aktuellen Status des Formular-Übermittlungs-Flags zurück
     * @returns {boolean} true wenn das Formular bereits abgeschickt wurde
     */
    const isFormSubmitted = () => {
        return formSubmitted;
    };
    
    // Macht die Reset-Funktion global verfügbar für externe Aufrufe
    window.resetFormValidationState = resetFormSubmissionFlag;
    /**
     * Initialisiert das Kontaktformular
     * 
     * Diese Hauptfunktion richtet alle Event-Listener ein, verwaltet die Formular-Logik
     * und behandelt die Formular-Übermittlung. Sie wird beim DOM-Load aufgerufen.
     * 
     * Hauptaufgaben:
     * - Event-Listener für Formular-Submit einrichten
     * - URL-Parameter für Betreff-Vorauswahl verarbeiten
     * - Toast-Benachrichtigungen erstellen
     * - Fehlermeldungen anzeigen
     * - AJAX-Request für Formular-Übermittlung
     * - reCAPTCHA-Validierung
     * - CSRF-Token-Verwaltung
     */
    const initContactForm = () => {
        // Holt das Kontaktformular-Element aus dem DOM
        const contactForm = document.getElementById('contact-form');
        // Wenn das Formular nicht existiert, beende die Funktion
        if (!contactForm) return;
        const subjectSelect = document.getElementById('subject-select');
        const freitextGroup = document.getElementById('subject-freitext-group');
        const freitextInput = document.getElementById('subject-freitext');
        const urlParams = new URLSearchParams(window.location.search);
        const subjectParam = urlParams.get('subject');
        if (subjectParam && subjectSelect) {
            const decodedSubject = decodeURIComponent(subjectParam);
            const options = subjectSelect.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === decodedSubject) {
                    subjectSelect.value = decodedSubject;
                    break;
                }
            }
        }
        const showToast = (message, type = 'info', duration = 5000, options = {}) => {
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
            const toast = document.createElement('div');
            toast.className = `toast-notification toast-${type}`;
            const icons = {
                success: '<i class="fas fa-check-circle"></i>',
                error: '<i class="fas fa-exclamation-circle"></i>',
                warning: '<i class="fas fa-exclamation-triangle"></i>',
                info: '<i class="fas fa-info-circle"></i>'
            };
            const titles = {
                success: 'Erfolg',
                error: 'Fehler',
                warning: 'Warnung',
                info: 'Information'
            };
            const toastIcon = document.createElement('div');
            toastIcon.className = 'toast-icon';
            toastIcon.innerHTML = icons[type] || icons.info;
            const toastContent = document.createElement('div');
            toastContent.className = 'toast-content';
            const toastTitle = document.createElement('div');
            toastTitle.className = 'toast-title';
            toastTitle.textContent = titles[type] || titles.info;
            const toastMessage = document.createElement('p');
            toastMessage.className = 'toast-message';
            toastMessage.textContent = message;
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.setAttribute('aria-label', 'Schließen');
            closeBtn.innerHTML = '&times;';
            toastContent.appendChild(toastTitle);
            toastContent.appendChild(toastMessage);
            toast.appendChild(toastIcon);
            toast.appendChild(toastContent);
            toast.appendChild(closeBtn);
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
        if (subjectSelect && freitextGroup && freitextInput) {
            subjectSelect.addEventListener('change', function () {
                if (this.value === 'Freitext') {
                    freitextGroup.classList.add('visible');
                    freitextGroup.classList.remove('d-none');
                    freitextInput.setAttribute('required', 'required');
                    freitextInput.setAttribute('name', 'subject');
                    subjectSelect.removeAttribute('name');
                    subjectSelect.removeAttribute('required');
                    subjectSelect.classList.remove('is-invalid');
                    const selectGroup = subjectSelect.closest('.form-group-animated');
                    if (selectGroup) selectGroup.classList.remove('has-error');
                    const selectLabel = selectGroup.querySelector('label');
                    if (selectLabel) selectLabel.classList.remove('invalid-label');
                } else {
                    freitextGroup.classList.remove('visible');
                    freitextGroup.classList.add('d-none');
                    freitextInput.removeAttribute('required');
                    freitextInput.removeAttribute('name');
                    freitextInput.value = '';
                    freitextInput.classList.remove('is-invalid');
                    const freitextLabel = freitextGroup.querySelector('label');
                    if (freitextLabel) freitextLabel.classList.remove('invalid-label');
                    freitextGroup.classList.remove('has-error');
                    subjectSelect.setAttribute('name', 'subject');
                    subjectSelect.setAttribute('required', 'required');
                }
            });
        }
        const clearValidationErrors = () => {
            contactForm.querySelectorAll('.is-invalid').forEach(el => {
                el.classList.remove('is-invalid');
                el.removeAttribute('aria-invalid');
            });
            contactForm.querySelectorAll('.invalid-label').forEach(el => el.classList.remove('invalid-label'));
            contactForm.querySelectorAll('.form-group-animated').forEach(el => el.classList.remove('has-error'));
        };
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();
            setFormSubmittedFlag();
            clearValidationErrors();
            if (window.sendButtonInstance && window.sendButtonInstance.btn.classList.contains('is-sending')) {
                return;
            }
            let isValid = true;
            let errorMessages = [];
            const fieldsToValidate = [
                { id: 'name', msg: 'Bitte geben Sie Ihren Namen ein.' },
                { id: 'email', msg: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.', type: 'email' },
                { id: 'message', msg: 'Bitte geben Sie eine Nachricht ein.' }
            ];
            const subjectSelectValue = subjectSelect.value;
            if (subjectSelectValue === 'Freitext') {
                fieldsToValidate.push({
                    id: 'subject-freitext',
                    msg: 'Bitte geben Sie Ihren Betreff ein.'
                });
            } else if (subjectSelectValue === '') {
                fieldsToValidate.push({
                    id: 'subject-select',
                    msg: 'Bitte wählen Sie einen Betreff aus.'
                });
            }
            fieldsToValidate.forEach(field => {
                const input = document.getElementById(field.id);
                if (!input) return;
                const label = contactForm.querySelector(`label[for="${field.id}"]`);
                const group = input.closest('.form-group-animated');
                const errorDiv = group ? group.querySelector('.invalid-feedback') : null;
                let fieldIsValid = true;
                if (field.type === 'email') {
                    fieldIsValid = input.value.trim() !== '' && input.checkValidity();
                } else {
                    fieldIsValid = input.value.trim() !== '';
                }
                if (!fieldIsValid) {
                    isValid = false;
                    input.classList.add('is-invalid');
                    input.setAttribute('aria-invalid', 'true');
                    if (label) label.classList.add('invalid-label');
                    if (errorDiv) {
                        errorDiv.textContent = field.msg;
                        const errorId = `${field.id}-error`;
                        errorDiv.id = errorId;
                        const currentDescribedBy = input.getAttribute('aria-describedby') || '';
                        if (!currentDescribedBy.includes(errorId)) {
                            input.setAttribute('aria-describedby', currentDescribedBy ? `${currentDescribedBy} ${errorId}` : errorId);
                        }
                    }
                    if (group) group.classList.add('has-error');
                    errorMessages.push(field.id);
                } else {
                    input.classList.remove('is-invalid');
                    input.removeAttribute('aria-invalid');
                    if (label) label.classList.remove('invalid-label');
                    if (group) group.classList.remove('has-error');
                    if (errorDiv) errorDiv.textContent = '';
                }
            });
            const privacyCheckbox = document.getElementById('privacy-checkbox');
            if (privacyCheckbox && !privacyCheckbox.checked) {
                isValid = false;
                privacyCheckbox.classList.add('is-invalid');
                privacyCheckbox.setAttribute('aria-invalid', 'true');
                const checkGroup = privacyCheckbox.closest('.form-check');
                if (checkGroup) {
                    const errorDiv = checkGroup.querySelector('.invalid-feedback');
                    if (errorDiv) {
                        errorDiv.style.display = 'block';
                        const errorId = 'privacy-checkbox-error';
                        errorDiv.id = errorId;
                        privacyCheckbox.setAttribute('aria-describedby', errorId);
                    }
                }
            } else if (privacyCheckbox) {
                privacyCheckbox.classList.remove('is-invalid');
                privacyCheckbox.removeAttribute('aria-invalid');
                const checkGroup = privacyCheckbox.closest('.form-check');
                if (checkGroup) {
                    const errorDiv = checkGroup.querySelector('.invalid-feedback');
                    if (errorDiv) {
                        errorDiv.style.display = 'none';
                        if (privacyCheckbox.getAttribute('aria-describedby') === 'privacy-checkbox-error') {
                            privacyCheckbox.removeAttribute('aria-describedby');
                        }
                    }
                }
            }
            const recaptchaResponse = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
            const recaptchaResponseInput = document.getElementById('g-recaptcha-response-input');
            if (recaptchaResponseInput) {
                recaptchaResponseInput.value = recaptchaResponse;
            }
            if (recaptchaResponse.length === 0 && typeof grecaptcha !== 'undefined') {
                isValid = false;
            }
            if (!isValid) {
                const firstInvalidField = contactForm.querySelector('.is-invalid');
                if (firstInvalidField) {
                    if (window.innerWidth <= 768) {
                        firstInvalidField.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                        setTimeout(() => {
                            firstInvalidField.focus({ preventScroll: true });
                        }, 500);
                    } else {
                        firstInvalidField.focus({ preventScroll: true });
                    }
                }
                if (errorMessages.length > 0) {
                    const errorMsg = window.ibcLanguageSwitcher ?
                        window.ibcLanguageSwitcher.getTranslation('form-validation-error') :
                        'Bitte prüfen Sie die rot markierten Felder.';
                    showToast(errorMsg, 'error');
                } else if (recaptchaResponse.length === 0 && typeof grecaptcha !== 'undefined') {
                    const recaptchaMsg = window.ibcLanguageSwitcher ?
                        window.ibcLanguageSwitcher.getTranslation('form-recaptcha-error') :
                        'Bitte bestätigen Sie die reCAPTCHA-Überprüfung.';
                    showToast(recaptchaMsg, 'error');
                }
                return;
            }
            const formData = new FormData(contactForm);
            if (window.sendButtonInstance) {
                window.sendButtonInstance.setState('sending');
            }
            fetch('get_csrf.php', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    const error = new Error('Failed to fetch CSRF token');
                    error.type = 'CSRF_FETCH_ERROR';
                    throw error;
                }
                return response.json();
            })
            .then(data => {
                if (!data || !data.token) {
                    const error = new Error('Invalid CSRF token response');
                    error.type = 'CSRF_INVALID_ERROR';
                    throw error;
                }
                formData.append('csrf_token', data.token);
                return fetch('send_mail.php', {
                    method: 'POST',
                    credentials: 'same-origin',
                    body: formData
                });
            })
            .catch(error => {
                if (error.type === 'CSRF_FETCH_ERROR' || error.type === 'CSRF_INVALID_ERROR') {
                    console.error('CSRF Token Error:', error);
                    if (window.sendButtonInstance) {
                        window.sendButtonInstance.setState('error', 'Fehler');
                    }
                    showToast('Sicherheitsfehler. Bitte laden Sie die Seite neu.', 'error', 8000);
                    throw error;
                }
                throw error;
            })
            .then(async response => {
                const isJson = response.headers.get('content-type')?.includes('application/json');
                let data = null;
                if (isJson) {
                    try {
                        data = await response.json();
                    } catch (jsonError) {
                        console.error('Failed to parse JSON response:', jsonError);
                    }
                }
                if (!response.ok) {
                    let userMessage = 'Ein unerwarteter Fehler ist aufgetreten.';
                    if (data && data.message) {
                        userMessage = data.message;
                    } else if (response.status === 429) {
                        userMessage = 'Zu viele Anfragen! Bitte warten Sie eine Stunde, bevor Sie es erneut versuchen.';
                    } else if (response.status === 400) {
                        userMessage = 'Bitte überprüfen Sie Ihre Eingaben. Einige Felder scheinen ungültig zu sein.';
                    } else if (response.status === 500) {
                        userMessage = 'Serverfehler. Unser Mailserver antwortet momentan nicht. Bitte schreiben Sie uns direkt per E-Mail.';
                    } else {
                        userMessage = 'Die Anfrage ist fehlgeschlagen. Status: ' + response.status;
                    }
                    throw new Error(userMessage);
                }
                if (!data) {
                    throw new Error('Server returned a non-JSON response. Please contact support.');
                }
                return data;
            })
            .then(data => {
                if (data && data.success) {
                    const successMsg = data.message || (window.ibcLanguageSwitcher ?
                        window.ibcLanguageSwitcher.getTranslation('form-success-message') :
                        'Ihre Nachricht wurde erfolgreich gesendet!');
                    if (window.sendButtonInstance) window.sendButtonInstance.setState('success', successMsg);
                    showToast(successMsg, 'success', 7000);
                    contactForm.reset();
                    subjectSelect.value = "";
                    subjectSelect.setAttribute('name', 'subject');
                    subjectSelect.setAttribute('required', 'required');
                    if (freitextGroup) {
                        freitextGroup.classList.remove('visible');
                        freitextGroup.classList.add('d-none');
                    }
                    if (freitextInput) {
                        freitextInput.removeAttribute('required');
                        freitextInput.removeAttribute('name');
                        freitextInput.value = '';
                    }
                    if (typeof grecaptcha !== 'undefined') {
                        grecaptcha.reset();
                    }
                    clearValidationErrors();
                } else {
                    throw new Error(data.message || 'Das Formular konnte nicht verarbeitet werden.');
                }
            })
            .catch(error => {
                console.error('Submission Error:', error);
                if (window.sendButtonInstance) {
                    window.sendButtonInstance.setState('error', 'Fehler');
                }
                showToast(error.message, 'error', 8000);
                showFormStatusMessage(error.message, 'error', 10000);
                if (typeof grecaptcha !== 'undefined') {
                    try { grecaptcha.reset(); } catch(e) {}
                }
            });
        });
    };
    const initFieldValidation = () => {
        const form = document.querySelector('#contact-form');
        if (!form) return;
        const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
        fields.forEach(field => {
            field.addEventListener('blur', function() {
                validateField(this);
            });
            field.addEventListener('input', function() {
                if (isFormSubmitted()) {
                    validateField(this);
                }
            });
        });
        function getFieldContainer(field) {
            const container = field.closest('.form-group-animated') || field.parentElement;
            if (!container) {
                console.warn('Cannot find container for field validation:', {
                    id: field.id || 'unknown',
                    name: field.name || 'unknown',
                    type: field.type || 'unknown'
                });
            }
            return container;
        }
        function validateField(field) {
            const isValid = field.checkValidity();
            const t = (key, defaultText) => {
                return (window.ibcLanguageSwitcher && window.ibcLanguageSwitcher.getTranslation(key) !== key)
                       ? window.ibcLanguageSwitcher.getTranslation(key)
                       : defaultText;
            };
            if (!isValid) {
                field.classList.add('is-invalid');
                field.classList.remove('is-valid');
                field.setAttribute('aria-invalid', 'true');
                const container = getFieldContainer(field);
                if (!container) return false;
                let errorMsg = container.querySelector('.invalid-feedback');
                if (!errorMsg) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'invalid-feedback';
                    errorMsg.id = field.id + '-error';
                    container.appendChild(errorMsg);
                }
                if (!field.getAttribute('aria-describedby')) {
                    field.setAttribute('aria-describedby', errorMsg.id);
                }
                if (field.validity.valueMissing) {
                    errorMsg.textContent = t('form-field-empty-error', 'Bitte füllen Sie dieses Feld aus.');
                } else if (field.validity.typeMismatch && field.type === 'email') {
                    errorMsg.textContent = t('contact-form-email-error', 'Bitte geben Sie eine korrekte E-Mail-Adresse ein.');
                } else if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
                    errorMsg.textContent = t('form-privacy-error', 'Bitte akzeptieren Sie den Datenschutz.');
                } else {
                    errorMsg.textContent = t('form-validation-error', 'Bitte prüfen Sie Ihre Eingabe.');
                }
                return false;
            } else {
                field.classList.remove('is-invalid');
                field.classList.add('is-valid');
                field.removeAttribute('aria-invalid');
                const container = getFieldContainer(field);
                if (container) {
                    const errorMsg = container.querySelector('.invalid-feedback');
                    if (errorMsg) {
                        errorMsg.textContent = '';
                    }
                }
                return true;
            }
        }
    };
    const initRecaptchaConsentHandling = () => {
        const contactForm = document.getElementById('contact-form');
        const consentNotice = document.getElementById('recaptcha-consent-notice');
        const recaptchaWrapper = document.querySelector('.recaptcha-wrapper');
        const openConsentBtn = document.getElementById('open-consent-settings-btn');
        if (!contactForm || !consentNotice) return;
        const disableForm = () => {
            contactForm.classList.add('form-disabled-no-consent');
            const inputs = contactForm.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = true;
            });
            consentNotice.classList.add('visible');
            if (recaptchaWrapper) {
                recaptchaWrapper.classList.add('hidden');
            }
        };
        const enableForm = () => {
            contactForm.classList.remove('form-disabled-no-consent');
            const inputs = contactForm.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = false;
            });
            consentNotice.classList.remove('visible');
            if (recaptchaWrapper) {
                recaptchaWrapper.classList.remove('hidden');
            }
        };
        const checkConsentState = () => {
            const consentSettings = localStorage.getItem('consent_settings');
            if (!consentSettings) {
                disableForm();
                return;
            }
            try {
                const settings = JSON.parse(consentSettings);
                if (settings.security === true) {
                    enableForm();
                } else {
                    disableForm();
                }
            } catch (e) {
                console.error('Error parsing consent settings:', e);
                disableForm();
            }
        };
        checkConsentState();
        document.addEventListener('consentGiven', (event) => {
            checkConsentState();
        });
        if (openConsentBtn) {
            openConsentBtn.addEventListener('click', () => {
                if (window.cookieConsent && typeof window.cookieConsent.showBanner === 'function') {
                    window.cookieConsent.showBanner();
                } else {
                    const errorMsg = 'Cookie-Einstellungen konnten nicht geöffnet werden. Bitte laden Sie die Seite neu und versuchen Sie es erneut.';
                    if (typeof showToast === 'function') {
                        showToast(errorMsg, 'error');
                    } else {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'alert alert-danger mt-2';
                        errorDiv.textContent = errorMsg;
                        consentNotice.appendChild(errorDiv);
                        setTimeout(() => errorDiv.remove(), 5000);
                    }
                }
            });
        }
    };
    document.addEventListener('DOMContentLoaded', () => {
        initContactForm();
        initFieldValidation();
        initRecaptchaConsentHandling();
    });
})();
