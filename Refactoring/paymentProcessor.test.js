const PaymentProcessor = require("./paymentProcessor");

describe("PaymentProcessor", () => {
  let apiClient;
  let processor;

  beforeEach(() => {
    apiClient = { post: jest.fn() };
    processor = new PaymentProcessor(apiClient);
  });

  test("processes a credit card payment with valid metadata", () => {
    const metadata = { cardNumber: "1234", expiry: "12/25" };

    const tx = processor.processPayment(
      100,
      "USD",
      "user1",
      "credit_card",
      metadata,
      null,
      1
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/credit",
      expect.objectContaining({
        userId: "user1",
        originalAmount: 100
      })
    );

    expect(tx.finalAmount).toBe(100);
  });

  test("throws error for invalid credit card metadata", () => {
    const metadata = { cardNumber: "1234" }; // no expiry

    expect(() =>
      processor.processPayment(
        50,
        "USD",
        "user1",
        "credit_card",
        metadata,
        null,
        0
      )
    ).toThrow("Invalid card metadata");
  });

  test("applies SUMMER20 discount", () => {
    const metadata = { cardNumber: "1234", expiry: "12/25" };

    const tx = processor.processPayment(
      100,
      "USD",
      "user1",
      "credit_card",
      metadata,
      "SUMMER20",
      0
    );

    expect(tx.finalAmount).toBe(80); // 20% off
  });

  test("applies WELCOME10 discount", () => {
    const metadata = { cardNumber: "1234", expiry: "12/25" };

    const tx = processor.processPayment(
      50,
      "USD",
      "user1",
      "credit_card",
      metadata,
      "WELCOME10",
      0
    );

    expect(tx.finalAmount).toBe(40);
  });

  test("converts currency when not USD", () => {
    const metadata = { cardNumber: "1234", expiry: "12/25" };

    const tx = processor.processPayment(
      100,
      "EUR",
      "user1",
      "credit_card",
      metadata,
      null,
      0
    );

    expect(tx.finalAmount).toBe(100 * processor.currencyConversionRate);
  });

  test("refund processes with correct fee", () => {
    const refund = processor.refundPayment(
      "tx123",
      "user1",
      "duplicate",
      100,
      "USD",
      {}
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      "/payments/refund",
      expect.objectContaining({
        transactionId: "tx123"
      })
    );

    expect(refund.netAmount).toBe(95); // 5% fee
  });
});
