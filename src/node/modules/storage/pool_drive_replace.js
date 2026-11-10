import modalPartial from 'node/modules/storage/partials/modals/pool_drive_replace.html';
import contentPartial from 'node/modules/storage/partials/modals/pool_drive_replace_content.html';
import * as storageService from 'node/modules/storage/services/storage';

const SIZE_MARGIN = 1.01;

const contentTemplate = _.template(contentPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', modalPartial);

const modal = document.querySelector('#pool-drive-replace');
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

const findDrive = (drives, name) => {
	return _.find(drives, (drive) => { return _.some([drive.id, ...(drive.ids || [])], (id) => { return _.toLower(id) === _.toLower(name); }); });
};

const driveLabel = (drive, name) => {
	return (drive?.name ? _.last(drive.name.split('/')) : `…${name.slice(-6)}`);
};

const diskVdevs = (vdev) => {
	if (vdev.vdevType === 'disk') {
		return [vdev];
	}

	return _.flatMap(_.values(vdev.vdevs), diskVdevs);
};

const getReplacements = (pool) => {
	const replaceJobs = _.filter(storageService.getJobs(), (job) => { return job.name === 'host:storage:pool:replace' && _.toLower(job.data?.config?.name) === _.toLower(pool.name); });
	const pendingOld = _.map(replaceJobs, (job) => { return _.toLower(job.data?.config?.old); });
	const pendingNew = _.map(replaceJobs, (job) => { return _.toLower(job.data?.config?.new); });
	return _.map(pool.replacements, (replacement) => {
		if (_.includes(pendingOld, _.toLower(replacement.name))) {
			return { ...replacement, candidates: [], reason: 'queued' };
		}

		if (replacement.reason) {
			return replacement;
		}

		if (replacement.kind === 'healthy' && !_.isEmpty(replaceJobs)) {
			return { ...replacement, candidates: [], reason: 'replacing-other' };
		}

		const candidates = _.reject(replacement.candidates, (id) => { return _.includes(pendingNew, _.toLower(id)); });
		return { ...replacement, candidates, reason: (_.isEmpty(candidates) ? 'drives' : null) };
	});
};

const render = () => {
	if (!request) {
		return;
	}

	const pool = _.find(storageService.getStorage(), (entry) => { return _.toLower(entry.name) === _.toLower(request.name); });
	const replacement = _.find((pool ? getReplacements(pool) : []), (entry) => { return _.toLower(entry.name) === _.toLower(request.old) && !entry.reason; });
	const drives = (storageService.getDrives() || []);
	const candidates = _.compact(_.map(replacement?.candidates, (id) => {
		const drive = _.find(drives, { id });
		return (drive ? { id, label: driveLabel(drive, id), model: drive.model, serialNumber: drive.serialNumber, size: drive.size } : null);
	}));
	if (_.isEmpty(candidates)) {
		bootstrap.Dialog.getInstance(modal)?.hide();
		return;
	}

	if (!_.some(candidates, { id: request.new })) {
		request.new = _.first(candidates).id;
	}

	const group = _.find(_.values(pool.vdevs?.[pool.name]?.vdevs), (vdev) => {
		return _.some(diskVdevs(vdev), (disk) => { return _.toLower(disk.name) === _.toLower(replacement.name); });
	});
	const disks = _.map(diskVdevs(group), (vdev) => {
		const drive = findDrive(drives, vdev.name);
		const isOld = (_.toLower(vdev.name) === _.toLower(replacement.name));
		return {
			name: vdev.name,
			label: driveLabel(drive, vdev.name),
			model: drive?.model,
			serialNumber: drive?.serialNumber,
			size: (drive?.size || vdev.physSpace || vdev.repDevSize || 0),
			kind: (isOld ? replacement.kind : null),
			isOld
		};
	});
	const oldDisk = _.find(disks, 'isOld');
	const selectedDrive = _.find(candidates, { id: request.new });
	const otherSizes = _.map(_.reject(disks, 'isOld'), 'size');
	const currentMin = _.min([oldDisk.size, ...otherSizes]);
	const nextMin = _.min([selectedDrive.size, ...otherSizes]);
	let growth = null;
	if (nextMin > currentMin * SIZE_MARGIN) {
		growth = 'now';
	} else if (selectedDrive.size > oldDisk.size * SIZE_MARGIN) {
		growth = 'later';
	}

	morphdom(modal.querySelector('.dialog-body'), contentTemplate({
		pool,
		group: { name: (group.vdevType === 'disk' ? 'stripe' : group.name), state: group.state, disks },
		candidates,
		selected: request.new,
		selectedDrive,
		growth,
		currentMin,
		stateColor,
		prettyBytes
	}));
};

const open = (event) => {
	const name = event.relatedTarget?.closest('.item')?.dataset.name;
	request = (name ? { name, old: (event.relatedTarget.closest('[data-replace]')?.dataset.replace || null), new: null } : null);
	render();
};

const select = (event) => {
	if (event.target.name !== 'replacement') {
		return;
	}

	request.new = event.target.value;
	render();
};

const replace = async (event) => {
	if (!event.target.closest('.pool-drive-replace-confirm') || !request?.new) {
		return;
	}

	const data = { name: request.name, old: request.old, new: request.new };
	const label = driveLabel(_.find(storageService.getDrives(), { id: request.new }), request.new);
	if (!await confirm(`Everything currently on <strong>${_.escape(label)}</strong> will be erased. This action cannot be undone.`, {
		buttons: [{ text: 'Replace', class: 'btn-solid theme-danger' }],
		acknowledge: 'I understand and want to proceed'
	})) {
		return;
	}

	storageService.replaceDrive(data);
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const restore = () => {
	request = null;
};

storageService.subscribe([render]);

modal.addEventListener('show.bs.dialog', open);
modal.addEventListener('hidden.bs.dialog', restore);
modal.addEventListener('change', select);
modal.addEventListener('click', replace);
