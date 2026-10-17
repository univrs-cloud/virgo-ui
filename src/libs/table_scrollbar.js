const instances = new Map();

const attach = (scroller) => {
	const controller = new AbortController();
	const { signal } = controller;
	const overlay = document.createElement('div');
	overlay.className = 'table-scroll-overlay';
	overlay.innerHTML = '<div class="table-scrollbar d-none"><div class="table-scrollbar-thumb"></div></div>';
	const scrollbar = overlay.firstElementChild;
	const thumb = scrollbar.firstElementChild;
	let dragStartY = null;
	let dragStartScrollTop = 0;

	const getHeadHeight = () => {
		const thead = scroller.querySelector('thead');
		return (thead && getComputedStyle(thead).position === 'sticky' ? thead.offsetHeight : 0);
	};

	const getScrollRange = () => {
		return scroller.scrollHeight - scroller.clientHeight;
	};

	const update = () => {
		if (scroller.nextElementSibling !== overlay) {
			scroller.after(overlay);
		}

		const headHeight = getHeadHeight();
		const scrollRange = (getComputedStyle(scroller).overflowY === 'hidden' ? 0 : getScrollRange());
		overlay.style.top = `${scroller.offsetTop}px`;
		overlay.style.left = `${scroller.offsetLeft}px`;
		overlay.style.width = `${scroller.offsetWidth}px`;
		overlay.style.height = `${scroller.clientHeight}px`;
		overlay.style.setProperty('--table-scroll-head-height', `${headHeight}px`);
		overlay.style.setProperty('--table-scroll-padding-right', getComputedStyle(scroller).paddingRight);
		overlay.classList.toggle('has-scroll-above', scroller.scrollTop > 0);
		overlay.classList.toggle('has-scroll-below', scroller.scrollTop < scrollRange - 1);
		scrollbar.classList.toggle('d-none', scrollRange <= 0);
		if (scrollRange <= 0) {
			return;
		}

		const trackHeight = scrollbar.clientHeight;
		const thumbHeight = Math.max(30, ((scroller.clientHeight - headHeight) / (scroller.scrollHeight - headHeight)) * trackHeight);
		thumb.style.height = `${thumbHeight}px`;
		thumb.style.top = `${(scroller.scrollTop / scrollRange) * (trackHeight - thumbHeight)}px`;
	};

	const wheel = (event) => {
		event.preventDefault();
		scroller.scrollTop += event.deltaY;
	};

	const jump = (event) => {
		if (event.target === thumb) {
			return;
		}

		const clickY = event.clientY - scrollbar.getBoundingClientRect().top;
		scroller.scrollTop = ((clickY - thumb.offsetHeight / 2) / (scrollbar.clientHeight - thumb.offsetHeight)) * getScrollRange();
	};

	const dragStart = (event) => {
		event.preventDefault();
		dragStartY = event.clientY;
		dragStartScrollTop = scroller.scrollTop;
		thumb.classList.add('dragging');
	};

	const drag = (event) => {
		if (_.isNull(dragStartY)) {
			return;
		}

		scroller.scrollTop = dragStartScrollTop + (event.clientY - dragStartY) * (getScrollRange() / (scrollbar.clientHeight - thumb.offsetHeight));
	};

	const dragEnd = () => {
		dragStartY = null;
		thumb.classList.remove('dragging');
	};

	const resizeObserver = new ResizeObserver(update);
	resizeObserver.observe(scroller);
	_.each(scroller.children, (child) => { resizeObserver.observe(child); });
	scroller.addEventListener('scroll', update, { signal });
	scrollbar.addEventListener('wheel', wheel, { signal, passive: false });
	scrollbar.addEventListener('click', jump, { signal });
	thumb.addEventListener('mousedown', dragStart, { signal });
	document.addEventListener('mousemove', drag, { signal });
	document.addEventListener('mouseup', dragEnd, { signal });
	update();

	return {
		update,
		detach: () => {
			controller.abort();
			resizeObserver.disconnect();
			overlay.remove();
		}
	};
};

let isScanQueued = false;

const scan = () => {
	isScanQueued = false;
	instances.forEach((instance, scroller) => {
		if (!scroller.isConnected || !scroller.classList.contains('table-scroll')) {
			instance.detach();
			instances.delete(scroller);
		}
	});
	_.each(document.querySelectorAll('.table-scroll'), (scroller) => {
		if (instances.has(scroller)) {
			instances.get(scroller).update();
			return;
		}

		instances.set(scroller, attach(scroller));
	});
};

const queueScan = () => {
	if (isScanQueued) {
		return;
	}

	isScanQueued = true;
	requestAnimationFrame(scan);
};

new MutationObserver(queueScan).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
queueScan();
