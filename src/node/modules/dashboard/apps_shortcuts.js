import appsEmptyPartial from 'node/modules/dashboard/partials/apps_empty.html';
import categoryPartial from 'node/modules/dashboard/partials/category.html';
import appPartial from 'node/modules/dashboard/partials/app.html';
import shortcutPartial from 'node/modules/dashboard/partials/shortcut.html';
import * as appService from 'node/modules/dashboard/services/app';
import * as windowService from 'node/services/window';
import Sortable from 'sortablejs';

const appsEmptyTemplate = _.template(appsEmptyPartial);
const categorySomething = _.template(categoryPartial);
const appTemplate = _.template(appPartial);
const shortcutTemplate = _.template(shortcutPartial);
const container = document.querySelector('#apps-shortcuts');
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

	let data = [];
	_.each(cards, (card, order) => {
		const item = {
			id: card.dataset.id,
			type: card.dataset.type,
			order: order + 1
		};
		data.push(item);
	});
	appService.setOrder(data);
};

const withoutAliases = (urls) => {
	const hosts = _.map(urls, (url) => { return new URL(url).host.toLowerCase(); });
	return _.uniq(_.filter(urls, (url, index) => {
		return !(_.startsWith(hosts[index], 'www.') && _.includes(hosts, hosts[index].slice(4)));
	}));
};

const openWindow = (event) => {
	const link = event.target.closest('.open-window');
	if (_.isNull(link)) {
		return;
	}

	event.preventDefault();
	windowService.open({ label: link.dataset.label, icon: link.dataset.icon, type: link.closest('.card').dataset.type, url: link.dataset.url });
};

const render = (state) => {
	if (_.isNull(state.apps)) {
		return;
	}
	
	if (hasDraggingStarted) {
		return;
	}

	const rowSlot = /\s*<div class="row"><\/div>/;
	let inner;
	if (_.isEmpty(state.apps)) {
		inner = appsEmptyTemplate();
	} else {
		inner = _.join(_.map(state.apps, (categoryApps, categoryName) => {
			const ordered = _.orderBy(categoryApps, ['order'], ['asc']);
			const cardsHtml = _.join(_.map(ordered, (entity) => {
				if (entity.type === 'app') {
					return appTemplate({ app: entity, windowUrls: withoutAliases(entity.urls) });
				}
				if (entity.type === 'shortcut') {
					return shortcutTemplate({ shortcut: entity });
				}
				return '';
			}), '');
			return categorySomething({ name: categoryName, isOrderable: !_.some(categoryApps, 'isUnmanaged') }).replace(rowSlot, `<div class="row">${cardsHtml}</div>`);
		}), '');
	}
	
	morphdom(
		container,
		`<div>${inner}</div>`,
		{
			childrenOnly: true,
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('order')) {
					return false;
				}
				if (fromEl.classList.contains('dropdown') && fromEl.querySelector('.show')) {
					return false;
				}
			}
		}
	);
};

container.addEventListener('click', toggleOrder);
container.addEventListener('click', openWindow);

appService.subscribe([render]);
