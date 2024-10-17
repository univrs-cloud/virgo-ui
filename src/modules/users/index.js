import modulePartial from 'modules/users/partials/index.html';

const moduleTemplate = _.template(modulePartial);
let container = document.querySelector('main .modules');
container.insertAdjacentHTML('beforeend', moduleTemplate());
