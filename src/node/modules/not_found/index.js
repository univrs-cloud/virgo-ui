import modulePartial from 'node/modules/not_found/partials/index.html';
import notFoundImage from 'assets/img/empty/not-found.svg';

const moduleTemplate = _.template(modulePartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate({ notFoundImage }));
