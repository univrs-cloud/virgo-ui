import appsEmptyPartial from 'modules/dashboard/partials/apps_empty.html';
import categoryPartial from 'modules/dashboard/partials/category.html';
import appPartial from 'modules/dashboard/partials/app.html';
import bookmarkPartial from 'modules/dashboard/partials/bookmark.html';
import * as appService from 'modules/dashboard/services/app';
import 'libs/drag_drop.js';

const appsEmptyTemplate = _.template(appsEmptyPartial);
const categorySomething = _.template(categoryPartial);
const appTemplate = _.template(appPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
const container = document.querySelector('#apps-bookmars');
let dragDropInstance = null;
let isDraggingEnabled = false;

const order = (event) => {
	const target = event.target.closest('.order');
	if (_.isNull(target)) {
		return;
	}

	event.preventDefault();
	if (isDraggingEnabled) {
		const shouldEnableDragging = target.querySelector('.icon-solid').classList.contains('icon-bars-staggered');
		_.each(container.querySelectorAll('.item'), (boundry) => {
			disableDragDrop(boundry);
		});
		if (shouldEnableDragging) {
			enableDragDrop(target.closest('.item'));
		}
	} else {
		enableDragDrop(target.closest('.item'));
	}
};

const disableDragDrop = (container) => {
	dragDropInstance?.stop();
	dragDropInstance = null;
	const icon = container.querySelector('.icon-solid');
	icon.classList.remove('icon-check', 'text-green-500');
	icon.classList.add('icon-bars-staggered', 'text-gray-500');
	isDraggingEnabled = false;
};

const enableDragDrop = (container) => {	
	if (dragDropInstance) {
		return;
	}

	isDraggingEnabled = true;
	const icon = container.querySelector('.icon-solid');
	icon.classList.remove('icon-bars-staggered', 'text-gray-500');
	icon.classList.add('icon-check', 'text-green-500');
	dragDropInstance = new DragDropReorder(container, {
		itemSelector: '.card',
		onReorder: handleReorder
	});
	dragDropInstance.start();
};

const handleReorder = (newOrder, draggedElement, boundry) => {
	if (!newOrder || !draggedElement || !boundry) {
		return;
	}
	
	let config = [];
	_.each(newOrder, (card, order) => {
		let item = {
			id: card.dataset.id,
			type: card.dataset.type,
			order: order + 1
		};
		config.push(item);
	});
	appService.setOrder(config);
};

const render = (state) => {
	if (_.isNull(state.apps)) {
		return;
	}
	
	if (isDraggingEnabled) {
		return;
	}

	const template = document.createElement('template');
	if (_.isEmpty(state.apps)) {
		template.innerHTML = appsEmptyTemplate();
	} else {
		_.each(state.apps, (apps, key) => {
			const categoryTemplate = document.createElement('template');
			categoryTemplate.innerHTML = categorySomething({ name: key });
			const category = categoryTemplate.content.querySelector('.col');
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
};

container.addEventListener('click', order);

appService.subscribe([render]);
