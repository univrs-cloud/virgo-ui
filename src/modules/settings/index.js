import modulePartial from 'modules/settings/partials/index.html';

const moduleTemplate = _.template(modulePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());

import('modules/settings/power');
import('modules/settings/configuration');
