import categoryPartial from '../partials/category.html';
import appPartial from '../partials/app.html';
import bookmarkPartial from '../partials/bookmark.html';
import * as appService from './services/app';

let container = document.querySelector('#apps-bookmars');
const appTemplate = _.template(appPartial);
const bookmarkTemplate = _.template(bookmarkPartial);

const composeUrlFromProxy = (proxy) => {
	return `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
};

const render = (state) => {
	if (_.isNull(state.proxies) || _.isNull(state.configured)) {
		return;
	}

	let proxies = state.proxies;
	let configuration = state.configured.configuration;
	let dockerContainers = state.configured.containers;
	configuration = _.groupBy(configuration, 'category');
	configuration = _.pick(configuration, _.keys(configuration));
	let template = document.createElement('template');
	_.each(configuration, (collection, cat) => {
		let categoryTemplate = document.createElement('template');
		categoryTemplate.innerHTML = _.template(categoryPartial)({ name: cat });
		let category = categoryTemplate.content.querySelector('.col');
		_.each(collection, (entity) => {
			let dockerContainer = _.find(dockerContainers, { name: entity.name });
			entity.state = '';
			if (dockerContainer) {
				entity.state = dockerContainer.state;
				let proxy = _.find(proxies, { forwardHost: dockerContainer.name });
				if (!_.isEmpty(proxy)) {
					entity.url = composeUrlFromProxy(proxy);
				} else if (!_.isEmpty(dockerContainer.ports)) {
					let ports = _.filter(dockerContainer.ports, { IP: '0.0.0.0' });
					if (!_.isEmpty(ports)) {
						_.each(ports, (port) => {
							let proxy = _.find(proxies, { forwardPort: port.PublicPort });
							if (!_.isEmpty(proxy)) {
								entity.url = composeUrlFromProxy(proxy);
							}
						});
					}
				}
			}
			if (entity.type === 'app') {
				category.insertAdjacentHTML('beforeend', appTemplate({ entity }));
			}
			if (entity.type === 'bookmark') {
				category.insertAdjacentHTML('beforeend', bookmarkTemplate({ entity }));
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
