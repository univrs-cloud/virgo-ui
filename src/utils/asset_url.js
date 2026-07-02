const getSelectedNodeId = () => {
	return localStorage.getItem('virgo.selectedNodeId') || null;
};

const assetUrl = (path) => {
	if (!path || path.includes('://')) {
		return path;
	}
	if (window.isFleetMode && path.startsWith('/assets/img/')) {
		const nodeId = getSelectedNodeId();
		const match = path.match(/^\/assets\/img\/(apps|bookmarks)\/(.+)$/);
		if (nodeId && match) {
			return `/assets/fleet/${nodeId}/img/${match[1]}/${match[2]}`;
		}
	}
	return path;
};

const assetIcon = (icon, type) => {
	if (!icon) {
		return assetUrl('/assets/img/virgo.svg');
	}
	return assetUrl(icon.includes('/') ? icon : `/assets/img/${type}/${icon}`);
};

export {
	assetUrl,
	assetIcon
};
