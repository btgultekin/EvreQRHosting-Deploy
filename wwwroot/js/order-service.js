/**
 * OrderService - Sipariş yönetimi
 * Menü sayfasında kullanılır
 * ApiClient üzerinden merkezi hata yönetimi (429, 500 vb.)
 */
const OrderService = (function () {
    // ApiClient kullanılabilir mi kontrol et
    const useApiClient = typeof ApiClient !== 'undefined';

    /**
     * Sipariş oluştur
     */
    async function createOrder(companyId, addressId, items, customerNote) {
        try {
            const payload = {
                companyId: companyId,
                addressId: addressId,
                customerNote: customerNote,
                items: items
            };
            
            if (useApiClient) {
                return await ApiClient.post('/api/order/create', payload);
            } else {
                const res = await fetch('/api/order/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                return await res.json();
            }
        } catch (e) {
            console.error('OrderService: Sipariş oluşturma hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * Sipariş iptal et
     */
    async function cancelOrder(orderId, reason) {
        try {
            const payload = { orderId: orderId, reason: reason };
            
            if (useApiClient) {
                return await ApiClient.post('/api/order/cancel', payload);
            } else {
                const res = await fetch('/api/order/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                return await res.json();
            }
        } catch (e) {
            console.error('OrderService: Sipariş iptal hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * Sipariş detayını getir
     */
    async function getOrder(orderId) {
        try {
            if (useApiClient) {
                return await ApiClient.get('/api/order/' + orderId);
            } else {
                const res = await fetch('/api/order/' + orderId, {
                    credentials: 'include'
                });
                return await res.json();
            }
        } catch (e) {
            console.error('OrderService: Sipariş getirme hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * Minimum sipariş tutarını getir
     */
    async function getMinimumOrderAmount(companyId) {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.get('/api/order/minimum-amount/' + companyId);
            } else {
                const res = await fetch('/api/order/minimum-amount/' + companyId);
                data = await res.json();
            }
            return data.success ? data.minimumAmount : 0;
        } catch (e) {
            console.error('OrderService: Minimum tutar hatası', e);
            return 0;
        }
    }

    /**
     * Müşterinin siparişlerini getir (Siparişlerim)
     */
    async function getMyOrders(companyId) {
        try {
            if (useApiClient) {
                return await ApiClient.get('/api/order/my/' + companyId);
            } else {
                const res = await fetch('/api/order/my/' + companyId, {
                    credentials: 'include'
                });
                return await res.json();
            }
        } catch (e) {
            console.error('OrderService: Siparişlerim hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    // Public API
    return {
        createOrder,
        cancelOrder,
        getOrder,
        getMinimumOrderAmount,
        getMyOrders
    };
})();
