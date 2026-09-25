import page from 'page';
import validator from 'validator';
import hostPartial from 'setup/partials/network/host.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i;
const RESERVED_NODE_NAMES = ['analytics', 'auth', 'autoconfig', 'autodiscover', 'dockhand', 'euro-office', 'gitea', 'mail', 'nextcloud', 'pihole', 'rspamd', 'talk', 'terminal', 'torrent', 'traefik', 'vpn'];
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
const accessClusterWildcard = access.querySelector('.cluster-wildcard');
const accessNodeName = access.querySelector('.node-name');
const accessNodeWildcard = access.querySelector('.node-wildcard');
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

const splitDomainName = (domainName) => {
	const labels = _.split(domainName || '', '.');
	if (labels.length < 3) {
		return { cluster: '', domainName: domainName || '' };
	}

	return { cluster: _.head(labels), domainName: _.join(_.tail(labels), '.') };
};

const lockedCluster = () => {
	const clustered = _.filter(networkService.getDiscovered(), 'cluster');
	return (_.find(clustered, 'holdsVirtualIp') || _.first(clustered) || null);
};

const getFormData = () => {
	const peer = lockedCluster();
	return { ...form.getData(), ...(peer ? splitDomainName(peer.cluster) : {}) };
};

const applyClusterLock = () => {
	const peer = lockedCluster();
	const clusterInput = form.querySelector('.cluster');
	const domainInput = form.querySelector('.domain-name');
	if (peer) {
		const { cluster, domainName } = splitDomainName(peer.cluster);
		if (clusterInput.value !== cluster) {
			clusterInput.value = cluster;
		}

		if (domainInput.value !== domainName) {
			domainInput.value = domainName;
		}
	}

	clusterInput.disabled = Boolean(peer);
	domainInput.disabled = Boolean(peer);
	clusterInput.tip = (peer ? `Shared with <strong>${peer.name || peer.address}</strong>. A node set up on this network joins its cluster.` : '');
};

const toIdentifier = (data) => {
	return { hostname: data.hostname, domainName: `${data.cluster}.${data.domainName}` };
};

// The hostname and domain are what the node answers to once setup finishes, and nothing resolves that
// name until someone says so — so both the resulting address and the record that has to exist for it
// are spelled out while it is still being typed. Seeding the fields fires `value-changed` too, so
// this covers the prefilled values without render having to call it.
const renderAccess = () => {
	const data = getFormData();
	const clusterDomain = `${data.cluster}.${data.domainName}`;
	const fqdn = `${data.hostname}.${clusterDomain}`;
	accessUrl.textContent = `https://${fqdn}`;
	accessClusterWildcard.textContent = `*.${clusterDomain}`;
	accessNodeName.textContent = fqdn;
	accessNodeWildcard.textContent = `*.${fqdn}`;
	_.each(accessAddresses, (accessAddress) => { accessAddress.textContent = (networkService.getPortForwardAddress(networkService.getSystem()) || `this node's address`); });
	dnsManagedFqdn.textContent = fqdn;
	access.classList.toggle('d-none', !isValidIdentifier(data));
	renderAvailability();
};

const isFleetZone = (domainName) => {
	return String(domainName || '').trim().toLowerCase() === FLEET_ZONE;
};

const isFleetSubZone = (domainName) => {
	return _.endsWith(String(domainName || '').trim().toLowerCase(), `.${FLEET_ZONE}`);
};

const isValidIdentifier = (data) => {
	return (HOSTNAME_PATTERN.test(data.hostname || '') && !_.includes(RESERVED_NODE_NAMES, _.toLower(data.hostname)) && HOSTNAME_PATTERN.test(data.cluster || '') && validator.isFQDN(data.domainName || '') && !isFleetSubZone(data.domainName));
};

const renderAvailability = () => {
	const managed = isFleetZone(getFormData().domainName);
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
	const data = getFormData();
	const key = `${data.cluster}.${data.domainName}`.toLowerCase();
	if (!isFleetZone(data.domainName) || !HOSTNAME_PATTERN.test(data.cluster || '')) {
		availability = { key: '', status: 'idle' };
		renderAvailability();
		return;
	}

	availability = { key, status: 'checking' };
	renderAvailability();
	availabilityRequest = (async () => {
		try {
			const response = await networkService.checkDomainAvailability(data.cluster);
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

	if (!isPrefilled && !_.isEmpty(state.system?.osInfo)) {
		const identifier = currentIdentifier(state.system);
		const { cluster, domainName } = splitDomainName(identifier.domainName);
		form.querySelector('.hostname').value = identifier.hostname;
		form.querySelector('.cluster').value = cluster;
		form.querySelector('.domain-name').value = domainName;
		isPrefilled = true;
	}

	applyClusterLock();
};

const confirmAvailability = async (data) => {
	checkAvailability.flush();
	if (availabilityRequest) {
		await availabilityRequest;
	}

	return (availability.key === `${data.cluster}.${data.domainName}`.toLowerCase() && availability.status === 'available');
};

const updateIdentifier = async (event) => {
	const data = getFormData();
	if (isFleetZone(data.domainName) && !await confirmAvailability(data)) {
		form.validateField('.cluster');
		return;
	}

	const identifier = toIdentifier(data);
	// Nothing to apply when the identifier is already what the form holds — move on without a job.
	if (_.isEqual(identifier, currentIdentifier(networkService.getSystem()))) {
		goNext();
		return;
	}

	pendingIdentifier = identifier;
	pendingUrl = followUrl(currentIdentifier(networkService.getSystem()), identifier);
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

					return (!_.includes(RESERVED_NODE_NAMES, _.toLower(value)) || 'Used by an app, choose another hostname');
				},
				message: 'Letters, digits and hyphens only'
			}
		}
	},
	{
		selector: '.cluster',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					if (!HOSTNAME_PATTERN.test(value)) {
						return 'Letters, digits and hyphens only';
					}

					if (!isFleetZone(getFormData().domainName)) {
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
			isFQDN: { message: 'Must be a domain with a TLD, like example.com' },
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
