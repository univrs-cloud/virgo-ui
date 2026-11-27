import servicePartial from 'node/modules/apps/partials/modals/app_custom/service.html';
import volumePartial from 'node/modules/apps/partials/modals/app_custom/volume.html';
import portPartial from 'node/modules/apps/partials/modals/app_custom/port.html';
import variablePartial from 'node/modules/apps/partials/modals/app_custom/variable.html';
import snapshotRulesPartial from 'node/modules/apps/partials/modals/app_custom/snapshot_rules.html';
import createModalPartial from 'node/modules/apps/partials/modals/app_custom_create.html';
import updateModalPartial from 'node/modules/apps/partials/modals/app_custom_update.html';
import fieldsPartial from 'node/modules/apps/partials/modals/app_custom/fields.html';
import * as appCenterService from 'node/modules/apps/services/app_center';
import * as iconPicker from 'node/modules/shortcuts/services/icon_picker';

const serviceTemplate = _.template(servicePartial);
const volumeTemplate = _.template(volumePartial);
const portTemplate = _.template(portPartial);
const variableTemplate = _.template(variablePartial);
const snapshotRulesTemplate = _.template(snapshotRulesPartial);

const FLEET_ZONE = 'univrs.cloud';
const APPS_DIR = '/messier/apps';
const HOST_PORTS = ['22/tcp', '445/tcp', '3493/tcp'];
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NAME_PREFIX = 'custom-';
const NAME_MAX_LENGTH = 56;
const IMAGE_PATTERN = /^[a-z0-9][a-z0-9._\/:@-]*$/i;
const FOLDER_PATTERN = /^[a-z0-9._-]+(?:\/[a-z0-9._-]+)*$/i;
const VARIABLE_PATTERN = /^[a-z_][a-z0-9_]*$/i;
const PLAIN_PATTERN = /^[\w.\/@,+:=-]*$/;
const NEW_SERVICE = { name: '', image: '', network: 'public', domain: '', port: '', isPrivate: true, isRedirectingWww: false, restart: 'unless-stopped', ports: [], volumes: [], variables: [] };
const NEW_VOLUME = { source: '', target: '', isReadOnly: false };
const NEW_PORT = { published: '', target: '', protocol: 'tcp' };
const NEW_VARIABLE = { name: '', value: '' };
let modal = null;
let form = null;
let appNameInput = null;
let servicesContainer = null;
let composePreview = null;
let iconBox = null;
let domainName = '';
let editedApp = null;
let snapshotRule = null;
let hasVolumes = null;
let updateFrame = null;

const valueOf = (input) => {
	return _.trim(input?.value ?? '');
};

const isHidden = (input) => {
	return input.closest('.d-none') !== null;
};

const isFleetDomain = (domain) => {
	return _.endsWith(domain, `.${FLEET_ZONE}`);
};

const isNodeDomain = (domain) => {
	return !_.isEmpty(domainName) && _.endsWith(domain, `.${domainName}`);
};

const canRedirectWww = (domain) => {
	return !_.isEmpty(domain) && !isNodeDomain(domain) && !_.startsWith(domain, 'www.');
};

const getAppName = () => {
	return valueOf(appNameInput).toLowerCase();
};

const getAppFolder = () => {
	return `${APPS_DIR}/${NAME_PREFIX}${getAppName() || 'app'}/`;
};

const getTakenHosts = () => {
	const fqdn = appCenterService.getFQDN().toLowerCase();
	const templateHosts = _.flatMap(appCenterService.getTemplates(), (template) => {
		const domain = (template.scope?.toLowerCase() === 'node' ? fqdn : domainName);
		return _.map(
			_.filter(template.env, (env) => { return env?.name?.toLowerCase() === 'domain' && !_.isEmpty(env.prefix); }),
			(env) => { return `${env.prefix}${domain}`.toLowerCase(); }
		);
	});
	const shortcutHosts = _.map(appCenterService.getShortcuts(), (shortcut) => {
		try {
			return new URL(shortcut.url).hostname.toLowerCase();
		} catch {
			return null;
		}
	});
	const customHosts = _.flatMap(_.reject(appCenterService.getApps(), (app) => { return Boolean(editedApp) && _.toLower(app.name) === _.toLower(editedApp.name); }), (app) => {
		return _.flatMap(app.custom?.services, (service) => {
			return (service.isRedirectingWww ? [service.domain, `www.${service.domain}`] : [service.domain]);
		});
	});
	return _.uniq(_.compact(_.map([domainName, fqdn, ...templateHosts, ...shortcutHosts, ...customHosts], _.toLower)));
};

