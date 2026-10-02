import modelData from "../data/model-data.json";

type Customer = Record<string, string | number | null | undefined>;
type Tree = {
  childrenLeft: number[];
  childrenRight: number[];
  feature: number[];
  threshold: number[];
  value: number[];
};

type ModelData = {
  numericColumns: string[];
  numericImputer: number[];
  numericScale: number[];
  numericMean: number[];
  categoricalColumns: string[];
  categories: Record<string, string[]>;
  trees: Tree[];
  treeCount: number;
  globalImportance: { feature: string; importance: number }[];
};

const model = modelData as ModelData;

const numberValue = (row: Customer, key: string, fallback: number) => {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : fallback;
};

export function engineerCustomer(row: Customer): Customer {
  const tenure = numberValue(row, "tenure", 29);
  const services = [
    "PhoneService",
    "MultipleLines",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
  ];
  const serviceCount = services.reduce((total, field) => total + (String(row[field] ?? "").toLowerCase() === "yes" ? 1 : 0), 0);
  const tenureGroup = tenure <= 12 ? "0-12" : tenure <= 24 ? "13-24" : tenure <= 48 ? "25-48" : tenure <= 72 ? "49-72" : "73+";
  return {
    ...row,
    TotalCharges: row.TotalCharges === "" || row.TotalCharges == null ? null : numberValue(row, "TotalCharges", 1390.85),
    tenure,
    service_count: serviceCount,
    estimated_lifetime_value: numberValue(row, "MonthlyCharges", 70.6) * tenure,
    is_month_to_month: row.Contract === "Month-to-month" ? 1 : 0,
    is_paperless: row.PaperlessBilling === "Yes" ? 1 : 0,
    tenure_group: tenureGroup,
  };
}

function transform(row: Customer): number[] {
  const engineered = engineerCustomer(row);
  const numeric = model.numericColumns.map((column, index) => {
    const raw = Number(engineered[column]);
    const value = Number.isFinite(raw) ? raw : model.numericImputer[index];
    return (value - model.numericMean[index]) / (model.numericScale[index] || 1);
  });
  const categorical = model.categoricalColumns.flatMap((column) => {
    const value = String(engineered[column] ?? "");
    return model.categories[column].map((category) => (category === value ? 1 : 0));
  });
  return [...numeric, ...categorical];
}

function treeProbability(tree: Tree, features: number[]) {
  let node = 0;
  while (tree.childrenLeft[node] !== -1) {
    node = features[tree.feature[node]] <= tree.threshold[node] ? tree.childrenLeft[node] : tree.childrenRight[node];
  }
  // scikit-learn stores the positive-class leaf value as a probability.
  return tree.value[node];
}

export type Prediction = {
  prediction: "Churn" | "No Churn";
  probability: number;
  riskLevel: "Low" | "Medium" | "High";
  topFactors: { feature: string; importance: number }[];
};

export function predictCustomer(row: Customer): Prediction {
  const features = transform(row);
  const probability = model.trees.reduce((sum, tree) => sum + treeProbability(tree, features), 0) / model.treeCount;
  const rounded = Math.round(probability * 1000) / 1000;
  const riskLevel = rounded < 0.3 ? "Low" : rounded <= 0.7 ? "Medium" : "High";
  return {
    prediction: rounded >= 0.5 ? "Churn" : "No Churn",
    probability: rounded,
    riskLevel,
    topFactors: model.globalImportance.slice(0, 5),
  };
}

export const modelSummary = {
  name: "Random Forest",
  version: "1.0.0",
  rocAuc: 0.835,
  recall: 0.74,
  prAuc: 0.661,
  testRows: 1057,
  features: 24,
  trainedOn: "IBM Telco Customer Churn",
};
