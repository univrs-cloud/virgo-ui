import page from 'page';
import finishPartial from 'setup/partials/finish.html';
import * as setupService from 'setup/services/setup';
import * as networkService from 'setup/services/network';
import { previousStepPath } from 'setup/wizard';

let isFinishing = false;
const finishTemplate = _.template(finishPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', finishTemplate());
const step = document.querySelector('#finish');
const url = step.querySelector('.url');
const unnamed = step.querySelector('.unnamed');
const backButton = step.querySelector('[data-action="back"]');
const finishButton = step.querySelector('[data-action="finish"]');

// Setup is reached by address, but a finished node authenticates through Authelia, which only issues
// a session for the node's own name — so the browser has to be sent there, and there is nowhere else
// to fall back to. Without a name, finishing would lock the user out of the node entirely.
const nodeUrl = (system) => {
	const fqdn = networkService.getFqdn(system);
	return (_.isEmpty(fqdn) ? '' : `https://${fqdn}`);
};

// Leaving setup mode changes which app the shell builds, and the shell only decides that once per
// load — so the node reporting a finished setup is the cue to load it again at its own address.
const render = ({ setupCompleted, system }) => {
	const address = nodeUrl(system);
	url.textContent = (_.isEmpty(address) ? 'this node' : address);
	unnamed.classList.toggle('d-none', !_.isEmpty(address));
	if (!isFinishing) {
		finishButton.disabled = _.isEmpty(address);
	}

	if (!isFinishing || setupCompleted !== true) {
		return;
	}

	location.replace(address);
};

const completeSetup = (event) => {
	if (isFinishing) {
		return;
	}

	isFinishing = true;
	backButton.disabled = true;
	finishButton.loading();
	setupService.completeSetup();
};

const goBack = (event) => {
	if (isFinishing) {
		return;
	}

	page(previousStepPath('finish'));
};

finishButton.addEventListener('click', completeSetup);
backButton.addEventListener('click', goBack);

setupService.subscribe([render]);
