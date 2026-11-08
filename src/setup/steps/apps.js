import page from 'page';
import jobProgressPartial from 'setup/partials/job_progress.html';
import appsPartial from 'setup/partials/apps.html';
import statePartial from 'setup/partials/apps_state.html';
import certificateReasonPartial from 'setup/partials/certificate_reason.html';
import * as appsService from 'setup/services/apps';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const appsTemplate = _.template(appsPartial);
const stateTemplate = _.template(statePartial);
const jobProgressTemplate = _.template(jobProgressPartial);
const certificateReasonTemplate = _.template(certificateReasonPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', appsTemplate());
const step = document.querySelector('#apps');
const core = step.querySelector('.core');
const backButton = step.querySelector('[data-action="back"]');
const continueButton = step.querySelector('[data-action="continue"]');
const checkingRow = step.querySelector('.certificate-checking');
const checkingFqdns = step.querySelectorAll('.certificate-fqdn');
const waitingLabel = step.querySelector('.certificate-waiting');
const stillCheckingLabel = step.querySelector('.certificate-still-checking');
const warningRow = step.querySelector('.certificate-warning');
const warningReason = step.querySelector('.certificate-reason');
const CERTIFICATE_GRACE_MS = 60000;
let waitStartedAt = null;
let gaveUp = false;
let graceTimeout = null;
let lastState = null;

const goNext = (event) => {
	completeStep('apps');
	page(nextStepPath('apps'));
};

const goBack = (event) => {
	page(previousStepPath('apps'));
};

// Waiting for a certificate is the one state the node has nothing new to say about, so the grace
// period cannot be measured on the next delivery — there may not be one. It gets its own timer, which
// re-renders the state it was given so the warning appears on time and the step stops being a dead end.
const renderWaiting = (fqdn) => {
	waitStartedAt = waitStartedAt || Date.now();
	const remaining = CERTIFICATE_GRACE_MS - (Date.now() - waitStartedAt);
	const expired = gaveUp || remaining <= 0;
	if (!expired && _.isNull(graceTimeout)) {
		graceTimeout = setTimeout(() => {
			graceTimeout = null;
			render(lastState);
		}, remaining);
	}

	_.each(checkingFqdns, (checkingFqdn) => { checkingFqdn.textContent = fqdn || 'this node'; });
	checkingRow.classList.remove('d-none');
	checkingRow.classList.add('d-flex');
	waitingLabel.classList.toggle('d-none', expired);
	stillCheckingLabel.classList.toggle('d-none', !expired);
	warningRow.classList.toggle('d-none', !expired);
	return expired;
};

const renderCertificate = (certificate) => {
	if (_.toLower(certificate?.status) === 'issued') {
		clearTimeout(graceTimeout);
		graceTimeout = null;
		waitStartedAt = null;
		gaveUp = false;
		checkingRow.classList.add('d-none');
		checkingRow.classList.remove('d-flex');
		warningRow.classList.add('d-none');
		return true;
	}

	const canSkip = (_.isNil(certificate) || certificate.canSkip);
	warningReason.innerHTML = certificateReasonTemplate({ certificate });
	gaveUp = renderWaiting(certificate?.fqdn);
	return (gaveUp && canSkip);
};

// The node installs these on its own once the pool is ready, so this step only reports what it is
// doing — and holds the wizard here, in both directions, until every app is up: the password written
// by the next step goes into a file Authelia has to have created.
const render = (state) => {
	lastState = state;
	const apps = appsService.getCoreApps(state.configured, state.containers, state.jobs);
	morphdom(
		core,
		`<dl>${stateTemplate({ apps, jobProgressTemplate })}</dl>`,
		{ childrenOnly: true }
	);

	const isRunning = _.every(apps, 'isRunning');
	if (!isRunning) {
		backButton.disabled = true;
		continueButton.disabled = true;
		return;
	}

	const isReady = renderCertificate(appsService.getCertificate(state.certificate));
	backButton.disabled = !(isReady || gaveUp);
	continueButton.disabled = !isReady;
};

continueButton.addEventListener('click', goNext);
backButton.addEventListener('click', goBack);

appsService.subscribe([render]);
