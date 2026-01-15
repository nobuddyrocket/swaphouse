// Socket.IO Client Wrapper
const SocketManager = {
  socket: null,

  init() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return this.socket;
  },

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  },

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  },

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  },

  getId() {
    return this.socket ? this.socket.id : null;
  }
};
