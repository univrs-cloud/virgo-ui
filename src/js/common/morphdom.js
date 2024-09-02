import mdom from 'morphdom';

const morphdom = (fromNode, toNode, options) => {
	let onBeforeElUpdated = options?.onBeforeElUpdated;
	options = options || {};
	options.onBeforeElUpdated = (fromEl, toEl) => {
		if (onBeforeElUpdated) {
			let result = onBeforeElUpdated(fromEl, toEl);
			if (result === false) {
				return false;
			}
		}

		if (fromEl.hasAttribute('data-bs-toggle') && (fromEl.getAttribute('data-bs-toggle') === 'tooltip' || fromEl.getAttribute('data-bs-toggle') === 'popover' || fromEl.getAttribute('data-bs-toggle') === 'tab')) {
			morphdom(fromEl, toEl, { childrenOnly: true });
			return false;
		}

		if (fromEl.classList.contains('dropdown-menu')) {
			morphdom(fromEl, toEl, { childrenOnly: true });
		}
		if ((fromEl.getAttribute('data-bs-toggle') === 'dropdown' || fromEl.classList.contains('dropdown-menu')) && fromEl.classList.contains('show')) {
			return false;
		}
	};

	return mdom(fromNode, toNode, options);
};

export {
	morphdom
};
