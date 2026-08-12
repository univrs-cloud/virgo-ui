import page from 'page';
import hostPartial from 'setup/partials/network/host.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let isPrefilled = false;
let isSubmitting = false;
let settleTimeout = null;
const SETTLE_TIMEOUT = 30000;
const hostTemplate = _.template(hostPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', hostTemplate());
const step = document.querySelector('#host');
const form = step.querySelector('u-form');
const back = step.querySelector('[data-action="back"]');
const submit = step.querySelector('[type="submit"]');
const access = step.querySelector('.access');
const accessUrl = access.querySelector('.url');

const currentIdentifier = (system) => {
	return {
		hostname: system?.osInfo?.hostname || '',
		domainName: _.replace(system?.osInfo?.fqdn || '', `${system?.osInfo?.hostname}.`, '')
	};
};

// The hostname and domain are what the node answers to once setup finishes, so spell the resulting
// address out while it is still being typed.
const renderAccess = () => {
	const data = form.getData();
	const hostname = _.trim(data.hostname);
	const domainName = _.trim(data.domainName);
	accessUrl.textContent = `https://${hostname}.${domainName}`;
	access.classList.toggle('d-none', _.isEmpty(hostname) || _.isEmpty(domainName));
	access.classList.toggle('d-flex', !_.isEmpty(hostname) && !_.isEmpty(domainName));
};

const prefill = (system) => {
	if (isPrefilled || _.isEmpty(system?.osInfo)) {
		return;
	}

	const identifier = currentIdentifier(system);
	form.querySelector('.hostname').value = identifier.hostname;
	form.querySelector('.domain-name').value = identifier.domainName;
	isPrefilled = true;
	renderAccess();
};

const goNext = () => {
	completeStep('host');
	page(nextStepPath('host'));
};

const finish = () => {
	isSubmitting = false;
	clearTimeout(settleTimeout);
	settleTimeout = null;
	submit.reset();
	back.disabled = false;
};

const settle = (job) => {
	if (!isSubmitting || job.name !== networkService.IDENTIFIER_JOB || !_.includes(['completed', 'failed'], job.progress?.state)) {
		return;
	}

	finish();
	if (job.progress.state === 'failed') {
		alert(job.failedReason || 'Host was not updated.');
		return;
	}

	goNext();
};

const render = (state) => {
	prefill(state.system);
	_.each(state.jobs, settle);
};

const updateIdentifier = (event) => {
	if (isSubmitting) {
		return;
	}

	// Nothing to apply when the identifier is already what the form holds — move on without a job.
	const data = form.getData();
	if (_.isEqual(data, currentIdentifier(networkService.getSystem()))) {
		goNext();
		return;
	}

	isSubmitting = true;
	back.disabled = true;
	submit.loading();
	// The update is applied by a job on the API; without a terminal job the button would spin forever.
	settleTimeout = setTimeout(() => {
		finish();
		alert('Host was not updated, the request timed out.');
	}, SETTLE_TIMEOUT);
	networkService.updateHostIdentifier(data);
};

const goBack = (event) => {
	if (isSubmitting) {
		return;
	}

	page(previousStepPath('host'));
};

form.validation = [
	{
		selector: '.hostname',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => { return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(_.trim(value)); },
				message: 'Letters, digits and hyphens only'
			}
		}
	},
	{
		selector: '.domain-name',
		rules: {
			isEmpty: `Can't be empty`,
			// Single-label domains ("lan", "local") are common on home networks, so no TLD is required.
			isFQDN: { require_tld: false, message: 'Must be a valid domain name' }
		}
	}
];
form.addEventListener('valid', updateIdentifier);
form.addEventListener('value-changed', renderAccess);
back.addEventListener('click', goBack);

step.onRoute = () => { prefill(networkService.getSystem()); };

networkService.subscribe([render]);
