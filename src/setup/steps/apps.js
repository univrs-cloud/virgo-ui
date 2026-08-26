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
let waitStartedAt = null;
let gaveUp = false;

const goNext = (event) => {
	completeStep('apps');
	page(nextStepPath('apps'));
};

const goBack = (event) => {
	page(previousStepPath('apps'));
};

const certificateReason = (certificate) => {
	if (!certificate?.resolves) {
		return `${certificate?.fqdn} does not resolve yet. DNS may still be propagating, or the record was not created.`;
	}

	return `${certificate.fqdn} resolves, but no certificate has been issued yet. Check port forwarding and the node's logs.`;
};

const renderWaiting = (fqdn) => {
	waitStartedAt = waitStartedAt || Date.now();
	const expired = gaveUp || (Date.now() - waitStartedAt) >= CERTIFICATE_GRACE_MS;
	checkingFqdn.textContent = fqdn || 'this node';
	checkingRow.classList.toggle('d-none', expired);
	checkingRow.classList.toggle('d-flex', !expired);
	warningRow.classList.toggle('d-none', !expired);
	return expired;
};

const renderCertificate = (certificate) => {
	if (!_.isNil(certificate) && (!certificate.required || certificate.hasCertificate)) {
		checkingRow.classList.add('d-none');
		warningRow.classList.add('d-none');
		return true;
	}

	warningReason.textContent = (_.isNil(certificate)
		? 'The node has not reported its certificate state yet.'
		: certificateReason(certificate));
	gaveUp = renderWaiting(certificate?.fqdn);
	return gaveUp;
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
	if (!isRunning) {
		backButton.disabled = true;
		continueButton.disabled = true;
		return;
	}

	const isReady = renderCertificate(appsService.getCertificate(certificate));
	backButton.disabled = !isReady;
	continueButton.disabled = !isReady;
};

continueButton.addEventListener('click', goNext);
backButton.addEventListener('click', goBack);

appsService.subscribe([render]);
