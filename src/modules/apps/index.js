import modulePartial from 'modules/apps/partials/index.html';

const moduleTemplate = _.template(modulePartial);
let container = document.querySelector('main .modules');
container.insertAdjacentHTML('beforeend', moduleTemplate());

import('modules/apps/app_center');
