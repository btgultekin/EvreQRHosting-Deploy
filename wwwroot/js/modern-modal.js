/**
 * ModernModal - Modern alert/confirm/prompt replacement
 * 
 * Usage:
 *   ModernModal.alert('Mesaj', 'Başlık', 'info');
 *   ModernModal.confirm('Emin misiniz?', 'Onay').then(result => { if(result) ... });
 *   ModernModal.prompt('Değer giriniz', 'Başlık').then(value => { if(value !== null) ... });
 *   ModernModal.toast('Başarılı!', 'success');
 */
(function(global) {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // ICONS (SVG)
    // ═══════════════════════════════════════════════════════════════════════════
    var icons = {
        info: '<svg class="mm-icon mm-icon-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        success: '<svg class="mm-icon mm-icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        warning: '<svg class="mm-icon mm-icon-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        error: '<svg class="mm-icon mm-icon-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        question: '<svg class="mm-icon mm-icon-question" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL CONTAINER
    // ═══════════════════════════════════════════════════════════════════════════
    var modalContainer = null;
    var toastContainer = null;

    function ensureContainers() {
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'mm-modal-container';
            document.body.appendChild(modalContainer);
        }
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'mm-toast-container';
            document.body.appendChild(toastContainer);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Show a modal dialog
     * @param {Object} options - Modal options
     * @returns {Promise} - Resolves with button result or input value
     */
    function showModal(options) {
        ensureContainers();

        var opts = Object.assign({
            title: '',
            message: '',
            icon: 'info', // info, success, warning, error, question
            showCancel: false,
            confirmText: 'Tamam',
            cancelText: 'İptal',
            confirmClass: 'mm-btn-primary',
            cancelClass: 'mm-btn-secondary',
            input: false, // false or 'text' for prompt
            inputPlaceholder: '',
            inputValue: '',
            dangerous: false, // true for destructive actions
            allowHtml: false // true to render HTML in message
        }, options);

        return new Promise(function(resolve) {
            // Create modal HTML
            var modal = document.createElement('div');
            modal.className = 'mm-modal-overlay';
            modal.innerHTML = '\
                <div class="mm-modal">\
                    <div class="mm-modal-content">\
                        <div class="mm-modal-header">\
                            <div class="mm-icon-wrapper mm-icon-' + opts.icon + '">' + (icons[opts.icon] || icons.info) + '</div>\
                            ' + (opts.title ? '<h3 class="mm-modal-title">' + escapeHtml(opts.title) + '</h3>' : '') + '\
                        </div>\
                        <div class="mm-modal-body">\
                            <div class="mm-modal-message">' + (opts.allowHtml ? opts.message : escapeHtml(opts.message)) + '</div>\
                            ' + (opts.input ? '<input type="text" class="mm-modal-input" placeholder="' + escapeHtml(opts.inputPlaceholder) + '" value="' + escapeHtml(opts.inputValue) + '">' : '') + '\
                        </div>\
                        <div class="mm-modal-footer">\
                            ' + (opts.showCancel ? '<button type="button" class="mm-btn ' + opts.cancelClass + '" data-action="cancel">' + escapeHtml(opts.cancelText) + '</button>' : '') + '\
                            <button type="button" class="mm-btn ' + (opts.dangerous ? 'mm-btn-danger' : opts.confirmClass) + '" data-action="confirm">' + escapeHtml(opts.confirmText) + '</button>\
                        </div>\
                    </div>\
                </div>\
            ';

            modalContainer.appendChild(modal);

            // Focus management
            var input = modal.querySelector('.mm-modal-input');
            var confirmBtn = modal.querySelector('[data-action="confirm"]');
            
            setTimeout(function() {
                modal.classList.add('mm-show');
                if (input) {
                    input.focus();
                    input.select();
                } else {
                    confirmBtn.focus();
                }
            }, 10);

            // Event handlers
            function closeModal(result) {
                modal.classList.remove('mm-show');
                setTimeout(function() {
                    modal.remove();
                }, 200);
                resolve(result);
            }

            // Button clicks
            modal.querySelectorAll('.mm-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var action = this.getAttribute('data-action');
                    if (action === 'cancel') {
                        closeModal(opts.input ? null : false);
                    } else {
                        if (opts.input) {
                            closeModal(input.value);
                        } else {
                            closeModal(true);
                        }
                    }
                });
            });

            // Enter key
            if (input) {
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        closeModal(input.value);
                    } else if (e.key === 'Escape') {
                        closeModal(null);
                    }
                });
            }

            // Escape key
            modal.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && !opts.input) {
                    closeModal(opts.showCancel ? false : true);
                }
            });

            // Click outside to close (only for alerts without cancel)
            modal.addEventListener('click', function(e) {
                if (e.target === modal && !opts.showCancel && !opts.input) {
                    closeModal(true);
                }
            });
        });
    }

    /**
     * Show an alert modal (single OK button)
     */
    function alertModal(message, title, icon) {
        return showModal({
            title: title || 'Bilgi',
            message: message,
            icon: icon || 'info',
            showCancel: false
        });
    }

    /**
     * Show a confirm modal (OK/Cancel buttons)
     */
    function confirmModal(message, title, options) {
        var opts = Object.assign({
            title: title || 'Onay',
            message: message,
            icon: 'question',
            showCancel: true,
            confirmText: 'Evet',
            cancelText: 'Hayır'
        }, options || {});
        return showModal(opts);
    }

    /**
     * Show a prompt modal (input + OK/Cancel)
     */
    function promptModal(message, title, defaultValue) {
        return showModal({
            title: title || 'Giriş',
            message: message,
            icon: 'question',
            showCancel: true,
            input: true,
            inputValue: defaultValue || '',
            confirmText: 'Tamam',
            cancelText: 'İptal'
        });
    }

    /**
     * Show a success alert
     */
    function successModal(message, title) {
        return alertModal(message, title || 'Başarılı', 'success');
    }

    /**
     * Show an error alert
     */
    function errorModal(message, title) {
        return alertModal(message, title || 'Hata', 'error');
    }

    /**
     * Show a warning alert
     */
    function warningModal(message, title) {
        return alertModal(message, title || 'Uyarı', 'warning');
    }

    /**
     * Show a dangerous confirm (red button)
     */
    function dangerConfirm(message, title, confirmText) {
        return showModal({
            title: title || 'Dikkat',
            message: message,
            icon: 'warning',
            showCancel: true,
            confirmText: confirmText || 'Sil',
            cancelText: 'İptal',
            dangerous: true
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOAST FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Show a toast notification
     */
    function toast(message, type, duration) {
        ensureContainers();

        type = type || 'info';
        duration = duration || 3000;

        var toastEl = document.createElement('div');
        toastEl.className = 'mm-toast mm-toast-' + type;
        toastEl.innerHTML = '\
            <div class="mm-toast-icon">' + (icons[type] || icons.info) + '</div>\
            <div class="mm-toast-message">' + escapeHtml(message) + '</div>\
            <button type="button" class="mm-toast-close">&times;</button>\
        ';

        toastContainer.appendChild(toastEl);

        // Show animation
        setTimeout(function() {
            toastEl.classList.add('mm-toast-show');
        }, 10);

        // Auto hide
        var hideTimeout = setTimeout(function() {
            hideToast(toastEl);
        }, duration);

        // Manual close
        toastEl.querySelector('.mm-toast-close').addEventListener('click', function() {
            clearTimeout(hideTimeout);
            hideToast(toastEl);
        });
    }

    function hideToast(toastEl) {
        toastEl.classList.remove('mm-toast-show');
        toastEl.classList.add('mm-toast-hide');
        setTimeout(function() {
            toastEl.remove();
        }, 300);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    global.ModernModal = {
        show: showModal,
        alert: alertModal,
        confirm: confirmModal,
        prompt: promptModal,
        success: successModal,
        error: errorModal,
        warning: warningModal,
        dangerConfirm: dangerConfirm,
        toast: toast
    };

})(window);
