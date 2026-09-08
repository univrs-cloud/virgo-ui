import page from 'page';
import modulePartial from 'node/modules/storage/partials/index.html';
import storagePartial from 'node/modules/storage/partials/storage.html';
import poolDetailsPartial from 'node/modules/storage/partials/pool_details.html';
import poolVdevPartial from 'node/modules/storage/partials/pool_vdev.html';
import * as storageService from 'node/modules/storage/services/storage';
import { filterListByQuery } from 'utils/list_search';

const moduleTemplate = _.template(modulePartial);
const storageTemplate = _.template(storagePartial);
const poolDetailsTemplate = _.template(poolDetailsPartial);
const poolVdevTemplate = _.template(poolVdevPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#storage');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const details = container.querySelector('.details');
const searchInput = module.querySelector('.search');
const table = container.querySelector('.table');
let routePoolName = null;
let searchTimer;
let searchValue = '';
let pools = [];
let drives = [];

const search = (event) => {
	clearTimeout(searchTimer);
	searchTimer = setTimeout(() => {
		searchValue = event.target.value;
		const storage = storageService.getStorage();
		const snapshots = storageService.getSnapshots();
		const drives = storageService.getDrives();
		render({ storage, snapshots, drives });
	}, 300);
};

const expand = (event) => {
	if (event.target.closest('a, .dropdown')) {
		return;
	}

	const row = event.target.closest('.item');
	const name = row?.dataset.name;
	if (!name) {
		return;
	}

	event.preventDefault();
	page(`/storage/${encodeURIComponent(name)}`);
};

const compress = (event) => {
	if (!event.target.closest('button')?.classList.contains('compress')) {
		return;
	}

	event.preventDefault();
	page('/storage');
};

const stateColor = (state) => {
	const value = _.toLower(state || '');
	if (_.includes(['online', 'avail'], value)) {
		return 'green';
	}

	if (_.includes(['degraded', 'inuse'], value)) {
		return 'yellow';
	}

	return 'red';
};

const vdevFaultTolerance = (vdev) => {
	if (vdev.vdevType === 'mirror') {
		return _.max([_.size(vdev.vdevs) - 1, 0]);
	}

	return _.toInteger(_.replace(vdev.name, /^raidz(\d).*$/, '$1'));
};

const flattenVdevs = (vdevs, depth = 0) => {
	const siblings = _.values(vdevs || {});
	return _.flatMap(siblings, (vdev, index) => {
		const drive = (vdev.vdevType === 'disk' ? _.find(drives, { eui: vdev.name }) : null);
		const isLast = (index === siblings.length - 1);
		return [{ vdev, drive, depth, isLast }, ...flattenVdevs(vdev.vdevs, depth + 1)];
	});
};

const renderPoolDetails = (name) => {
	if (!name) {
		return;
	}

	const pool = _.find(pools, { name });
	if (!pool) {
		return;
	}

	const rootVdev = pool.vdevs?.[pool.name];
	const vdevRows = flattenVdevs(rootVdev?.vdevs);
	const groups = _.map(_.values(rootVdev?.vdevs || {}), (vdev) => {
		const disks = _.filter(flattenVdevs(vdev.vdevs), ({ vdev }) => { return vdev.vdevType === 'disk'; });
		return { vdev, disks: (_.isEmpty(disks) ? [{ vdev, drive: _.find(drives, { eui: vdev.name }) }] : disks) };
	});

	const faultTolerance = (_.isEmpty(groups) ? 0 : _.min(_.map(groups, ({ vdev }) => { return vdevFaultTolerance(vdev); })));

	morphdom(
		details,
		`<div>${poolDetailsTemplate({ pool, drives, groups, vdevRows, faultTolerance, poolVdevTemplate, stateColor, prettyBytes, moment })}</div>`,
		{ childrenOnly: true }
	);
};

const hidePoolDetails = () => {
	details.classList.remove('d-block');
	details.innerHTML = '';
};

const render = (state) => {
	if (_.isNull(state.drives) || _.isNull(state.storage) || _.isNull(state.snapshots)) {
		return;
	}

	drives = (state.drives || []);
	pools = _.map(state.storage, (pool) => {
		if (pool.name !== 'system') {
			pool.properties.usedbydatasets.percent = (pool.properties.usedbydatasets.value / pool.properties.size.value * 100);
			pool.properties.usedbysnapshots.percent = (pool.properties.usedbysnapshots.value / pool.properties.size.value * 100);
			pool.snapshots = _.pickBy(state.snapshots, (snapshot) => {
				return snapshot.pool === pool.name;
			});
		}
		return pool;
	});

	const rows = _.join(_.map(filterListByQuery(pools, searchValue, ['name', 'poolGuid', 'type']), (pool) => {
		return storageTemplate({ drives, pool, stateColor, prettyBytes, moment });
	}), '');

	morphdom(
		table.querySelector('tbody'),
		`<tbody>${rows}</tbody>`,
		{ childrenOnly: true }
	);

	const detailsPoolName = routePoolName || container.querySelector('.details .item')?.dataset.name;
	if (detailsPoolName) {
		renderPoolDetails(detailsPoolName);
	}

	loading.classList.add('d-none');
	container.classList.remove('d-none');
};

const handleRoute = (ctx) => {
	const name = ctx?.params?.poolName;
	routePoolName = (_.isEmpty(name) ? null : name);
	if (_.isEmpty(name)) {
		hidePoolDetails();
		return;
	}

	renderPoolDetails(name);
	details.classList.add('d-block');
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
searchInput.addEventListener('input', search);
table.querySelector('tbody').addEventListener('click', expand);

storageService.subscribe([render]);
