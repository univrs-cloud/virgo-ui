import modulePartial from 'modules/fleet_empty/partials/index.html';

const moduleTemplate = _.template(modulePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
