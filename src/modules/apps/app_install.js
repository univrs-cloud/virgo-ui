import appModalPartial from 'modules/apps/partials/modals/app_install.html';
import inputHiddenPartial from 'modules/apps/partials/modals/app_install/input_hidden.html';
import inputTextPartial from 'modules/apps/partials/modals/app_install/input_text.html';
import inputEmailPartial from 'modules/apps/partials/modals/app_install/input_email.html';
import inputPasswordPartial from 'modules/apps/partials/modals/app_install/input_password.html';
import inputRadioPartial from 'modules/apps/partials/modals/app_install/input_radio.html';
import selectPartial from 'modules/apps/partials/modals/app_install/select.html';
import * as appCenterService from 'modules/apps/services/app_center';

const inputHiddenTemplate = _.template(inputHiddenPartial);
const inputTextTemplate = _.template(inputTextPartial);
const inputEmailTemplate = _.template(inputEmailPartial);
const inputPasswordTemplate = _.template(inputPasswordPartial);
const inputRadioTemplate = _.template(inputRadioPartial);
const selectTemplate = _.template(selectPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', appModalPartial);

const modal = document.querySelector('#app-install');
const form = modal.closest('u-form');
let app;

const install = (event) => {
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let env = form.getData();
	let config = {
		id: app.id,
		env
	};
	appCenterService.install(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const id = event.relatedTarget.closest('.app').dataset.id;
	app = _.find(appCenterService.getTemplates(), { id: Number(id) });
	form.querySelector('.modal-title').innerHTML = app.title;
	form.querySelector('.description').innerHTML = app.description;
	form.querySelector('.note').innerHTML = app.note || '';
	form.querySelector('.note').classList[app.note ? 'remove' : 'add']('d-none');
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
	form.validation = [
		{
			selector: 'u-input:not([type="hidden"]), u-select, u-textarea',
			rules: {
				isEmpty: `Can't be empty`
			}
		}
	];
};

const restore = (event) => {
	app = null;
	_.each(form.querySelectorAll('.modal-title, .description, .note, .inputs'), (node) => { node.innerHTML = ''; });
	form.querySelector('.note').classList.add('d-none');
	form.validation = [];
	form.reset();
}

form.validation = [];
form.addEventListener('valid', install);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
