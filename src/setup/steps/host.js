import page from 'page';
import validator from 'validator';
import hostPartial from 'setup/partials/network/host.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const FLEET_ZONE = 'univrs.cloud';
const MDNS_DOMAIN = 'local';
const CHECK_DELAY_MS = 400;
const APPLY_DELAY = 8000;
let isPrefilled = false;
let availability = { key: '', status: 'idle' };
let availabilityRequest = null;
let pendingIdentifier = null;
let pendingUrl = null;
const hostTemplate = _.template(hostPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', hostTemplate());
const step = document.querySelector('#host');
const form = step.querySelector('u-form');
const backButton = step.querySelector('[data-action="back"]');
const submitButton = step.querySelector('[type="submit"]');
const access = step.querySelector('.access');
const accessUrl = access.querySelector('.url');
const accessFqdn = access.querySelector('.fqdn');
const accessFqdnWildcard = access.querySelector('.fqdn-wildcard');
const accessAddresses = access.querySelectorAll('.address');
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
	unknown: 'var(--bs-red)'
};
const AVAILABILITY_ERRORS = {
	taken: 'This name is already taken',
	unknown: `Can't reach the fleet to check this name`
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
	accessFqdnWildcard.textContent = `*.${fqdn}`;
	_.each(accessAddresses, (accessAddress) => { accessAddress.textContent = (networkService.getDefaultInterfaceAddress() || `this node's address`); });
	dnsManagedFqdn.textContent = fqdn;
	access.classList.toggle('d-none', !isValidIdentifier(hostname, domainName));
	renderAvailability();
};

const isFleetZone = (domainName) => {
	return String(domainName || '').trim().toLowerCase() === FLEET_ZONE;
};

const isFleetSubZone = (domainName) => {
	return _.endsWith(String(domainName || '').trim().toLowerCase(), `.${FLEET_ZONE}`);
};

const isValidIdentifier = (hostname, domainName) => {
	return (HOSTNAME_PATTERN.test(hostname || '') && validator.isFQDN(domainName || '', { require_tld: false }) && !isFleetSubZone(domainName));
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
		available: 'This name is available'
	}[availability.status] || AVAILABILITY_ERRORS[availability.status] || '';
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
	availabilityRequest = (async () => {
		try {
			const response = await networkService.checkDomainAvailability(data.hostname);
			if (availability.key !== key) {
				return;
			}

			availability = { key, status: (response?.status === 'succeeded' ? (response.available ? 'available' : 'taken') : 'unknown') };
		} catch {
			if (availability.key === key) {
				availability = { key, status: 'unknown' };
			}
		} finally {
			availabilityRequest = null;
			renderAvailability();
		}
	})();
}, CHECK_DELAY_MS);

const goNext = () => {
	completeStep('host');
	page(nextStepPath('host'));
};

const idle = () => {
	pendingIdentifier = null;
	pendingUrl = null;
	submitButton.reset();
	backButton.disabled = false;
};

const followName = (current, identifier) => {
	const host = _.toLower(location.hostname);
	if (host === _.toLower(`${current.hostname}.${MDNS_DOMAIN}`)) {
		return `${identifier.hostname}.${MDNS_DOMAIN}`;
	}

	if (host === _.toLower(`${current.hostname}.${current.domainName}`)) {
		return `${identifier.hostname}.${identifier.domainName}`;
	}

	return null;
};

const followUrl = (current, identifier) => {
	const name = followName(current, identifier);
	if (!name || _.toLower(name) === _.toLower(location.hostname)) {
		return null;
	}

	const port = (location.port ? `:${location.port}` : '');
	return `${location.protocol}//${name}${port}${nextStepPath('host')}`;
};

const sleep = (delay) => {
	return new Promise((resolve) => { setTimeout(resolve, delay); });
};

const followNode = async (url) => {
	await sleep(APPLY_DELAY);
	if (pendingUrl !== url) {
		return;
	}

	location.replace(url);
};

/** The identifier the node actually answers to, matched against the one it was asked for. */
const isIdentifierApplied = (system) => {
	return Boolean(pendingIdentifier) && _.isEqual(currentIdentifier(system), pendingIdentifier);
};

// The job is what the form follows: while one is running the form is locked, and the step advances
// when it finishes — but only if it is the step on screen, since a job outlives the page that started
// it. A failure leaves the user here; the job toaster carries the reason. The fields are seeded once,
// from the first delivery that carries the node's identifier; after that the form belongs to whoever
// is typing in it.
const render = (state) => {
	const job = _.find(state.jobs, { name: networkService.IDENTIFIER_JOB });
	const isSettled = _.includes(['completed', 'failed'], job?.progress?.state);
	if (job && !isSettled) {
		backButton.disabled = true;
		submitButton.loading();
		return;
	}

	if (submitButton.disabled) {
		// The node answering to the identifier it was asked for is the outcome the job was reporting, and
		// it outlives the report: renaming the host reconfigures the interface it is reached on, so the
		// job can settle while nothing is listening. Every connection is told the current system, so that
		// answer arrives whether the report did or not — which is why the step waits on it rather than on
		// the job reporting completed. Only a failure concludes the step without it.
		const isApplied = isIdentifierApplied(state.system);
		if (job?.progress?.state !== 'failed' && !isApplied) {
			return;
		}

		const url = pendingUrl;
		idle();
		if (!isApplied || step.classList.contains('d-none')) {
			return;
		}

		if (url) {
			location.replace(url);
			return;
		}

		goNext();
	}

	if (isPrefilled || _.isEmpty(state.system?.osInfo)) {
		return;
	}

	const identifier = currentIdentifier(state.system);
	form.querySelector('.hostname').value = identifier.hostname;
	form.querySelector('.domain-name').value = identifier.domainName;
	isPrefilled = true;
};

const confirmAvailability = async (data) => {
	checkAvailability.flush();
	if (availabilityRequest) {
		await availabilityRequest;
	}

	return (availability.key === `${data.hostname}.${data.domainName}`.toLowerCase() && availability.status === 'available');
};

const updateIdentifier = async (event) => {
	const data = form.getData();
	if (isFleetZone(data.domainName) && !await confirmAvailability(data)) {
		form.validateField('.hostname');
		return;
	}

	// Nothing to apply when the identifier is already what the form holds — move on without a job.
	if (_.isEqual(data, currentIdentifier(networkService.getSystem()))) {
		goNext();
		return;
	}

	pendingIdentifier = data;
	pendingUrl = followUrl(currentIdentifier(networkService.getSystem()), data);
	backButton.disabled = true;
	submitButton.loading();
	networkService.updateHostIdentifier(data);
	if (pendingUrl) {
		followNode(pendingUrl);
	}
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

					if (!isFleetZone(form.getData().domainName)) {
						return true;
					}

					return (AVAILABILITY_ERRORS[availability.status] || true);
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
			isFQDN: { require_tld: false, message: 'Must be a valid domain name' },
			custom: {
				validate: (value) => {
					return (isFleetSubZone(value) ? `Use ${FLEET_ZONE} itself, without a sub-domain` : true);
				},
				message: 'Must be a valid domain name'
			}
		}
	}
];
form.addEventListener('valid', updateIdentifier);
form.addEventListener('value-changed', renderAccess);
form.addEventListener('value-changed', checkAvailability);
backButton.addEventListener('click', goBack);

networkService.subscribe([render]);