const getTakenPorts = () => {
	const containers = _.reject(appCenterService.getContainers(), (container) => { return Boolean(editedApp) && _.toLower(container.labels?.comDockerComposeProject) === _.toLower(editedApp.name); });
	const containerPorts = _.flatMap(_.filter(containers, (container) => { return _.includes(['running', 'restarting', 'paused'], _.toLower(container.state)); }), (container) => {
		return _.map(
			_.filter(container.ports, (port) => { return port.publicPort; }),
			(port) => { return `${port.publicPort}/${String(port.type).toLowerCase()}`; }
		);
	});
	return _.uniq([...HOST_PORTS, ...containerPorts]);
};

const toProtocols = (protocol) => {
	return (protocol === 'both' ? ['tcp', 'udp'] : [protocol]);
};

const readConfig = () => {
	return {
		name: getAppName(),
		services: _.map(servicesContainer.querySelectorAll('.service'), (service) => {
			const isPublic = service.querySelector('.service-public').checked;
			const isInternal = service.querySelector('.service-internal').checked;
			const network = (isPublic && isInternal ? 'both' : (isPublic ? 'public' : 'internal'));
			const domain = (isPublic ? valueOf(service.querySelector('.service-domain')).toLowerCase() : '');
			return {
				name: valueOf(service.querySelector('.service-name')).toLowerCase(),
				image: valueOf(service.querySelector('.service-image')),
				network,
				domain,
				port: (_.isEmpty(domain) ? '' : valueOf(service.querySelector('.service-port'))),
				isPrivate: (isNodeDomain(domain) && service.querySelector('.service-private').checked),
				isRedirectingWww: (canRedirectWww(domain) && service.querySelector('.service-www').checked),
				restart: service.querySelector('.service-restart').value,
				ports: (isPublic
					? _.map(service.querySelectorAll('.port'), (port) => {
						return {
							published: valueOf(port.querySelector('.port-published')),
							target: valueOf(port.querySelector('.port-target')),
							protocol: port.querySelector('.port-protocol').value
						};
					})
					: []),
				volumes: _.map(service.querySelectorAll('.volume'), (volume) => {
					return {
						source: _.trim(valueOf(volume.querySelector('.volume-source')), '/'),
						target: valueOf(volume.querySelector('.volume-target')),
						isReadOnly: volume.querySelector('.volume-read-only').checked
					};
				}),
				variables: _.map(service.querySelectorAll('.variable'), (variable) => {
					return {
						name: valueOf(variable.querySelector('.variable-name')),
						value: variable.querySelector('.variable-value').value ?? ''
					};
				})
			};
		})
	};
};

const toEnvKey = (serviceName, variableName) => {
	return `${_.toUpper(_.replace(serviceName, /-/g, '_'))}__${variableName}`;
};

const toYamlItem = (value) => {
	if (PLAIN_PATTERN.test(value)) {
		return value;
	}

	return `"${_.replace(_.replace(value, /\\/g, '\\\\'), /"/g, '\\"')}"`;
};

