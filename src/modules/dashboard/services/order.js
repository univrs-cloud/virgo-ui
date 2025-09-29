/**
 * Service for managing the order of dashboard items
 */

class OrderService {
    constructor() {
        this.storageKey = 'dashboard-order';
        this.orderData = this.loadOrderData();
    }
    
    loadOrderData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load order data:', error);
            return {};
        }
    }
    
    saveOrderData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.orderData));
        } catch (error) {
            console.warn('Failed to save order data:', error);
        }
    }
    
    getOrderForCategory(categoryName) {
        return this.orderData[categoryName] || [];
    }
    
    setOrderForCategory(categoryName, items) {
        // Extract order information from items
        const order = items.map((item, index) => {
            const id = item.dataset?.id || item.id || item.getAttribute('data-id');
            return {
                id: id,
                order: index
            };
        });
        
        this.orderData[categoryName] = order;
        this.saveOrderData();
    }
    
    applyOrderToItems(items, categoryName) {
        const orderData = this.getOrderForCategory(categoryName);
        if (!orderData.length) return items;
        
        // Create a map of order data for quick lookup
        const orderMap = {};
        orderData.forEach(item => {
            orderMap[item.id] = item.order;
        });
        
        // Sort items based on stored order
        return items.sort((a, b) => {
            const aId = a.dataset?.id || a.id || a.getAttribute('data-id');
            const bId = b.dataset?.id || b.id || b.getAttribute('data-id');
            
            const aOrder = orderMap[aId] !== undefined ? orderMap[aId] : 999;
            const bOrder = orderMap[bId] !== undefined ? orderMap[bId] : 999;
            
            return aOrder - bOrder;
        });
    }
    
    clearOrderForCategory(categoryName) {
        delete this.orderData[categoryName];
        this.saveOrderData();
    }
    
    clearAllOrderData() {
        this.orderData = {};
        this.saveOrderData();
    }
}

// Create singleton instance
const orderService = new OrderService();

export default orderService;
