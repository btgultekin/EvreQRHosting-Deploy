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

    function decodeImageAsync(img) {
        if (!img || !img.decode) return;
        img.decode().catch(function () {
            // Decode ipucu desteklenmeyen/iptal edilen durumlarda normal yükleme devam eder.
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body.classList.contains('nm-page')) return;

        var home = document.getElementById('menuTabHome');
        var about = document.getElementById('menuTabAbout');
        var hubToggle = document.getElementById('nmDockHubToggle');
        var hubPopover = document.getElementById('nmDockHubPopover');
        var hubPuan = document.getElementById('nmHubPuanBtn');
        var hubAbout = document.getElementById('nmHubAboutBtn');
        var hubAi = document.getElementById('nmHubAiBtn');
        var nmRoot = document.querySelector('.nm-root');
        var allergenEnabled = nmRoot && nmRoot.getAttribute('data-allergen-enabled') === 'true';
        var allergenBtn = document.getElementById('allergenToggleBtn');

        function setDockActive(view) {
            qsa('.nm-dock [data-nm-view]').forEach(function (b) {
                b.classList.toggle('is-active', b.getAttribute('data-nm-view') === view);
            });
        }

        function setAboutShellVisible(isAbout) {
            if (nmRoot) nmRoot.classList.toggle('nm-about-view', !!isAbout);
        }

        function goHome() {
            setDockActive('home');
            setAboutShellVisible(false);
            if (home) home.style.display = '';
            if (about) about.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function goAbout() {
            setDockActive('about');
            setAboutShellVisible(true);
            if (home) home.style.display = 'none';
            if (about) about.style.display = '';
            // scrollIntoView küçük kaydırmaya yol açıyor; bilgi görünümü üstten başlasın
            window.scrollTo(0, 0);
        }

        function closeHub() {
            if (!hubToggle || !hubPopover) return;
            hubToggle.setAttribute('aria-expanded', 'false');
            hubPopover.hidden = true;
            hubToggle.classList.remove('is-open');
        }

        function openHub() {
            if (!hubToggle || !hubPopover) return;
            hubToggle.setAttribute('aria-expanded', 'true');
            hubPopover.hidden = false;
            hubToggle.classList.add('is-open');
        }

        function toggleHub() {
            if (!hubPopover || hubPopover.hidden) openHub();
            else closeHub();
        }

        if (hubToggle && hubPopover) {
            hubToggle.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleHub();
            });
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

        if (hubAbout) {
            hubAbout.addEventListener('click', function () {
                closeHub();
                if (
                    typeof window.EvreqrAboutStories !== 'undefined' &&
                    window.EvreqrAboutStories.urls &&
                    window.EvreqrAboutStories.urls.length > 0
                ) {
                    window.EvreqrAboutStories.open();
                } else {
                    goAbout();
                }
            });
        }

        if (hubAi) {
            hubAi.addEventListener('click', function () {
                closeHub();
                var aiFab = document.getElementById('ai-fab');
                if (aiFab) aiFab.click();
                setDockActive('home');
                setAboutShellVisible(false);
                if (home) home.style.display = '';
                if (about) about.style.display = 'none';
            });
        }

        if (hubPuan) {
            hubPuan.addEventListener('click', function () {
                closeHub();
                if (typeof window.__evreqrTryOpenFeedbackFromHub === 'function') {
                    window.__evreqrTryOpenFeedbackFromHub();
                }
            });
        }

        document.addEventListener('click', function (e) {
            if (!hubToggle || !hubPopover || hubPopover.hidden) return;
            var hubWrap = hubToggle.closest('.nm-dock__hub');
            if (hubWrap && !hubWrap.contains(e.target)) closeHub();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeHub();
        });

        if (allergenBtn && !allergenEnabled) {
            allergenBtn.addEventListener(
                'click',
                function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof ModernModal !== 'undefined' && ModernModal.warning) {
                        ModernModal.warning(
                            'Alerjen filtresi bu işletme için henüz etkinleştirilmedi.',
                            'Bilgi'
                        );
                    }
                },
                true
            );
        }

        qsa('.nm-dock [data-nm-view]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                closeHub();
                var v = btn.getAttribute('data-nm-view');
                if (v === 'ai') {
                    var aiFab = document.getElementById('ai-fab');
                    if (aiFab) aiFab.click();
                    setDockActive('ai');
                    setAboutShellVisible(false);
                    if (home) home.style.display = '';
                    if (about) about.style.display = 'none';
                    return;
                }
                if (v === 'home') goHome();
                else if (v === 'about') goAbout();
            });
        });

        var openSt = document.getElementById('nmOpenSettings');
        if (openSt)
            openSt.addEventListener('click', function () {
                closeHub();
                openSettings();
            });
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

        var campaignModal = document.getElementById('nmCampaignModal');
        var campaignStories = qsa('.nm-campaign-story');
        var campaignImage = document.getElementById('nmCampaignImage');
        var campaignTitle = document.getElementById('nmCampaignTitle');
        var campaignDesc = document.getElementById('nmCampaignDescription');
        var campaignValidity = document.getElementById('nmCampaignValidity');
        var campaignAddBtn = document.getElementById('nmCampaignAddToCartBtn');
        var activeCampaignPayload = null;

        if (campaignModal && campaignStories.length > 0) {
            var campaignCloseTimer = null;
            var campaignRoot = campaignModal.closest('.nm-root');
            var companyId = campaignModal.getAttribute('data-company-id') || '0';
            var isPremiumOnlyCompany = campaignModal.getAttribute('data-is-premium-only-company') === 'true';
            var viewedKey = 'lynarqr_campaign_seen_' + companyId;
            var viewedRaw = localStorage.getItem(viewedKey);
            var viewedMap = {};

            try {
                viewedMap = viewedRaw ? JSON.parse(viewedRaw) : {};
            } catch (_e) {
                viewedMap = {};
            }

            function persistViewed() {
                localStorage.setItem(viewedKey, JSON.stringify(viewedMap));
            }

            function markViewed(campaignId) {
                if (!campaignId) return;
                viewedMap[campaignId] = true;
                persistViewed();
                campaignStories.forEach(function (story) {
                    if (story.getAttribute('data-campaign-id') === campaignId) {
                        story.classList.remove('is-unread');
                    }
                });
            }

            function openCampaign(storyBtn) {
                if (!storyBtn) return;
                var campaignId = storyBtn.getAttribute('data-campaign-id') || '';
                var image = storyBtn.getAttribute('data-campaign-image') || '';
                var title = storyBtn.getAttribute('data-campaign-title') || '';
                var description = storyBtn.getAttribute('data-campaign-description') || '';
                var validity = storyBtn.getAttribute('data-campaign-validity') || '';
                var applyMode = storyBtn.getAttribute('data-campaign-apply-mode') || '';
                var originalTotal = parseFloat(storyBtn.getAttribute('data-campaign-original-total') || '0') || 0;
                var discountedPrice = parseFloat(storyBtn.getAttribute('data-campaign-discount-value') || '0') || 0;
                var productIdsRaw = storyBtn.getAttribute('data-campaign-product-ids') || '';
                var productNamesText = storyBtn.getAttribute('data-campaign-product-names') || '';
                var productNames = productNamesText ? productNamesText.split(' • ') : [];

                activeCampaignPayload = {
                    campaignId: parseInt(campaignId, 10) || 0,
                    title: title,
                    image: image,
                    applyMode: applyMode,
                    discountedPrice: discountedPrice,
                    originalTotal: originalTotal,
                    productIds: productIdsRaw
                        .split(',')
                        .map(function (x) { return parseInt(x, 10) || 0; })
                        .filter(function (x) { return x > 0; }),
                    productNames: productNames
                };

                if (campaignImage) {
                    campaignImage.decoding = 'async';
                    campaignImage.src = image;
                    campaignImage.alt = title;
                    decodeImageAsync(campaignImage);
                }
                if (campaignTitle) campaignTitle.textContent = title;
                if (campaignDesc) {
                    campaignDesc.textContent = description;
                    campaignDesc.style.display = description ? '' : 'none';
                }
                if (campaignValidity) {
                    campaignValidity.textContent = validity;
                    campaignValidity.style.display = validity ? '' : 'none';
                }
                if (campaignAddBtn) {
                    var canAddPackage = isPremiumOnlyCompany
                        && activeCampaignPayload.applyMode === 'Package'
                        && activeCampaignPayload.campaignId > 0;
                    campaignAddBtn.style.display = canAddPackage ? '' : 'none';
                }

                campaignModal.hidden = false;
                campaignModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                if (campaignCloseTimer) {
                    clearTimeout(campaignCloseTimer);
                    campaignCloseTimer = null;
                }
                requestAnimationFrame(function () {
                    campaignModal.classList.add('is-open');
                    if (campaignRoot) campaignRoot.classList.add('nm-campaign-open');
                });
                markViewed(campaignId);
            }

            function closeCampaign() {
                campaignModal.classList.remove('is-open');
                campaignModal.setAttribute('aria-hidden', 'true');
                if (campaignCloseTimer) {
                    clearTimeout(campaignCloseTimer);
                }
                campaignCloseTimer = setTimeout(function () {
                    campaignModal.hidden = true;
                    document.body.style.overflow = '';
                    if (campaignRoot) campaignRoot.classList.remove('nm-campaign-open');
                    campaignCloseTimer = null;
                }, 220);
            }

            campaignStories.forEach(function (story) {
                var storyId = story.getAttribute('data-campaign-id') || '';
                var isNew = (story.getAttribute('data-campaign-start') || '') >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
                var isViewed = !!viewedMap[storyId];
                story.classList.toggle('is-unread', !isViewed || isNew);
                story.addEventListener('click', function () {
                    openCampaign(story);
                });
            });

            qsa('[data-campaign-close]', campaignModal).forEach(function (el) {
                el.addEventListener('click', closeCampaign);
            });

            var latestId = campaignModal.getAttribute('data-latest-campaign-id');
            var openOnLoad = campaignModal.getAttribute('data-open-on-load') || 'if-unseen';
            var shouldAutoOpen = latestId && (openOnLoad === 'always' || !viewedMap[latestId]);
            if (shouldAutoOpen) {
                var latestStory = campaignStories.find(function (s) { return s.getAttribute('data-campaign-id') === latestId; });
                if (latestStory) {
                    setTimeout(function () {
                        openCampaign(latestStory);
                    }, 350);
                }
            }

            var touchStartY = 0;
            var sheet = qs('.nm-campaign-modal__sheet', campaignModal);
            if (sheet) {
                sheet.addEventListener('touchstart', function (e) {
                    touchStartY = e.touches && e.touches.length ? e.touches[0].clientY : 0;
                }, { passive: true });

                sheet.addEventListener('touchmove', function (e) {
                    var currentY = e.touches && e.touches.length ? e.touches[0].clientY : 0;
                    if (currentY - touchStartY > 90) {
                        closeCampaign();
                    }
                }, { passive: true });
            }

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && campaignModal && !campaignModal.hidden) {
                    closeCampaign();
                }
            });

            if (campaignAddBtn) {
                campaignAddBtn.addEventListener('click', function () {
                    if (!activeCampaignPayload || activeCampaignPayload.applyMode !== 'Package') return;

                    if (typeof window.dineInAddCampaignToCartFromModal === 'function') {
                        window.dineInAddCampaignToCartFromModal(activeCampaignPayload);
                        closeCampaign();
                        return;
                    }

                    if (window.ModernModal && typeof window.ModernModal.warning === 'function') {
                        window.ModernModal.warning('Kampanya paketi sadece masa siparişi sepetinde eklenebilir.', 'Bilgi');
                    }
                });
            }
        }
    });
})();
