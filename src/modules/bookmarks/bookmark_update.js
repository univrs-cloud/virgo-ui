import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_update.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';
import * as systemService from 'shell/services/system';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

const modal = document.querySelector('#bookmark-update');
const form = modal.closest('u-form');
const useProxyCheckbox = form.querySelector('.use-proxy');
const urlContainer = form.querySelector('.url-container');
const proxyContainer = form.querySelector('.proxy-container');
const domainSuffix = form.querySelector('.domain-suffix');

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
	const currentName = form.querySelector('.name').value;
	const bookmarks = bookmarkService.getBookmarks();
	const existingSubdomain = _.find(bookmarks, (bookmark) => {
		return bookmark.traefik?.subdomain === subdomain && bookmark.name !== currentName;
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

const updateBookmark = (event) => {
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	
	if (config.useProxy) {
		const fqdn = getFQDN();
		config.url = `https://${config.subdomain}.${fqdn}`;
		config.traefik = {
			subdomain: config.subdomain,
			backendUrl: config.backendUrl,
			isAuthRequired: config.requireAuth || false
		};
	} else {
		config.traefik = null;
	}
	
	delete config.useProxy;
	delete config.subdomain;
	delete config.backendUrl;
	delete config.requireAuth;
	
	bookmarkService.updateBookmark(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const render = (event) => {
	const name = event.relatedTarget.closest('.bookmark').dataset.name;
	const bookmark = _.find(bookmarkService.getBookmarks(), { name: name });
	form.querySelector('.name').value = bookmark.name;
	form.querySelector('.title').value = bookmark.title;
	form.querySelector('.category').value = bookmark.category;
	
	if (bookmark.traefik) {
		useProxyCheckbox.checked = true;
		form.querySelector('.subdomain').value = bookmark.traefik.subdomain;
		form.querySelector('.backend-url').value = bookmark.traefik.backendUrl;
		form.querySelector('.require-auth').checked = bookmark.traefik.isAuthRequired || false;
		toggleProxyMode(true);
	} else {
		useProxyCheckbox.checked = false;
		form.querySelector('.url').value = bookmark.url;
		toggleProxyMode(false);
	}
};

const restore = (event) => {
	form.reset();
	toggleProxyMode(false);
};

useProxyCheckbox.addEventListener('checked-changed', (event) => {
	toggleProxyMode(event.target.checked);
});

updateValidation(false);
form.addEventListener('valid', updateBookmark);
form.addEventListener('show.bs.modal', render);
form.addEventListener('hidden.bs.modal', restore);
