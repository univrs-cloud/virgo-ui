import appModalPartial from 'node/modules/apps/partials/modals/app_install.html';
import inputHiddenPartial from 'node/modules/apps/partials/modals/app_install/input_hidden.html';
import inputTextPartial from 'node/modules/apps/partials/modals/app_install/input_text.html';
import inputEmailPartial from 'node/modules/apps/partials/modals/app_install/input_email.html';
import inputPasswordPartial from 'node/modules/apps/partials/modals/app_install/input_password.html';
import inputRadioPartial from 'node/modules/apps/partials/modals/app_install/input_radio.html';
import selectPartial from 'node/modules/apps/partials/modals/app_install/select.html';
import * as appCenterService from 'node/modules/apps/services/app_center';

const inputHiddenTemplate = _.template(inputHiddenPartial);
const inputTextTemplate = _.template(inputTextPartial);
const inputEmailTemplate = _.template(inputEmailPartial);
const inputPasswordTemplate = _.template(inputPasswordPartial);
const inputRadioTemplate = _.template(inputRadioPartial);
const selectTemplate = _.template(selectPartial);

document.querySelector('body').insertAdjacentHTML('beforeend', appModalPartial);

const FLEET_ZONE = 'univrs.cloud';
const modal = document.querySelector('#app-install');
const form = modal.querySelector('u-form');
let app;
let certResolverEnv = null;

const isFleetDomain = (domain) => {
	return _.endsWith(String(domain || '').toLowerCase(), `.${FLEET_ZONE}`);
};

const renderCertResolver = (domain) => {
	const slot = form.querySelector('.certresolver');
	if (!slot || !certResolverEnv) {
		return;
	}

	slot.innerHTML = (String(domain || '').toLowerCase() === appCenterService.getFQDN())
		? inputHiddenTemplate({ env: { ...certResolverEnv, default: '' } })
		: inputRadioTemplate({ env: certResolverEnv });
};

const install = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	const env = form.getData();
	const data = {
		name: app.name,
		env
	};
	appCenterService.install(data);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const name = event.relatedTarget.closest('.item').dataset.name;
	app = _.find(appCenterService.getTemplates(), { name });
	form.querySelector('.modal-title').textContent = app.title;
	form.querySelector('.description').textContent = app.description;
	form.querySelector('.note').textContent = app.note || '';
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
			if (env.name.toLowerCase() === 'certresolver') {
				certResolverEnv = env;
				form.querySelector('.inputs').innerHTML += '<div class="certresolver"></div>';
				return;
			}

			form.querySelector('.inputs').innerHTML += inputRadioTemplate({ env });
			return;
		}

		if (env?.type === 'select') {
			form.querySelector('.inputs').innerHTML += selectTemplate({ env });
			return;
		}
	});
	const domainInput = form.querySelector('u-input[name="DOMAIN"]');
	renderCertResolver(domainInput ? domainInput.value : fqdn);
	domainInput?.addEventListener('value-changed', () => { renderCertResolver(domainInput.value); });
	form.validation = [
		{
			selector: 'u-input:not([type="hidden"]), u-select, u-textarea',
			rules: {
				isEmpty: `Can't be empty`
			}
		},
		{
			selector: 'u-input[name="DOMAIN" i]',
			rules: {
				isFQDN: { require_tld: false, message: 'Must be a valid domain name' },
				custom: {
					validate: (value) => {
						const domain = String(value || '').toLowerCase();
						return !isFleetDomain(domain) || domain === fqdn;
					},
					message: `Can only be ${fqdn}`
				}
			}
		}
	];
};

const restore = (event) => {
	app = null;
	certResolverEnv = null;
	_.each(form.querySelectorAll('.modal-title, .description, .note, .inputs'), (node) => { node.innerHTML = ''; });
	form.querySelector('.note').classList.add('d-none');
	form.validation = [];
	form.reset();
}

form.validation = [];
form.addEventListener('valid', install);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