const toCompose = (config) => {
	const appName = `${NAME_PREFIX}${config.name || 'app'}`;
	const networks = new Set();
	const lines = ['x-virgo: custom', 'services:'];
	_.each(config.services, (service, index) => {
		const serviceName = service.name || `service-${index + 1}`;
		lines.push(`  ${serviceName}:`);
		lines.push(`    image: ${service.image}`);

		if (!_.isEmpty(service.variables)) {
			lines.push('    environment:');
			_.each(service.variables, (variable) => {
				lines.push(`      - ${toYamlItem(`${variable.name}=\${${toEnvKey(serviceName, variable.name)}}`)}`);
			});
		}

		if (!_.isEmpty(service.volumes)) {
			lines.push('    volumes:');
			_.each(_.sortBy(service.volumes, (volume) => { return (volume.isReadOnly ? 0 : 1); }), (volume) => {
				lines.push(`      - \${APP_DIR:-${APPS_DIR}/${appName}}/${volume.source}:${volume.target}${volume.isReadOnly ? ':ro' : ''}`);
			});
		}

		if (!_.isEmpty(service.domain)) {
			const router = `${appName}-${serviceName}`;
			const isOnNodeDomain = isNodeDomain(service.domain);
			const host = (isOnNodeDomain ? `${service.domain.slice(0, -(domainName.length + 1))}.\${DOMAIN}` : service.domain);
			const certresolver = (isOnNodeDomain ? '${CERTRESOLVER:+${CERTRESOLVER}}' : 'le');
			const middlewares = _.join(_.compact([
				(service.isRedirectingWww ? `${router}-www` : null),
				'secure-headers@file',
				(service.isPrivate ? 'authelia@file' : null)
			]), ',');
			const rule = (service.isRedirectingWww ? `Host(\`${host}\`) || Host(\`www.${host}\`)` : `Host(\`${host}\`)`);
			lines.push('    labels:');
			lines.push('      - "traefik.enable=true"');
			lines.push('      - "traefik.docker.allowNonRunning=true"');
			lines.push(`      - "traefik.http.services.${router}.loadbalancer.server.port=${service.port}"`);
			lines.push(`      - "traefik.http.routers.${router}.service=${router}"`);
			lines.push(`      - "traefik.http.routers.${router}.rule=${rule}"`);
			lines.push(`      - "traefik.http.routers.${router}.entrypoints=https"`);
			lines.push(`      - "traefik.http.routers.${router}.tls.certresolver=${certresolver}"`);
			lines.push(`      - "traefik.http.routers.${router}.middlewares=${middlewares}"`);
			if (service.isRedirectingWww) {
				lines.push(`      - "traefik.http.middlewares.${router}-www.redirectregex.regex=^https://www[.]${_.replace(host, /\./g, '[.]')}/(.*)"`);
				lines.push(`      - "traefik.http.middlewares.${router}-www.redirectregex.replacement=https://${host}/$\${1}"`);
				lines.push(`      - "traefik.http.middlewares.${router}-www.redirectregex.permanent=true"`);
			}
		}

		if (!_.isEmpty(service.ports)) {
			lines.push('    ports:');
			_.each(service.ports, (port) => {
				_.each(toProtocols(port.protocol), (protocol) => {
					lines.push(`      - "${port.published}:${port.target}/${protocol}"`);
				});
			});
		}

		lines.push('    networks:');
		if (service.network !== 'public') {
			networks.add('internal');
			lines.push('      - internal');
		}
		if (service.network !== 'internal') {
			networks.add('virgo');
			lines.push('      - virgo');
		}
		lines.push(`    restart: ${service.restart === 'no' ? '"no"' : service.restart}`);
		lines.push('');
	});

	lines.push('networks:');
	if (networks.has('internal')) {
		lines.push('  internal:');
		lines.push('    internal: true');
	}
	if (networks.has('virgo')) {
		lines.push('  virgo:');
		lines.push('    external: true');
	}
	return _.join(lines, '\n');
};

