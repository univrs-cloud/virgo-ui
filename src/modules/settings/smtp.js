import smtpModalPartial from 'modules/settings/partials/modals/smtp.html';
import * as configurationService from 'modules/settings/services/configuration';
import validator from 'validator';

document.querySelector('body').insertAdjacentHTML('beforeend', smtpModalPartial);

let smtpForm = document.querySelector('#smtp');

const validateAddress = (event) => {
	let input = smtpForm.querySelector('.address');
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
	let input = smtpForm.querySelector('.port');
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
	return _.isEmpty(smtpForm.querySelectorAll('.is-invalid'));
};

const setSmtp = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let submitButton = form.querySelector('button[type="submit"]');
	submitButton.disabled = true;
	let config = {
		address: form.querySelector('.address').value,
		port: form.querySelector('.port').value,
		username: form.querySelector('.username').value,
		password: form.querySelector('.password').value,
		sender: form.querySelector('.sender').value
	}
	configurationService.setSmtp(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
	submitButton.disabled = false;
	_.each(smtpForm.querySelectorAll('input'), (element) => { element.classList.remove('is-valid'); });
	document.querySelector('.toast-container').insertAdjacentHTML('beforeend',
		`<div class="toast bd-green-500 border-0" data-bs-autohide="true">
			<div class="d-flex">
				<div class="toast-body">Notification server saved.</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
			</div>
		</div>`
	);
	let toast = new bootstrap.Toast(document.querySelector('.toast-container .toast:last-of-type'));
	toast.show();
};

const render = (state) => {
	if (_.isNull(state.configuration)) {
		return;
	}
	
	smtpForm.querySelector('.address').value = state.configuration?.smtp?.address ?? '';
	smtpForm.querySelector('.port').value = state.configuration?.smtp?.port ?? '';
	smtpForm.querySelector('.username').value = state.configuration?.smtp?.username ?? '';
	smtpForm.querySelector('.password').value = state.configuration?.smtp?.password ?? '';
	smtpForm.querySelector('.sender').value = state.configuration?.smtp?.sender ?? '';
};

render({ configuration: configurationService.getConfiguration() });

configurationService.subscribe([render]);

smtpForm.querySelector('.address').addEventListener('input', validateAddress);
smtpForm.querySelector('.port').addEventListener('input', validatePort);
smtpForm.addEventListener('submit', setSmtp);
