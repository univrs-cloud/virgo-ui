import notificationModalPartial from 'modules/settings/partials/modals/notifications.html';
import * as configurationService from 'modules/settings/services/configuration';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', notificationModalPartial);

let form = document.querySelector('#smtp');

const validateAddress = (event) => {
	let input = form.querySelector('.address');
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

const validatePort = (event) => {
	let input = form.querySelector('.port');
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
	validateAddress();
	validatePort();
};

const isFormValid = () => {
	validateForm();
	return _.validator.isEmpty(form.querySelectorAll('.is-invalid'));
};

const updateSmtp = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = configurationService.getConfiguration()?.smtp || {};
	config.encryption = form.querySelector('.encryption:checked').value;
	config.address = form.querySelector('.address').value;
	config.port = form.querySelector('.port').value;
	config.username = form.querySelector('.username').value;
	config.password = form.querySelector('.password').value;
	config.sender = form.querySelector('.sender').value;
	config.recipients = _.compact(_.split(_.trim(form.querySelector('.recipients').value), '\n'));
	
	configurationService.updateSmtp(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const restore = (event) => {
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(form.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	let configuration = configurationService.getConfiguration();
	let encryption = configuration?.smtp?.encryption ?? '';
	form.querySelector(`.encryption[value="${encryption}"]`).checked = true;
	form.querySelector('.address').value = configuration?.smtp?.address ?? '';
	form.querySelector('.port').value = configuration?.smtp?.port ?? '';
	form.querySelector('.username').value = configuration?.smtp?.username ?? '';
	form.querySelector('.password').value = configuration?.smtp?.password ?? '';
	form.querySelector('.sender').value = configuration?.smtp?.sender ?? '';
	form.querySelector('.recipients').innerHTML = configuration?.smtp?.recipients?.join('\n') || '';
};

form.querySelector('.address').addEventListener('input', validateAddress);
form.querySelector('.port').addEventListener('input', validatePort);
form.addEventListener('submit', updateSmtp);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
