import appsEmptyPartial from 'partials/apps_empty.html';
import categoryPartial from 'partials/category.html';
import appPartial from 'partials/app.html';
import bookmarkPartial from 'partials/bookmark.html';
import * as appService from 'js/services/app';

const appsEmptyTemplate = _.template(appsEmptyPartial);
const categorySomething = _.template(categoryPartial);
const appTemplate = _.template(appPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
let container = document.querySelector('#apps-bookmars');

const performAction = (event) => {
	event.preventDefault();
	let button = event.currentTarget;
	let card = button.closest('.card');
	if (button.classList.contains('text-danger') && !confirm(`Are you sure you want to ${button.dataset.action} ${card.dataset.title}?`)) {
		return;
	}

	let config = {
		id: card.dataset.id,
		action: button.dataset.action
	};
	appService.performAction(config);
};

const render = (state) => {
	if (_.isNull(state.apps)) {
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
			_.each(apps, (app) => {
				if (app.type === 'app') {
					category.insertAdjacentHTML('beforeend', appTemplate({ entity: app }));
				}
				if (app.type === 'bookmark') {
					category.insertAdjacentHTML('beforeend', bookmarkTemplate({ entity: app }));
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
	_.each(container.querySelectorAll('.dropdown-menu a:not(.disabled)'), (button) => {
		button.addEventListener('click', performAction);
	});
};

appService.subscribe([render]);
