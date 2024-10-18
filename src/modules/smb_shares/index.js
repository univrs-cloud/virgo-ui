import modulePartial from 'modules/smb_shares/partials/index.html';

const moduleTemplate = _.template(modulePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
