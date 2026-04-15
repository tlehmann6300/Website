
(function() {
    'use strict';
    class SendButton {
        constructor(buttonElement, statusElement) {
            this.btn = buttonElement;
            this.textEl = buttonElement.querySelector('.btn-text');
            this.statusEl = statusElement;
            this.timer = null;
            this.texts = {
                de: {
                    idle: 'Senden',
                    sending: 'Sende...',
                    success: 'Gesendet',
                    error: 'Fehler',
                    statusSending: 'Nachricht wird gesendet...',
                    statusSuccess: 'Erfolg: Nachricht wurde gesendet.',
                    statusError: 'Fehler beim Senden der Nachricht.'
                },
                en: {
                    idle: 'Send',
                    sending: 'Sending...',
                    success: 'Sent',
                    error: 'Error',
                    statusSending: 'Message is being sent...',
                    statusSuccess: 'Success: Message has been sent.',
                    statusError: 'Error sending message.'
                },
                fr: {
                    idle: 'Envoyer',
                    sending: 'Envoi...',
                    success: 'Envoyé',
                    error: 'Erreur',
                    statusSending: 'Le message est en cours d\'envoi...',
                    statusSuccess: 'Succès: Le message a été envoyé.',
                    statusError: 'Erreur lors de l\'envoi du message.'
                }
            };
        }
        getCurrentLanguage() {
            if (window.ibcLanguageSwitcher && window.ibcLanguageSwitcher.currentLang) {
                return window.ibcLanguageSwitcher.currentLang;
            }
            const htmlLang = document.documentElement.getAttribute('lang');
            if (htmlLang && (htmlLang === 'de' || htmlLang === 'en' || htmlLang === 'fr')) {
                return htmlLang;
            }
            return 'de';
        }
        getText(key) {
            const lang = this.getCurrentLanguage();
            return this.texts[lang][key] || this.texts.de[key];
        }
        setState(state, customMessage = '') {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
            this.btn.classList.remove('is-sending', 'is-success', 'is-error');
            switch (state) {
                case 'idle':
                    this.btn.disabled = false;
                    this.btn.removeAttribute('aria-busy');
                    this.textEl.textContent = this.getText('idle');
                    setTimeout(() => {
                        if (!this.timer && this.statusEl) {
                            this.statusEl.textContent = '';
                        }
                    }, 1000);
                    break;
                case 'sending':
                    this.btn.disabled = true;
                    this.btn.setAttribute('aria-busy', 'true');
                    this.btn.classList.add('is-sending');
                    this.textEl.textContent = this.getText('sending');
                    if (this.statusEl) {
                        this.statusEl.textContent = customMessage || this.getText('statusSending');
                    }
                    break;
                case 'success':
                    this.btn.disabled = false;
                    this.btn.removeAttribute('aria-busy');
                    this.btn.classList.add('is-success');
                    this.textEl.textContent = this.getText('success');
                    if (this.statusEl) {
                        this.statusEl.textContent = customMessage || this.getText('statusSuccess');
                    }
                    this.btn.focus();
                    this.timer = setTimeout(() => this.setState('idle'), 3000);
                    break;
                case 'error':
                    this.btn.disabled = false;
                    this.btn.removeAttribute('aria-busy');
                    this.btn.classList.add('is-error');
                    this.textEl.textContent = this.getText('error');
                    if (this.statusEl) {
                        this.statusEl.textContent = customMessage || this.getText('statusError');
                    }
                    this.btn.focus();
                    this.timer = setTimeout(() => this.setState('idle'), 4000);
                    break;
            }
        }
        reset() {
            this.setState('idle');
        }
    }
    function initSendButton() {
        const btn = document.getElementById('contact-send-btn');
        const statusEl = document.getElementById('statusMessage');
        if (!btn || !statusEl) {
            console.warn('Send button or status element not found');
            return null;
        }
        return new SendButton(btn, statusEl);
    }
    window.initSendButton = initSendButton;
    window.SendButton = SendButton;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.sendButtonInstance = initSendButton();
        });
    } else {
        window.sendButtonInstance = initSendButton();
    }
})();
