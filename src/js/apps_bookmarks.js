import categoryPartial from '../partials/category.html';
import appPartial from '../partials/app.html';
import bookmarkPartial from '../partials/bookmark.html';
import * as appService from './services/app';

const appTemplate = _.template(appPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
let container = document.querySelector('#apps-bookmars');

const render = (state) => {
	if (_.isNull(state.apps)) {
		return;
	}
	
	let template = document.createElement('template');
	_.each(state.apps, (apps, key) => {
		let categoryTemplate = document.createElement('template');
		categoryTemplate.innerHTML = _.template(categoryPartial)({ name: key });
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
	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{
			 childrenOnly: true,
			 onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('dropdown')) {
					return false;
				}

				return true;
			 }
		}
	);
};

appService.subscribe([render]);
