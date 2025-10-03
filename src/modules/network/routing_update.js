import routingModalPartial from 'modules/network/partials/modals/routing.html';
import * as networkService from 'modules/network/services/network';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', routingModalPartial);

let form = document.querySelector('#network-routing');

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
	validateGateway();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const updateDefaultGateway = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		name: form.querySelector('.name').value,
		gateway: form.querySelector('.gateway').value
	};
	networkService.updateDefaultGateway(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const render = (event) => {
	const system = networkService.getSystem();
	form.querySelector('.name').value = system?.networkInterface?.ifaceName;
	form.querySelector('.gateway').value = system?.defaultGateway;
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

form.querySelector('.gateway').addEventListener('input', validateGateway);
form.addEventListener('submit', updateDefaultGateway);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
