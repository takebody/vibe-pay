import { prisma } from "@/lib/prisma";

export const DEFAULT_TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";
export const DEFAULT_TOSS_SECRET_KEY =
  process.env.TOSS_SECRET_KEY || "test_sk_zXLkKEypNArWmo50nX3mqGbpgm79";

export interface TossPaymentResponse {
  mId?: string;
  version?: string;
  paymentKey: string;
  status: string;
  lastTransactionKey?: string;
  orderId: string;
  orderName: string;
  requestedAt?: string;
  approvedAt?: string;
  useEscrow?: boolean;
  cultureExpense?: boolean;
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
    isInterestFree: boolean;
    approveNo: string;
    useCardPoint: boolean;
    cardType: string;
    ownerType: string;
    acquireStatus: string;
    receiptUrl: string;
  };
  easyPay?: {
    provider: string;
    amount: number;
    discountAmount: number;
  };
  cancels?: Array<{
    cancelAmount: number;
    cancelReason: string;
    taxFreeAmount: number;
    taxExemptionAmount: number;
    refundableAmount: number;
    easyPayDiscountAmount: number;
    canceledAt: string;
    transactionKey: string;
  }>;
  secret?: string;
  type?: string;
  country?: string;
  currency?: string;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount?: number;
  vat?: number;
  taxFreeAmount?: number;
  method?: string;
  receipt?: {
    url: string;
  };
}

export async function getActiveTossKeys(): Promise<{
  clientKey: string;
  secretKey: string;
  isCustom: boolean;
}> {
  try {
    const [clientConfig, secretConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "TOSS_CLIENT_KEY" } }),
      prisma.systemConfig.findUnique({ where: { key: "TOSS_SECRET_KEY" } }),
    ]);

    const clientKey = clientConfig?.value || DEFAULT_TOSS_CLIENT_KEY;
    const secretKey = secretConfig?.value || DEFAULT_TOSS_SECRET_KEY;
    const isCustom = Boolean(clientConfig?.value || secretConfig?.value);

    return { clientKey, secretKey, isCustom };
  } catch (e) {
    console.error("Error reading systemConfig for Toss keys:", e);
    return {
      clientKey: DEFAULT_TOSS_CLIENT_KEY,
      secretKey: DEFAULT_TOSS_SECRET_KEY,
      isCustom: false,
    };
  }
}

export async function getTossAuthHeader(): Promise<string> {
  const { secretKey } = await getActiveTossKeys();
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY is not configured");
  }
  // Toss Payments requires Basic Auth with secretKey + ":" base64 encoded
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function confirmTossPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossPaymentResponse> {
  const authHeader = await getTossAuthHeader();

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || "토스 결제 승인 요청 중 오류가 발생했습니다.";
    const errorCode = data.code || "PAYMENT_CONFIRM_FAILED";
    const error = new Error(`[${errorCode}] ${errorMsg}`);
    (error as unknown as { status: number; code: string }).status = response.status;
    (error as unknown as { status: number; code: string }).code = errorCode;
    throw error;
  }

  return data as TossPaymentResponse;
}

export async function cancelTossPayment(params: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}): Promise<TossPaymentResponse> {
  const { paymentKey, cancelReason, cancelAmount } = params;
  const payload: Record<string, unknown> = {
    cancelReason,
  };
  if (cancelAmount && cancelAmount > 0) {
    payload.cancelAmount = cancelAmount;
  }

  const authHeader = await getTossAuthHeader();

  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || "토스 결제 취소 요청 중 오류가 발생했습니다.";
    const errorCode = data.code || "PAYMENT_CANCEL_FAILED";
    const error = new Error(`[${errorCode}] ${errorMsg}`);
    (error as unknown as { status: number; code: string }).status = response.status;
    (error as unknown as { status: number; code: string }).code = errorCode;
    throw error;
  }

  return data as TossPaymentResponse;
}
