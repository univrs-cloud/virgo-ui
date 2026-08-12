import page from 'page';
import portsPartial from 'setup/partials/network/ports.html';
import * as networkService from 'setup/services/network';
import { completeStep, nextStepPath, previousStepPath } from 'setup/wizard';

const portsTemplate = _.template(portsPartial);
document.querySelector('main .wizard').insertAdjacentHTML('beforeend', portsTemplate());
const step = document.querySelector('#ports');
const address = step.querySelector('.address');

// The ports themselves are fixed, but the address they go to is whatever the interface step left the
// node on — and it is the one thing the user has to copy into the router.
const render = ({ system }) => {
	address.textContent = (networkService.getDefaultInterfaceAddress(system) || `this node's address`);
};

const goNext = (event) => {
	completeStep('ports');
	page(nextStepPath('ports'));
};

const goBack = (event) => {
	page(previousStepPath('ports'));
};

step.querySelector('[data-action="continue"]').addEventListener('click', goNext);
step.querySelector('[data-action="back"]').addEventListener('click', goBack);

networkService.subscribe([render]);
