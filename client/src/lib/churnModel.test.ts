import { describe, expect, it } from "vitest";
import { predictCustomer } from "./churnModel";

describe("portable churn model", () => {
  it("scores the demo customer as high-risk churn using the trained model", () => {
    const result = predictCustomer({
      customerID: "demo-001",
      gender: "Female",
      SeniorCitizen: 0,
      Partner: "No",
      Dependents: "No",
      tenure: 2,
      PhoneService: "Yes",
      MultipleLines: "No",
      MonthlyCharges: 95,
      TotalCharges: 190,
      Contract: "Month-to-month",
      InternetService: "Fiber optic",
      OnlineSecurity: "No",
      OnlineBackup: "No",
      DeviceProtection: "No",
      TechSupport: "No",
      StreamingTV: "No",
      StreamingMovies: "No",
      PaperlessBilling: "Yes",
      PaymentMethod: "Electronic check",
    });
    expect(result.prediction).toBe("Churn");
    expect(result.riskLevel).toBe("High");
    expect(result.probability).toBeCloseTo(0.858, 2);
    expect(result.topFactors.length).toBeGreaterThan(0);
  });

  it("returns a bounded probability and documented risk category", () => {
    const result = predictCustomer({ tenure: 72, MonthlyCharges: 50, TotalCharges: 3600, Contract: "Two year", InternetService: "DSL", PaymentMethod: "Credit card (automatic)" });
    expect(result.probability).toBeGreaterThanOrEqual(0);
    expect(result.probability).toBeLessThanOrEqual(1);
    expect(["Low", "Medium", "High"]).toContain(result.riskLevel);
  });
});
