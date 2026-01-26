import bookmarkModalPartial from 'modules/bookmarks/partials/modals/bookmark_create.html';
import * as bookmarkService from 'modules/bookmarks/services/bookmark';
import * as systemService from 'shell/services/system';

document.querySelector('body').insertAdjacentHTML('beforeend', bookmarkModalPartial);

const modal = document.querySelector('#bookmark-create');
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
	const buttons = form.querySelectorAll('button');
	_.each(buttons, (button) => { button.disabled = true; });
	let config = form.getData();
	const useProxy = config.useProxy === true || config.useProxy === 'true';
	
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
	
	console.log('createBookmark', config);
	bookmarkService.createBookmark(config);
	bootstrap.Modal.getInstance(modal)?.hide();
};

const restore = (event) => {
	form.reset();
	toggleProxyMode(false);
};

useProxyCheckbox.addEventListener('checked-changed', (event) => {
	toggleProxyMode(event.target.checked);
});

updateValidation(false);
form.addEventListener('valid', createBookmark);
form.addEventListener('hidden.bs.modal', restore);
