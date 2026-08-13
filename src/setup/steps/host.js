import page from 'page';
import hostPartial from 'setup/partials/network/host.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let isPrefilled = false;
let settleTimeout = null;
const SETTLE_TIMEOUT = 30000;
const hostTemplate = _.template(hostPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', hostTemplate());
const step = document.querySelector('#host');
const form = step.querySelector('u-form');
const backButton = step.querySelector('[data-action="back"]');
const submitButton = step.querySelector('[type="submit"]');
const access = step.querySelector('.access');
const accessUrl = access.querySelector('.url');
const accessFqdn = access.querySelector('.fqdn');
const accessAddress = access.querySelector('.address');

const currentIdentifier = (system) => {
	return {
		hostname: system?.osInfo?.hostname || '',
		domainName: _.replace(system?.osInfo?.fqdn || '', `${system?.osInfo?.hostname}.`, '')
	};
};

// The hostname and domain are what the node answers to once setup finishes, and nothing resolves that
// name until someone says so — so both the resulting address and the record that has to exist for it
// are spelled out while it is still being typed. Seeding the fields fires `value-changed` too, so
// this covers the prefilled values without render having to call it.
const renderAccess = () => {
	const data = form.getData();
	const hostname = _.trim(data.hostname);
	const domainName = _.trim(data.domainName);
	const fqdn = `${hostname}.${domainName}`;
	accessUrl.textContent = `https://${fqdn}`;
	accessFqdn.textContent = fqdn;
	accessAddress.textContent = (networkService.getDefaultInterfaceAddress() || `this node's address`);
	access.classList.toggle('d-none', _.isEmpty(hostname) || _.isEmpty(domainName));
};

const goNext = () => {
	completeStep('host');
	page(nextStepPath('host'));
};

const idle = () => {
	clearTimeout(settleTimeout);
	settleTimeout = null;
	submitButton.reset();
	backButton.disabled = false;
};

// The job is what the form follows: while one is running the form is locked, and the step advances
// when it finishes — but only if it is the step on screen, since a job outlives the page that
// started it. A failure leaves the user here; the job toaster carries the reason.
const renderJob = (jobs) => {
	const job = _.find(jobs, { name: networkService.IDENTIFIER_JOB });
	const isSettled = _.includes(['completed', 'failed'], job?.progress?.state);
	if (job && !isSettled) {
		clearTimeout(settleTimeout);
		backButton.disabled = true;
		submitButton.loading();
		return;
	}

	// A locked form is the record that this step has a job of its own to conclude.
	if (!submitButton.disabled) {
		return;
	}

	idle();
	if (job?.progress?.state === 'completed' && !step.classList.contains('d-none')) {
		goNext();
	}
};

// The fields are seeded once, from the first delivery that carries the node's identifier; after
// that the form belongs to whoever is typing in it.
const render = ({ system, jobs }) => {
	renderJob(jobs);
	if (isPrefilled || _.isEmpty(system?.osInfo)) {
		return;
	}

	const identifier = currentIdentifier(system);
	form.querySelector('.hostname').value = identifier.hostname;
	form.querySelector('.domain-name').value = identifier.domainName;
	isPrefilled = true;
};

const updateIdentifier = (event) => {
	// Nothing to apply when the identifier is already what the form holds — move on without a job.
	const data = form.getData();
	if (_.isEqual(data, currentIdentifier(networkService.getSystem()))) {
		goNext();
		return;
	}

	backButton.disabled = true;
	submitButton.loading();
	// The job locks the form once it appears; until it does, this covers a request that never lands.
	settleTimeout = setTimeout(() => {
		idle();
		notifier.add({ title: 'Host was not updated, the request timed out.', type: 'error', duration: 0 });
	}, SETTLE_TIMEOUT);
	networkService.updateHostIdentifier(data);
};

const goBack = (event) => {
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
backButton.addEventListener('click', goBack);

networkService.subscribe([render]);
