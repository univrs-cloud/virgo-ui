import domainModalPartial from 'node/modules/apps/partials/modals/mail_domain_create.html';
import accountModalPartial from 'node/modules/apps/partials/modals/mail_account_create.html';
import passwordModalPartial from 'node/modules/apps/partials/modals/mail_account_password.html';
import quotaModalPartial from 'node/modules/apps/partials/modals/mail_account_quota.html';
import aliasModalPartial from 'node/modules/apps/partials/modals/mail_alias_create.html';
import banModalPartial from 'node/modules/apps/partials/modals/mail_ban_create.html';
import setupModalPartial from 'node/modules/apps/partials/modals/mail_domain_setup.html';
import setupBodyPartial from 'node/modules/apps/partials/modals/mail_domain_setup_body.html';
import mailDnsRecordsPartial from 'node/modules/apps/partials/app_mail_dns_records.html';
import * as appService from 'node/modules/apps/services/app';

const APP_NAME = 'mailserver';
const LOCAL_PART_PATTERN = /^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/i;
const GIB = 1024 * 1024 * 1024;

const setupBodyTemplate = _.template(setupBodyPartial);
const mailDnsRecordsTemplate = _.template(mailDnsRecordsPartial);
const addedDomains = new Set();

document.querySelector('body').insertAdjacentHTML('beforeend', domainModalPartial + accountModalPartial + passwordModalPartial + quotaModalPartial + aliasModalPartial + banModalPartial + setupModalPartial);

const setupModal = document.querySelector('#mail-domain-setup');

const showDomainSetup = (name) => {
	const mailserver = appService.getMailserver();
	const domain = _.find(mailserver?.domains, { name });
	if (!domain) {
		return;
	}

	setupModal.querySelector('.dialog-title').textContent = `Set up ${name}`;
	setupModal.querySelector('.dialog-body').innerHTML = setupBodyTemplate({ domain, mailserver, nodeAddress: appService.getNodeAddress(), mailDnsRecordsTemplate });
	bootstrap.Dialog.getOrCreateInstance(setupModal).show();
};

const announceAddedDomains = (state) => {
	_.each(state.jobs, (job) => {
		const domain = job.data?.config?.domain;
		if (job.name !== 'app:mailserver:domain:add' || !addedDomains.has(domain) || !_.includes(['completed', 'failed'], job.progress?.state)) {
			return;
		}

		addedDomains.delete(domain);
		if (job.progress.state !== 'completed') {
			return;
		}

		const toast = notifier.add({
			title: `${domain} was added, but mail for it does not work yet.`,
			message: `<div>Add its DNS records and forward the mail ports on your router.</div><div class="mt-3"><u-button type="button" size="sm" click="setup">Show me how</u-button></div>`,
			type: 'neutral',
			duration: 0,
			dismissible: true,
			callbacks: {
				setup: () => {
					toast.remove();
					showDomainSetup(domain);
				}
			}
		});
	});
};

const passwordRules = (form) => {
	return [
		{
			selector: '.password',
			rules: {
				isEmpty: `Can't be empty`,
				isStrongPassword: {
					message: `At least 8 characters`,
					minLength: 8,
					minLowercase: 0,
					minUppercase: 0,
					minNumbers: 0,
					minSymbols: 0
				}
			}
		},
		{
			selector: '.password-check',
			rules: {
				isEmpty: `Can't be empty`,
				equals: {
					message: `Passwords do not match`,
					comparison: () => { return form.querySelector('.password').value; }
				}
			}
		}
	];
};

const quotaRule = {
	selector: '.quota',
	rules: {
		custom: {
			validate: (value) => {
				if (_.trim(value) === '') {
					return `Can't be empty`;
				}
				if (!/^\d+$/.test(_.trim(value))) {
					return `Must be a whole number`;
				}
				return (Number(value) >= 1 ? true : `At least 1`);
			}
		}
	}
};

const defaultQuotaValue = () => {
	const defaultLimit = appService.getMailserver()?.defaultLimit;
	return (defaultLimit > 0 ? String(Math.round(defaultLimit / GIB)) : null);
};

const quotaOf = (quota, defaultQuota = null) => {
	const value = _.trim(quota);
	return (value === defaultQuota ? 'default' : Number(value));
};

const localPartRule = (form, takenReason) => {
	return {
		selector: '.local-part',
		rules: {
			isEmpty: `Can't be empty`,
			custom: {
				validate: (value) => {
					if (!LOCAL_PART_PATTERN.test(_.trim(value))) {
						return `Use letters, digits, dots, dashes, underscores or plus signs`;
					}
					return (takenReason(`${_.toLower(_.trim(value))}@${_.toLower(form.querySelector('.domain').value)}`) ?? true);
				}
			}
		}
	};
};

const domainOptions = () => {
	const domains = appService.getMailserver()?.domains;
	return [
		{ value: '', label: 'Select domain', default: true },
		..._.map(domains, (domain) => { return { value: domain.name, label: domain.name }; })
	];
};

const wire = (selector, { validation, action, toData, render }) => {
	const modal = document.querySelector(selector);
	const form = modal.querySelector('u-form');
	let context = {};
	form.validation = validation(form);
	form.addEventListener('valid', () => {
		_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
		appService.manageMailserver(action, { name: APP_NAME, ...toData(form.getData(), context, form) });
		bootstrap.Dialog.getInstance(modal)?.hide();
	});
	modal.addEventListener('show.bs.dialog', (event) => {
		context = { email: event.relatedTarget?.dataset.email };
		render?.(form, context);
	});
	modal.addEventListener('hidden.bs.dialog', () => {
		context = {};
		form.reset();
	});
};

