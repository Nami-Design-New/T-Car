import "server-only";
import { auth } from "@/auth";
import { protectedRead } from "@/services/http/session";
import { AppError } from "@/shared/lib/errors";
import { walletApi } from "./api";
import type { WalletData } from "./model";

/** The signed-in customer's wallet summary and transaction history. */
export function getWallet(): Promise<WalletData> {
  return protectedRead(async () => {
    const session = await auth();
    if (!session?.user?.id) throw new AppError("unauthorized");
    return walletApi.getWallet();
  });
}
