export const fetchDynamicRTCConfig = async (): Promise<RTCConfiguration> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;
    if (!apiKey) throw new Error("Metered API key missing");

    const res = await fetch(
      `https://murtazanarwar.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
    );

    if (!res.ok) throw new Error(`Failed to fetch TURN: ${res.status}`);
    
    // Metered API returns an array directly
    const iceServers: RTCIceServer[] = await res.json();

    // Always include a fallback STUN
    return { iceServers: [...iceServers, { urls: "stun:stun.l.google.com:19302" }] };
  } catch (err) {
    console.warn("Could not fetch TURN, falling back to STUN only", err);
    return { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  }
};


