import modulePartial from 'modules/storage/partials/index.html';
import storagePartial from 'modules/storage/partials/storage.html';
import * as storageService from 'modules/storage/services/storage';
import { filterListByQuery } from 'utils/list_search';

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
	if (_.isNull(state.drives) || _.isNull(state.storage) || _.isNull(state.snapshots)) {
		return;
	}
	
	let drives = state.drives;
	let pools = state.storage;
	let snapshots = state.snapshots;
	pools = filterListByQuery(pools, searchValue, ['name', 'poolGuid', 'type']);
	const rows = _.join(_.map(pools, (pool) => {
		if (pool.name !== 'system') {
			pool.properties.usedbydatasets.percent = (pool.properties.usedbydatasets.value / pool.properties.size.value * 100);
			pool.properties.usedbysnapshots.percent = (pool.properties.usedbysnapshots.value / pool.properties.size.value * 100);
			pool.snapshots = _.pickBy(snapshots, (snapshot) => {
				return snapshot.pool === pool.name;
			});
		}
		return storageTemplate({ drives, pool, prettyBytes, moment });
	}), '');
	
	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

searchInput.addEventListener('input', search);

storageService.subscribe([render]);
