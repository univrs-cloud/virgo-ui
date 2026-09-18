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
	if (_.includes(['online', 'avail', 'inuse'], value)) {
		return 'green';
	}

	if (value === 'degraded') {
		return 'yellow';
	}

	return 'red';
};

const healthColor = (health) => {
	if (health?.status === 'critical') {
		return 'red';
	}

	if (health?.status === 'warning') {
		return 'orange';
	}

	return null;
};

const driveHealthTip = (drive) => {
	const name = (drive?.name ? _.last(drive.name.split('/')) : null);
	if (!name) {
		return null;
	}

	return (drive.health?.message ? `${_.escape(name)}: ${_.escape(drive.health.message)}` : _.escape(name));
};

const vdevFaultTolerance = (vdev) => {
	if (vdev.vdevType === 'mirror') {
		return _.max([_.size(vdev.vdevs) - 1, 0]);
	}

	return _.toInteger(_.replace(vdev.name, /^raidz(\d).*$/, '$1'));
};

const findDrive = (name) => {
	return _.find(drives, (drive) => { return _.includes(drive.ids, name); });
};

const POOL_SECTION_LABELS = {
	logs: 'Write log',
	special: 'Metadata',
	dedup: 'Dedup metadata',
	l2cache: 'Read cache',
	spares: 'Spares'
};

const STATE_SEVERITY = { green: 0, yellow: 1, red: 2 };

const replaceRole = (parent, index, count) => {
	if (!_.includes(['replacing', 'spare'], parent?.vdevType)) {
		return null;
	}

	if (index === 0) {
		return 'old';
	}

	return (index === count - 1 ? 'new' : null);
};

const flattenVdevs = (vdevs, depth = 0, parent = null) => {
	const siblings = _.values(vdevs || {});
	return _.flatMap(siblings, (vdev, index) => {
		const drive = (vdev.vdevType === 'disk' ? findDrive(vdev.name) : null);
		const isLast = (index === siblings.length - 1);
		const role = replaceRole(parent, index, siblings.length);
		const pair = (role ? parent.vdevType : null);
		return [{ vdev, drive, depth, isLast, role, pair }, ...flattenVdevs(vdev.vdevs, depth + 1, vdev)];
	});
};

const vdevActivity = (vdev, scan) => {
	const isScanning = (_.toUpper(scan?.state) === 'SCANNING');
	if (!isScanning || !_.isEmpty(vdev.vdevs) || _.toUpper(vdev.state) !== 'ONLINE') {
		return null;
	}

	if (vdev.scanProcessed > 0) {
		return (_.toUpper(scan.function) === 'RESILVER' ? 'Resilvering' : 'Repairing');
	}

	return (vdev.resilverDeferred ? 'Awaiting resilver' : null);
};

const poolHealth = (pool) => {
	const members = (pool.name === 'system'
		? _.filter(drives, 'system')
		: _.compact(_.map(_.filter(flattenVdevs(pool.vdevs?.[pool.name]?.vdevs), ({ vdev }) => { return vdev.vdevType === 'disk'; }), 'drive')));
	const unhealthy = _.filter(members, (drive) => { return Boolean(healthColor(drive.health)); });
	if (_.isEmpty(unhealthy)) {
		return null;
	}

	return {
		color: (_.some(unhealthy, (drive) => { return drive.health.status === 'critical'; }) ? 'red' : 'orange'),
		tip: _.join(_.map(unhealthy, driveHealthTip), '<br>')
	};
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
	const sections = _.filter([
		{ key: 'data', label: 'Data', vdevs: rootVdev?.vdevs },
		..._.map(_.filter(_.keys(pool), (key) => { return _.has(POOL_SECTION_LABELS, key); }), (key) => { return { key, label: POOL_SECTION_LABELS[key], vdevs: pool[key] }; })
	], (section) => { return !_.isEmpty(section.vdevs); });
	const withActivity = (row) => { return { ...row, activity: vdevActivity(row.vdev, pool.scanStats) }; };
	const vdevSections = _.map(sections, (section) => { return { label: section.label, rows: _.map(flattenVdevs(section.vdevs), withActivity) }; });
	const spareUse = {};
	_.each(_.reject(sections, { key: 'spares' }), (section) => {
		_.each(_.values(section.vdevs), (top) => {
			_.each(flattenVdevs(top.vdevs, 0, top), ({ vdev, role, pair }) => {
				if (pair === 'spare' && role === 'new') {
					spareUse[vdev.name] = top.name;
				}
			});
		});
	});
	const groupDisks = (vdev) => {
		const disks = _.map(_.filter(flattenVdevs(vdev.vdevs, 0, vdev), ({ vdev }) => { return vdev.vdevType === 'disk'; }), withActivity);
		return (_.isEmpty(disks) ? [withActivity({ vdev, drive: findDrive(vdev.name), role: null })] : disks);
	};
	const spareDisks = (vdev) => {
		return _.map(groupDisks(vdev), (disk) => { return { ...disk, usedIn: (spareUse[disk.vdev.name] || null) }; });
	};
	const groups = _.flatMap(sections, (section) => {
		const vdevs = _.values(section.vdevs);
		if (section.key === 'data') {
			return _.map(vdevs, (vdev) => { return { vdev, isData: true, sectionLabel: (vdev.vdevType === 'disk' ? section.label : `${section.label} · ${vdev.name}`), disks: groupDisks(vdev) }; });
		}

		const bare = _.filter(vdevs, { vdevType: 'disk' });
		const worst = _.maxBy(bare, (vdev) => { return STATE_SEVERITY[stateColor(vdev.state)]; });
		const bareGroup = { vdev: { name: section.label, vdevType: 'section', state: worst?.state }, sectionLabel: section.label, disks: _.flatMap(bare, (section.key === 'spares' ? spareDisks : groupDisks)) };
		return _.compact(_.map(vdevs, (vdev) => {
			if (vdev.vdevType !== 'disk') {
				return { vdev, sectionLabel: `${section.label} · ${vdev.name}`, disks: groupDisks(vdev) };
			}

			return (vdev === bare[0] ? bareGroup : null);
		}));
	});

	const dataGroups = _.filter(groups, 'isData');
	const faultTolerance = (_.isEmpty(dataGroups) ? 0 : _.min(_.map(dataGroups, ({ vdev }) => { return vdevFaultTolerance(vdev); })));

	morphdom(
		details,
		`<div>${poolDetailsTemplate({ pool, groups, vdevSections, faultTolerance, poolVdevTemplate, stateColor, healthColor, driveHealthTip, prettyBytes, moment })}</div>`,
		{
			childrenOnly: true,
			onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('details-toggle') || fromEl.classList.contains('collapse') || fromEl.classList.contains('collapsing')) {
					morphdom(fromEl, toEl, { childrenOnly: true });
					return false;
				}
			}
		}
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
		return storageTemplate({ pool, stateColor, poolHealth, prettyBytes, moment });
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

const toggleStateTooltip = (event) => {
	if (!event.target.classList?.contains('state-icon')) {
		return;
	}

	const dot = event.target.querySelector('.state-dot');
	const tooltip = bootstrap.Tooltip.getOrCreateInstance(dot, { selector: false, trigger: 'manual' });
	if (event.type === 'mouseenter') {
		tooltip.show();
	} else {
		tooltip.hide();
	}
};

module.onRoute = handleRoute;
module.addEventListener('click', compress);
module.addEventListener('mouseenter', toggleStateTooltip, true);
module.addEventListener('mouseleave', toggleStateTooltip, true);
searchInput.addEventListener('input', search);
table.querySelector('tbody').addEventListener('click', expand);

storageService.subscribe([render]);
