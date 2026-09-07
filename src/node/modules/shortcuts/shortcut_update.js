import shortcutModalPartial from 'node/modules/shortcuts/partials/modals/shortcut_update.html';
import * as shortcutService from 'node/modules/shortcuts/services/shortcut';
import * as systemService from 'node/services/system';
import * as iconPicker from 'node/modules/shortcuts/services/icon_picker';

document.querySelector('body').insertAdjacentHTML('beforeend', shortcutModalPartial);

const modal = document.querySelector('#shortcut-update');
const form = modal.querySelector('u-form');
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
	const currentName = form.querySelector('.name').value;
	const shortcuts = shortcutService.getShortcuts();
	const existingSubdomain = _.find(shortcuts, (shortcut) => {
		return shortcut.traefik?.subdomain === subdomain && shortcut.name !== currentName;
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

const updateShortcut = (event) => {
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
	
	shortcutService.updateShortcut(data);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const name = event.relatedTarget.closest('.item').dataset.name;
	const shortcut = _.find(shortcutService.getShortcuts(), { name: name });
	form.querySelector('.name').value = shortcut.name;
	form.querySelector('.title').value = shortcut.title;
	form.querySelector('.category').value = shortcut.category;
	form.querySelector('.shortcut-icon-img').src = `assets/img/shortcuts/${shortcut.icon}`;
	if (shortcut.traefik) {
		useProxyCheckbox.checked = true;
		form.querySelector('.subdomain').value = shortcut.traefik.subdomain;
		form.querySelector('.backend-url').value = shortcut.traefik.backendUrl;
		form.querySelector('.require-auth').checked = shortcut.traefik.isAuthRequired || false;
		toggleProxyMode(true);
	} else {
		useProxyCheckbox.checked = false;
		form.querySelector('.url').value = shortcut.url;
		toggleProxyMode(false);
	}
};

const restore = (event) => {
	form.reset();
	form.querySelector('.shortcut-icon-img').src = iconPicker.DEFAULT_ICON;
	form.querySelector('.shortcut-icon').value = '';
	toggleProxyMode(false);
};

initDomainSuffix();
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
form.addEventListener('valid', updateShortcut);
modal.addEventListener('show.bs.modal', render);
modal.addEventListener('hidden.bs.modal', restore);
