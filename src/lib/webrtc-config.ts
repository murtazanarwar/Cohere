export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // add TURN server in production:
    // { urls: 'turn:your.turn.server:3478', username: 'user', credential: 'pass' }
  ],
};
