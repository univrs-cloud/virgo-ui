import page from 'page';
import interfacePartial from 'setup/partials/network/interface.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const MAX_DNS_SERVERS = 3;
// Long enough for the connection to be torn down and brought back up on the new address, since the
// browser cannot ask: the node answers on its own certificate, and one issued for an address this
// browser has never visited fails every probe until someone accepts it.
const APPLY_DELAY = 8000;

let isPrefilled = false;
const interfaceTemplate = _.template(interfacePartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', interfaceTemplate());
const step = document.querySelector('#interface');
const form = step.querySelector('u-form');
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

// Shaped like the form, so what the node holds can be compared against what was typed. The wizard only
// configures static addressing, so a node still on DHCP always differs and gets converted, even with
// untouched fields.
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

const goNext = () => {
	completeStep('interface');
	page(nextStepPath('interface'));
};

// The locked form is this step's state: while it is locked the node is being reconfigured and the
// browser is on its way to the address it will answer on.
const isApplying = () => {
	return submitButton.disabled;
};

const restore = () => {
	submitButton.reset();
	backButton.disabled = false;
};

// Reconfiguring the connection drops this browser's link to the node — on a new address the old
// origin never answers again — so the step waits for the target address and reloads the wizard there.
const stepUrl = (ipAddress) => {
	const port = (location.port ? `:${location.port}` : '');
	return `${location.protocol}//${ipAddress}${port}${nextStepPath('interface')}`;
};

const sleep = (delay) => {
	return new Promise((resolve) => { setTimeout(resolve, delay); });
};

/** Nothing can be waited for here: the old address stops answering the moment the connection comes
 * back up, and the new one is a different origin whose certificate this browser has never been shown
 * — every probe of it fails before it reaches the node. So the wizard simply follows the node over,
 * and the browser asks about the certificate the way it did for the address being left behind. */
const followNode = async (url) => {
	await sleep(APPLY_DELAY);
	if (!isApplying()) {
		return;
	}

	location.replace(url);
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
	const data = form.getData();
	// The form carries one field per DNS server; the node takes them as a list, in the order they were
	// asked for. No branch on the method here the way the node's own form has one: setup only writes
	// static addressing, which is what the hidden field says.
	data.dnsServers = _.compact(_.map(_.filter(dnsRows, isVisible), (row) => {
		return data[row.querySelector('u-input').getAttribute('name')];
	}));
	_.each(dnsRows, (row) => { delete data[row.querySelector('u-input').getAttribute('name')]; });
	// Nothing to apply when the interface already holds this configuration — move on without a job.
	if (_.isEqual(data, currentConfiguration(networkService.getDefaultInterface()))) {
		goNext();
		return;
	}

	backButton.disabled = true;
	submitButton.loading();
	networkService.updateInterface(data);
	followNode(stepUrl(data.ipAddress));
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
				return (isVisible(input.closest('.dns-server')) ? requiredIpAddress(value) : true);
			}
		}
	};
};

form.validation = [
	{
		selector: '.ip-address',
		rules: {
			custom: (value) => { return requiredIpAddress(value); }
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
			custom: (value) => { return requiredIpAddress(value); }
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