const accountExists = (email) => {
	return _.some(appService.getMailserver()?.accounts, (account) => { return _.toLower(account.email) === email; });
};

const aliasExists = (email) => {
	return _.some(appService.getMailserver()?.aliases, (alias) => { return _.toLower(alias.address) === email; });
};

const addressTakenReason = (email) => {
	if (accountExists(email)) {
		return `Already an account`;
	}
	return (aliasExists(email) ? `Already an alias` : null);
};

const aliasTakenReason = (form) => {
	return (email) => {
		if (accountExists(email)) {
			return `Already an account`;
		}
		const recipient = form.querySelector('.recipient').value;
		return (_.some(appService.getMailserver()?.aliases, (alias) => { return _.toLower(alias.address) === email && _.includes(alias.recipients, recipient); }) ? `Already an alias of this account` : null);
	};
};

const renderDomainField = (form) => {
	const mailserver = appService.getMailserver();
	const names = _.map(mailserver?.domains, 'name');
	const domainSelect = form.querySelector('.domain');
	domainSelect.options = (_.isEmpty(names) ? domainOptions() : _.map(names, (name) => { return { value: name, label: name }; }));
	domainSelect.value = (_.includes(names, mailserver?.defaultDomain) ? mailserver.defaultDomain : (_.first(names) ?? ''));
	form.querySelector('.domain-suffix').textContent = (domainSelect.value ? `@${domainSelect.value}` : '');
};

const returnToLocalPart = (form) => {
	const localPart = form.querySelector('.local-part');
	if (_.trim(localPart.value) === '') {
		localPart.error = '';
	} else {
		form.validateField('.local-part');
	}
	setTimeout(() => { localPart.focus(); });
};

const watchDomainField = (selector) => {
	const form = document.querySelector(`${selector} u-form`);
	form.querySelector('.domain').addEventListener('change', (event) => {
		form.querySelector('.domain-suffix').textContent = (event.target.value ? `@${event.target.value}` : '');
		returnToLocalPart(form);
	});
};

wire('#mail-domain-create', {
	action: 'domain:add',
	validation: () => {
		return [
			{
				selector: '.domain',
				rules: {
					isEmpty: `Can't be empty`,
					isFQDN: `Invalid domain`,
					custom: {
						validate: (value) => { return !_.some(appService.getMailserver()?.domains, (domain) => { return domain.name === _.toLower(_.trim(value)); }); },
						message: `Already exists`
					}
				}
			}
		];
	},
	toData: (data) => {
		const domain = _.toLower(_.trim(data.domain));
		addedDomains.add(domain);
		return { domain };
	}
});

wire('#mail-account-create', {
	action: 'account:add',
	validation: (form) => {
		return [
			localPartRule(form, addressTakenReason),
			{ selector: '.domain', rules: { isEmpty: `Can't be empty` } },
			...passwordRules(form),
			quotaRule
		];
	},
	render: (form, context) => {
		renderDomainField(form);
		context.defaultQuota = defaultQuotaValue();
		form.querySelector('.quota').value = (context.defaultQuota ?? '');
	},
	toData: (data, context) => { return { email: `${_.toLower(_.trim(data.localPart))}@${data.domain}`, password: data.password, quota: quotaOf(data.quota, context.defaultQuota) }; }
});

watchDomainField('#mail-account-create');

wire('#mail-account-password', {
	action: 'account:password',
	validation: (form) => { return passwordRules(form); },
	render: (form, context) => { form.querySelector('.title-email').textContent = context.email; },
	toData: (data, context) => { return { email: context.email, password: data.password }; }
});

wire('#mail-account-quota', {
	action: 'account:quota',
	validation: () => { return [quotaRule]; },
	render: (form, context) => {
		const account = _.find(appService.getMailserver()?.accounts, { email: context.email });
		context.defaultQuota = (account?.quota ? null : defaultQuotaValue());
		form.querySelector('.title-email').textContent = context.email;
		form.querySelector('.quota').value = (account?.quota ? String(Math.round(account.quota / GIB)) : (context.defaultQuota ?? ''));
	},
	toData: (data, context) => { return { email: context.email, quota: quotaOf(data.quota, context.defaultQuota) }; }
});

wire('#mail-alias-create', {
	action: 'alias:add',
	validation: (form) => {
		return [
			localPartRule(form, aliasTakenReason(form)),
			{ selector: '.domain', rules: { isEmpty: `Can't be empty` } }
		];
	},
	render: (form, context) => {
		renderDomainField(form);
		form.querySelector('.recipient').value = context.email;
		form.querySelector('.title-email').textContent = context.email;
	},
	toData: (data) => { return { address: `${_.toLower(_.trim(data.localPart))}@${data.domain}`, recipient: data.recipient }; }
});

watchDomainField('#mail-alias-create');

wire('#mail-ban-create', {
	action: 'ban:add',
	validation: () => {
		return [
			{
				selector: '.ip',
				rules: {
					isEmpty: `Can't be empty`,
					isIP: `Invalid IP address`
				}
			}
		];
	},
	toData: (data) => { return { ip: _.trim(data.ip) }; }
});

appService.subscribe([announceAddedDomains]);
