import interfaceModalPartial from 'modules/network/partials/modals/interface.html';
import * as networkService from 'modules/network/services/network';
import validator from 'validator';
import { Netmask } from 'netmask';

document.querySelector('body').insertAdjacentHTML('beforeend', interfaceModalPartial);

let form = document.querySelector('#network-interface');

const validateIpAddress = () => {
	let input = form.querySelector('.ip-address');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateNetmask = () => {
	let input = form.querySelector('.netmask');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateGateway = () => {
	let input = form.querySelector('.gateway');
	let invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	let value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateForm = () => {
	validateIpAddress();
	validateNetmask();
	validateGateway();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const updateInterface = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	const isDhcp = form.querySelector('.dhcp').checked;
	let config = {
		name: form.querySelector('input.name').value,
		method: (!isDhcp ? 'manual' : 'auto'),
		ipAddress: (!isDhcp ? form.querySelector('.ip-address').value : null),
		netmask: (!isDhcp ? form.querySelector('.netmask').value : null),
		gateway: (!isDhcp ? form.querySelector('.gateway').value : null)
	};
	networkService.updateInterface(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const toggleDhcp = (event) => {
	form.querySelector('.ip-address').disabled = event.target.checked;
	form.querySelector('.netmask').disabled = event.target.checked;
	_.each(form.querySelectorAll('.input-group'), (element) => { element.classList[event.target.checked ? 'add' : 'remove']('d-none'); });
};

const getBlock = (networkInterface) => {
	let block = null;
	try {
		block = new Netmask(`${networkInterface?.ip4}/${networkInterface?.ip4subnet}`);
	} catch (error) {}
	return block;
};

const render = (event) => {
	const system = networkService.getSystem();
	const block = getBlock(system.networkInterface);
	form.querySelector('.alert .name').innerHTML = system?.networkInterface?.ifaceName;
	form.querySelector('input.name').value = system?.networkInterface?.ifaceName;
	form.querySelector('.dhcp').checked = system?.networkInterface?.dhcp;
	form.querySelector('.ip-address').value = system?.networkInterface?.ip4;
	form.querySelector('.netmask').value = block?.bitmask ?? 'error';
	form.querySelector('.gateway').value = system?.defaultGateway;
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
	form.querySelector('.dhcp').dispatchEvent(new Event('change'));
};

form.querySelector('.dhcp').addEventListener('change', toggleDhcp);
form.querySelector('.ip-address').addEventListener('input', validateIpAddress);
form.querySelector('.netmask').addEventListener('input', validateNetmask);
form.querySelector('.gateway').addEventListener('input', validateGateway);
form.addEventListener('submit', updateInterface);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
