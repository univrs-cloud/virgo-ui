import shortcutModalPartial from 'node/modules/shortcuts/partials/modals/shortcut_create.html';
import * as shortcutService from 'node/modules/shortcuts/services/shortcut';
import * as systemService from 'node/services/system';
import * as iconPicker from 'node/modules/shortcuts/services/icon_picker';

document.querySelector('body').insertAdjacentHTML('beforeend', shortcutModalPartial);

const modal = document.querySelector('#shortcut-create');
const form = modal.querySelector('u-form');
const defaultIconSrc = iconPicker.DEFAULT_ICON;
const defaultIconUrl = new URL(defaultIconSrc, window.location.origin).href;
const useProxyCheckbox = form.querySelector('.use-proxy');
const urlContainer = form.querySelector('.url-container');
const proxyContainer = form.querySelector('.proxy-container');
const domainSuffix = form.querySelector('.domain-suffix');
const iconBox = modal.querySelector('.shortcut-icon-box');
const iconPopoverContent = modal.querySelector('.shortcut-icon-popover-content');
let iconPopoverOutsideClick = null;

new bootstrap.Popover(iconBox, {
	placement: 'left',
	title: '',
	content: iconPopoverContent.innerHTML,
	html: true,
	container: iconBox,
	sanitize: false,
	offset: [32, 0],
	trigger: 'manual'
});

iconPicker.initIconSearch(iconBox, iconPopoverContent, {
	getIconImgEl: () => form.querySelector('.shortcut-icon-img'),
	getIconInputEl: () => form.querySelector('.shortcut-icon'),
	onSelect: () => { bootstrap.Popover.getInstance(iconBox)?.hide(); }
});

const getFQDN = () => {
	return systemService.getFQDN();
};

const initDomainSuffix = () => {
	domainSuffix.textContent = `.${getFQDN()}`;
};

const toggleProxyMode = (useProxy) => {
	if (useProxy) {
		urlContainer.classList.add('d-none');
		proxyContainer.classList.remove('d-none');
	} else {
		urlContainer.classList.remove('d-none');
		proxyContainer.classList.add('d-none');
	}
	updateValidation(useProxy);
};

const isSubdomainUnique = (subdomain) => {
	const shortcuts = shortcutService.getShortcuts();
	const existingSubdomain = _.find(shortcuts, (shortcut) => {
		return shortcut.traefik?.subdomain === subdomain;
	});
	return !existingSubdomain;
};

const updateValidation = (useProxy) => {
	if (useProxy) {
		form.validation = [
			{
				selector: '.title',
				rules: {
					isEmpty: `Can't be empty`
				}
			},
			{
				selector: '.subdomain',
				rules: {
					isEmpty: `Can't be empty`,
					custom: {
						validate: (value) => isSubdomainUnique(value),
						message: `This subdomain is already in use`
					}
				}
			},
			{
				selector: '.backend-url',
				rules: {
					isEmpty: `Can't be empty`
				}
			}
		];
	} else {
		form.validation = [
			{
				selector: '.title',
				rules: {
					isEmpty: `Can't be empty`
				}
			},
			{
				selector: '.url',
				rules: {
					isEmpty: `Can't be empty`
				}
			}
		];
	}
};

const createShortcut = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let data = form.getData();
	const useProxy = (data.useProxy === 'true');
	
	if (useProxy) {
		const fqdn = getFQDN();
		data.url = `https://${data.subdomain}.${fqdn}`;
		data.traefik = {
			subdomain: data.subdomain,
			backendUrl: data.backendUrl,
			isAuthRequired: data.requireAuth === true || data.requireAuth === 'true'
		};
	} else {
		data.traefik = null;
	}
	
	delete data.useProxy;
	delete data.subdomain;
	delete data.backendUrl;
	delete data.requireAuth;
	
	shortcutService.createShortcut(data);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	form.querySelector('.shortcut-icon-img').src = defaultIconSrc;
	form.querySelector('.shortcut-icon').value = defaultIconUrl;
	toggleProxyMode(false);
};

initDomainSuffix();
form.querySelector('.shortcut-icon').value = defaultIconUrl;
updateValidation(false);

iconBox.addEventListener('click', (event) => {
	event.preventDefault();
	const popover = bootstrap.Popover.getInstance(iconBox);
	popover?.toggle();
});
iconBox.addEventListener('shown.bs.popover', () => {
	const popover = bootstrap.Popover.getInstance(iconBox);
	const tip = popover?.tip;
	tip?.querySelector('.icon-search')?.focus();
	iconPopoverOutsideClick = (event) => {
		if (tip && !tip.contains(event.target) && !iconBox.contains(event.target)) {
			popover?.hide();
			document.removeEventListener('click', iconPopoverOutsideClick);
			iconPopoverOutsideClick = null;
		}
	};
	setTimeout(() => { document.addEventListener('click', iconPopoverOutsideClick); }, 0);
});
iconBox.addEventListener('hide.bs.popover', (event) => {
	const popover = bootstrap.Popover.getInstance(iconBox);
	if (popover?.tip?.contains(document.activeElement)) {
		event.preventDefault();
	}
	if (iconPopoverOutsideClick) {
		document.removeEventListener('click', iconPopoverOutsideClick);
		iconPopoverOutsideClick = null;
	}
});
useProxyCheckbox.addEventListener('checked-changed', (event) => {
	toggleProxyMode(event.target.checked);
});
form.addEventListener('valid', createShortcut);
modal.addEventListener('hidden.bs.modal', restore);
