import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_create.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';
import * as systemService from 'shell/services/system';
import * as iconPicker from 'modules/bookmarks/services/icon_picker';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

const modal = document.querySelector('#bookmark-create');
const form = modal.querySelector('u-form');
const useProxyCheckbox = form.querySelector('.use-proxy');
const urlContainer = form.querySelector('.url-container');
const proxyContainer = form.querySelector('.proxy-container');
const domainSuffix = form.querySelector('.domain-suffix');

const iconBox = modal.querySelector('.bookmark-icon-box');
const iconPopoverContent = modal.querySelector('.bookmark-icon-popover-content');
new bootstrap.Popover(iconBox, {
	placement: 'left',
	title: '',
	content: iconPopoverContent.innerHTML,
	html: true,
	container: iconBox,
	sanitize: false,
	offset: [28, 0],
	trigger: 'manual'
});
iconBox.addEventListener('click', (event) => {
	event.preventDefault();
	const popover = bootstrap.Popover.getInstance(iconBox);
	popover?.toggle();
});
let iconPopoverOutsideClick = null;
iconBox.addEventListener('shown.bs.popover', () => {
	const popover = bootstrap.Popover.getInstance(iconBox);
	const tip = popover?.tip;
	tip?.querySelector('.icon-search')?.focus();
	iconPopoverOutsideClick = (e) => {
		if (tip && !tip.contains(e.target) && !iconBox.contains(e.target)) {
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
iconPicker.initIconSearch(iconBox, iconPopoverContent, {
	getIconImgEl: () => form.querySelector('.bookmark-icon-img'),
	getIconInputEl: () => form.querySelector('.icon'),
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

// Initialize domain suffix early so u-input renders correctly
initDomainSuffix();

const isSubdomainUnique = (subdomain) => {
	const bookmarks = bookmarkService.getBookmarks();
	const existingSubdomain = _.find(bookmarks, (bookmark) => {
		return bookmark.traefik?.subdomain === subdomain;
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
						message: 'This subdomain is already in use'
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

const createBookmark = (event) => {
	_.each(form.querySelectorAll('.modal-footer u-button'), (button) => { button.disabled = true; });
	let config = form.getData();
	delete config.iconSearch;
	const useProxy = (config.useProxy === 'true');
	
	if (useProxy) {
		const fqdn = getFQDN();
		config.url = `https://${config.subdomain}.${fqdn}`;
		config.traefik = {
			subdomain: config.subdomain,
			backendUrl: config.backendUrl,
			isAuthRequired: config.requireAuth === true || config.requireAuth === 'true'
		};
	} else {
		config.traefik = null;
	}
	
	delete config.useProxy;
	delete config.subdomain;
	delete config.backendUrl;
	delete config.requireAuth;
	
	bookmarkService.createBookmark(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	form.querySelector('.bookmark-icon-img').src = iconPicker.getIconSrc('');
	form.querySelector('.icon').value = '';
	toggleProxyMode(false);
};

useProxyCheckbox.addEventListener('checked-changed', (event) => {
	toggleProxyMode(event.target.checked);
});

updateValidation(false);
form.addEventListener('valid', createBookmark);
modal.addEventListener('hidden.bs.modal', restore);