const update = () => {
	updateFrame = null;
	const appFolder = getAppFolder();
	_.each(form.querySelectorAll('.volume-prefix'), (prefix) => { prefix.textContent = appFolder; });
	const services = servicesContainer.querySelectorAll('.service');
	_.each(services, (service) => {
		const publicInput = service.querySelector('.service-public');
		const internalInput = service.querySelector('.service-internal');
		const domain = valueOf(service.querySelector('.service-domain')).toLowerCase();
		publicInput.disabled = (publicInput.checked && !internalInput.checked);
		internalInput.disabled = (internalInput.checked && !publicInput.checked);
		service.querySelector('.public').classList.toggle('d-none', !publicInput.checked);
		service.querySelector('.private').classList.toggle('d-none', !_.isEmpty(domain) && !isNodeDomain(domain));
		service.querySelector('.service-private').disabled = _.isEmpty(domain);
		service.querySelector('.www').classList.toggle('d-none', !_.isEmpty(domain) && !canRedirectWww(domain));
		service.querySelector('.service-www').disabled = _.isEmpty(domain);
		service.querySelector('.remove-service').classList.toggle('d-none', _.size(services) === 1);
		service.querySelector('.service-title').textContent = (valueOf(service.querySelector('.service-name')) || 'Service');
		service.querySelector('.service-subtitle').textContent = valueOf(service.querySelector('.service-image'));
	});
	if ((form.querySelector('.volume') !== null) !== hasVolumes) {
		renderProtection();
	}
	composePreview.textContent = toCompose(readConfig());
};

const renderProtection = () => {
	hasVolumes = (form.querySelector('.volume') !== null);
	form.querySelector('.protection-body').innerHTML = snapshotRulesTemplate({ snapshotRules: appCenterService.getSnapshotRules(), selectedRule: snapshotRule, hasVolumes });
};

const selectSnapshotRule = (event) => {
	const button = event.target.closest('[data-snapshot-rule]');
	if (!button) {
		return;
	}

	snapshotRule = (button.dataset.snapshotRule || null);
	renderProtection();
};

const scheduleUpdate = () => {
	if (updateFrame) {
		return;
	}

	updateFrame = requestAnimationFrame(update);
};

const toggleService = (service, isExpanded) => {
	service.querySelector('.service-body').classList.toggle('show', isExpanded);
	const icon = service.querySelector('.toggle-service i');
	icon.classList.toggle('icon-chevron-up', isExpanded);
	icon.classList.toggle('icon-chevron-down', !isExpanded);
};

const expandInvalid = () => {
	const invalid = form.querySelectorAll('.is-invalid');
	if (_.isEmpty(invalid)) {
		return;
	}

	_.each(invalid, (input) => {
		const service = input.closest('.service');
		if (service) {
			toggleService(service, true);
		}
	});
	_.head(invalid).focus();
};

const addService = (service) => {
	servicesContainer.insertAdjacentHTML('beforeend', serviceTemplate({ service, domainName, appFolder: getAppFolder(), portTemplate, volumeTemplate, variableTemplate }));
	scheduleUpdate();
};

const addRow = (event) => {
	const button = event.target.closest('.add-service, .add-volume, .add-port, .add-variable, .remove-service, .remove-row, .toggle-service');
	if (!button) {
		return;
	}

	if (button.classList.contains('toggle-service')) {
		const service = button.closest('.service');
		toggleService(service, !service.querySelector('.service-body').classList.contains('show'));
		return;
	}

	if (button.classList.contains('add-service')) {
		addService(NEW_SERVICE);
		return;
	}

	if (button.classList.contains('remove-service')) {
		button.closest('.service').remove();
		scheduleUpdate();
		return;
	}

	if (button.classList.contains('remove-row')) {
		button.closest('.volume, .port, .variable').remove();
		scheduleUpdate();
		return;
	}

	const service = button.closest('.service');
	if (button.classList.contains('add-volume')) {
		service.querySelector('.volumes').insertAdjacentHTML('beforeend', volumeTemplate({ volume: NEW_VOLUME, appFolder: getAppFolder() }));
	}
	if (button.classList.contains('add-port')) {
		service.querySelector('.ports').insertAdjacentHTML('beforeend', portTemplate({ port: NEW_PORT }));
	}
	if (button.classList.contains('add-variable')) {
		service.querySelector('.variables').insertAdjacentHTML('beforeend', variableTemplate({ variable: NEW_VARIABLE }));
	}
	scheduleUpdate();
};

const countIn = (container, selector, value) => {
	return _.size(_.filter(container.querySelectorAll(selector), (input) => { return !isHidden(input) && valueOf(input).toLowerCase() === value.toLowerCase(); }));
};

