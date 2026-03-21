/**
 * NewMenu (nm-page) — alt dock, ayarlar modalı, AI kısayolu (#ai-fab).
 * Kategori / sepet / SignalR mantığı _NewMenuScriptsBody içinde kalır.
 */
(function () {
    'use strict';

    function qs(sel, root) {
        return (root || document).querySelector(sel);
    }

    function qsa(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body.classList.contains('nm-page')) return;

        var home = document.getElementById('menuTabHome');
        var about = document.getElementById('menuTabAbout');

        function setDockActive(view) {
            qsa('.nm-dock [data-nm-view]').forEach(function (b) {
                b.classList.toggle('is-active', b.getAttribute('data-nm-view') === view);
            });
        }

        function goHome() {
            setDockActive('home');
            if (home) home.style.display = '';
            if (about) about.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function goAbout() {
            setDockActive('about');
            if (home) home.style.display = 'none';
            if (about) about.style.display = '';
            // scrollIntoView küçük kaydırmaya yol açıyor; bilgi görünümü üstten başlasın
            window.scrollTo(0, 0);
        }

        function openSettings() {
            var modal = document.getElementById('nmSettingsModal');
            if (!modal) return;
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeSettings() {
            var modal = document.getElementById('nmSettingsModal');
            if (!modal) return;
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        qsa('.nm-dock [data-nm-view]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var v = btn.getAttribute('data-nm-view');
                if (v === 'settings') {
                    openSettings();
                    return;
                }
                if (v === 'ai') {
                    var aiFab = document.getElementById('ai-fab');
                    if (aiFab) aiFab.click();
                    setDockActive('ai');
                    if (home) home.style.display = '';
                    if (about) about.style.display = 'none';
                    return;
                }
                if (v === 'home') goHome();
                else if (v === 'about') goAbout();
            });
        });

        var openSt = document.getElementById('nmOpenSettings');
        if (openSt) openSt.addEventListener('click', openSettings);
        var backdrop = document.getElementById('nmSettingsBackdrop');
        if (backdrop) backdrop.addEventListener('click', closeSettings);
        var closeBtn = document.getElementById('nmSettingsClose');
        if (closeBtn) closeBtn.addEventListener('click', closeSettings);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                var modal = document.getElementById('nmSettingsModal');
                if (modal && !modal.hidden) closeSettings();
            }
        });
    });
})();
