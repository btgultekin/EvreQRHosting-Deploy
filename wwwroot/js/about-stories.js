/**
 * Tam ekran Hakkımızda slayt (#evreqr-about-stories-json).
 */
(function () {
    'use strict';

    var AUTO_MS = 6000;
    var SWIPE_MIN = 56;
    var CLOSE_DOWN_MIN = 72;
    var TAP_MAX_DIST = 22;
    var TAP_MAX_MS = 420;

    function parseUrls() {
        var el = document.getElementById('evreqr-about-stories-json');
        if (!el) return [];
        try {
            var arr = JSON.parse(el.textContent || '[]');
            return Array.isArray(arr) ? arr.filter(function (u) { return typeof u === 'string' && u.length; }) : [];
        } catch (_e) {
            return [];
        }
    }

    var urls = parseUrls();

    var root = document.getElementById('nm-about-stories');
    var imgEl = document.getElementById('nmAboutStoriesImg');
    var progressHost = document.getElementById('nmAboutStoriesProgress');
    var closeBtn = document.getElementById('nmAboutStoriesClose');
    var touchLayer = document.getElementById('nmAboutStoriesTouch');

    var idx = 0;
    var timerId = null;
    var progressRaf = null;
    var segmentStartedAt = 0;
    var fills = [];

    function clearTimer() {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
        if (progressRaf) {
            cancelAnimationFrame(progressRaf);
            progressRaf = null;
        }
    }

    function buildProgressBars() {
        if (!progressHost) return;
        progressHost.innerHTML = '';
        fills = [];
        for (var i = 0; i < urls.length; i++) {
            var bar = document.createElement('div');
            bar.className = 'nm-about-stories__progress-bar';
            var fill = document.createElement('div');
            fill.className = 'nm-about-stories__progress-fill';
            if (i < idx) fill.classList.add('is-done');
            bar.appendChild(fill);
            progressHost.appendChild(bar);
            fills.push(fill);
        }
    }

    function setFillWidths(activeFrac) {
        for (var i = 0; i < fills.length; i++) {
            var f = fills[i];
            f.classList.remove('is-active', 'is-done');
            if (i < idx) {
                f.style.width = '100%';
                f.classList.add('is-done');
            } else if (i > idx) {
                f.style.width = '0%';
            } else {
                f.style.width = Math.min(100, Math.max(0, activeFrac * 100)) + '%';
                f.classList.add('is-active');
            }
        }
    }

    function tickProgress() {
        if (!fills.length) return;
        var elapsed = Date.now() - segmentStartedAt;
        var frac = elapsed / AUTO_MS;
        setFillWidths(Math.min(1, frac));
        if (frac < 1) progressRaf = requestAnimationFrame(tickProgress);
    }

    function scheduleAutoAdvance() {
        clearTimer();
        if (urls.length === 0) return;
        segmentStartedAt = Date.now();
        setFillWidths(0);
        progressRaf = requestAnimationFrame(tickProgress);
        timerId = setTimeout(function () {
            goNext();
        }, AUTO_MS);
    }

    function showSlide() {
        if (!imgEl || urls.length === 0) return;
        imgEl.src = urls[idx];
    }

    function goNext() {
        if (urls.length === 0) return;
        clearTimer();
        idx = (idx + 1) % urls.length;
        buildProgressBars();
        showSlide();
        scheduleAutoAdvance();
    }

    function goPrev() {
        if (urls.length === 0) return;
        clearTimer();
        idx = (idx - 1 + urls.length) % urls.length;
        buildProgressBars();
        showSlide();
        scheduleAutoAdvance();
    }

    function open() {
        if (!root || urls.length === 0) return;
        idx = 0;
        root.hidden = false;
        root.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        buildProgressBars();
        showSlide();
        scheduleAutoAdvance();
    }

    function close() {
        if (!root) return;
        clearTimer();
        root.hidden = true;
        root.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        root.classList.remove('nm-about-stories--closing-down', 'is-swipe-next', 'is-swipe-prev');
    }

    function tapZoneFromClientX(clientX) {
        if (!touchLayer) return;
        var r = touchLayer.getBoundingClientRect();
        var x = clientX - r.left;
        if (x < r.width * 0.35) goPrev();
        else goNext();
    }

    var gesture = null;

    function onTouchStart(e) {
        if (!e.touches || !e.touches.length) return;
        var t = e.touches[0];
        gesture = { x0: t.clientX, y0: t.clientY, t0: Date.now() };
        root.classList.remove('is-swipe-next', 'is-swipe-prev');
    }

    function onTouchMove(e) {
        if (!gesture || !e.touches || !e.touches.length) return;
        var t = e.touches[0];
        var dx = t.clientX - gesture.x0;
        var dy = t.clientY - gesture.y0;
        if (Math.abs(dx) > Math.abs(dy)) {
            root.classList.toggle('is-swipe-next', dx > 12);
            root.classList.toggle('is-swipe-prev', dx < -12);
        }
    }

    function onTouchEnd(e) {
        if (!gesture) return;
        var end = e.changedTouches && e.changedTouches[0];
        if (!end) {
            gesture = null;
            return;
        }
        var dx = end.clientX - gesture.x0;
        var dy = end.clientY - gesture.y0;
        var dt = Date.now() - gesture.t0;
        gesture = null;
        root.classList.remove('is-swipe-next', 'is-swipe-prev');

        var dist = Math.max(Math.abs(dx), Math.abs(dy));
        if (dist <= TAP_MAX_DIST && dt <= TAP_MAX_MS) {
            tapZoneFromClientX(end.clientX);
            return;
        }

        if (Math.abs(dy) > Math.abs(dx) && dy > CLOSE_DOWN_MIN) {
            root.classList.add('nm-about-stories--closing-down');
            setTimeout(close, 180);
            return;
        }

        if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) >= Math.abs(dy)) {
            clearTimer();
            /* Parmağı sağa kaydır: sonraki; sola: önceki */
            if (dx > 0) goNext();
            else goPrev();
        }
    }

    if (closeBtn) closeBtn.addEventListener('click', close);

    var lastTouchEndTs = 0;
    if (touchLayer) {
        touchLayer.addEventListener('touchend', function () {
            lastTouchEndTs = Date.now();
        }, true);
        touchLayer.addEventListener('click', function (e) {
            if (Date.now() - lastTouchEndTs < 450) {
                e.preventDefault();
                return;
            }
            tapZoneFromClientX(e.clientX);
        });
        touchLayer.addEventListener('touchstart', onTouchStart, { passive: true });
        touchLayer.addEventListener('touchmove', onTouchMove, { passive: true });
        touchLayer.addEventListener('touchend', onTouchEnd, { passive: true });
        touchLayer.addEventListener('touchcancel', function () {
            gesture = null;
            root.classList.remove('is-swipe-next', 'is-swipe-prev');
        }, { passive: true });
    }

    document.addEventListener('keydown', function (e) {
        if (!root || root.hidden) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            clearTimer();
            goNext();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            clearTimer();
            goPrev();
        }
    });

    window.EvreqrAboutStories = {
        urls: urls,
        open: open,
        close: close
    };
})();
