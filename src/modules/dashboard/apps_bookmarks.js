import appsEmptyPartial from 'modules/dashboard/partials/apps_empty.html';
import categoryPartial from 'modules/dashboard/partials/category.html';
import appPartial from 'modules/dashboard/partials/app.html';
import bookmarkPartial from 'modules/dashboard/partials/bookmark.html';
import * as appService from 'modules/dashboard/services/app';
import Sortable from 'sortablejs';

const appsEmptyTemplate = _.template(appsEmptyPartial);
const categorySomething = _.template(categoryPartial);
const appTemplate = _.template(appPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
const container = document.querySelector('#apps-bookmars');
let sortable = null;
let cards = [];
let hasDraggingStarted = false;

const toggleOrder = (event) => {
	const orderToggle = event.target.closest('.order');
	if (_.isNull(orderToggle)) {
		return;
	}

	const group = orderToggle.closest('.group');
	const icon = orderToggle.querySelector('.icon-solid');

	if (!group.classList.contains('dragging')) {
		sortable?.destroy();
		sortable = null;
		saveReorder(cards);
		cards = [];
		_.each(container.querySelectorAll('.group.dragging'), (group) => {
			group.classList.remove('dragging');
			const icon = group.querySelector('.order .icon-solid');
			icon.classList.remove('icon-check', 'text-green-500');
			icon.classList.add('icon-bars-staggered', 'text-gray-500');
		});
	}

	if (sortable) {
		sortable.destroy();
		sortable = null;
		saveReorder(cards);
		cards = [];
		hasDraggingStarted = false;
		group.classList.remove('dragging');
		icon.classList.remove('icon-check', 'text-green-500');
		icon.classList.add('icon-bars-staggered', 'text-gray-500');
		return;
	}

	hasDraggingStarted = true;
	group.classList.add('dragging');
	icon.classList.remove('icon-bars-staggered', 'text-gray-500');
	icon.classList.add('icon-check', 'text-green-500');
	sortable = new Sortable(group.querySelector(':scope > .row'), {
		animation: 150,
		draggable: '.col',
		handle: '.card',
		onStart: (event) => {
			event.item.style.opacity = '0.5';
		},
		onEnd: (event) => {
			event.item.style.opacity = '1';
			cards = _.map(Array.from(event.to.children), (col) => { return col.querySelector('.card'); });
		}
	});
};

const saveReorder = (cards) => {
	if (_.isEmpty(cards)) {
		return;
	}

	let config = [];
	_.each(cards, (card, order) => {
		const item = {
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
			const category = categoryTemplate.content.querySelector('.group .row');
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

container.addEventListener('click', toggleOrder);

appService.subscribe([render]);
