import modulePartial from 'modules/settings/partials/index.html';

const moduleTemplate = _.template(modulePartial);
let container = document.querySelector('main .modules');
container.insertAdjacentHTML('beforeend', moduleTemplate());

import('modules/settings/power');
import('modules/settings/configuration');
