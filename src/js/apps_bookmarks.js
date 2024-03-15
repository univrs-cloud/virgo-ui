import categoryPartial from '../partials/category.html';
import appPartial from '../partials/app.html';
import bookmarkPartial from '../partials/bookmark.html';

let fetchRetries = 5;
let fetchDelay = 2000;
let request = null;
let container = document.querySelector('#apps-bookmars');

const fetchData = () => {
	request = new AbortController();
	axios.get('/api/v1/docker/configured', { signal: request.signal })
		.then((response) => {
			fetchRetries = 5;
			render(response.data);
		})
		.catch((error) => {
			if (error.name === 'CanceledError') {
				return;
			}
			
			console.log(error);
			fetchRetries--;
			container.innerHTML = '<span class="text-red-300">Error fetching data</span>';
		})
		.then(() => {
			request = null;
			if (fetchRetries > 0) {
				setTimeout(() => {
					fetchData();
				}, fetchDelay);
			}
		});
};

const render = (state) => {
	let configuration = state.configuration;
	let dockerContainers = state.containers;
	configuration = _.groupBy(configuration, 'category');
	configuration = _.pick(configuration, _.keys(configuration));
	let template = document.createElement('template');
	_.each(configuration, (collection, cat) => {
		let categoryTemplate = document.createElement('template');
		categoryTemplate.innerHTML = _.template(categoryPartial)({ name: cat });
		let category = categoryTemplate.content.firstChild;
		_.each(collection, (entity) => {
			let dockerContainer = _.find(dockerContainers, { name: entity.name });
			entity.state = '';
			if (dockerContainer) {
				entity.state = dockerContainer.state;
				if (!_.isEmpty(dockerContainer.ports)) {
					let ports = _.filter(dockerContainer.ports, { IP: '0.0.0.0' });
					if (!_.isEmpty(ports)) {
						_.each(ports, (port) => {
							let proxy = _.find(proxies, { forwardPort: port.PublicPort });
							if (!_.isEmpty(proxy)) {
								entity.url = `${proxy.sslForced ? 'https://' : 'http://'}${_.first(proxy.domainNames)}`;
							}
						});
					}
				}
			}
			if (entity.type === 'app') {
				const template = _.template(appPartial);
				category.insertAdjacentHTML('beforeend', template({ entity }));
			}
			if (entity.type === 'bookmark') {
				const template = _.template(bookmarkPartial);
				category.insertAdjacentHTML('beforeend', template({ entity }));
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

fetchData();
