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
	let config = configurationService.getConfiguration().smtp;
	config.encryption = form.querySelector('.encryption:checked').value;
	config.address = form.querySelector('.address').value;
	config.port = form.querySelector('.port').value;
	config.username = form.querySelector('.username').value;
	config.password = form.querySelector('.password').value;
	config.sender = form.querySelector('.sender').value;
	config.recipients = _.split(_.trim(form.querySelector('.recipients').value), '\n');
	
	configurationService.setSmtp(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
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

const restore = (event) => {
	smtpForm.reset();
	smtpForm.querySelector('button[type="submit"]').disabled = false;
	_.each(smtpForm.querySelectorAll('.form-floating'), (input) => {
		input.querySelector('input').classList.remove('is-invalid');
		input.querySelector('.invalid-feedback').innerHTML = '';
	});
};

const render = (event) => {
	let configuration = configurationService.getConfiguration();
	let encryption = configuration?.smtp?.encryption ?? '';
	smtpForm.querySelector(`.encryption[value="${encryption}"]`).checked = true;
	smtpForm.querySelector('.address').value = configuration?.smtp?.address ?? '';
	smtpForm.querySelector('.port').value = configuration?.smtp?.port ?? '';
	smtpForm.querySelector('.username').value = configuration?.smtp?.username ?? '';
	smtpForm.querySelector('.password').value = configuration?.smtp?.password ?? '';
	smtpForm.querySelector('.sender').value = configuration?.smtp?.sender ?? '';
	smtpForm.querySelector('.recipients').innerHTML = configuration?.smtp?.recipients?.join('\n');
};

configurationService.subscribe([render]);

smtpForm.querySelector('.address').addEventListener('input', validateAddress);
smtpForm.querySelector('.port').addEventListener('input', validatePort);
smtpForm.addEventListener('submit', setSmtp);
smtpForm.addEventListener('show.bs.modal', render);
smtpForm.addEventListener('hidden.bs.modal', restore);
