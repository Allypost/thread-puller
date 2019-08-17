import io from 'socket.io-client';

export const socket = io(process.env.THREADPULLER_DOMAIN_PRESENCE);
