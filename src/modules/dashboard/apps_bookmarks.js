import appsEmptyPartial from 'modules/dashboard/partials/apps_empty.html';
import categoryPartial from 'modules/dashboard/partials/category.html';
import appPartial from 'modules/dashboard/partials/app.html';
import bookmarkPartial from 'modules/dashboard/partials/bookmark.html';
import * as appService from 'modules/dashboard/services/app';

const appsEmptyTemplate = _.template(appsEmptyPartial);
const categorySomething = _.template(categoryPartial);
const appTemplate = _.template(appPartial);
const bookmarkTemplate = _.template(bookmarkPartial);
let container = document.querySelector('#apps-bookmars');

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

appService.subscribe([render]);
