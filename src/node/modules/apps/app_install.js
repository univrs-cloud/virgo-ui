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
let editedApp = null;
let appDomain = '';
let certResolverEnv = null;
let nodeResolver = null;
let certResolverChoice = null;
let isCertResolverHidden = null;

const isFleetDomain = (domain) => {
	return _.endsWith(domain?.toLowerCase(), `.${FLEET_ZONE}`);
};

const findTemplate = (name) => {
	const appName = _.toLower(name);
	return _.find(appCenterService.getTemplates(), (template) => {
		const templateName = _.toLower(template.name);
		return templateName === appName || (template.multiple === true && _.startsWith(appName, `${templateName}-`));
	});
};

const withCurrentValue = (env) => {
	const value = editedApp.env?.[env.name];
	if (env.type === 'password') {
		return { ...env, default: '', description: `${env.description} Leave it empty to keep the current one.` };
	}

	if (_.isNil(value)) {
		return env;
	}

	if (env.type === 'radio' || env.type === 'select') {
		return { ...env, select: _.map(env.select, (option) => { return { ...option, default: String(option.value).toLowerCase() === String(value).toLowerCase() }; }) };
	}

	return { ...env, default: value };
};

const isGated = (env) => {
	const policy = env.auth?.policy?.toLowerCase();
	if (_.isNil(policy) || policy === 'none') {
		return false;
	}

	if (policy === 'optional') {
		return env.auth.default === true;
	}

	return true;
};

const renderCertResolver = (domain) => {
	const slot = form.querySelector('.certresolver');
	if (!slot || !certResolverEnv) {
		return;
	}

	const isHidden = (domain?.toLowerCase() === appDomain && isFleetDomain(domain));
	if (isHidden === isCertResolverHidden) {
		return;
	}

	isCertResolverHidden = isHidden;
	if (isHidden) {
		slot.innerHTML = inputHiddenTemplate({ env: { ...certResolverEnv, default: '' } });
		return;
	}

	const selected = (certResolverChoice ?? nodeResolver);
	const resolver = selected?.toLowerCase();
	const isKnown = !_.isNil(selected) && _.some(certResolverEnv.select, (option) => { return String(option.value).toLowerCase() === resolver; });
	const select = (isKnown
		? _.map(certResolverEnv.select, (option) => { return { ...option, default: String(option.value).toLowerCase() === resolver }; })
		: certResolverEnv.select);
	slot.innerHTML = inputRadioTemplate({ env: { ...certResolverEnv, select } });
};

const install = (event) => {
	_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	const env = form.getData();
	if (editedApp) {
		const passwordNames = _.map(_.filter(app.env, { type: 'password' }), 'name');
		appCenterService.update({
			name: editedApp.name,
			env: _.omitBy(env, (value, key) => { return _.includes(passwordNames, key) && _.isEmpty(value); })
		});
	} else {
		appCenterService.install({
			name: app.name,
			env
		});
	}
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const render = (event) => {
	const name = event.relatedTarget.closest('.item').dataset.name;
	editedApp = (event.relatedTarget.dataset.action === 'edit' ? _.find(appCenterService.getApps(), { name }) || null : null);
	app = (editedApp ? findTemplate(name) : _.find(appCenterService.getTemplates(), { name }));
	certResolverChoice = (editedApp?.env?.CERTRESOLVER ?? null);
	form.querySelector('.dialog-title').textContent = (editedApp ? editedApp.title : app.title);
	form.querySelector('[type="submit"]').textContent = (editedApp ? 'Update' : 'Install');
	form.querySelector('.description').textContent = app.description;
	form.querySelector('.note').textContent = app.note || '';
	form.querySelector('.note').classList[app.note ? 'remove' : 'add']('d-none');
	const fqdn = appCenterService.getFQDN();
	const domainName = appCenterService.getDomainName();
	appDomain = (_.toLower(app.scope) === 'node' ? fqdn : domainName);
	nodeResolver = appCenterService.getCertresolver();
	_.each((editedApp ? _.map(_.filter(app.env, (env) => { return env.editable === true && !isGated(env); }), withCurrentValue) : app.env), (env) => {
		if (env?.type === 'hidden') {
			form.querySelector('.inputs').innerHTML += inputHiddenTemplate({ env });
			return;
		}

		if (env?.type === 'text') {
			env = {
				...env,
				readonly: env.readonly === true || isGated(env)
			};
			if (isGated(env) || (env.name.toLowerCase() === 'domain' && !editedApp)) {
				env.default = appDomain;
			}
			if (env.name.toLowerCase() === 'nextcloud_trusted_domains') {
				env.default = `${domainName} auth.${fqdn} nextcloud.${domainName} onlyoffice.${domainName} talk.${domainName}`;
			}
			form.querySelector('.inputs').innerHTML += inputTextTemplate({ env, prefix: env?.prefix, suffix: env?.suffix, isGated: isGated(env) });
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
	form.querySelector('.password-note').classList.toggle('d-none', !editedApp || !form.querySelector('.env-password'));
	const domainInput = form.querySelector('.env-domain');
	renderCertResolver(domainInput ? domainInput.value : (editedApp?.env?.DOMAIN ?? appDomain));
	domainInput?.addEventListener('value-changed', () => { renderCertResolver(domainInput.value); });
	form.querySelector('.certresolver')?.addEventListener('change', (event) => { certResolverChoice = event.target.value; });
	form.validation = [
		{
			selector: (editedApp ? '.env-field:not(.env-password)' : '.env-field'),
			rules: {
				isEmpty: `Can't be empty`
			}
		},
		{
			selector: '.env-domain',
			rules: {
				isFQDN: { require_tld: false, message: 'Must be a valid domain name' },
				custom: {
					validate: (value) => {
						const domain = value?.toLowerCase();
						return !isFleetDomain(domain) || domain === appDomain;
					},
					message: `Can only be ${appDomain}`
				}
			}
		},
		{
			selector: '.env-instance',
			rules: {
				isAlphanumeric: 'Can only contain letters and numbers',
				custom: {
					validate: (value) => {
						const name = `${app.name}-${value}`.toLowerCase();
						return !_.some(appCenterService.getApps(), (installedApp) => { return installedApp.name.toLowerCase() === name; });
					},
					message: 'Already exists'
				}
			}
		}
	];
};

const restore = (event) => {
	app = null;
	editedApp = null;
	appDomain = '';
	certResolverEnv = null;
	nodeResolver = null;
	certResolverChoice = null;
	isCertResolverHidden = null;
	_.each(form.querySelectorAll('.dialog-title, .description, .note, .inputs'), (node) => { node.innerHTML = ''; });
	form.querySelector('.note').classList.add('d-none');
	form.querySelector('.password-note').classList.add('d-none');
	form.validation = [];
	form.reset();
}

form.validation = [];
form.addEventListener('valid', install);
modal.addEventListener('show.bs.dialog', render);
modal.addEventListener('hidden.bs.dialog', restore);
