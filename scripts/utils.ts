import { ethers } from "hardhat";
import { EventLog, Log, FeeData } from "ethers";

/**
 * Response for current gas fee data from the Amoy gas station API at:
 * https://gasstation-testnet.polygon.technology/amoy
 */
interface AmoyFeeData {
  safeLow: {
    maxPriorityFee: number;
    maxFee: number;
  };
  standard: {
    maxPriorityFee: number;
    maxFee: number;
  };
  fast: {
    maxPriorityFee: number;
    maxFee: number;
  };
  estimatedBaseFee: number;
  blockTime: number;
  blockNumber: number;
}

/**
 * Fetches the current gas fee data from the Amoy Gas Station API.
 * @param url Amoy gas station API URL.
 * @returns Current gas fee information or `null` (to align with ethers
 * `getFeeData` method return type)
 */
export async function getFeeData(chainName: string): Promise<FeeData> {
  if (chainName === "polygon-amoy") {
    try {
      const url = "https://gasstation-testnet.polygon.technology/amoy";
      const response = await fetch(url);
      const data = (await response.json()) as AmoyFeeData;
      const feeData = new FeeData(
        null, // No gas price value needed
        BigInt(ethers.parseUnits(String(data.fast.maxFee), "gwei")),
        BigInt(ethers.parseUnits(String(data.fast.maxPriorityFee), "gwei"))
      );
      return feeData;
    } catch {
      const feeData = new FeeData();
      return feeData;
    }
  } else {
    return await ethers.provider.getFeeData();
  }
}

/**
 * Helpers to parse logs from a transaction receipt and ensure only `EventLog`
 * types are returned.
 * @param log Response from awaiting transaction receipt.
 * @returns Array of `EventLog` types.
 */
export function isEventLog(log: EventLog | Log): log is EventLog {
  return "args" in log;
}
