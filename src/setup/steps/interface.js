import page from 'page';
import interfacePartial from 'setup/partials/network/interface.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const MAX_DNS_SERVERS = 3;
// The old connection can answer for a moment after the update is queued, so give it time to drop
// before the first probe — otherwise an unchanged address looks reachable while it is still going down.
const REACHABLE_DELAY = 5000;
const REACHABLE_INTERVAL = 2000;
const REACHABLE_TIMEOUT = 180000;

let isPrefilled = false;
const interfaceTemplate = _.template(interfacePartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', interfaceTemplate());
const step = document.querySelector('#interface');
const form = step.querySelector('u-form');
const configuration = step.querySelector('.configuration');
const applying = step.querySelector('.applying');
const dnsRows = form.querySelectorAll('.dns-server');
const addDnsButton = form.querySelector('.add');
const backButton = step.querySelector('[data-action="back"]');
const submitButton = step.querySelector('[type="submit"]');

const isVisible = (row) => {
	return !row.classList.contains('d-none');
};

const toggleAddDnsButton = () => {
	addDnsButton.classList[_.filter(dnsRows, isVisible).length < MAX_DNS_SERVERS ? 'remove' : 'add']('d-none');
};

const showDnsRows = (count) => {
	_.each(dnsRows, (row, index) => {
		row.classList[index < count ? 'remove' : 'add']('d-none');
	});
	toggleAddDnsButton();
};

const addDnsRow = (event) => {
	const row = _.find(dnsRows, (row) => { return !isVisible(row); });
	if (!row) {
		return;
	}

	row.classList.remove('d-none');
	toggleAddDnsButton();
	row.querySelector('u-input').focus();
};

const removeDnsRow = (event) => {
	const row = event.target.closest('.dns-server');
	const input = row.querySelector('u-input');
	input.value = '';
	input.error = '';
	row.classList.add('d-none');
	// Keep the visible rows contiguous so the servers stay in query order
	const values = _.map(_.filter(dnsRows, isVisible), (row) => { return row.querySelector('u-input').value; });
	_.each(dnsRows, (row, index) => {
		row.querySelector('u-input').value = values[index] || '';
	});
	showDnsRows(values.length);
};

// The wizard only configures static addressing, so the current config is compared as manual too —
// a node still on DHCP therefore always differs and gets converted, even with untouched fields.
const currentConfiguration = (networkInterface) => {
	const address = _.find(networkInterface?.addrInfo, { family: 'inet' });
	return {
		name: networkInterface?.ifname || '',
		method: (networkInterface?.dhcp ? 'auto' : 'manual'),
		ipAddress: address?.local || '',
		netmask: _.toString(address?.prefixlen || ''),
		gateway: networkInterface?.gateway || '',
		dnsServers: _.compact(networkInterface?.dnsServers || [])
	};
};

const formConfiguration = () => {
	const data = form.getData();
	return {
		name: data.name || '',
		method: 'manual',
		ipAddress: _.trim(data.ipAddress),
		netmask: _.trim(data.netmask),
		gateway: _.trim(data.gateway),
		dnsServers: _.compact(_.map(_.filter(dnsRows, isVisible), (row) => {
			return _.trim(data[row.querySelector('u-input').getAttribute('name')]);
		}))
	};
};

const goNext = () => {
	completeStep('interface');
	page(nextStepPath('interface'));
};

// The applying panel doubles as this step's state: while it is up the node is being reconfigured and
// the browser is waiting for it to answer somewhere else.
const isApplying = () => {
	return !applying.classList.contains('d-none');
};

const restore = () => {
	applying.classList.add('d-none');
	configuration.classList.remove('d-none');
	submitButton.reset();
	backButton.disabled = false;
};

// Reconfiguring the connection drops this browser's link to the node — on a new address the old
// origin never answers again — so the step waits for the target address and reloads the wizard there.
const stepUrl = (ipAddress) => {
	const port = (location.port ? `:${location.port}` : '');
	return `${location.protocol}//${ipAddress}${port}${nextStepPath('interface')}`;
};

const isReachable = async (url) => {
	try {
		await fetch(url, { mode: 'no-cors', cache: 'no-store' });
		return true;
	} catch (error) {
		return false;
	}
};

const sleep = (delay) => {
	return new Promise((resolve) => { setTimeout(resolve, delay); });
};

const waitForNode = async (url) => {
	await sleep(REACHABLE_DELAY);
	const deadline = Date.now() + REACHABLE_TIMEOUT;
	while (Date.now() < deadline) {
		await sleep(REACHABLE_INTERVAL);
		if (!isApplying()) {
			return;
		}

		if (await isReachable(url)) {
			location.replace(url);
			return;
		}
	}

	restore();
	notifier.add({ title: `The node did not come back at <a href="${url}">${url}</a>. Check the address and try again.`, type: 'error', duration: 0 });
};

// A failed job means the node stayed where it is, so there is nothing left to wait for. Success is
// not handled here: the browser has to reach the node at its new address to know it arrived.
const renderJob = (jobs) => {
	if (_.find(jobs, { name: networkService.INTERFACE_JOB })?.progress?.state === 'failed' && isApplying()) {
		restore();
	}
};

// The fields are seeded once, from the first delivery that carries the interface; after that the
// form belongs to whoever is typing in it.
const render = ({ system, jobs }) => {
	renderJob(jobs);
	const networkInterface = networkService.getDefaultInterface(system);
	if (isPrefilled || _.isUndefined(networkInterface)) {
		return;
	}

	const current = currentConfiguration(networkInterface);
	form.querySelector('.name').value = current.name;
	form.querySelector('.ip-address').value = current.ipAddress;
	form.querySelector('.netmask').value = current.netmask;
	form.querySelector('.gateway').value = current.gateway;
	_.each(dnsRows, (row, index) => {
		row.querySelector('u-input').value = current.dnsServers[index] || '';
	});
	showDnsRows(Math.max(1, Math.min(current.dnsServers.length, MAX_DNS_SERVERS)));
	isPrefilled = true;
};

const updateInterface = (event) => {
	// Nothing to apply when the interface already holds this configuration — move on without a job.
	const config = formConfiguration();
	if (_.isEqual(config, currentConfiguration(networkService.getDefaultInterface()))) {
		goNext();
		return;
	}

	backButton.disabled = true;
	submitButton.loading();
	configuration.classList.add('d-none');
	const url = stepUrl(config.ipAddress);
	applying.querySelector('.address small').innerHTML = url;
	applying.classList.remove('d-none');
	networkService.updateInterface(config);
	waitForNode(url);
};

const goBack = (event) => {
	page(previousStepPath('interface'));
};

const requiredIpAddress = (value) => {
	if (_.isEmpty(value)) {
		return `Can't be empty`;
	}

	return form.validator.isIP(value, 4) || `Invalid IP address`;
};

const dnsServerRules = (selector) => {
	return {
		selector,
		rules: {
			custom: (value, input) => {
				return (isVisible(input.closest('.dns-server')) ? requiredIpAddress(_.trim(value)) : true);
			}
		}
	};
};

form.validation = [
	{
		selector: '.ip-address',
		rules: {
			custom: (value) => { return requiredIpAddress(_.trim(value)); }
		}
	},
	{
		selector: '.netmask',
		rules: {
			isEmpty: `Can't be empty`,
			isInt: { min: 1, max: 32, message: 'Must be between 1 and 32' }
		}
	},
	{
		selector: '.gateway',
		rules: {
			custom: (value) => { return requiredIpAddress(_.trim(value)); }
		}
	},
	dnsServerRules('.dns-server-1'),
	dnsServerRules('.dns-server-2'),
	dnsServerRules('.dns-server-3')
];
form.addEventListener('valid', updateInterface);
addDnsButton.addEventListener('click', addDnsRow);
_.each(form.querySelectorAll('.dns-server .remove'), (button) => { button.addEventListener('click', removeDnsRow); });
backButton.addEventListener('click', goBack);


networkService.subscribe([render]);
