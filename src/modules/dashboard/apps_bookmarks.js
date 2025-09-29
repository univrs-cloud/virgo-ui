import appsEmptyPartial from 'modules/dashboard/partials/apps_empty.html';
import categoryPartial from 'modules/dashboard/partials/category.html';
import appPartial from 'modules/dashboard/partials/app.html';
import bookmarkPartial from 'modules/dashboard/partials/bookmark.html';
import * as appService from 'modules/dashboard/services/app';
// import orderService from 'modules/dashboard/services/order';
import 'libs/drag-drop.js';

const appsEmptyTemplate = _.template(appsEmptyPartial);
const categorySomething = _.template(categoryPartial);
const appTemplate = _.template(appPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
let container = document.querySelector('#apps-bookmars');
let dragDropInstance = null;
let isDragging = false;

const render = (state) => {
	if (_.isNull(state.apps)) {
		return;
	}
	
	if (isDragging) {
		return;
	}

	let template = document.createElement('template');
	if (_.isEmpty(state.apps)) {
		template.innerHTML = appsEmptyTemplate();
	} else {
		_.each(state.apps, (apps, key) => {
			let categoryTemplate = document.createElement('template');
			categoryTemplate.innerHTML = categorySomething({ name: key });
			let category = categoryTemplate.content.querySelector('.col');
			apps = _.orderBy(apps, ['order'], ['asc']);
			_.each(apps, (entity) => {
				if (entity.type === 'app') {
					category.insertAdjacentHTML('beforeend', appTemplate({ app: entity }));
				}
				if (entity.type === 'bookmark') {
					category.insertAdjacentHTML('beforeend', bookmarkTemplate({ bookmark: entity }));
				}
			});
			template.innerHTML += category.outerHTML;
		});
	}
	
	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{ childrenOnly: true }
	);
	
	if (!dragDropInstance) {
		initializeDragDrop();
	}
};

const initializeDragDrop = () => {	
	const cards = container.querySelectorAll('.card');
	cards.forEach(card => {
		card.classList.add('drag-drop-item');
	});
	
	let timeout;
	dragDropInstance = new DragDropReorder(container, {
		boundrySelector: '.item',
		itemSelector: '.card',
		onDragStart: () => {
			clearTimeout(timeout);
			isDragging = true;
		},
		onDragEnd: () => {
			timeout = setTimeout(() => {
				isDragging = false;
			}, 1000);
		},
		onReorder: handleReorder
	});
};

const handleReorder = (newOrder, draggedElement, category) => {
	if (!newOrder || !draggedElement || !category) return;
	
	// Get the category name
	const categoryName = category.querySelector('h5').textContent.trim();
	
	// Update the order of items in the category
	const reorderedItems = newOrder.items;
	
	// Clear the category and re-append items in the new order
	category.innerHTML = '';
	
	// Add the category title back
	const title = document.createElement('h5');
	title.textContent = categoryName;
	category.appendChild(title);
	
	// Append all items in the new order
	reorderedItems.forEach((item) => {
		category.appendChild(item);
	});
	
	// Ensure the dragged element is properly positioned
	const draggedItemIndex = newOrder.draggedItemIndex;
	if (draggedItemIndex >= 0 && draggedItemIndex < reorderedItems.length) {
		// The dragged element should already be in the correct position
		// but let's verify it's there
		const currentItems = Array.from(category.querySelectorAll('.card'));
		const draggedElementInDOM = currentItems.find(item => item === draggedElement);
		if (!draggedElementInDOM) {
			// If for some reason the dragged element is not in the DOM, insert it at the correct position
			const targetPosition = Math.min(draggedItemIndex, currentItems.length);
			if (targetPosition === currentItems.length) {
				category.appendChild(draggedElement);
			} else {
				category.insertBefore(draggedElement, currentItems[targetPosition]);
			}
		}
	}
	
	// Save the new order
	// orderService.setOrderForCategory(categoryName, reorderedItems);
};

appService.subscribe([render]);
