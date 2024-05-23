import Store from "./store";

class Share extends Store {
	constructor() {
		const initialState = {
			shares: null
		};
		super({
			namespace: 'share'
		});

		this.setState(initialState, 'socket_connect');

		this.socket.on('disconnect', () => {
			_.each(_.keys(initialState), (key) => { initialState[key] = false; });
			this.setState(initialState, 'socket_disconnect');
			_.each(_.keys(initialState), (key) => { initialState[key] = null; });
		});

		this.socket.on('shares', (shares) => {
			// shares = [
			// 	{
			// 		name: 'downloads',
			// 		isPrivate: false,
			// 		cap: 47
			// 	},
			// 	{
			// 		name: 'time machine user 1',
			// 		isPrivate: true,
			// 		cap: 22
			// 	},
			// 	{
			// 		name: 'time machine user 2',
			// 		isPrivate: true,
			// 		cap: 33
			
			// 	}
			// ];
			this.setState({ shares }, 'set_shares');
		});
	}
}

export default new Share();
