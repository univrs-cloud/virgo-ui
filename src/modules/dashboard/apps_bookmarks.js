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
let hasDraggingStarted = false;

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
	
	if (hasDraggingStarted) {
		return;
	}

	const template = document.createElement('template');
	if (_.isEmpty(state.apps)) {
		template.innerHTML = appsEmptyTemplate();
	} else {
		_.each(state.apps, (apps, categoryName) => {
			const categoryTemplate = document.createElement('template');
			categoryTemplate.innerHTML = categorySomething({ name: categoryName });
			const category = categoryTemplate.content.querySelector('.group');
			apps = _.orderBy(apps, ['order'], ['asc']);
			_.each(apps, (entity) => {
				if (entity.type === 'app') {
					category.insertAdjacentHTML('beforeend', appTemplate({ app: entity }));
				}
				if (entity.type === 'bookmark') {
					category.insertAdjacentHTML('beforeend', bookmarkTemplate({ bookmark: entity }));
				}
			});
			template.innerHTML += categoryTemplate.innerHTML;
		});
	}
	
	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{
			childrenOnly: true,
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('order')) {
					return false;
				}
			}
		}
	);
};

new DragDropReorder(container, {
	toggleSelector: '.order',
	boundrySelector: '.group',
	itemSelector: '.card',
	onStart: () => { hasDraggingStarted = true; },
	onStop: () => { hasDraggingStarted = false; },
	onReorder: handleReorder
});

appService.subscribe([render]);