const install = () => {
	_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = true; });
	if (editedApp) {
		appCenterService.updateCustom({ ...readConfig(), icon: valueOf(form.querySelector('.shortcut-icon')) });
	} else {
		appCenterService.installCustom({ ...readConfig(), icon: valueOf(form.querySelector('.shortcut-icon')), snapshotRule: (hasVolumes ? (snapshotRule || '') : '') });
	}
	bootstrap.Dialog.getInstance(modal)?.hide();
};

const activateModal = (currentModal) => {
	modal = currentModal;
	form = modal.querySelector('u-form');
	appNameInput = form.querySelector('.app-name');
	servicesContainer = form.querySelector('.services');
	composePreview = form.querySelector('.compose');
	iconBox = modal.querySelector('.shortcut-icon-box');
};

const render = (event, isEditing) => {
	activateModal(event.currentTarget);
	const name = (isEditing ? event.relatedTarget?.closest('.item')?.dataset.name : null);
	editedApp = (name ? _.find(appCenterService.getApps(), { name }) || null : null);
	domainName = appCenterService.getDomainName().toLowerCase();
	if (editedApp) {
		form.querySelector('.dialog-title').textContent = editedApp.title;
	}
	appNameInput.value = (editedApp ? _.replace(editedApp.name, new RegExp(`^${NAME_PREFIX}`), '') : '');
	appNameInput.disabled = Boolean(editedApp);
	form.querySelector('.shortcut-icon-img').src = (editedApp?.icon ? `assets/img/apps/${editedApp.icon}` : iconPicker.DEFAULT_ICON);
	form.querySelector('.shortcut-icon').value = '';
	form.querySelector('.protection').classList.toggle('d-none', Boolean(editedApp));
	snapshotRule = (_.find(appCenterService.getSnapshotRules(), 'isDefault')?.name || null);
	renderProtection();
	_.each((_.isEmpty(editedApp?.custom?.services) ? [NEW_SERVICE] : editedApp.custom.services), addService);
	form.validation = getValidation(Boolean(editedApp));
};

