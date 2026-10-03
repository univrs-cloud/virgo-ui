import Store from 'stores/store';

class Indexer extends Store {
	constructor() {
		super({
			namespace: 'indexer',
		});
	}

	search(query) {
		return this.socket.timeout(30000).emitWithAck('indexer:search', query);
	}

	getRestoreFolders(path) {
		return this.socket.timeout(30000).emitWithAck('indexer:restore:folders', { path });
	}

	inspectRestore(config) {
		return this.socket.timeout(30000).emitWithAck('indexer:restore:inspect', config);
	}

	restore(config) {
		return this.socket.timeout(30000).emitWithAck('indexer:restore', config);
	}
}

export default new Indexer();
