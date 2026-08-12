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

// `importable` is [] once scanned and false when the scan itself failed, so both are answers; only
// null means the node has not reported yet and the step keeps waiting.
const renderState = () => {
	const importable = storageService.getImportable();
	const drives = storageService.getDrives();
	if (_.isNull(importable) || _.isNull(drives)) {
		return;
	}

	const pool = storageService.getPool();
	const importablePool = storageService.getImportablePool();
	const template = stateTemplate({
		pool,
		importable,
		importablePool,
		foreignPools: storageService.getForeignPools(),
		drives,
		poolName: storageService.POOL_NAME,
		prettyBytes
	});
	morphdom(
		summary,
		`<div>${template}</div>`,
		{ childrenOnly: true }
	);

	// A pool that is already imported leaves nothing to do; otherwise it is adopt-or-create, and
	// creating needs the two drives the mirror is made of.
	const canCreate = (_.isUndefined(pool) && _.isUndefined(importablePool) && _.size(drives) >= 2);
	continueButton.classList.toggle('d-none', _.isUndefined(pool));
	importButton.classList.toggle('d-none', !_.isUndefined(pool) || _.isUndefined(importablePool));
	createButton.classList.toggle('d-none', !canCreate);
	fetching.classList.add('d-none');
	summary.classList.remove('d-none');
	actions.classList.remove('d-none');
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

const render = (state) => {
	if (!isSubmitting) {
		renderState();
	}

	_.each(state.jobs, settle);
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

	const drives = storageService.getDrives();
	const names = _.map(drives, (drive) => { return `${drive.model} (SN: ${drive.serialNumber})`; }).join('<br>');
	if (!await confirm(`Everything on these drives will be erased:<br><br>${names}<br><br>This cannot be undone.`, { buttons: [{ text: 'Erase and create pool', class: 'btn-danger' }] })) {
		return;
	}

	start(createButton);
	storageService.createPool({
		name: storageService.POOL_NAME,
		drives: _.map(drives, 'serialNumber')
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
	storageService.fetchImportable();
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

step.onRoute = () => {
	// A scan that failed before this client connected is never replayed on connect, so ask for one
	// rather than sitting on the spinner.
	if (_.isNull(storageService.getImportable())) {
		storageService.fetchImportable();
	}

	renderState();
};

storageService.subscribe([render]);
