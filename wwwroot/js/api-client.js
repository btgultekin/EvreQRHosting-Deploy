/**
 * ApiClient - Merkezi API istek yönetimi
 * 
 * Tüm API isteklerini bu wrapper üzerinden geçirerek:
 * - Rate limiting (429) hatalarını merkezi olarak yakalar
 * - Kullanıcıya şık uyarılar gösterir
 * - Retry mekanizması sağlar
 * 
 * Usage:
 *   const data = await ApiClient.get('/api/endpoint');
 *   const data = await ApiClient.post('/api/endpoint', { key: 'value' });
 */
const ApiClient = (function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    const config = {
        // 429 hatası için bekleme süresi (ms)
        rateLimitRetryDelay: 5000,
        // Maksimum retry sayısı
        maxRetries: 2,
        // 429 uyarısı gösterildi mi? (spam önleme)
        rateLimitWarningShown: false,
        // Uyarı cooldown süresi (ms)
        warningCooldown: 10000
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RATE LIMIT HANDLING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Rate limit uyarısı göster (spam önlemeli)
     */
    function showRateLimitWarning() {
        if (config.rateLimitWarningShown) {
            return; // Zaten gösterildi, spam yapma
        }

        config.rateLimitWarningShown = true;

        // ModernModal varsa toast göster, yoksa console'a yaz
        if (typeof ModernModal !== 'undefined' && ModernModal.toast) {
            ModernModal.toast(
                'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
                'warning',
                5000
            );
        } else {
            console.warn('⚠️ Rate Limit: Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.');
        }

        // Cooldown sonrası tekrar uyarı gösterilebilir
        setTimeout(function() {
            config.rateLimitWarningShown = false;
        }, config.warningCooldown);
    }

    /**
     * Genel hata göster
     */
    function showError(message) {
        if (typeof ModernModal !== 'undefined' && ModernModal.toast) {
            ModernModal.toast(message, 'error', 4000);
        } else {
            console.error('❌ API Hatası:', message);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FETCH WRAPPER
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Merkezi fetch wrapper
     * @param {string} url - API endpoint
     * @param {Object} options - fetch options
     * @param {number} retryCount - Mevcut retry sayısı
     * @returns {Promise<Response>}
     */
    async function request(url, options, retryCount = 0) {
        options = options || {};
        
        // Varsayılan ayarlar
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Options'ı birleştir
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, mergedOptions);

            // 429 Too Many Requests
            if (response.status === 429) {
                showRateLimitWarning();

                // Retry mekanizması
                if (retryCount < config.maxRetries) {
                    // Bekle ve tekrar dene
                    await sleep(config.rateLimitRetryDelay);
                    return request(url, options, retryCount + 1);
                }

                // Max retry aşıldı, hata döndür
                return {
                    ok: false,
                    status: 429,
                    json: async () => ({
                        success: false,
                        message: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin ve tekrar deneyin.'
                    })
                };
            }

            // 403 Forbidden - Online sipariş kapalı vs.
            if (response.status === 403) {
                const data = await response.clone().json().catch(() => ({}));
                if (data.message) {
                    showError(data.message);
                }
            }

            // 500+ Server errors
            if (response.status >= 500) {
                showError('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
            }

            return response;

        } catch (error) {
            // Network error
            console.error('ApiClient: Network hatası', error);
            
            // Offline durumu kontrolü
            if (!navigator.onLine) {
                showError('İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edin.');
            }

            throw error;
        }
    }

    /**
     * Sleep helper
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * GET request
     */
    async function get(url, options) {
        const response = await request(url, {
            method: 'GET',
            ...options
        });
        return response.json();
    }

    /**
     * POST request
     */
    async function post(url, body, options) {
        const response = await request(url, {
            method: 'POST',
            body: JSON.stringify(body),
            ...options
        });
        return response.json();
    }

    /**
     * PUT request
     */
    async function put(url, body, options) {
        const response = await request(url, {
            method: 'PUT',
            body: JSON.stringify(body),
            ...options
        });
        return response.json();
    }

    /**
     * DELETE request
     */
    async function del(url, options) {
        const response = await request(url, {
            method: 'DELETE',
            ...options
        });
        return response.json();
    }

    /**
     * Raw fetch - response nesnesini döndürür (json() çağırmadan)
     * Özel durumlar için (örn. text response)
     */
    async function raw(url, options) {
        return request(url, options);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════════════════

    return {
        get: get,
        post: post,
        put: put,
        delete: del,
        raw: raw,
        // Config erişimi (test için)
        _config: config
    };
})();
