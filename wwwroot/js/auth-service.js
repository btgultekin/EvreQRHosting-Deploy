/**
 * AuthService - Müşteri auth yönetimi
 * Menü sayfasında kullanılır, localStorage ile persist edilir
 * ApiClient üzerinden merkezi hata yönetimi (429, 500 vb.)
 */
const AuthService = (function () {
    const STORAGE_KEY = 'evreqr_auth';
    let currentUser = null;
    let companyId = null;
    const listeners = [];

    // ApiClient kullanılabilir mi kontrol et
    const useApiClient = typeof ApiClient !== 'undefined';

    /**
     * Servis başlat
     */
    function init(cid) {
        companyId = cid;
        // localStorage'dan yükle
        loadFromStorage();
        // Backend'den doğrula
        checkSession();
    }

    /**
     * localStorage'dan kullanıcı bilgisi yükle
     */
    function loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.companyId === companyId) {
                    currentUser = parsed.customer;
                    notifyListeners();
                }
            }
        } catch (e) {
            console.warn('AuthService: Storage okuma hatası', e);
        }
    }

    /**
     * localStorage'a kaydet
     */
    function saveToStorage() {
        try {
            if (currentUser) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    companyId: companyId,
                    customer: currentUser
                }));
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.warn('AuthService: Storage yazma hatası', e);
        }
    }

    /**
     * Backend'den oturum kontrolü
     */
    async function checkSession() {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.get('/api/customer/me');
            } else {
                const res = await fetch('/api/customer/me', { credentials: 'include' });
                data = await res.json();
            }
            if (data.success && data.customer) {
                currentUser = data.customer;
                saveToStorage();
            } else {
                currentUser = null;
                localStorage.removeItem(STORAGE_KEY);
            }
            notifyListeners();
        } catch (e) {
            console.warn('AuthService: Session kontrolü başarısız', e);
        }
    }

    /**
     * Kullanıcı giriş yap
     */
    async function login(phone, password) {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.post('/api/customer/login', { phone, password, companyId });
            } else {
                const res = await fetch('/api/customer/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ phone, password, companyId })
                });
                data = await res.json();
            }
            if (data.success && data.customer) {
                currentUser = data.customer;
                saveToStorage();
                notifyListeners();
            }
            return data;
        } catch (e) {
            console.error('AuthService: Login hatası', e);
            return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' };
        }
    }

    /**
     * Kullanıcı kayıt ol
     */
    async function register(name, phone, email, password) {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.post('/api/customer/register', { name, phone, email, password, companyId });
            } else {
                const res = await fetch('/api/customer/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, phone, email, password, companyId })
                });
                data = await res.json();
            }
            if (data.success && data.customer) {
                currentUser = data.customer;
                saveToStorage();
                notifyListeners();
            }
            return data;
        } catch (e) {
            console.error('AuthService: Register hatası', e);
            return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' };
        }
    }

    /**
     * Çıkış yap
     */
    async function logout() {
        try {
            if (useApiClient) {
                await ApiClient.post('/api/customer/logout', {});
            } else {
                await fetch('/api/customer/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            }
        } catch (e) {
            console.warn('AuthService: Logout hatası', e);
        }
        currentUser = null;
        localStorage.removeItem(STORAGE_KEY);
        notifyListeners();
    }

    /**
     * Auth durumu
     */
    function isAuthenticated() {
        return currentUser !== null;
    }

    /**
     * Mevcut kullanıcı bilgisi
     */
    function getUser() {
        return currentUser;
    }

    /**
     * Müşteri ID'sini al
     */
    function getCustomerId() {
        return currentUser?.id || null;
    }

    /**
     * Değişiklik dinleyicisi ekle
     */
    function onChange(callback) {
        if (typeof callback === 'function') {
            listeners.push(callback);
            // İlk çağrı
            callback(currentUser);
        }
    }

    /**
     * Dinleyicileri bilgilendir
     */
    function notifyListeners() {
        listeners.forEach(fn => {
            try {
                fn(currentUser);
            } catch (e) {
                console.error('AuthService: Listener hatası', e);
            }
        });
    }

    // Public API
    return {
        init,
        login,
        register,
        logout,
        isAuthenticated,
        getUser,
        getCustomerId,
        onChange
    };
})();
