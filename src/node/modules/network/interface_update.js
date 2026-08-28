import interfaceModalPartial from 'node/modules/network/partials/modals/interface.html';
import * as networkService from 'node/modules/network/services/network';

const MAX_DNS_SERVERS = 3;

document.querySelector('body').insertAdjacentHTML('beforeend', interfaceModalPartial);

const modal = document.querySelector('#network-interface');
const form = modal.querySelector('u-form');
const dnsRows = form.querySelectorAll('.dns-server');
const addDnsButton = form.querySelector('.add');

const isDhcp = () => {
	return form.querySelector('.dhcp').checked;
};

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

const updateInterface = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let data = form.getData();
	const isAuto = (data.method === 'auto');
	data.ipAddress = (!isAuto ? data.ipAddress : null);
	data.netmask = (!isAuto ? data.netmask : null);
	data.gateway = (!isAuto ? data.gateway : null);
	data.virtualIp = ((isAuto || lockedPeer()) ? null : _.trim(data.virtualIp));
	data.dnsServers = (!isAuto ? _.compact(_.map(_.filter(dnsRows, isVisible), (row) => {
		return _.trim(data[row.querySelector('u-input').getAttribute('name')]);
	})) : null);
	_.each(dnsRows, (row) => { delete data[row.querySelector('u-input').getAttribute('name')]; });
	networkService.updateInterface(data);
	bootstrap.Modal.getInstance(modal)?.hide();
};

/** Editable when this node has a virtual IP of its own, or when nothing else on the network has one.
 * Otherwise the address another node carries is shown but locked: two unrelated holders is the state
 * the design exists to avoid, and the operator's route is to join that node rather than configure a
 * second address here. The API enforces the same rule, since a disabled input is not a permission
 * check. */
const lockedPeer = () => {
	const system = networkService.getSystem();
	if (system?.virtualIp?.address) {
		return null;
	}

	return _.first(networkService.getPeersWithVirtualIp()) || null;
};

/** Mandatory while this node is the only one on the network: it is the node that has to establish the
 * virtual IP, because a second node can only join one that already exists. Only a definite empty peer
 * list counts — discovery that has not answered, or that failed, leaves the field optional. */
const isVirtualIpRequired = () => {
	const peers = networkService.getPeers();
	return !lockedPeer() && _.isArray(peers) && _.isEmpty(peers);
};

const applyVirtualIp = () => {
	const system = networkService.getSystem();
	const input = form.querySelector('.virtual-ip');
	const note = form.querySelector('.virtual-ip-note');
	const peer = lockedPeer();
	input.value = (system?.virtualIp?.address || peer?.virtualIp || '');
	input.disabled = (isDhcp() || Boolean(peer));
	note.classList[peer ? 'remove' : 'add']('d-none');
	note.textContent = (peer
		? `${peer.name || peer.address} already has this virtual IP. Join that node to share the address.`
		: '');
};

// The switch only emits on user interaction, so render() has to apply this too
const applyDhcp = () => {
	const dhcp = isDhcp();
	form.querySelector('.ip-address').disabled = dhcp;
	form.querySelector('.netmask').disabled = dhcp;
	applyVirtualIp();
	_.each(form.querySelectorAll('.manual'), (element) => { element.classList[dhcp ? 'add' : 'remove']('d-none'); });
};

const toggleDhcp = (event) => {
	applyDhcp();
};

const render = (event) => {
	const system = networkService.getSystem();
	const networkInterface = _.find(system?.networkInterfaces, { default: true });
	modal.querySelector('.alert .interface-name').textContent = networkInterface?.ifname;
	form.querySelector('.name').value = networkInterface?.ifname || '';
	form.querySelector('.dhcp').checked = networkInterface?.dhcp;
	form.querySelector('.ip-address').value = _.find(networkInterface?.addrInfo, { family: 'inet' })?.local || '';
	form.querySelector('.netmask').value = _.find(networkInterface?.addrInfo, { family: 'inet' })?.prefixlen || '';
	form.querySelector('.gateway').value = networkInterface?.gateway || '';
	networkService.discoverPeers();
	const dnsServers = networkInterface?.dnsServers || [];
	_.each(dnsRows, (row, index) => {
		row.querySelector('u-input').value = dnsServers[index] || '';
	});
	showDnsRows(Math.max(1, Math.min(dnsServers.length, MAX_DNS_SERVERS)));
	applyDhcp();
};

const restore = (event) => {
	form.reset();
};

// DHCP hides every manual field, so they must stop validating or the form can never submit
const manualRules = (selector, validate) => {
	return {
		selector,
		rules: {
			custom: (value, input) => {
				return (isDhcp() ? true : validate(_.trim(value), input));
			}
		}
	};
};

const requiredIpAddress = (value) => {
	if (_.isEmpty(value)) {
		return `Can't be empty`;
	}

	return form.validator.isIP(value, 4) || `Invalid IP address`;
};

/** Both values are in this form, so the two rules that matter can be checked against what is on
 * screen rather than only server-side: the virtual IP has to sit in the subnet being submitted, and
 * must not be the node's own address. */
const virtualIpRules = (value) => {
	if (!form.validator.isIP(value, 4)) {
		return `Invalid IP address`;
	}

	const ipAddress = _.trim(form.querySelector('.ip-address').value);
	if (value === ipAddress) {
		return `Can't be the same as the IP address`;
	}

	const prefixLength = Number.parseInt(form.querySelector('.netmask').value, 10);
	if (!form.validator.isIP(ipAddress, 4) || !Number.isFinite(prefixLength)) {
		return true;
	}

	const toInteger = (address) => {
		return _.reduce(_.split(address, '.'), (total, octet) => { return ((total << 8) >>> 0) + Number(octet); }, 0) >>> 0;
	};
	const mask = (prefixLength === 0 ? 0 : (0xFFFFFFFF << (32 - prefixLength)) >>> 0);
	if (((toInteger(value) & mask) >>> 0) !== ((toInteger(ipAddress) & mask) >>> 0)) {
		return `Must be in the same subnet as the IP address`;
	}

	return true;
};

const dnsServerRules = (selector) => {
	return manualRules(selector, (value, input) => {
		return (isVisible(input.closest('.dns-server')) ? requiredIpAddress(value) : true);
	});
};

form.validation = [
	manualRules('.ip-address', requiredIpAddress),
	manualRules('.netmask', (value) => { return !_.isEmpty(value) || `Can't be empty`; }),
	manualRules('.gateway', requiredIpAddress),
	manualRules('.virtual-ip', (value) => {
		if (lockedPeer()) {
			return true;
		}

		if (_.isEmpty(_.trim(value))) {
			return (isVirtualIpRequired() ? `Required while this is the only node on the network` : true);
		}

		return virtualIpRules(_.trim(value));
	}),
	dnsServerRules('.dns-server-1'),
	dnsServerRules('.dns-server-2'),
	dnsServerRules('.dns-server-3')
];
form.addEventListener('valid', updateInterface);
form.querySelector('.dhcp').addEventListener('switch-changed', toggleDhcp);
addDnsButton.addEventListener('click', addDnsRow);
_.each(form.querySelectorAll('.dns-server .remove'), (button) => { button.addEventListener('click', removeDnsRow); });
networkService.subscribe([() => {
	if (modal.classList.contains('show')) {
		applyVirtualIp();
	}
}]);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
