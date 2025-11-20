import identifierModalPartial from 'modules/network/partials/modals/identifier.html';
import * as networkService from 'modules/network/services/network';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', identifierModalPartial);

const form = document.querySelector('#network-identifier');

const validateHostname = () => {
	const input = form.querySelector('.hostname');
	const invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	const value = input.value;
	if (validator.isEmpty(value)) {
		input.classList.remove('is-valid');
		input.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	input.classList.remove('is-invalid');
	input.classList.add('is-valid');
};

const validateDomainName = () => {
	const input = form.querySelector('.domain-name');
	const invalidFeedback = input.closest('.form-floating').querySelector('.invalid-feedback');
	const value = input.value;
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
	validateHostname();
	validateDomainName();
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const updateIdentifier = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		hostname: form.querySelector('.hostname').value,
		domainName: form.querySelector('.domain-name').value
	};
	networkService.updateHostIdentifier(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const render = (event) => {
	const system = networkService.getSystem();
	form.querySelector('.hostname').value = system?.osInfo?.hostname;
	form.querySelector('.domain-name').value = _.replace(system?.osInfo?.fqdn, `${system?.osInfo?.hostname}.`, '');
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (field) => {
		field.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		field.querySelector('.invalid-feedback').innerHTML = '';
	});
};

form.querySelector('.hostname').addEventListener('input', validateHostname);
form.querySelector('.domain-name').addEventListener('input', validateDomainName);
form.addEventListener('submit', updateIdentifier);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
