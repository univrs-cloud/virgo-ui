import mdom from 'morphdom';

const TOOLTIP_SELECTOR = '[data-bs-toggle="tooltip"]';

const removeTooltip = (element) => {
	const tipId = element.getAttribute('aria-describedby');
	bootstrap.Tooltip.getInstance(element)?.dispose();
	if (tipId) {
		document.getElementById(tipId)?.remove();
	}
};

const removeTooltips = (node) => {
	if (node.nodeType !== Node.ELEMENT_NODE) {
		return;
	}

	if (node.matches(TOOLTIP_SELECTOR)) {
		removeTooltip(node);
	}
	node.querySelectorAll(TOOLTIP_SELECTOR).forEach(removeTooltip);
};

const NAV_OVERFLOW_SELECTOR = '[data-bs-toggle="nav-overflow"]';
const pendingNavOverflows = new WeakMap();

const isNavOverflowOpen = (element) => {
	return Boolean(element.querySelector('.nav-overflow-menu.show'));
};

const disposeNavOverflow = (element) => {
	bootstrap.NavOverflow.getInstance(element)?.dispose();
};

const disposeNavOverflows = (node) => {
	if (node.nodeType !== Node.ELEMENT_NODE) {
		return;
	}

	if (node.matches(NAV_OVERFLOW_SELECTOR)) {
		disposeNavOverflow(node);
	}
	node.querySelectorAll(NAV_OVERFLOW_SELECTOR).forEach(disposeNavOverflow);
};

const morphdom = (fromNode, toNode, options) => {
	let onBeforeElUpdated = options?.onBeforeElUpdated;
	let onBeforeNodeDiscarded = options?.onBeforeNodeDiscarded;
	fromNode.querySelectorAll(NAV_OVERFLOW_SELECTOR).forEach((element) => {
		if (!isNavOverflowOpen(element)) {
			disposeNavOverflow(element);
		}
	});
	mdom(fromNode, toNode, {
		...options,
		onBeforeElUpdated: (fromEl, toEl) => {
			if (onBeforeElUpdated) {
				const result = onBeforeElUpdated(fromEl, toEl);
				if (result === false) {
					return false;
				}
			}

			if (fromEl.matches(NAV_OVERFLOW_SELECTOR) && isNavOverflowOpen(fromEl)) {
				pendingNavOverflows.set(fromEl, toEl);
				return false;
			}

			if (!fromEl.classList.contains('show')) {
				return;
			}

			if (fromEl.classList.contains('menu')) {
				morphdom(fromEl, toEl, { childrenOnly: true });
				return false;
			}

			if (fromEl.matches('[data-bs-toggle="menu"]')) {
				if (toEl.classList.contains('disabled') || toEl.hasAttribute('disabled')) {
					bootstrap.Menu.getInstance(fromEl)?.hide();
					return;
				}

				toEl.classList.add('show');
				toEl.setAttribute('aria-expanded', 'true');
			}
		},
		onBeforeNodeDiscarded: (node) => {
			if (onBeforeNodeDiscarded) {
				const result = onBeforeNodeDiscarded(node);
				if (result === false) {
					return false;
				}
			}

			if (node.nodeType === Node.ELEMENT_NODE && (node.classList.contains('table-scroll-overlay') || node.classList.contains('form-range-bubble') || node.classList.contains('form-range-ticks'))) {
				return false;
			}

			removeTooltips(node);
			disposeNavOverflows(node);
		}
	});
	fromNode.querySelectorAll(NAV_OVERFLOW_SELECTOR).forEach((element) => {
		bootstrap.NavOverflow.getOrCreateInstance(element);
	});
};

document.addEventListener('hidden.bs.menu', (event) => {
	const element = event.target.closest(NAV_OVERFLOW_SELECTOR);
	const pending = (element ? pendingNavOverflows.get(element) : undefined);
	if (!pending) {
		return;
	}

	pendingNavOverflows.delete(element);
	disposeNavOverflow(element);
	morphdom(element, pending);
	bootstrap.NavOverflow.getOrCreateInstance(element);
});

export default morphdom;
