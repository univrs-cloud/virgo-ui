import Indexer from 'stores/indexer';

const searchSnapshots = (query) => {
	return Indexer.search(query);
};

const browseSnapshot = (config) => {
	return Indexer.browse(config);
};

const browseSnapshotChanges = (config) => {
	return Indexer.browseChanges(config);
};

const getRestoreFolders = (path) => {
	return Indexer.getRestoreFolders(path);
};

const inspectRestore = (config) => {
	return Indexer.inspectRestore(config);
};

const restoreSnapshotFile = (config) => {
	return Indexer.restore(config);
};

const restoreSnapshotSelection = (config) => {
	return Indexer.restoreSelection(config);
};

export {
	searchSnapshots,
	browseSnapshot,
	browseSnapshotChanges,
	getRestoreFolders,
	inspectRestore,
	restoreSnapshotFile,
	restoreSnapshotSelection
};
