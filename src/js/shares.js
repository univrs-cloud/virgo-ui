import sharesPartial from '../partials/shares.html';
import sharesEmptyPartial from '../partials/shares_empty.html';
import sharePartial from '../partials/share.html';
import * as shareService from './services/share';

const sharesTemplate = _.template(sharesPartial);
const sharesEmptyTemplate = _.template(sharesEmptyPartial);
const shareTemplate = _.template(sharePartial);
let container = document.querySelector('#shares');

const render = (state) => {
	if (_.isNull(state.shares)) {
		return;
	}

	let template = document.createElement('template');
	template.innerHTML = sharesTemplate();
	let shares = template.content.querySelector('.col');
	if (_.isEmpty(state.shares)) {
		shares.insertAdjacentHTML('beforeend', sharesEmptyTemplate());
	} else {
		_.each(state.shares, (entity) => {
			shares.insertAdjacentHTML('beforeend', shareTemplate({ entity }));
		});
	}
	morphdom(
		container,
		`<div>${template.innerHTML}</div>`,
		{
			 childrenOnly: true,
			 onBeforeElUpdated: (fromEl, toEl) => {
				if (fromEl.classList.contains('dropdown')) {
					return false;
				}

				return true;
			 }
		}
	);
};

shareService.subscribe([render]);
