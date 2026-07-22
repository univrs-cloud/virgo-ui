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
	let config = form.getData();
	const isAuto = (config.method === 'auto');
	config.ipAddress = (!isAuto ? config.ipAddress : null);
	config.netmask = (!isAuto ? config.netmask : null);
	config.gateway = (!isAuto ? config.gateway : null);
	config.dnsServers = (!isAuto ? _.compact(_.map(_.filter(dnsRows, isVisible), (row) => {
		return _.trim(config[row.querySelector('u-input').getAttribute('name')]);
	})) : null);
	_.each(dnsRows, (row) => { delete config[row.querySelector('u-input').getAttribute('name')]; });
	networkService.updateInterface(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

// The switch only emits on user interaction, so render() has to apply this too
const applyDhcp = () => {
	const dhcp = isDhcp();
	form.querySelector('.ip-address').disabled = dhcp;
	form.querySelector('.netmask').disabled = dhcp;
	_.each(form.querySelectorAll('.manual'), (element) => { element.classList[dhcp ? 'add' : 'remove']('d-none'); });
};

const toggleDhcp = (event) => {
	applyDhcp();
};

const render = (event) => {
	const system = networkService.getSystem();
	const networkInterface = _.find(system?.networkInterfaces, { default: true });
	modal.querySelector('.alert .interface-name').innerHTML = networkInterface?.ifname;
	form.querySelector('.name').value = networkInterface?.ifname || '';
	form.querySelector('.dhcp').checked = networkInterface?.dhcp;
	form.querySelector('.ip-address').value = _.find(networkInterface?.addrInfo, { family: 'inet' })?.local || '';
	form.querySelector('.netmask').value = _.find(networkInterface?.addrInfo, { family: 'inet' })?.prefixlen || '';
	form.querySelector('.gateway').value = networkInterface?.gateway || '';
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

const dnsServerRules = (selector) => {
	return manualRules(selector, (value, input) => {
		return (isVisible(input.closest('.dns-server')) ? requiredIpAddress(value) : true);
	});
};

form.validation = [
	manualRules('.ip-address', requiredIpAddress),
	manualRules('.netmask', (value) => { return !_.isEmpty(value) || `Can't be empty`; }),
	manualRules('.gateway', requiredIpAddress),
	dnsServerRules('.dns-server-1'),
	dnsServerRules('.dns-server-2'),
	dnsServerRules('.dns-server-3')
];
form.addEventListener('valid', updateInterface);
form.querySelector('.dhcp').addEventListener('switch-changed', toggleDhcp);
addDnsButton.addEventListener('click', addDnsRow);
_.each(form.querySelectorAll('.dns-server .remove'), (button) => { button.addEventListener('click', removeDnsRow); });
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
