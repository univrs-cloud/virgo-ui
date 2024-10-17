import modulePartial from 'modules/smb_shares/partials/index.html';

const moduleTemplate = _.template(modulePartial);
let container = document.querySelector('main .modules');
container.insertAdjacentHTML('beforeend', moduleTemplate());
