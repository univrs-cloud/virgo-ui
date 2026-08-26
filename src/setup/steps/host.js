import page from 'page';
import hostPartial from 'setup/partials/network/host.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const FLEET_ZONE = 'univrs.cloud';
const CHECK_DELAY_MS = 400;
let isPrefilled = false;
let availability = { key: '', status: 'idle' };
let availabilityRequest = null;
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
const dnsRecord = access.querySelector('.dns-record');
const dnsManaged = access.querySelector('.dns-managed');
const dnsManagedFqdn = access.querySelector('.fqdn-managed');
const availabilityRow = access.querySelector('.availability');
const availabilityMessage = access.querySelector('.availability-message');
const availabilityIcon = access.querySelector('.availability-icon');
const AVAILABILITY_ICONS = {
	checking: 'icon-solid icon-spinner-third icon-fw icon-spin me-2',
	available: 'icon-duotone icon-solid icon-circle-check icon-fw me-2',
	taken: 'icon-duotone icon-solid icon-circle-xmark icon-fw me-2',
	unknown: 'icon-duotone icon-solid icon-triangle-exclamation icon-fw me-2'
};
const AVAILABILITY_COLOURS = {
	available: 'var(--bs-green)',
	taken: 'var(--bs-red)',
	unknown: 'var(--bs-yellow)'
};

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
	dnsManagedFqdn.textContent = fqdn;
	access.classList.toggle('d-none', _.isEmpty(hostname) || _.isEmpty(domainName));
	renderAvailability();
};

const isFleetZone = (domainName) => {
	return String(domainName || '').trim().toLowerCase() === FLEET_ZONE;
};

const renderAvailability = () => {
	const managed = isFleetZone(form.getData().domainName);
	dnsRecord.classList.toggle('d-none', managed);
	dnsRecord.classList.toggle('d-flex', !managed);
	dnsManaged.classList.toggle('d-none', !managed);
	dnsManaged.classList.toggle('d-flex', managed);
	availabilityRow.classList.toggle('d-none', !managed || availability.status === 'idle');
	availabilityRow.classList.toggle('d-flex', managed && availability.status !== 'idle');
	availabilityMessage.textContent = {
		checking: 'Checking availability...',
		available: 'This name is available',
		taken: 'This name is already taken',
		unknown: 'Could not reach the fleet to check this name'
	}[availability.status] || '';
	availabilityIcon.className = `availability-icon ${AVAILABILITY_ICONS[availability.status] || AVAILABILITY_ICONS.checking}`;
	availabilityIcon.style.setProperty('--icon-secondary-color', AVAILABILITY_COLOURS[availability.status] || '');
};

const checkAvailability = _.debounce(() => {
	const data = form.getData();
	const key = `${data.hostname}.${data.domainName}`.toLowerCase();
	if (!isFleetZone(data.domainName) || !HOSTNAME_PATTERN.test(data.hostname || '')) {
		availability = { key: '', status: 'idle' };
		renderAvailability();
		return;
	}

	availability = { key, status: 'checking' };
	renderAvailability();
	availabilityRequest = networkService.checkDomainAvailability(data.hostname)
		.then((response) => {
			if (availability.key !== key) {
				return;
			}

			availability = { key, status: (response?.status === 'succeeded' ? (response.available ? 'available' : 'taken') : 'unknown') };
		})
		.catch(() => {
			if (availability.key === key) {
				availability = { key, status: 'unknown' };
			}
		})
		.finally(() => {
			availabilityRequest = null;
			renderAvailability();
		});
}, CHECK_DELAY_MS);

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

const updateIdentifier = async (event) => {
	if (availabilityRequest) {
		await availabilityRequest;
	}

	if (availability.status === 'taken') {
		return;
	}

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
				validate: (value) => {
					if (!HOSTNAME_PATTERN.test(value)) {
						return 'Letters, digits and hyphens only';
					}

					return (availability.status === 'taken' ? 'This name is already taken' : true);
				},
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
form.addEventListener('value-changed', checkAvailability);
backButton.addEventListener('click', goBack);

networkService.subscribe([render]);
