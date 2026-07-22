import modulePartial from 'node/modules/dashboard/partials/index.html';

const moduleTemplate = _.template(modulePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());

import('node/modules/dashboard/resources_monitor');
import('node/modules/dashboard/apps_bookmarks');
import('node/modules/dashboard/shares');
