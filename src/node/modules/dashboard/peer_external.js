import peerExternalModalPartial from 'node/modules/dashboard/partials/modals/peer_external.html';
import * as peerService from 'node/modules/dashboard/services/peer';

document.querySelector('body').insertAdjacentHTML('beforeend', peerExternalModalPartial);

const modal = document.querySelector('#peer-external');
const form = modal.querySelector('u-form');

const addressRules = (value) => {
	const address = _.trim(value);
	if (!form.validator.isIP(address, 4)) {
		return 'Invalid IP address';
	}

	const system = peerService.getSystem();
	if (address === system?.virtualIp?.address) {
		return `Can't be the virtual IP`;
	}

	const ownAddresses = _.map(_.filter(_.flatMap(system?.networkInterfaces, 'addrInfo'), { family: 'inet' }), 'local');
	if (_.includes(ownAddresses, address)) {
		return `Can't be this node's IP address`;
	}

	const paired = _.find([...peerService.getPeers(), ...peerService.getExternalPeers()], { address });
	return (!paired || `Already paired with ${paired.name || address}`);
};

const adopt = (event) => {
	peerService.adoptExternalPeer({ address: _.trim(form.getData().address) });
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
};

form.validation = [
	{
		selector: '.address',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: addressRules,
				message: 'Invalid IP address'
			}
		}
	}
];
form.addEventListener('valid', adopt);
modal.addEventListener('hidden.bs.dialog', restore);
