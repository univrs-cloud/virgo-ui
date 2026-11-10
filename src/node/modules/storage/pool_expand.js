import modalPartial from 'node/modules/storage/partials/modals/pool_expand.html';
import contentPartial from 'node/modules/storage/partials/modals/pool_expand_content.html';
import * as storageService from 'node/modules/storage/services/storage';

const contentTemplate = _.template(contentPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#pool-expand');
let drives = [];
let request = null;

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

const findDrive = (name) => {
	return _.find(drives, (drive) => { return _.some(drive.ids, (id) => { return _.toLower(id) === _.toLower(name); }); });
};

const replaceRole = (parent, index, count) => {
	if (!_.includes(['replacing', 'spare'], parent?.vdevType)) {
		return null;
	}

	if (index === 0) {
		return 'old';
	}

	return (index === count - 1 ? 'new' : null);
};

const flattenVdevs = (vdevs, parent = null) => {
	const siblings = _.values(vdevs || {});
	return _.flatMap(siblings, (vdev, index) => {
		const drive = (vdev.vdevType === 'disk' ? findDrive(vdev.name) : null);
		const role = replaceRole(parent, index, siblings.length);
		const pair = (role ? parent.vdevType : null);
		return [{ vdev, drive, role, pair }, ...flattenVdevs(vdev.vdevs, vdev)];
	});
};

const vdevActivity = (vdev, scan) => {
	const isScanning = (_.toLower(scan?.state) === 'scanning');
	if (!isScanning || !_.isEmpty(vdev.vdevs) || _.toLower(vdev.state) !== 'online') {
		return null;
	}

	if (vdev.scanProcessed > 0) {
		return (_.toLower(scan.function) === 'resilver' ? 'resilvering' : 'repairing');
	}

	return (vdev.resilverDeferred ? 'awaiting' : null);
};

const render = (event) => {
	const name = event.relatedTarget?.closest('.item')?.dataset.name;
	const pool = _.find(storageService.getStorage(), (entry) => { return _.toLower(entry.name) === _.toLower(name); });
	const expansion = pool?.expansion;
	if (_.isEmpty(expansion?.groups)) {
		request = null;
		return;
	}

	drives = (storageService.getDrives() || []);
	const withActivity = (row) => { return { ...row, activity: vdevActivity(row.vdev, pool.scanStats) }; };
	const groupDisks = (vdev) => {
		const disks = _.map(_.filter(flattenVdevs(vdev.vdevs, vdev), ({ vdev }) => { return vdev.vdevType === 'disk'; }), withActivity);
		return (_.isEmpty(disks) ? [withActivity({ vdev, drive: findDrive(vdev.name), role: null, pair: null })] : disks);
	};
	const existingGroups = _.map(_.values(pool.vdevs?.[pool.name]?.vdevs), (vdev) => {
		return { vdev, name: (vdev.vdevType === 'disk' ? 'stripe' : vdev.name), disks: groupDisks(vdev) };
	});
	const toDisk = (id) => {
		const drive = _.find(drives, { id });
		return { name: (drive?.name ? _.last(drive.name.split('/')) : id), size: (drive?.size || 0) };
	};
	const newGroups = _.map(expansion.groups, (group) => {
		return { disks: _.map(group.drives, toDisk) };
	});
	const unusedDisks = _.map(expansion.unused, toDisk);
	const driveIds = _.flatMap(expansion.groups, 'drives');
	request = { name: pool.name, drives: driveIds };
	morphdom(modal.querySelector('.dialog-body'), contentTemplate({
		pool,
		expansion,
		existingGroups,
		newGroups,
		unusedDisks,
		capacityBytes: (pool.properties?.size?.value || 0),
		addedBytes: _.sumBy(expansion.groups, 'capacityBytes'),
		stateColor,
		healthColor,
		prettyBytes
	}));
};

const expand = async (event) => {
	if (!event.target.closest('.pool-expand-confirm') || !request) {
		return;
	}

	const data = request;
	const labels = _.map(data.drives, (id) => {
		const drive = _.find(drives, { id });
		return `<strong>${_.escape(drive?.name ? _.last(drive.name.split('/')) : id)}</strong>`;
	});
	const list = (_.size(labels) > 1 ? `${_.join(_.initial(labels), ', ')} and ${_.last(labels)}` : _.first(labels));
	if (!await confirm(`Everything currently on ${list} will be erased. This action cannot be undone.`, {
		buttons: [{ text: 'Expand', class: 'btn-solid theme-danger' }],
		acknowledge: 'I understand and want to proceed'
	})) {
		return;
	}

	storageService.expandPool(data);
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const restore = () => {
	request = null;
};

modal.addEventListener('show.bs.dialog', render);
modal.addEventListener('hidden.bs.dialog', restore);
modal.addEventListener('click', expand);
