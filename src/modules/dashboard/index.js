import modulePartial from 'modules/dashboard/partials/index.html';

const moduleTemplate = _.template(modulePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());

import('modules/dashboard/metrics');
import('modules/dashboard/resources_monitor');
import('modules/dashboard/apps_bookmarks');
import('modules/dashboard/shares');
