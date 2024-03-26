import footerPartial from '../partials/footer.html';
import * as systemService from './services/system';

let container = document.querySelector('footer');
const template = _.template(footerPartial);

const render = (state) => {
	morphdom(container, template({ system: state.system }));
};

systemService.subscribe([render]);
