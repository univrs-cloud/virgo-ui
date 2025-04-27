import appModalPartial from 'modules/apps/partials/modal/app_install.html';
import inputHiddenPartial from 'modules/apps/partials/modal/app_install/input_hidden.html';
import inputTextPartial from 'modules/apps/partials/modal/app_install/input_text.html';
import inputEmailPartial from 'modules/apps/partials/modal/app_install/input_email.html';
import inputPasswordPartial from 'modules/apps/partials/modal/app_install/input_password.html';
import inputRadioPartial from 'modules/apps/partials/modal/app_install/input_radio.html';
import selectPartial from 'modules/apps/partials/modal/app_install/select.html';
import * as appCenterService from 'modules/apps/services/app_center';
import validator from 'validator';

const inputHiddenTemplate = _.template(inputHiddenPartial);
const inputTextTemplate = _.template(inputTextPartial);
const inputEmailTemplate = _.template(inputEmailPartial);
const inputPasswordTemplate = _.template(inputPasswordPartial);
const inputRadioTemplate = _.template(inputRadioPartial);
const selectTemplate = _.template(selectPartial);
document.querySelector('body').insertAdjacentHTML('beforeend', appModalPartial);

let appForm = document.querySelector('#app-install');
let app;

const validateField = (field) => {
	let invalidFeedback = field.closest('.form-floating').querySelector('.invalid-feedback');
	let value = field.value;
	if (validator.isEmpty(value)) {
		field.classList.remove('is-valid');
		field.classList.add('is-invalid');
		invalidFeedback.innerHTML = `Can't be empty`;
		return;
	}
	field.classList.remove('is-invalid');
	field.classList.add('is-valid');
};

const validateForm = () => {
	_.each(appForm.querySelectorAll('input, textarea'), (field) => {
		validateField(field);
	});
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(appForm.querySelectorAll('.is-invalid'));
};

const install = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	let form = event.target;
	let buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		id: app.id,
		env: {}
	};
	_.each(app.env, (env) => {
		config.env[env.name] = form.querySelector(`[name="${env.name}"]`).value;
	});
	
	appCenterService.install(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const render = (event) => {
	let id = event.relatedTarget.closest('.app').dataset.id;
	app = _.find(appCenterService.getTemplates(), { id: Number(id) });
	appForm.querySelector('.modal-title').innerHTML = app.title;
	appForm.querySelector('.description').innerHTML = app.description;
	let domain = appCenterService.getDomain();
	_.each(app.env, (env) => {
		if (env?.type === 'hidden') {
			appForm.querySelector('.inputs').innerHTML += inputHiddenTemplate({ env });
			return;
		}

		if (env?.type === 'text') {
			if (env.name.toLowerCase() === 'domain') {
				env.default = domain;
			}
			appForm.querySelector('.inputs').innerHTML += inputTextTemplate({ env, prefix: env?.prefix, suffix: env?.suffix });
			return;
		}

		if (env?.type === 'email') {
			appForm.querySelector('.inputs').innerHTML += inputEmailTemplate({ env });
			return;
		}

		if (env?.type === 'password') {
			appForm.querySelector('.inputs').innerHTML += inputPasswordTemplate({ env });
			return;
		}

		if (env?.type === 'radio') {
			appForm.querySelector('.inputs').innerHTML += inputRadioTemplate({ env });
			return;
		}

		if (env?.type === 'select') {
			appForm.querySelector('.inputs').innerHTML += selectTemplate({ env });
			return;
		}
	});
	_.each(appForm.querySelectorAll('input, textarea'), (field) => { field.addEventListener('input', (event) => { validateField(event.target); }) });
};

const restore = (event) => {
	app = null;
	_.each(appForm.querySelectorAll('.modal-title, .description, .inputs'), (node) => { node.innerHTML = ''; });
	appForm.reset();
	_.each(appForm.querySelectorAll('button'), (button) => { button.disabled = false });
}

appForm.addEventListener('submit', install);
appForm.addEventListener('show.bs.modal', render);
appForm.addEventListener('hidden.bs.modal', restore);
