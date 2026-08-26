import page from 'page';
import jobProgressPartial from 'setup/partials/job_progress.html';
import appsPartial from 'setup/partials/apps.html';
import statePartial from 'setup/partials/apps_state.html';
import * as appsService from 'setup/services/apps';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const appsTemplate = _.template(appsPartial);
const stateTemplate = _.template(statePartial);
const jobProgressTemplate = _.template(jobProgressPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', appsTemplate());
const step = document.querySelector('#apps');
const core = step.querySelector('.core');
const backButton = step.querySelector('[data-action="back"]');
const continueButton = step.querySelector('[data-action="continue"]');
const checkingRow = step.querySelector('.certificate-checking');
const checkingFqdn = step.querySelector('.certificate-fqdn');
const warningRow = step.querySelector('.certificate-warning');
const warningReason = step.querySelector('.certificate-reason');
const CERTIFICATE_GRACE_MS = 60000;
const CERTIFICATE_POLL_MS = 5000;
let waitStartedAt = null;
let pollTimer = null;

const goNext = (event) => {
	stopPolling();
	completeStep('apps');
	page(nextStepPath('apps'));
};

const goBack = (event) => {
	page(previousStepPath('apps'));
};

const stopPolling = () => {
	clearInterval(pollTimer);
	pollTimer = null;
};

const certificateReason = (certificate) => {
	if (!certificate?.resolves) {
		return `${certificate?.fqdn} does not resolve yet. DNS may still be propagating, or the record was not created.`;
	}

	return `${certificate.fqdn} resolves, but no certificate has been issued yet. Check port forwarding and the node's logs.`;
};

const startPolling = () => {
	if (pollTimer) {
		return;
	}

	appsService.fetchCertificate();
	pollTimer = setInterval(() => { appsService.fetchCertificate(); }, CERTIFICATE_POLL_MS);
};

const renderWaiting = (fqdn) => {
	waitStartedAt = waitStartedAt || Date.now();
	const expired = (Date.now() - waitStartedAt) >= CERTIFICATE_GRACE_MS;
	checkingFqdn.textContent = fqdn || 'this node';
	checkingRow.classList.toggle('d-none', expired);
	checkingRow.classList.toggle('d-flex', !expired);
	warningRow.classList.toggle('d-none', !expired);
	return expired;
};

const renderCertificate = (certificate) => {
	if (_.isNil(certificate)) {
		startPolling();
		warningReason.textContent = 'The node has not reported its certificate state yet.';
		return renderWaiting(null);
	}

	if (!certificate.required || certificate.hasCertificate) {
		stopPolling();
		checkingRow.classList.add('d-none');
		warningRow.classList.add('d-none');
		return true;
	}

	startPolling();
	warningReason.textContent = certificateReason(certificate);
	const expired = renderWaiting(certificate.fqdn);
	if (expired) {
		stopPolling();
	}

	return expired;
};

// The node installs these on its own once the pool is ready, so this step only reports what it is
// doing — and holds the wizard here, in both directions, until both apps are up: the password written
// by the next step goes into a file Authelia has to have created.
const render = ({ configured, containers, jobs, certificate }) => {
	const apps = appsService.getCoreApps(configured, containers, jobs);
	morphdom(
		core,
		`<dl>${stateTemplate({ apps, jobProgressTemplate })}</dl>`,
		{ childrenOnly: true }
	);

	const isRunning = _.every(apps, 'isRunning');
	backButton.disabled = !isRunning;
	if (!isRunning) {
		continueButton.disabled = true;
		return;
	}

	continueButton.disabled = !renderCertificate(appsService.getCertificate(certificate));
};

continueButton.addEventListener('click', goNext);
backButton.addEventListener('click', goBack);

appsService.subscribe([render]);
