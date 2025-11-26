import appModalPartial from 'modules/apps/partials/modals/app_install.html';
import inputHiddenPartial from 'modules/apps/partials/modals/app_install/input_hidden.html';
import inputTextPartial from 'modules/apps/partials/modals/app_install/input_text.html';
import inputEmailPartial from 'modules/apps/partials/modals/app_install/input_email.html';
import inputPasswordPartial from 'modules/apps/partials/modals/app_install/input_password.html';
import inputRadioPartial from 'modules/apps/partials/modals/app_install/input_radio.html';
import selectPartial from 'modules/apps/partials/modals/app_install/select.html';
import * as appCenterService from 'modules/apps/services/app_center';
import validator from 'validator';

const inputHiddenTemplate = _.template(inputHiddenPartial);
const inputTextTemplate = _.template(inputTextPartial);
const inputEmailTemplate = _.template(inputEmailPartial);
const inputPasswordTemplate = _.template(inputPasswordPartial);
const inputRadioTemplate = _.template(inputRadioPartial);
const selectTemplate = _.template(selectPartial);
document.querySelector('body').insertAdjacentHTML('beforeend', appModalPartial);

const form = document.querySelector('#app-install');
let app;

const validateInput = (input) => {
	const value = input.value;
	if (validator.isEmpty(value.toString())) {
		input.error = `Can't be empty`;
		return;
	}
	input.error = ``;
};

const validateForm = () => {
	_.each(form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea'), (input) => {
		validateInput(input);
	});
};

const isFormValid = () => {
	validateForm();
	return _.isEmpty(form.querySelectorAll('.is-invalid'));
};

const install = (event) => {
	event.preventDefault();
	if (!isFormValid()) {
		return;
	}

	const form = event.target;
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });

	let config = {
		id: app.id,
		env: {}
	};
	_.each(app.env, (env) => {
		const input = form.querySelector(`input[name="${env.name}"]:checked`) || form.querySelector(`u-input[name="${env.name}"]`) || form.querySelector(`select[name="${env.name}"]`) || form.querySelector(`u-select[name="${env.name}"]`) || form.querySelector(`textarea[name="${env.name}"]`) || form.querySelector(`u-textarea[name="${env.name}"]`);
		config.env[env.name] = input.value;
	});
	
	appCenterService.install(config);
	bootstrap.Modal.getInstance(form.closest('.modal'))?.hide();
};

const render = (event) => {
	const id = event.relatedTarget.closest('.app').dataset.id;
	app = _.find(appCenterService.getTemplates(), { id: Number(id) });
	form.querySelector('.modal-title').innerHTML = app.title;
	form.querySelector('.description').innerHTML = app.description;
	form.querySelector('.note').innerHTML = app.note || '';
	form.querySelector('.note')?.classList[app.note ? 'remove' : 'add']('d-none');
	const fqdn = appCenterService.getFQDN();
	_.each(app.env, (env) => {
		if (env?.type === 'hidden') {
			form.querySelector('.inputs').innerHTML += inputHiddenTemplate({ env });
			return;
		}

		if (env?.type === 'text') {
			if (env.name.toLowerCase() === 'domain') {
				env.default = fqdn;
			}
			if (env.name.toLowerCase() === 'nextcloud_trusted_domains') {
				env.default = `${fqdn} auth.${fqdn} nextcloud.${fqdn} onlyoffice.${fqdn} talk.${fqdn}`;
			}
			form.querySelector('.inputs').innerHTML += inputTextTemplate({ env, prefix: env?.prefix, suffix: env?.suffix });
			return;
		}

		if (env?.type === 'email') {
			form.querySelector('.inputs').innerHTML += inputEmailTemplate({ env });
			return;
		}

		if (env?.type === 'password') {
			form.querySelector('.inputs').innerHTML += inputPasswordTemplate({ env });
			return;
		}

		if (env?.type === 'radio') {
			form.querySelector('.inputs').innerHTML += inputRadioTemplate({ env });
			return;
		}

		if (env?.type === 'select') {
			form.querySelector('.inputs').innerHTML += selectTemplate({ env });
			return;
		}
	});
	_.each(form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea'), (input) => { input.addEventListener('input', (event) => { validateInput(event.target); }) });
};

const restore = (event) => {
	app = null;
	_.each(form.querySelectorAll('.modal-title, .description, .note, .inputs'), (node) => { node.innerHTML = ''; });
	form.querySelector('.note').classList.add('d-none');
	form.reset();
	_.each(form.querySelectorAll('button'), (button) => { button.disabled = false });
}

form.addEventListener('submit', install);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
