class PaymentProcessor {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.currencyConversionRate = 1.2; // magic number
  }

  processPayment(
    amount,
    currency,
    userId,
    paymentMethod,
    metadata,
    discountCode,
    fraudCheckLevel
  ) {
    // Long method: does many things
    // Too many parameters

    // 1. Validate payment method
    if (paymentMethod === "credit_card") {
      if (!metadata.cardNumber || !metadata.expiry) {
        throw new Error("Invalid card metadata");
      }
    } else if (paymentMethod === "paypal") {
      if (!metadata.paypalAccount) {
        throw new Error("Invalid PayPal metadata");
      }
    } else {
      throw new Error("Unsupported payment method");
    }

    // 2. Check for fraud
    if (fraudCheckLevel > 0) {
      // duplicated logic for small or large amount
      if (amount < 100) {
        console.log("Performing light fraud check for small payment");
        this._lightFraudCheck(userId, amount);
      } else {
        console.log("Performing heavy fraud check for large payment");
        this._heavyFraudCheck(userId, amount);
      }
    }

    // 3. Apply discount
    let finalAmount = amount;
    if (discountCode) {
      if (discountCode === "SUMMER20") {
        finalAmount = amount * 0.8; // magic number
      } else if (discountCode === "WELCOME10") {
        finalAmount = amount - 10; // magic number
      } else {
        console.log("Unknown discount code");
      }
    }

    // 4. Convert currency, if needed
    if (currency !== "USD") {
      finalAmount = finalAmount * this.currencyConversionRate; // magic number
    }

    // 5. Create transaction object
    const transaction = {
      userId: userId,
      originalAmount: amount,
      finalAmount: finalAmount,
      currency: currency,
      paymentMethod: paymentMethod,
      metadata: metadata,
      discountCode: discountCode,
      fraudChecked: fraudCheckLevel,
      timestamp: new Date().toISOString(),
    };

    // 6. Send to API
    try {
      // duplicated code: two very similar API calls
      if (paymentMethod === "credit_card") {
        this.apiClient.post("/payments/credit", transaction);
      } else if (paymentMethod === "paypal") {
        this.apiClient.post("/payments/paypal", transaction);
      }
      console.log("Payment sent to API:", transaction);
    } catch (err) {
      console.error("Failed to send payment:", err);
      throw err;
    }

    // 7. Send confirmation email
    this._sendConfirmationEmail(userId, finalAmount, currency);

    // 8. Log analytics
    this._logAnalytics({
      userId,
      amount: finalAmount,
      currency,
      method: paymentMethod,
    });

    return transaction;
  }

  _lightFraudCheck(userId, amount) {
    // pretend logic
    console.log(`Light fraud check for user ${userId} on amount ${amount}`);
    // duplicated code with heavyFraudCheck?
    if (amount < 10) {
      console.log("Very low risk");
    } else {
      console.log("Low risk");
    }
  }

  _heavyFraudCheck(userId, amount) {
    console.log(`Heavy fraud check for user ${userId} on amount ${amount}`);
    // duplicated logic again
    if (amount < 1000) {
      console.log("Medium risk");
    } else {
      console.log("High risk");
    }
  }

  _sendConfirmationEmail(userId, amount, currency) {
    // In real code, you'd send an email. Here it just prints.
    console.log(
      `Sending email to user ${userId}: Your payment of ${amount} ${currency} was successful.`
    );
  }

  _logAnalytics(data) {
    // God service smell: this class is doing analytics too
    console.log("Analytics event:", data);
  }

  refundPayment(transactionId, userId, reason, amount, currency, metadata) {
    // Another method with many params (too many parameters)
    const refund = {
      transactionId,
      userId,
      reason,
      amount,
      currency,
      metadata,
      date: new Date(),
    };

    // Magic number for refund fee percentage
    const refundFee = amount * 0.05;

    refund.netAmount = amount - refundFee;

    // duplicated code: sending via API again
    this.apiClient.post("/payments/refund", refund);

    console.log("Refund processed:", refund);
    return refund;
  }
}

module.exports = PaymentProcessor;
