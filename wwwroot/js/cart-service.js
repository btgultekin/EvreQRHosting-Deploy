/**
 * CartService - Sepet State Management
 * localStorage tabanlı, çoklu firma destekli sepet yönetimi
 * 
 * Kullanım:
 *   CartService.init(companyId);
 *   CartService.addToCart({ id: 1, name: 'Ürün', price: 100 });
 *   CartService.removeFromCart(1);
 *   CartService.updateQuantity(1, 3);
 *   var cart = CartService.getCart();
 *   CartService.clearCart();
 */
var CartService = (function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE STATE
    // ═══════════════════════════════════════════════════════════════
    
    var STORAGE_PREFIX = 'evreqr_cart_';
    var companyId = null;
    var cart = [];
    var listeners = [];

    // ═══════════════════════════════════════════════════════════════
    // PRIVATE METHODS
    // ═══════════════════════════════════════════════════════════════

    /**
     * localStorage key oluşturur
     */
    function getStorageKey() {
        return STORAGE_PREFIX + companyId;
    }

    /**
     * Sepeti localStorage'dan yükler
     */
    function loadFromStorage() {
        if (!companyId) return;
        try {
            var data = localStorage.getItem(getStorageKey());
            cart = data ? JSON.parse(data) : [];
            // Geçersiz verileri temizle
            cart = cart.filter(function(item) {
                return item && item.productId && item.quantity > 0;
            });
        } catch (e) {
            console.warn('CartService: localStorage okuma hatası', e);
            cart = [];
        }
    }

    /**
     * Sepeti localStorage'a kaydeder
     */
    function saveToStorage() {
        if (!companyId) return;
        try {
            localStorage.setItem(getStorageKey(), JSON.stringify(cart));
        } catch (e) {
            console.warn('CartService: localStorage yazma hatası', e);
        }
    }

    /**
     * Değişiklik listener'larını çağırır
     */
    function notifyListeners() {
        var cartData = getPublicCart();
        listeners.forEach(function(fn) {
            try {
                fn(cartData);
            } catch (e) {
                console.warn('CartService: Listener hatası', e);
            }
        });
    }

    /**
     * Sepet verisini public formata dönüştürür
     */
    function getPublicCart() {
        var totalQuantity = 0;
        var totalPrice = 0;

        var items = cart.map(function(item) {
            var itemTotal = item.price * item.quantity;
            totalQuantity += item.quantity;
            totalPrice += itemTotal;
            return {
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl || null,
                total: itemTotal
            };
        });

        return {
            companyId: companyId,
            items: items,
            itemCount: items.length,
            totalQuantity: totalQuantity,
            totalPrice: totalPrice
        };
    }

    /**
     * Sepette ürün bulur
     */
    function findItemIndex(productId) {
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].productId === productId) {
                return i;
            }
        }
        return -1;
    }

    /**
     * FAB badge'i günceller
     */
    function updateBadge() {
        var badge = document.getElementById('menuCartBadge');
        if (!badge) return;

        var totalQty = 0;
        cart.forEach(function(item) {
            totalQty += item.quantity;
        });

        if (totalQty > 0) {
            badge.textContent = totalQty > 99 ? '99+' : totalQty;
            badge.style.display = 'flex';
        } else {
            badge.textContent = '';
            badge.style.display = 'none';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════════

    return {
        /**
         * CartService'i başlatır
         * @param {number|string} cid - Company ID
         */
        init: function(cid) {
            if (!cid) {
                console.error('CartService: companyId gerekli');
                return;
            }
            companyId = String(cid);
            loadFromStorage();
            updateBadge();
            notifyListeners();
        },

        /**
         * Ürün ekler veya miktarı artırır
         * @param {Object} product - { id, name, price, imageUrl? }
         * @param {number} quantity - Eklenecek miktar (default: 1)
         * @returns {Object} Güncel sepet
         */
        addToCart: function(product, quantity) {
            if (!companyId) {
                console.error('CartService: init() çağrılmadı');
                return null;
            }
            if (!product || !product.id) {
                console.error('CartService: Geçersiz ürün');
                return null;
            }

            quantity = parseInt(quantity) || 1;
            if (quantity < 1) quantity = 1;

            var productId = parseInt(product.id);
            var index = findItemIndex(productId);

            if (index >= 0) {
                // Mevcut ürün - miktarı artır
                cart[index].quantity += quantity;
            } else {
                // Yeni ürün ekle
                cart.push({
                    productId: productId,
                    name: String(product.name || ''),
                    price: parseFloat(product.price) || 0,
                    imageUrl: product.imageUrl || null,
                    quantity: quantity
                });
            }

            saveToStorage();
            updateBadge();
            notifyListeners();
            return getPublicCart();
        },

        /**
         * Ürünü sepetten tamamen kaldırır
         * @param {number} productId
         * @returns {Object} Güncel sepet
         */
        removeFromCart: function(productId) {
            if (!companyId) return null;

            productId = parseInt(productId);
            var index = findItemIndex(productId);

            if (index >= 0) {
                cart.splice(index, 1);
                saveToStorage();
                updateBadge();
                notifyListeners();
            }

            return getPublicCart();
        },

        /**
         * Ürün miktarını günceller
         * @param {number} productId
         * @param {number} quantity - Yeni miktar (0 ise ürün silinir)
         * @returns {Object} Güncel sepet
         */
        updateQuantity: function(productId, quantity) {
            if (!companyId) return null;

            productId = parseInt(productId);
            quantity = parseInt(quantity) || 0;

            if (quantity <= 0) {
                return this.removeFromCart(productId);
            }

            var index = findItemIndex(productId);
            if (index >= 0) {
                cart[index].quantity = quantity;
                saveToStorage();
                updateBadge();
                notifyListeners();
            }

            return getPublicCart();
        },

        /**
         * Ürün miktarını 1 artırır
         * @param {number} productId
         * @returns {Object} Güncel sepet
         */
        incrementQuantity: function(productId) {
            productId = parseInt(productId);
            var index = findItemIndex(productId);
            if (index >= 0) {
                return this.updateQuantity(productId, cart[index].quantity + 1);
            }
            return getPublicCart();
        },

        /**
         * Ürün miktarını 1 azaltır
         * @param {number} productId
         * @returns {Object} Güncel sepet
         */
        decrementQuantity: function(productId) {
            productId = parseInt(productId);
            var index = findItemIndex(productId);
            if (index >= 0) {
                return this.updateQuantity(productId, cart[index].quantity - 1);
            }
            return getPublicCart();
        },

        /**
         * Güncel sepeti döner
         * @returns {Object} { companyId, items, itemCount, totalQuantity, totalPrice }
         */
        getCart: function() {
            return getPublicCart();
        },

        /**
         * Belirli ürünün sepetteki miktarını döner
         * @param {number} productId
         * @returns {number} Miktar (yoksa 0)
         */
        getQuantity: function(productId) {
            productId = parseInt(productId);
            var index = findItemIndex(productId);
            return index >= 0 ? cart[index].quantity : 0;
        },

        /**
         * Ürün sepette var mı?
         * @param {number} productId
         * @returns {boolean}
         */
        hasItem: function(productId) {
            return findItemIndex(parseInt(productId)) >= 0;
        },

        /**
         * Sepeti tamamen temizler
         * @returns {Object} Boş sepet
         */
        clearCart: function() {
            cart = [];
            saveToStorage();
            updateBadge();
            notifyListeners();
            return getPublicCart();
        },

        /**
         * Sepet değişikliği listener'ı ekler
         * @param {Function} fn - callback(cartData)
         * @returns {Function} Unsubscribe fonksiyonu
         */
        onChange: function(fn) {
            if (typeof fn !== 'function') return function() {};
            listeners.push(fn);
            // İlk değeri hemen gönder
            fn(getPublicCart());
            // Unsubscribe döner
            return function() {
                var idx = listeners.indexOf(fn);
                if (idx >= 0) listeners.splice(idx, 1);
            };
        },

        /**
         * Sepet boş mu?
         * @returns {boolean}
         */
        isEmpty: function() {
            return cart.length === 0;
        },

        /**
         * Debug: Sepet verisini console'a yazdırır
         */
        debug: function() {
            console.log('CartService Debug:', {
                companyId: companyId,
                storageKey: getStorageKey(),
                cart: cart,
                publicCart: getPublicCart()
            });
        }
    };
})();
