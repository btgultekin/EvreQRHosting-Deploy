/**
 * AddressService - Müşteri adres yönetimi
 * Menü sayfasında kullanılır
 * ApiClient üzerinden merkezi hata yönetimi (429, 500 vb.)
 */
const AddressService = (function () {
    let addresses = [];
    let selectedAddressId = null;
    const listeners = [];
    
    // ApiClient kullanılabilir mi kontrol et
    const useApiClient = typeof ApiClient !== 'undefined';

    /**
     * Adresleri yükle
     */
    async function loadAddresses() {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.get('/api/customer/address/list');
            } else {
                const res = await fetch('/api/customer/address/list', { credentials: 'include' });
                data = await res.json();
            }
            if (data.success) {
                addresses = data.addresses || [];
                // Varsayılan adresi seç
                const defaultAddr = addresses.find(a => a.isDefault);
                if (defaultAddr) {
                    selectedAddressId = defaultAddr.id;
                } else if (addresses.length > 0) {
                    selectedAddressId = addresses[0].id;
                } else {
                    selectedAddressId = null;
                }
                notifyListeners();
            }
            return data;
        } catch (e) {
            console.error('AddressService: Adres yükleme hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * Yeni adres ekle
     */
    async function createAddress(addressData) {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.post('/api/customer/address/create', addressData);
            } else {
                const res = await fetch('/api/customer/address/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(addressData)
                });
                data = await res.json();
            }
            if (data.success && data.address) {
                await loadAddresses();
            }
            return data;
        } catch (e) {
            console.error('AddressService: Adres ekleme hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * Adres güncelle
     */
    async function updateAddress(id, addressData) {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.put('/api/customer/address/update/' + id, addressData);
            } else {
                const res = await fetch('/api/customer/address/update/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(addressData)
                });
                data = await res.json();
            }
            if (data.success) {
                await loadAddresses();
            }
            return data;
        } catch (e) {
            console.error('AddressService: Adres güncelleme hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * Adres sil
     */
    async function deleteAddress(id) {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.delete('/api/customer/address/delete/' + id);
            } else {
                const res = await fetch('/api/customer/address/delete/' + id, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                data = await res.json();
            }
            if (data.success) {
                await loadAddresses();
            }
            return data;
        } catch (e) {
            console.error('AddressService: Adres silme hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * Varsayılan adres yap
     */
    async function setDefaultAddress(id) {
        try {
            let data;
            if (useApiClient) {
                data = await ApiClient.post('/api/customer/address/set-default/' + id, {});
            } else {
                const res = await fetch('/api/customer/address/set-default/' + id, {
                    method: 'POST',
                    credentials: 'include'
                });
                data = await res.json();
            }
            if (data.success) {
                await loadAddresses();
            }
            return data;
        } catch (e) {
            console.error('AddressService: Varsayılan adres hatası', e);
            return { success: false, message: 'Bağlantı hatası.' };
        }
    }

    /**
     * İlleri getir
     */
    async function getCities() {
        try {
            console.log('AddressService: İl API çağrısı: /api/customer/address/cities');
            let data;
            if (useApiClient) {
                data = await ApiClient.get('/api/customer/address/cities');
            } else {
                const res = await fetch('/api/customer/address/cities');
                console.log('AddressService: İl API status:', res.status);
                data = await res.json();
            }
            console.log('AddressService: İl API yanıtı:', data);
            return data;
        } catch (e) {
            console.error('AddressService: İl listesi hatası', e);
            return [];
        }
    }

    /**
     * İlçeleri getir
     */
    async function getDistricts(cityCode) {
        try {
            const url = '/api/customer/address/districts/' + cityCode;
            console.log('AddressService: İlçe API çağrısı:', url);
            
            if (useApiClient) {
                // ApiClient kullanıyorsa json otomatik parse edilir
                const data = await ApiClient.get(url);
                console.log('AddressService: İlçe API parsed:', data, 'Array?:', Array.isArray(data), 'Uzunluk:', data ? data.length : 0);
                return data;
            } else {
                const res = await fetch(url);
                console.log('AddressService: İlçe API status:', res.status);
                
                if (!res.ok) {
                    console.error('AddressService: İlçe API hatalı yanıt:', res.status, res.statusText);
                    return [];
                }
                
                const text = await res.text();
                console.log('AddressService: İlçe API raw yanıt:', text.substring(0, 500));
                
                try {
                    const data = JSON.parse(text);
                    console.log('AddressService: İlçe API parsed:', data, 'Array?:', Array.isArray(data), 'Uzunluk:', data ? data.length : 0);
                    return data;
                } catch (parseErr) {
                    console.error('AddressService: İlçe JSON parse hatası:', parseErr);
                    return [];
                }
            }
        } catch (e) {
            console.error('AddressService: İlçe listesi hatası', e);
            return [];
        }
    }

    /**
     * Mahalleleri getir
     */
    async function getNeighborhoods(districtCode) {
        try {
            const url = '/api/customer/address/neighborhoods/' + districtCode;
            console.log('Mahalle API çağrısı:', url);
            
            let data;
            if (useApiClient) {
                data = await ApiClient.get(url);
            } else {
                const res = await fetch(url);
                data = await res.json();
            }
            console.log('Mahalle API yanıtı:', data);
            return data;
        } catch (e) {
            console.error('AddressService: Mahalle listesi hatası', e);
            return [];
        }
    }

    /**
     * Tüm adresleri getir
     */
    function getAddresses() {
        return addresses;
    }

    /**
     * Seçili adresi getir
     */
    function getSelectedAddress() {
        if (!selectedAddressId) return null;
        return addresses.find(a => a.id === selectedAddressId) || null;
    }

    /**
     * Adres seç
     */
    function selectAddress(id) {
        if (addresses.some(a => a.id === id)) {
            selectedAddressId = id;
            notifyListeners();
        }
    }

    /**
     * Adres var mı?
     */
    function hasAddress() {
        return addresses.length > 0;
    }

    /**
     * Değişiklik dinleyicisi ekle
     */
    function onChange(callback) {
        if (typeof callback === 'function') {
            listeners.push(callback);
        }
    }

    /**
     * Dinleyicileri bilgilendir
     */
    function notifyListeners() {
        listeners.forEach(fn => {
            try {
                fn(addresses, getSelectedAddress());
            } catch (e) {
                console.error('AddressService: Listener hatası', e);
            }
        });
    }

    // Public API
    return {
        loadAddresses,
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        getCities,
        getDistricts,
        getNeighborhoods,
        getAddresses,
        getSelectedAddress,
        selectAddress,
        hasAddress,
        onChange
    };
})();
