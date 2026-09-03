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
	const virtualIp = networkService.getSystem()?.virtualIp?.address;
	const address = _.find(_.reject(networkInterface?.addrInfo, { local: virtualIp }), { family: 'inet' });
	return {
		name: networkInterface?.ifname || '',
		method: (networkInterface?.dhcp ? 'auto' : 'manual'),
		ipAddress: address?.local || '',
		netmask: _.toString(address?.prefixlen || ''),
		gateway: networkInterface?.gateway || '',
		dnsServers: _.compact(networkInterface?.dnsServers || []),
		virtualIp: (networkService.getSystem()?.virtualIp?.address || '')
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
// not handled here: the browser has to reach the node at its new address to know it arrived. The
// fields are seeded once, from the first delivery that carries the interface; after that the form
// belongs to whoever is typing in it.
/** Editable while holding the virtual IP, or while nothing else on the network has one. Otherwise the
 * address the other node carries is shown but locked — the operator's route is to adopt, not to
 * configure a second address here. The API enforces the same rule.
 *
 * Holding, not merely configured: a node that carries the address without holding it is a standby, and
 * a standby takes over from the dashboard rather than by editing this form. Setup does not normally
 * reach that state, but this and the node's own interface form have to answer identically — they are
 * the same field, and a rule that holds in one of them only is not a rule. */
const lockedPeer = () => {
	const system = networkService.getSystem();
	if (system?.virtualIp?.holding) {
		return null;
	}

	if (system?.virtualIp?.address) {
		const holder = _.find(networkService.getDiscovered(), { holdsVirtualIp: true });
		return { ...holder, virtualIp: system.virtualIp.address, standby: true };
	}

	return _.first(networkService.getDiscoveredWithVirtualIp()) || null;
};

/** Mandatory while this node is the only one on the network: it is the node that has to establish the
 * virtual IP, because a second node can only join one that already exists. Only a definite empty peer
 * list counts — discovery that has not answered, or that failed, leaves the field optional. */
const isVirtualIpRequired = () => {
	const peers = networkService.getDiscovered();
	return !lockedPeer() && _.isArray(peers) && _.isEmpty(peers);
};

/** Same two locks as the node's own interface form, worded for a node that has not finished setup —
 * the dashboard it points at is not reachable yet. */
const lockedTip = (peer) => {
	const holder = (peer.name || peer.address);
	if (peer.standby) {
		return `${holder ? `Held by <strong>${holder}</strong>` : 'Held by the other node'}. Both nodes share one virtual IP; it can be moved here from the dashboard once setup is finished.`;
	}

	return `Already in use by <strong>${holder}</strong>. Finish setup, then adopt that node from the dashboard to share its virtual IP.`;
};

const applyVirtualIp = () => {
	const input = form.querySelector('.virtual-ip');
	const peer = lockedPeer();
	if (peer) {
		input.value = peer.virtualIp;
	}

	input.disabled = Boolean(peer);
	input.tip = (peer ? lockedTip(peer) : '');
};

const render = (state) => {
	applyVirtualIp();
	if (_.find(state.jobs, { name: networkService.INTERFACE_JOB })?.progress?.state === 'failed' && isApplying()) {
		restore();
	}

	const networkInterface = networkService.getDefaultInterface(state.system);
	if (isPrefilled || _.isUndefined(networkInterface)) {
		return;
	}

	const current = currentConfiguration(networkInterface);
	form.querySelector('.virtual-ip').value = current.virtualIp;
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
	// Omitted rather than emptied when locked: an empty value is how the address is removed, so sending
	// one would clear the very virtual IP this node is locked out of changing.
	if (lockedPeer()) {
		delete data.virtualIp;
	} else {
		data.virtualIp = _.trim(data.virtualIp);
	}
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

/** Optional. Anything typed has to be usable: a v4 address, not the node's own, and inside the subnet
 * being submitted — all checkable here because both values are in this one form. */
const virtualIpRules = (value) => {
	const address = _.trim(value);
	if (_.isEmpty(address)) {
		return (isVirtualIpRequired() ? `Required while this is the only node on the network` : true);
	}

	if (!form.validator.isIP(address, 4)) {
		return `Invalid IP address`;
	}

	const ipAddress = _.trim(form.querySelector('.ip-address').value);
	if (address === ipAddress) {
		return `Can't be the same as the IP address`;
	}

	const prefixLength = Number.parseInt(form.querySelector('.netmask').value, 10);
	if (!form.validator.isIP(ipAddress, 4) || !Number.isFinite(prefixLength)) {
		return true;
	}

	const toInteger = (value) => {
		return _.reduce(_.split(value, '.'), (total, octet) => { return ((total << 8) >>> 0) + Number(octet); }, 0) >>> 0;
	};
	const mask = (prefixLength === 0 ? 0 : (0xFFFFFFFF << (32 - prefixLength)) >>> 0);
	if (((toInteger(address) & mask) >>> 0) !== ((toInteger(ipAddress) & mask) >>> 0)) {
		return `Must be in the same subnet as the IP address`;
	}

	return true;
};

const sameSubnet = (first, second, prefixLength) => {
	const toInteger = (address) => {
		return _.reduce(_.split(address, '.'), (total, octet) => { return ((total << 8) >>> 0) + Number(octet); }, 0) >>> 0;
	};
	const mask = (prefixLength === 0 ? 0 : (0xFFFFFFFF << (32 - prefixLength)) >>> 0);
	return ((toInteger(first) & mask) >>> 0) === ((toInteger(second) & mask) >>> 0);
};

/** When another node already carries the virtual IP, this node's own address has to sit in the same
 * subnet as it — the two share the address, so an address elsewhere could never answer for it. The
 * error goes on the field the operator can actually change, since the virtual IP itself is locked. */
const addressRules = (value) => {
	const required = requiredIpAddress(value);
	if (required !== true) {
		return required;
	}

	const peer = lockedPeer();
	const prefixLength = Number.parseInt(form.querySelector('.netmask').value, 10);
	if (!peer || !Number.isFinite(prefixLength)) {
		return true;
	}

	return (sameSubnet(_.trim(value), peer.virtualIp, prefixLength)
		|| `Must be in the same subnet as ${peer.virtualIp}, the virtual IP on ${peer.name || peer.address}`);
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
			custom: (value) => { return addressRules(value); }
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
	{
		selector: '.virtual-ip',
		rules: {
			custom: (value) => { return (lockedPeer() ? true : virtualIpRules(value)); }
		}
	},
	dnsServerRules('.dns-server-1'),
	dnsServerRules('.dns-server-2'),
	dnsServerRules('.dns-server-3')
];
/** The virtual IP rules read the address and netmask, and the address rules are read back by the
 * virtual IP, so a change to either leaves the other's verdict stale. Re-run it — but only when that
 * field already has a value or is already showing an error, so editing the address never raises an
 * error on a virtual IP field the operator has not touched yet. */
const revalidate = (selector) => {
	const input = form.querySelector(selector);
	if (!input || (_.isEmpty(_.trim(input.value || '')) && _.isEmpty(input.error))) {
		return;
	}

	form.validateField(selector);
};

const crossValidate = () => {
	_.each(['.ip-address', '.netmask'], (selector) => {
		form.querySelector(selector)?.addEventListener('value-changed', () => { revalidate('.virtual-ip'); });
	});
	form.querySelector('.netmask')?.addEventListener('value-changed', () => { revalidate('.ip-address'); });
	form.querySelector('.virtual-ip')?.addEventListener('value-changed', () => { revalidate('.ip-address'); });
};

crossValidate();
form.addEventListener('valid', updateInterface);
addDnsButton.addEventListener('click', addDnsRow);
_.each(form.querySelectorAll('.dns-server .remove'), (button) => { button.addEventListener('click', removeDnsRow); });
backButton.addEventListener('click', goBack);


networkService.subscribe([render]);
