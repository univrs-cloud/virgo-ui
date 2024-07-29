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

		if (fromEl.getAttribute('data-bs-toggle') === 'tooltip') {
			mdom(fromEl, toEl, { childrenOnly: true });
			return false;
		}

		if (fromEl.classList.contains('dropdown-menu')) {
			mdom(fromEl, toEl, { childrenOnly: true });
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
