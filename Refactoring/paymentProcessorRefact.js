const DISCOUNTS = {
  SUMMER20: 0.2,
  WELCOME10: 10,
};

const FRAUD_LIMIT = 100;
const LIGHT_RISK_LIMIT = 10;
const HEAVY_RISK_LIMIT = 1000;
const CURRENCY_RATE = 1.2;
const REFUND_FEE_PERCENT = 0.05;

class FraudChecker {
  check(amount, userId) {
    if (amount < FRAUD_LIMIT) {
      return this.lightCheck(userId, amount);
    }
    return this.heavyCheck(userId, amount);
  }

  lightCheck(userId, amount) {
    console.log(`Light fraud check for user ${userId} on amount ${amount}`);
    if (amount < LIGHT_RISK_LIMIT) console.log("Very low risk");
    else console.log("Low risk");
  }

  heavyCheck(userId, amount) {
    console.log(`Heavy fraud check for user ${userId} on amount ${amount}`);
    if (amount < HEAVY_RISK_LIMIT) console.log("Medium risk");
    else console.log("High risk");
  }
}

class DiscountService {
  apply(amount, code) {
    if (!code) return amount;
    if (DISCOUNTS[code] === undefined) {
      console.log("Unknown discount code");
      return amount;
    }
    if (DISCOUNTS[code] < 1) {
      return amount * (1 - DISCOUNTS[code]);
    }
    return amount - DISCOUNTS[code];
  }
}

class CurrencyService {
  convert(amount, currency) {
    if (currency === "USD") return amount;
    return amount * CURRENCY_RATE;
  }
}

class PaymentValidator {
  validate(method, metadata) {
    const validators = {
      credit_card: () => {
        if (!metadata.cardNumber || !metadata.expiry)
          throw new Error("Invalid card metadata");
      },

      paypal: () => {
        if (!metadata.paypalAccount)
          throw new Error("Invalid PayPal metadata");
      },
    };

    if (!validators[method]) throw new Error("Unsupported payment method");

    validators[method]();
  }
}

class PaymentProcessor {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.validator = new PaymentValidator();
    this.currency = new CurrencyService();
    this.discount = new DiscountService();
    this.fraud = new FraudChecker();
  }

  processPayment({
    amount,
    currency,
    userId,
    paymentMethod,
    metadata,
    discountCode,
    fraudCheckLevel,
  }) {
    this.validator.validate(paymentMethod, metadata);

    if (fraudCheckLevel > 0) {
      this.fraud.check(amount, userId);
    }

    let finalAmount = this.discount.apply(amount, discountCode);
    finalAmount = this.currency.convert(finalAmount, currency);

    const transaction = {
      userId,
      originalAmount: amount,
      finalAmount,
      currency,
      paymentMethod,
      metadata,
      discountCode,
      fraudChecked: fraudCheckLevel,
      timestamp: new Date().toISOString(),
    };

    this.apiClient.post(`/payments/${paymentMethod}`, transaction);

    console.log("Payment sent to API:", transaction);

    this.sendConfirmationEmail(userId, finalAmount, currency);
    this.logAnalytics({
      userId,
      amount: finalAmount,
      currency,
      method: paymentMethod,
    });

    return transaction;
  }

  sendConfirmationEmail(userId, amount, currency) {
    console.log(
      `Email to ${userId}: Your payment of ${amount} ${currency} was successful`
    );
  }

  logAnalytics(data) {
    console.log("Analytics event:", data);
  }

  refundPayment({ transactionId, userId, reason, amount, currency, metadata }) {
    const refundFee = amount * REFUND_FEE_PERCENT;

    const refund = {
      transactionId,
      userId,
      reason,
      amount,
      currency,
      metadata,
      netAmount: amount - refundFee,
      date: new Date().toISOString(),
    };

    this.apiClient.post("/payments/refund", refund);

    console.log("Refund processed:", refund);
    return refund;
  }
}

module.exports = PaymentProcessor;
