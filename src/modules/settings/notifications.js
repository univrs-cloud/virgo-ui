import notificationModalPartial from 'modules/settings/partials/modals/notifications.html';
import * as configurationService from 'modules/settings/services/configuration';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', notificationModalPartial);

let notificationForm = document.querySelector('#smtp');

const validateAddress = (event) => {
	let input = notificationForm.querySelector('.address');
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
	let input = notificationForm.querySelector('.port');
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
	return _.isEmpty(notificationForm.querySelectorAll('.is-invalid'));
};

const setSmtp = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = configurationService.getConfiguration().smtp;
	config.encryption = form.querySelector('.encryption:checked').value;
	config.address = form.querySelector('.address').value;
	config.port = form.querySelector('.port').value;
	config.username = form.querySelector('.username').value;
	config.password = form.querySelector('.password').value;
	config.sender = form.querySelector('.sender').value;
	config.recipients = _.compact(_.split(_.trim(form.querySelector('.recipients').value), '\n'));
	
	configurationService.setSmtp(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const restore = (event) => {
	notificationForm.reset();
	_.each(notificationForm.querySelectorAll('button'), (button) => { button.disabled = false });
	_.each(notificationForm.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input')?.classList?.remove('is-invalid', 'is-valid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	let configuration = configurationService.getConfiguration();
	let encryption = configuration?.smtp?.encryption ?? '';
	notificationForm.querySelector(`.encryption[value="${encryption}"]`).checked = true;
	notificationForm.querySelector('.address').value = configuration?.smtp?.address ?? '';
	notificationForm.querySelector('.port').value = configuration?.smtp?.port ?? '';
	notificationForm.querySelector('.username').value = configuration?.smtp?.username ?? '';
	notificationForm.querySelector('.password').value = configuration?.smtp?.password ?? '';
	notificationForm.querySelector('.sender').value = configuration?.smtp?.sender ?? '';
	notificationForm.querySelector('.recipients').innerHTML = configuration?.smtp?.recipients?.join('\n') || '';
};

notificationForm.querySelector('.address').addEventListener('input', validateAddress);
notificationForm.querySelector('.port').addEventListener('input', validatePort);
notificationForm.addEventListener('submit', setSmtp);
notificationForm.addEventListener('show.bs.modal', render);
notificationForm.addEventListener('hidden.bs.modal', restore);
