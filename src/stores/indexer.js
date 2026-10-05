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

	browse(config) {
		return this.socket.timeout(30000).emitWithAck('indexer:browse', config);
	}

	browseChanges(config) {
		return this.socket.timeout(30000).emitWithAck('indexer:browse:changes', config);
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

	restoreSelection(config) {
		return this.socket.timeout(30000).emitWithAck('indexer:restore:selection', config);
	}
}

export default new Indexer();