const getValidation = (isEditing) => {
	return [
		{
			selector: '.app-name',
			rules: {
				custom: {
					validate: (value) => {
						const name = _.trim(value).toLowerCase();
						if (isEditing) {
							return true;
						}

						if (_.isEmpty(name)) {
							return `Can't be empty`;
						}

						if (!NAME_PATTERN.test(name)) {
							return 'Can only contain lowercase letters, numbers and hyphens';
						}

						if (_.size(name) > NAME_MAX_LENGTH) {
							return `Can be at most ${NAME_MAX_LENGTH} characters`;
						}

						const isTaken = _.some(appCenterService.getApps(), (app) => { return app.name.toLowerCase() === `${NAME_PREFIX}${name}`; });
						return (isTaken ? 'Already exists' : true);
					}
				}
			}
		},
		{
			selector: '.service-name',
			rules: {
				custom: {
					validate: (value) => {
						const name = _.trim(value).toLowerCase();
						if (_.isEmpty(name)) {
							return `Can't be empty`;
						}

						if (!NAME_PATTERN.test(name)) {
							return 'Can only contain lowercase letters, numbers and hyphens';
						}

						return (countIn(servicesContainer, '.service-name', name) > 1 ? 'Already used' : true);
					}
				}
			}
		},
		{
			selector: '.service-image',
			rules: {
				custom: {
					validate: (value) => {
						const image = _.trim(value);
						if (_.isEmpty(image)) {
							return `Can't be empty`;
						}

						return (IMAGE_PATTERN.test(image) ? true : 'Must be an image name, like nginx:latest');
					}
				}
			}
		},
		{
			selector: '.service-domain',
			rules: {
				custom: {
					validate: (value, input, form) => {
						const domain = _.trim(value).toLowerCase();
						if (isHidden(input) || _.isEmpty(domain)) {
							return true;
						}

						if (!form.validator.isFQDN(domain, { require_tld: false })) {
							return 'Must be a valid domain name';
						}

						if (isFleetDomain(domain) && !(isNodeDomain(domain) && !_.includes(domain.slice(0, -(domainName.length + 1)), '.'))) {
							return `Can only be a subdomain of ${domainName}`;
						}

						if (_.includes(getTakenHosts(), domain)) {
							return 'Already in use';
						}

						return (countIn(servicesContainer, '.service-domain', domain) > 1 ? 'Already used' : true);
					}
				}
			}
		},
		{
			selector: '.service-port',
			rules: {
				custom: {
					validate: (value, input, form) => {
						const port = _.trim(value);
						if (isHidden(input) || _.isEmpty(valueOf(input.closest('.service').querySelector('.service-domain')))) {
							return true;
						}

						if (_.isEmpty(port)) {
							return `Can't be empty`;
						}

						return (form.validator.isPort(port) ? true : 'Must be a port number');
					}
				}
			}
		},
		{
			selector: '.port-published',
			rules: {
				custom: {
					validate: (value, input, form) => {
						const port = _.trim(value);
						if (isHidden(input)) {
							return true;
						}

						if (_.isEmpty(port)) {
							return `Can't be empty`;
						}

						if (!form.validator.isPort(port)) {
							return 'Must be a port number';
						}

						const protocols = toProtocols(input.closest('.port').querySelector('.port-protocol').value);
						const takenPorts = getTakenPorts();
						if (_.some(protocols, (protocol) => { return _.includes(takenPorts, `${Number(port)}/${protocol}`); })) {
							return 'Already in use';
						}

						const isUsedTwice = _.some(protocols, (protocol) => {
							return _.size(_.filter(servicesContainer.querySelectorAll('.port'), (row) => {
								return !isHidden(row) && Number(valueOf(row.querySelector('.port-published'))) === Number(port) && _.includes(toProtocols(row.querySelector('.port-protocol').value), protocol);
							})) > 1;
						});
						return (isUsedTwice ? 'Already used' : true);
					}
				}
			}
		},
		{
			selector: '.port-target',
			rules: {
				custom: {
					validate: (value, input, form) => {
						const port = _.trim(value);
						if (isHidden(input)) {
							return true;
						}

						if (_.isEmpty(port)) {
							return `Can't be empty`;
						}

						return (form.validator.isPort(port) ? true : 'Must be a port number');
					}
				}
			}
		},
		{
			selector: '.volume-source',
			rules: {
				custom: {
					validate: (value) => {
						const folder = _.trim(_.trim(value), '/');
						if (_.isEmpty(folder)) {
							return `Can't be empty`;
						}

						const isValid = FOLDER_PATTERN.test(folder) && !_.some(_.split(folder, '/'), (segment) => { return segment === '.' || segment === '..'; });
						return (isValid ? true : 'Can only contain letters, numbers, dots, hyphens, underscores and slashes');
					}
				}
			}
		},
		{
			selector: '.volume-target',
			rules: {
				custom: {
					validate: (value, input) => {
						const target = _.trim(value);
						if (_.isEmpty(target)) {
							return `Can't be empty`;
						}

						if (!_.startsWith(target, '/') || /\s|:/.test(target)) {
							return 'Must be a path starting with /';
						}

						return (countIn(input.closest('.service'), '.volume-target', target) > 1 ? 'Already used' : true);
					}
				}
			}
		},
		{
			selector: '.variable-name',
			rules: {
				custom: {
					validate: (value, input) => {
						const name = _.trim(value);
						if (_.isEmpty(name)) {
							return `Can't be empty`;
						}

						if (!VARIABLE_PATTERN.test(name)) {
							return `Can only contain letters, numbers and underscores, and can't start with a number`;
						}

						return (countIn(input.closest('.service'), '.variable-name', name) > 1 ? 'Already used' : true);
					}
				}
			}
		}
	];
};

