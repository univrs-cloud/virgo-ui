class DragDropReorder {
	constructor(container, options = {}) {
		this.container = container;
		this.options = {
			boundrySelector: null, // CSS selector for containers
			itemSelector: '.drag-drop-item', // CSS selector for draggable items
			axis: 'y', // 'x', 'y', or 'both'
			dragHandle: null, // CSS selector for drag handle, null means entire item is draggable
			onReorder: null, // Callback when items are reordered
			onDragStart: null, // Callback when drag starts
			onDragEnd: null, // Callback when drag ends
			...options
		};
		
		this.isDragging = false;
		this.draggedElement = null;
		this.dragOffset = { x: 0, y: 0 };
		this.placeholder = null;
		this.originalPosition = null;
		this.boundry = (this.options.boundrySelector ? this.container.querySelector(this.options.boundrySelector) : this.container);
		this.boundry.classList.add('dragging');
		this.hasStartedDragging = false;
		
		this.init();
	}
	
	init() {
		this.addDragStyles();
		this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
		this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
		this.container.addEventListener('dragstart', (event) => event.preventDefault());
	}
	
	addDragStyles() {
		if (document.getElementById('drag-drop-styles')) {
			return;
		}
		
		const style = document.createElement('style');
		style.id = 'drag-drop-styles';
		style.textContent = `
			.dragging {
				background: var(--bs-purple-100);
				border-radius: var(--bs-border-radius-xl);
			}
			.drag-drop-placeholder {
				transition: all 0.2s ease;
				opacity: 0 !important;
			}
			.drag-drop-item {
				z-index: 99;
				position: relative;
				transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
				cursor: grab;
			}
			.drag-drop-item.dragging {
				z-index: 1000;
				cursor: grabbing;
				opacity: 0.9;
				background: var(--bs-bg);
				box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
				transition: none;
			}
			/* Add a subtle drag handle indicator */
			.drag-drop-item::before {
				content: '⋮⋮';
				position: absolute;
				top: 50%;
				right: 8px;
				transform: translateY(-50%);
				color: #6c757d;
				font-size: 12px;
				line-height: 1;
				opacity: 0;
				transition: opacity 0.2s ease;
				pointer-events: none;
			}
			.drag-drop-item:hover::before {
				opacity: 1;
			}
			.drag-drop-item.dragging::before {
				opacity: 0;
			}
		`;
		document.head.appendChild(style);
	}
	
	handleMouseDown(event) {
		this.startDrag(event, 'mouse');
	}
	
	handleTouchStart(event) {
		this.startDrag(event, 'touch');
	}
	
	startDrag(event, type) {
		const item = event.target.closest(this.options.itemSelector);
		if (!item) {
			return;
		}
		
		// Check if drag handle is specified and click is on handle
		if (this.options.dragHandle && !event.target.closest(this.options.dragHandle)) {
			return;
		}
		
		event.preventDefault();
		
		this.draggedElement = item;
		// Calculate offset from mouse/touch to element
		const rect = item.getBoundingClientRect();
		this.originalPosition = {
			x: rect.left,
			y: rect.top
		};
		this.dragOffset = {
			x: (type === 'mouse' ? event.clientX : event.touches[0].clientX) - rect.left,
			y: (type === 'mouse' ? event.clientY : event.touches[0].clientY) - rect.top
		};
		
		this.isDragging = true;
		this.hasStartedDragging = false;
		item.classList.add('dragging');
		
		// Add event listeners
		const moveEvent = (type === 'mouse' ? 'mousemove' : 'touchmove');
		const endEvent = (type === 'mouse' ? 'mouseup' : 'touchend');
		
		document.addEventListener(moveEvent, this.handleMove.bind(this));
		document.addEventListener(endEvent, this.handleEnd.bind(this));
		
		if (this.options.onDragStart) {
			this.options.onDragStart(item, this.boundry);
		}
	}
	
	handleMove(event) {
		if (!this.isDragging || !this.draggedElement) {
			return;
		}
		
		event.preventDefault();
		
		const clientX = (event.type === 'mousemove' ? event.clientX : event.touches[0].clientX);
		const clientY = (event.type === 'mousemove' ? event.clientY : event.touches[0].clientY);
		
		// Create placeholder only when actual movement starts
		if (!this.hasStartedDragging) {
			this.hasStartedDragging = true;
			this.createPlaceholder();
		}
		
		// Calculate new position based on axis constraint
		let newX = clientX - this.dragOffset.x;
		let newY = clientY - this.dragOffset.y;
		
		// Constrain movement based on axis option
		if (this.options.axis === 'y') {
			// Only allow vertical movement - keep original X position
			newX = this.originalPosition.x;
		} else if (this.options.axis === 'x') {
			// Only allow horizontal movement - keep original Y position
			newY = this.originalPosition.y;
		}
		
		// Constrain to boundaries
		if (this.boundry) {
			const boundryRect = this.boundry.getBoundingClientRect();
			const elementRect = this.draggedElement.getBoundingClientRect();
			
			// Keep element within boundaries
			if (newX < boundryRect.left) {
				newX = boundryRect.left;
			} else if (newX + elementRect.width > boundryRect.right) {
				newX = boundryRect.right - elementRect.width;
			}
			
			if (newY < boundryRect.top) {
				newY = boundryRect.top;
			} else if (newY + elementRect.height > boundryRect.bottom) {
				newY = boundryRect.bottom - elementRect.height;
			}
		}
		
		// Update position
		this.draggedElement.style.position = 'fixed';
		this.draggedElement.style.left = newX + 'px';
		this.draggedElement.style.top = newY + 'px';
		this.draggedElement.style.pointerEvents = 'none';
		
		// Update placeholder position
		this.updatePlaceholderPosition(clientX, clientY);
	}
	
	handleEnd(event) {
		if (!this.isDragging || !this.draggedElement) {
			return;
		}
		
		this.isDragging = false;
		this.hasStartedDragging = false;
		
		// Remove event listeners
		document.removeEventListener('mousemove', this.handleMove.bind(this));
		document.removeEventListener('mouseup', this.handleEnd.bind(this));
		document.removeEventListener('touchmove', this.handleMove.bind(this));
		document.removeEventListener('touchend', this.handleEnd.bind(this));
		
		if (this.placeholder) {
			// Replace placeholder with the dragged element
			this.placeholder.parentNode.insertBefore(this.draggedElement, this.placeholder);
			this.placeholder.remove();
			this.placeholder = null;
		}

		// Reset styles
		this.draggedElement.classList.remove('dragging');
		this.draggedElement.style.position = '';
		this.draggedElement.style.left = '';
		this.draggedElement.style.top = '';
		this.draggedElement.style.pointerEvents = '';
		
		// Ensure the dragged element is in the DOM at the correct position
		if (!this.draggedElement.parentNode || this.draggedElement.parentNode !== this.boundry) {
			// If the element is not in the correct parent, append it to the current boundry
			this.boundry.appendChild(this.draggedElement);
		}
		
		// Trigger reorder callback if position changed
		if (this.options.onReorder) {
			const newOrder = this.getNewOrder();
			if (newOrder) {
				this.options.onReorder(newOrder, this.draggedElement, this.boundry);
			}
		}
		
		if (this.options.onDragEnd) {
			this.options.onDragEnd(this.draggedElement, this.boundry);
		}
		
		this.draggedElement = null;
	}
	
	createPlaceholder() {
		this.placeholder = this.draggedElement.cloneNode(true);
		this.placeholder.classList.add('drag-drop-placeholder');
		this.placeholder.style.opacity = '0.5';
		this.placeholder.style.pointerEvents = 'none';
		
		// Remove interactive elements from placeholder
		this.placeholder.querySelectorAll('a, button, input, select, textarea').forEach(element => {
			element.remove();
		});
		
		this.draggedElement.parentNode.insertBefore(this.placeholder, this.draggedElement);
	}
	
	updatePlaceholderPosition(clientX, clientY) {
		if (!this.placeholder) {
			return;
		}
		
		const items = this.boundry.querySelectorAll(this.options.itemSelector);
		let insertIndex = -1;
		
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			if (item === this.draggedElement || item === this.placeholder) {
				continue;
			}
			
			const rect = item.getBoundingClientRect();
			const itemCenterY = rect.top + rect.height / 2;
			
			if (clientY < itemCenterY) {
				insertIndex = i;
				break;
			}
		}
		
		if (insertIndex === -1) {
			// Insert at end
			this.boundry.appendChild(this.placeholder);
		} else {
			const targetItem = items[insertIndex];
			this.boundry.insertBefore(this.placeholder, targetItem);
		}
	}
	
	getNewOrder() {
		if (!this.boundry) {
			return null;
		}
		
		return Array.from(this.boundry.querySelectorAll(this.options.itemSelector));
	}
	
	destroy() {
		document.querySelector('#drag-drop-styles').remove();
		this.boundry.classList.remove('dragging');
		this.container.removeEventListener('mousedown', this.handleMouseDown.bind(this));
		this.container.removeEventListener('touchstart', this.handleTouchStart.bind(this));
	}
}

// Export for use in modules
window.DragDropReorder = DragDropReorder;
