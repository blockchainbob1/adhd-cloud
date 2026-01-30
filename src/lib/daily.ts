const DAILY_API_KEY = process.env.DAILY_API_KEY!;
const DAILY_API_URL = "https://api.daily.co/v1";

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: Record<string, unknown>;
}

interface DailyToken {
  token: string;
}

export async function createDailyRoom(appointmentId: string): Promise<DailyRoom> {
  const roomName = `adhd-${appointmentId.slice(0, 8)}`;

  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        enable_screenshare: true,
        enable_chat: true,
        max_participants: 2,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 3, // 3 hours from now
        enable_knocking: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    // If room already exists, try to get it
    if (response.status === 400) {
      return getDailyRoom(roomName);
    }
    throw new Error(`Failed to create Daily room: ${response.statusText}`);
  }

  return response.json();
}

export async function getDailyRoom(roomName: string): Promise<DailyRoom> {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Daily room: ${response.statusText}`);
  }

  return response.json();
}

export async function createMeetingToken(
  roomName: string,
  participantName: string,
  isOwner: boolean = false
): Promise<DailyToken> {
  const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_name: participantName,
        is_owner: isOwner,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 3, // 3 hours
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create meeting token: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteDailyRoom(roomName: string): Promise<void> {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Daily room: ${response.statusText}`);
  }
}
