import modulePartial from 'modules/dashboard/partials/index.html';

const moduleTemplate = _.template(modulePartial);
let container = document.querySelector('main .modules');
container.insertAdjacentHTML('beforeend', moduleTemplate());

import('modules/dashboard/resources_monitor');
import('modules/dashboard/apps_bookmarks');
import('modules/dashboard/shares');
