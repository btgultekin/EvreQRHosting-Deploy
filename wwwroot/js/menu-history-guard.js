/**
 * QR menü: geri tuşu ile sayfanın kapanmasını engeller; ModernModal ile onay sorar.
 * Çıkış: önce history.go(-2) (tuzak + gerçek geri); yetersiz geçmiş veya hata → Google.
 * _MenuLayout’ta modern-modal.js sonrası yüklenir.
 */
(function () {
    'use strict';

    var GOOGLE_FALLBACK = 'https://www.google.com';

    /** İlk -1 tuzak pushState, ikinci -1 müşterinin geldiği önceki kayıt */
    function exitMenuRealBack() {
        try {
            if (window.history.length > 2) {
                window.history.go(-2);
            } else {
                window.location.assign(GOOGLE_FALLBACK);
            }
        } catch (_e) {
            window.location.assign(GOOGLE_FALLBACK);
        }
    }

    function pushTrap() {
        try {
            history.pushState({ evreqrMenuTrap: true }, '', window.location.href);
        } catch (_e) {}
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body.classList.contains('menu-page')) return;

        var dialogOpen = false;

        pushTrap();

        window.addEventListener('popstate', function () {
            pushTrap();
            if (dialogOpen) return;

            dialogOpen = true;

            function done() {
                dialogOpen = false;
            }

            if (typeof ModernModal !== 'undefined' && typeof ModernModal.confirm === 'function') {
                ModernModal.confirm(
                    'Menüden ayrılmak üzeresiniz. Devam etmek istiyor musunuz?',
                    'Menüden ayrıl',
                    {
                        icon: 'question',
                        confirmText: 'Çıkış Yap',
                        cancelText: 'Menüde Kal',
                        confirmClass: 'mm-btn-primary',
                        cancelClass: 'mm-btn-secondary'
                    }
                ).then(function (confirmed) {
                    done();
                    if (confirmed) {
                        exitMenuRealBack();
                    }
                });
            } else {
                if (
                    window.confirm(
                        'Menüden ayrılmak üzeresiniz. Çıkmak istiyor musunuz?'
                    )
                ) {
                    done();
                    exitMenuRealBack();
                } else {
                    done();
                }
            }
        });
    });
})();
