import { configureRealtime, reconnectRealtime } from "./liveClient";
import { getApiBaseUrl } from "../config/env";

let getToken = () => null;
let socketToken;

configureRealtime({ url: getApiBaseUrl(), getToken: () => getToken() });

export function setRealtimeTokenSource(source) {
  getToken = source;
}

/** Re-authenticate the shared socket when the signed-in account changes. */
export function syncRealtimeToken() {
  const token = getToken() || null;
  if (socketToken !== undefined && token !== socketToken) reconnectRealtime();
  socketToken = token;
}
