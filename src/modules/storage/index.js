import modulePartial from 'modules/storage/partials/index.html';
import storagePartial from 'modules/storage/partials/storage.html';
import * as storageService from 'modules/storage/services/storage';

const moduleTemplate = _.template(modulePartial);
const storageTemplate = _.template(storagePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#storage');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const searchInput = module.querySelector('.search');
const table = container.querySelector('.table');
let searchTimer;
let searchValue = '';

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const storage = storageService.getStorage();
		render({ storage });
	}, 300);
};

const render = (state) => {
	if (_.isNull(state.storage)) {
		return;
	}
	
	const template = document.createElement('template');
	let pools = state.storage;
	const searchTerms = searchValue.toLowerCase().split(/\s+/);
	pools = _.filter(pools, (pool) => {
		const text = `${pool.name || ''}`.toLowerCase();
		const matchesSearch = _.every(searchTerms, (term) => text.includes(term));
		return matchesSearch;
	});
	_.each(pools, (pool) => {
		if (pool.name !== 'system') {
			pool.properties.usedbydatasets.percent = (pool.properties.usedbydatasets.value / pool.properties.size.value * 100);
			pool.properties.usedbysnapshots.percent = (pool.properties.usedbysnapshots.value / pool.properties.size.value * 100);
		}
		template.innerHTML += storageTemplate({ pool, drives: state.drives, prettyBytes, moment });
	});
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${template.innerHTML}</tbody>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

searchInput.addEventListener('input', search);

storageService.subscribe([render]);
