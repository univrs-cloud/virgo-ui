import page from 'page';
import storagePartial from 'setup/partials/storage.html';
import statePartial from 'setup/partials/storage_state.html';
import topologiesPartial from 'setup/partials/storage_topologies.html';
import poolTopologyPartial from 'setup/partials/storage_pool_topology.html';
import * as storageService from 'setup/services/storage';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const storageTemplate = _.template(storagePartial);
const stateTemplate = _.template(statePartial);
const topologiesTemplate = _.template(topologiesPartial);
const poolTopologyTemplate = _.template(poolTopologyPartial);
// The layout the user picked, kept across renders because the drive list re-renders under it.
let selectedType = null;
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', storageTemplate());
const step = document.querySelector('#storage');
const fetching = step.querySelector('.fetching');
const summary = step.querySelector('.summary');
const actions = step.querySelector('.actions');
const rescanLink = step.querySelector('.rescan');
const importButton = step.querySelector('[data-action="import"]');
const createButton = step.querySelector('[data-action="create"]');
const continueButton = step.querySelector('[data-action="continue"]');
const backButton = step.querySelector('[data-action="back"]');

const goNext = () => {
	completeStep('storage');
	page(nextStepPath('storage'));
};

const idle = () => {
	importButton.reset();
	createButton.reset();
	backButton.disabled = false;
	rescanLink.classList.remove('d-none');
};

// Preparing a pool is the node's work, not this tab's, so the actions follow the job: locked while one
// runs, and the step advances when it finishes — but only if it is the step on screen, since a job
// outlives the page that started it. A failure leaves the user here to try again. `importablePools` is
// [] once scanned and false when the scan itself failed, so both are answers; only null means the node
// has not reported yet and the step keeps waiting. A submission owns the view until its job settles,
// so the summary is left alone while one is in flight.
const render = (state) => {
	const pool = storageService.getPool(state.storage);
	const job = _.first(state.jobs);
	const isSettled = _.includes(['completed', 'failed'], job?.progress?.state);
	// A summary rendered while the pool is being prepared would describe a node that no longer exists.
	if (job && !isSettled) {
		backButton.disabled = true;
		rescanLink.classList.add('d-none');
		return;
	}

	if (backButton.disabled) {
		// The pool being there is the outcome the job was reporting, and it outlives the report: a socket
		// that dropped over the import comes back to an empty job list and would otherwise wait forever.
		// An empty list on its own decides nothing — that is also the gap before the node queues the job.
		const isPrepared = !_.isUndefined(pool);
		if (!isSettled && !isPrepared) {
			return;
		}

		idle();
		if (isPrepared && !step.classList.contains('d-none')) {
			goNext();
		}
	}

	if (_.isNull(state.importablePools) || _.isNull(state.drives)) {
		return;
	}

	const importablePool = storageService.getImportablePool(state.importablePools);
	const usableDrives = storageService.getUsableDrives(state.drives);
	const topologies = storageService.getTopologies(state.topologies);
	if (!_.find(topologies, { type: selectedType })) {
		selectedType = _.get(_.first(topologies), 'type', null);
	}

	const template = stateTemplate({
		pool,
		importablePools: state.importablePools,
		importablePool,
		foreignPools: storageService.getForeignPools(state.importablePools),
		drives: usableDrives,
		topologies,
		selectedType,
		topologiesPartial: topologiesTemplate,
		poolGroups: storageService.getPoolGroups(pool, state.drives),
		importableGroups: storageService.getImportableGroups(importablePool, state.drives),
		poolTopologyPartial: poolTopologyTemplate,
		poolName: storageService.POOL_NAME,
		minimumDrives: storageService.MINIMUM_DRIVES,
		prettyBytes
	});
	morphdom(
		summary,
		`<div>${template}</div>`,
		{ childrenOnly: true }
	);

	// A pool that is already imported leaves nothing to do; otherwise it is adopt-or-create, and
	// creating needs a layout the drives can actually be built into.
	const canCreate = (_.isUndefined(pool) && _.isUndefined(importablePool) && Boolean(selectedType));
	continueButton.classList.toggle('d-none', _.isUndefined(pool));
	importButton.classList.toggle('d-none', !_.isUndefined(pool) || _.isUndefined(importablePool));
	createButton.classList.toggle('d-none', !canCreate);
	fetching.classList.add('d-none');
	summary.classList.remove('d-none');
	actions.classList.remove('d-none');
};

const start = (button) => {
	backButton.disabled = true;
	rescanLink.classList.add('d-none');
	button.loading();
};

const importPool = (event) => {
	start(importButton);
	storageService.importPool({ name: storageService.POOL_NAME });
};

const selectTopology = (event) => {
	const input = event.target.closest('input[name="topology"]');
	if (input) {
		selectedType = input.value;
	}
};

const createPool = async (event) => {
	if (!selectedType) {
		return;
	}

	const drives = storageService.getUsableDrives(storageService.getDrives());
	const names = _.map(drives, (drive) => { return `${drive.model || drive.name} (SN: ${drive.serialNumber || '—'})`; }).join('<br>');
	if (!await confirm(`Everything on these drives will be erased:<br><br>${names}<br><br>This cannot be undone.`, { buttons: [{ text: 'Erase and create', class: 'btn-danger' }] })) {
		return;
	}

	start(createButton);
	storageService.createPool({
		name: storageService.POOL_NAME,
		type: selectedType,
		drives: _.map(drives, 'id')
	});
};

const scanAgain = (event) => {
	event.preventDefault();
	fetching.classList.remove('d-none');
	summary.classList.add('d-none');
	actions.classList.add('d-none');
	storageService.fetchImportablePools();
};

const goBack = (event) => {
	page(previousStepPath('storage'));
};

summary.addEventListener('change', selectTopology);
rescanLink.addEventListener('click', scanAgain);
importButton.addEventListener('click', importPool);
createButton.addEventListener('click', createPool);
continueButton.addEventListener('click', goNext);
backButton.addEventListener('click', goBack);

// The subscription keeps this step current even while it is hidden, so arriving here only has to
// cover the case where the node never reported a scan for this client to render.
step.onRoute = () => {
	if (_.isNull(storageService.getImportablePools())) {
		storageService.fetchImportablePools();
	}
};

storageService.subscribe([render]);
