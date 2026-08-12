import page from 'page';
import storagePartial from 'setup/partials/storage.html';
import statePartial from 'setup/partials/storage_state.html';
import * as storageService from 'setup/services/storage';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let isSubmitting = false;
const storageTemplate = _.template(storagePartial);
const stateTemplate = _.template(statePartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', storageTemplate());
const step = document.querySelector('#storage');
const fetching = step.querySelector('.fetching');
const summary = step.querySelector('.summary');
const actions = step.querySelector('.actions');
const rescan = step.querySelector('.rescan');
const importButton = step.querySelector('[data-action="import"]');
const createButton = step.querySelector('[data-action="create"]');
const continueButton = step.querySelector('[data-action="continue"]');
const back = step.querySelector('[data-action="back"]');

const goNext = () => {
	completeStep('storage');
	page(nextStepPath('storage'));
};

const finish = () => {
	isSubmitting = false;
	importButton.reset();
	createButton.reset();
	back.disabled = false;
	rescan.classList.remove('d-none');
};

const settle = (job) => {
	if (!isSubmitting || !_.includes(['completed', 'failed'], job.progress?.state)) {
		return;
	}

	finish();
	if (job.progress.state === 'failed') {
		alert(job.failedReason || 'The pool could not be prepared.');
		return;
	}

	goNext();
};

// `importablePools` is [] once scanned and false when the scan itself failed, so both are answers;
// only null means the node has not reported yet and the step keeps waiting. A submission owns the
// view until its job settles, so the summary is left alone while one is in flight.
const render = ({ storage, drives, importablePools, jobs }) => {
	_.each(jobs, settle);
	if (isSubmitting || _.isNull(importablePools) || _.isNull(drives)) {
		return;
	}

	const pool = storageService.findPool(storage);
	const importablePool = storageService.findImportablePool(importablePools);
	const usableDrives = storageService.findUsableDrives(drives);
	const template = stateTemplate({
		pool,
		importablePools,
		importablePool,
		foreignPools: storageService.findForeignPools(importablePools),
		drives: usableDrives,
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
	// creating needs the drives the mirror is made of.
	const canCreate = (_.isUndefined(pool) && _.isUndefined(importablePool) && _.size(usableDrives) >= storageService.MINIMUM_DRIVES);
	continueButton.classList.toggle('d-none', _.isUndefined(pool));
	importButton.classList.toggle('d-none', !_.isUndefined(pool) || _.isUndefined(importablePool));
	createButton.classList.toggle('d-none', !canCreate);
	fetching.classList.add('d-none');
	summary.classList.remove('d-none');
	actions.classList.remove('d-none');
};

const start = (button) => {
	isSubmitting = true;
	back.disabled = true;
	rescan.classList.add('d-none');
	button.loading();
};

const importPool = (event) => {
	if (isSubmitting) {
		return;
	}

	start(importButton);
	storageService.importPool({ name: storageService.POOL_NAME });
};

const createPool = async (event) => {
	if (isSubmitting) {
		return;
	}

	const drives = storageService.findUsableDrives(storageService.getDrives());
	const names = _.map(drives, (drive) => { return `${drive.model} (SN: ${drive.serialNumber})`; }).join('<br>');
	if (!await confirm(`Everything on these drives will be erased:<br><br>${names}<br><br>This cannot be undone.`, { buttons: [{ text: 'Erase and create pool', class: 'btn-danger' }] })) {
		return;
	}

	start(createButton);
	storageService.createPool({
		name: storageService.POOL_NAME,
		type: storageService.POOL_TYPE,
		drives: _.map(drives, 'eui')
	});
};

const scanAgain = (event) => {
	event.preventDefault();
	if (isSubmitting) {
		return;
	}

	fetching.classList.remove('d-none');
	summary.classList.add('d-none');
	actions.classList.add('d-none');
	storageService.fetchImportablePools();
};

const goBack = (event) => {
	if (isSubmitting) {
		return;
	}

	page(previousStepPath('storage'));
};

rescan.addEventListener('click', scanAgain);
importButton.addEventListener('click', importPool);
createButton.addEventListener('click', createPool);
continueButton.addEventListener('click', goNext);
back.addEventListener('click', goBack);

// The subscription keeps this step current even while it is hidden, so arriving here only has to
// cover the case where the node never reported a scan for this client to render.
step.onRoute = () => {
	if (_.isNull(storageService.getImportablePools())) {
		storageService.fetchImportablePools();
	}
};

storageService.subscribe([render]);