const restore = (event) => {
	activateModal(event.currentTarget);
	if (updateFrame) {
		cancelAnimationFrame(updateFrame);
		updateFrame = null;
	}
	domainName = '';
	editedApp = null;
	snapshotRule = null;
	hasVolumes = null;
	bootstrap.Popover.getInstance(iconBox)?.hide();
	form.querySelector('.shortcut-icon-img').src = iconPicker.DEFAULT_ICON;
	form.querySelector('.shortcut-icon').value = '';
	appNameInput.disabled = false;
	servicesContainer.innerHTML = '';
	composePreview.textContent = '';
	_.each(form.querySelectorAll('.dialog-footer u-button'), (button) => { button.disabled = false; });
	form.validation = [];
	form.reset();
	modal = null;
	form = null;
	appNameInput = null;
	servicesContainer = null;
	composePreview = null;
	iconBox = null;
};

const initializeModal = (currentModal, isEditing) => {
	const currentForm = currentModal.querySelector('u-form');
	const currentIconBox = currentModal.querySelector('.shortcut-icon-box');
	const currentIconPopoverContent = currentModal.querySelector('.shortcut-icon-popover-content');
	let outsideClick = null;
	new bootstrap.Popover(currentIconBox, {
		placement: 'left-start',
		fallbackPlacements: ['left-start'],
		title: '',
		content: currentIconPopoverContent.innerHTML,
		html: true,
		container: currentIconBox,
		sanitize: false,
		offset: [0, 0],
		trigger: 'manual'
	});

	iconPicker.initIconSearch(currentIconBox, currentIconPopoverContent, {
		getIconImgEl: () => { return currentForm.querySelector('.shortcut-icon-img'); },
		getIconInputEl: () => { return currentForm.querySelector('.shortcut-icon'); },
		onSelect: () => { bootstrap.Popover.getInstance(currentIconBox)?.hide(); }
	});

	currentForm.validation = [];
	currentForm.addEventListener('click', addRow);
	currentForm.addEventListener('click', selectSnapshotRule);
	currentForm.addEventListener('value-changed', scheduleUpdate);
	currentForm.addEventListener('checked-changed', scheduleUpdate);
	currentForm.addEventListener('valid', install);
	currentForm.addEventListener('submit', expandInvalid);
	currentModal.addEventListener('show.bs.dialog', (event) => { render(event, isEditing); });
	currentModal.addEventListener('hidden.bs.dialog', restore);
	currentIconBox.addEventListener('click', (event) => {
		const popover = bootstrap.Popover.getInstance(currentIconBox);
		if (popover?.tip?.contains(event.target)) {
			return;
		}

		event.preventDefault();
		popover?.toggle();
	});
	currentModal.addEventListener('focusin', (event) => {
		if (currentIconBox.contains(event.target)) {
			return;
		}

		bootstrap.Popover.getInstance(currentIconBox)?.hide();
	});
	currentIconBox.addEventListener('shown.bs.popover', () => {
		const popover = bootstrap.Popover.getInstance(currentIconBox);
		const tip = popover?.tip;
		tip?.querySelector('.shortcut-icon-search')?.focus();
		outsideClick = (event) => {
			if (tip && !tip.contains(event.target) && !currentIconBox.contains(event.target)) {
				popover?.hide();
				document.removeEventListener('click', outsideClick);
				outsideClick = null;
			}
		};
		setTimeout(() => { if (outsideClick) { document.addEventListener('click', outsideClick); } }, 0);
	});
	currentIconBox.addEventListener('hide.bs.popover', () => {
		const popover = bootstrap.Popover.getInstance(currentIconBox);
		if (popover?.tip?.contains(document.activeElement)) {
			currentIconBox.focus();
		}
		if (outsideClick) {
			document.removeEventListener('click', outsideClick);
			outsideClick = null;
		}
	});
};

document.querySelector('body').insertAdjacentHTML('beforeend', _.template(createModalPartial)({ fields: fieldsPartial }));
document.querySelector('body').insertAdjacentHTML('beforeend', _.template(updateModalPartial)({ fields: fieldsPartial }));
initializeModal(document.querySelector('#app-custom-create'), false);
initializeModal(document.querySelector('#app-custom-edit'), true);
