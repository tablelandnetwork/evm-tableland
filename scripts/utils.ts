import type { EventLog, Log } from "ethers";

export function isEventLog(log: EventLog | Log): log is EventLog {
  return "args" in log;
}
