import page from 'page';
import hostPartial from 'setup/partials/network/host.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

let isPrefilled = false;
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
	const hostname = data.hostname;
	const domainName = data.domainName;
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
	submitButton.reset();
	backButton.disabled = false;
};

// The job is what the form follows: while one is running the form is locked, and the step advances
// when it completes — but only if it is the step on screen, since a job outlives the page that
// started it. Only a job that has reported back concludes the step: an empty list is the gap between
// asking for one and the node queueing it, and unlocking there would hand the form back mid-flight.
// A failure leaves the user here; the job toaster carries the reason. The fields are seeded once,
// from the first delivery that carries the node's identifier; after that the form belongs to whoever
// is typing in it.
const render = ({ system, jobs }) => {
	const job = _.find(jobs, { name: networkService.IDENTIFIER_JOB });
	const isSettled = _.includes(['completed', 'failed'], job?.progress?.state);
	if (job && !isSettled) {
		backButton.disabled = true;
		submitButton.loading();
	} else if (isSettled && submitButton.disabled) {
		idle();
		if (job.progress.state === 'completed' && !step.classList.contains('d-none')) {
			goNext();
		}
	}

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
				validate: (value) => { return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(value); },
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
