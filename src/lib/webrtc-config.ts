export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:relay1.expressturn.com:3478",
      username: "000000002072432149",
      credential: "xVwyRmW9bs6VA7syaq4+rsh9YBQ="
    }
  ]
};
