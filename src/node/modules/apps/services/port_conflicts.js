const ACTIVE_STATES = ['running', 'restarting', 'paused'];

const portKeys = (ports) => {
	return _.flatMap(ports, (port) => {
		const published = (typeof port === 'string' ? port.split('/')[0] : port?.published);
		const protocol = String(typeof port === 'string' ? port.split('/')[1] : port?.protocol ?? '').toLowerCase();
		const protocols = (protocol === 'both' ? ['tcp', 'udp'] : [protocol]);
		return _.map(protocols, (value) => { return `${Number(published)}/${value}`; });
	});
};

const getPortConflictTip = (requiredPorts, containers, apps, exceptAppName, action) => {
	const required = new Set(portKeys(requiredPorts));
	if (_.isEmpty(required)) {
		return '';
	}

	const appTitles = new Map(_.map(apps, (app) => { return [_.toLower(app.name), app.title || app.name]; }));
	const conflicts = new Map();
	_.each(containers, (container) => {
		const state = _.toLower(container.state);
		if (!_.includes(ACTIVE_STATES, state)) {
			return;
		}

		const appName = String(container.labels?.comDockerComposeProject || _.trimStart(_.first(container.names) || container.id || '', '/'));
		if (_.toLower(appName) === _.toLower(exceptAppName || '')) {
			return;
		}

		const used = _.filter(container.ports, (port) => { return port.publicPort && required.has(`${Number(port.publicPort)}/${_.toLower(port.type)}`); });
		if (_.isEmpty(used)) {
			return;
		}

		const key = _.toLower(appName);
		if (!conflicts.has(key)) {
			conflicts.set(key, { title: appTitles.get(key) || appName, ports: new Set() });
		}
		_.each(used, (port) => { conflicts.get(key).ports.add(`${Number(port.publicPort)}/${_.toLower(port.type)}`); });
	});

	return _.map([...conflicts.values()], ({ title, ports }) => {
		const portList = [...ports].join(', ');
		return `${ports.size === 1 ? 'Port' : 'Ports'} ${portList} ${ports.size === 1 ? 'is' : 'are'} in use by ${title}. Stop ${title} before ${action}.`;
	}).join(' ');
};

export { getPortConflictTip };
