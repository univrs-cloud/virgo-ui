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
			this.setState(initialState, 'socket_disconnect');
		});

		this.socket.on('jobs', (jobs) => {
			this.setState({ jobs }, 'set_jobs');
		});

		this.socket.on('job', (job) => {
			let jobs = [...(this.getStateProperty('jobs') || [])];
			const index = _.findIndex(jobs, { id: job.id });
			if (index !== -1) {
				jobs[index] = job;
			} else {
				jobs.push(job);
			}
			this.setState({ jobs }, 'set_jobs');
			if (_.includes(['completed', 'failed'], job.progress?.state)) {
				const index = _.findIndex(jobs, { id: job.id });
				_.pullAt(jobs, index);
				this.setState({ jobs }, 'set_jobs');
			}
		});
	}

	getJobs() {
		return this.getStateProperty('jobs');
	}
}

export default new Job();
