import Store from 'stores/store';

class Job extends Store {
	constructor() {
		const initialState = {
			jobs: []
		};
		super({
			namespace: 'job'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			if (this.getStateProperty('reboot') || this.getStateProperty('shutdown') || !_.isNull(this.getStateProperty('upgrade'))) {
				return;
			}

			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});

		// this.socket.on('jobs', (jobs) => {
		// 	this.setState({ jobs }, 'set_jobs');
		// });

		this.socket.on('job', (job) => {
			let jobs = this.getStateProperty('jobs');
			const index = _.findIndex(jobs, { id: job.id });
			if (index !== -1) {
				jobs[index] = job;
			} else {
				jobs.push(job);
			}
			this.setState({ jobs }, 'set_jobs');
		});
	}

	getJobs() {
		return this.getStateProperty('jobs');
	}
}

export default new Job();
