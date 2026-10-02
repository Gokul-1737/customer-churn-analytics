import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronRight,
  CircleHelp,
  Download,
  FileUp,
  Gauge,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  X,
} from "lucide-react";
import analyticsData from "../data/analytics-data.json";
import { modelSummary, predictCustomer, type Prediction } from "@/lib/churnModel";

type Section = "overview" | "prediction" | "analytics" | "performance" | "batch";

type CustomerForm = Record<string, string | number | null>;

const initialCustomer: CustomerForm = {
  customerID: "demo-001",
  gender: "Female",
  SeniorCitizen: 0,
  Partner: "No",
  Dependents: "No",
  tenure: 2,
  PhoneService: "Yes",
  MultipleLines: "No",
  InternetService: "Fiber optic",
  OnlineSecurity: "No",
  OnlineBackup: "No",
  DeviceProtection: "No",
  TechSupport: "No",
  StreamingTV: "No",
  StreamingMovies: "No",
  Contract: "Month-to-month",
  PaperlessBilling: "Yes",
  PaymentMethod: "Electronic check",
  MonthlyCharges: 95,
  TotalCharges: 190,
};

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "prediction", label: "Customer prediction", icon: Target },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "performance", label: "Model performance", icon: Gauge },
  { id: "batch", label: "Batch scoring", icon: FileUp },
];

const riskColor = (risk: string) => risk === "High" ? "#e35d6a" : risk === "Medium" ? "#df9a3c" : "#32a783";
const pct = (value: number) => `${Math.round(value * 100)}%`;

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="section-description">{description}</p>
      </div>
      <div className="model-pill"><span className="pulse-dot" /> Live model · {modelSummary.version}</div>
    </div>
  );
}

function KpiCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string; detail: string; icon: typeof Users; tone: string }) {
  return <div className="kpi-card">
    <div className="kpi-top"><span>{label}</span><span className="kpi-icon" style={{ color: tone, background: `${tone}14` }}><Icon size={17} /></span></div>
    <strong>{value}</strong><small>{detail}</small>
  </div>;
}

function BarList({ title, rows, labelKey, valueKey, color = "#2f6ee4" }: { title: string; rows: Record<string, string | number>[]; labelKey: string; valueKey: string; color?: string }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey])), 1);
  return <div className="chart-card"><div className="chart-title"><h3>{title}</h3><span>Churn rate</span></div><div className="bar-list">
    {rows.map((row) => <div className="bar-row" key={String(row[labelKey])}><div className="bar-label"><span>{String(row[labelKey])}</span><b>{pct(Number(row[valueKey]))}</b></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(5, Number(row[valueKey]) / max * 100)}%`, background: color }} /></div></div>)}
  </div></div>;
}

function RiskRing({ prediction }: { prediction: Prediction }) {
  const circumference = 2 * Math.PI * 46;
  return <div className="risk-result">
    <div className="risk-ring" style={{ borderColor: `${riskColor(prediction.riskLevel)}45` }}>
      <svg viewBox="0 0 110 110"><circle className="ring-base" cx="55" cy="55" r="46" /><circle className="ring-value" cx="55" cy="55" r="46" stroke={riskColor(prediction.riskLevel)} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - prediction.probability)} /></svg>
      <div><strong>{pct(prediction.probability)}</strong><span>probability</span></div>
    </div>
    <div className="risk-copy"><span className="risk-badge" style={{ color: riskColor(prediction.riskLevel), background: `${riskColor(prediction.riskLevel)}16` }}>{prediction.riskLevel} risk</span><h2>{prediction.prediction}</h2><p>Scored by the trained Random Forest model using the same feature pipeline as training.</p></div>
  </div>;
}

function CustomerForm({ value, onChange, onSubmit }: { value: CustomerForm; onChange: (key: string, value: string | number) => void; onSubmit: () => void }) {
  const select = (key: string, label: string, options: string[]) => <label className="field"><span>{label}</span><select value={String(value[key] ?? "")} onChange={(event) => onChange(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
  const number = (key: string, label: string, min = 0, step = 1) => <label className="field"><span>{label}</span><input type="number" min={min} step={step} value={Number(value[key] ?? 0)} onChange={(event) => onChange(key, Number(event.target.value))} /></label>;
  return <div className="form-shell"><div className="form-grid">
    {select("gender", "Gender", ["Female", "Male"])}{number("tenure", "Tenure (months)")}{number("MonthlyCharges", "Monthly charges", 0, 0.01)}
    {number("TotalCharges", "Total charges", 0, 0.01)}{select("Contract", "Contract", ["Month-to-month", "One year", "Two year"])}{select("InternetService", "Internet service", ["DSL", "Fiber optic", "No"])}
    {select("PaymentMethod", "Payment method", ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"])}{select("Partner", "Partner", ["No", "Yes"])}{select("Dependents", "Dependents", ["No", "Yes"])}
    {select("OnlineSecurity", "Online security", ["No", "Yes", "No internet service"])}{select("TechSupport", "Tech support", ["No", "Yes", "No internet service"])}{select("PaperlessBilling", "Paperless billing", ["Yes", "No"])}
  </div><button className="primary-button full-button" onClick={onSubmit}><Sparkles size={17} /> Assess churn risk <ArrowUpRight size={17} /></button></div>;
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const split = (line: string) => line.match(/("[^"\\]*(?:\\.[^"\\]*)*"|[^,]+)(?=,|$)/g)?.map((cell) => cell.replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
  const headers = split(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(split(line).map((value, index) => [headers[index], value])));
}

export default function Home() {
  const [section, setSection] = useState<Section>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState<CustomerForm>(initialCustomer);
  const [prediction, setPrediction] = useState<Prediction>(() => predictCustomer(initialCustomer));
  const [batchResults, setBatchResults] = useState<(CustomerForm & { prediction: string; probability: number; riskLevel: string })[]>([]);
  const current = navItems.find((item) => item.id === section) ?? navItems[0];
  const topFactors = useMemo(() => prediction.topFactors.slice(0, 5), [prediction]);
  const handleFormChange = (key: string, value: string | number) => setForm((previous) => ({ ...previous, [key]: value }));
  const runPrediction = () => setPrediction(predictCustomer(form));
  const handleCsv = async (file: File) => {
    const rows = parseCsv(await file.text());
    setBatchResults(rows.map((row) => { const scored = predictCustomer(row); return { ...row, prediction: scored.prediction, probability: scored.probability, riskLevel: scored.riskLevel }; }));
  };
  const downloadBatch = () => {
    const headers = ["customerID", "prediction", "probability", "riskLevel"];
    const csv = [headers.join(","), ...batchResults.map((row) => headers.map((header) => String(row[header] ?? "")).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "churn-predictions.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (section === "prediction") return <><SectionHeader eyebrow="Customer intelligence" title="Customer prediction" description="Score one customer with the deployed model and see the signals behind the risk classification." /><div className="prediction-layout"><CustomerForm value={form} onChange={handleFormChange} onSubmit={runPrediction} /><div className="result-column"><div className="panel result-panel"><div className="panel-kicker"><span>Latest assessment</span><span className="model-tag">{modelSummary.name}</span></div><RiskRing prediction={prediction} /><div className="factor-list"><div className="subhead"><h3>Global model signals</h3><span>Associative, not causal</span></div>{topFactors.map((factor, index) => <div className="factor" key={factor.feature}><span className="factor-index">0{index + 1}</span><span>{factor.feature}</span><div className="factor-bar"><i style={{ width: `${Math.min(100, factor.importance * 700)}%` }} /></div><b>{(factor.importance * 100).toFixed(1)}%</b></div>)}</div></div></div></div></>;
    if (section === "analytics") return <><SectionHeader eyebrow="Customer intelligence" title="Analytics" description="Explore the real IBM Telco dataset and identify the segments with the strongest observed churn rates." /><div className="analytics-grid"><BarList title="Churn by contract" rows={analyticsData.contractChurn as Record<string, string | number>[]} labelKey="Contract" valueKey="churnRate" color="#e35d6a" /><BarList title="Churn by tenure" rows={analyticsData.tenureChurn as Record<string, string | number>[]} labelKey="band" valueKey="churnRate" /><BarList title="Churn by payment method" rows={analyticsData.paymentChurn as Record<string, string | number>[]} labelKey="method" valueKey="churnRate" color="#df9a3c" /><div className="chart-card"><div className="chart-title"><h3>Monthly charges distribution</h3><span>Customers</span></div><div className="charge-chart">{analyticsData.chargeBands.map((row) => <div className="charge-column" key={row.band as string}><div className="column-value">{row.customers}</div><div className="column-bar" style={{ height: `${Math.max(14, Number(row.customers) / 30)}px` }} /><span>{row.band}</span></div>)}</div></div></div></>;
    if (section === "performance") return <><SectionHeader eyebrow="Model intelligence" title="Model performance" description="Transparent evaluation on an untouched stratified test set. Recall is prioritized because missed churners are costly." /><div className="performance-grid"><div className="panel metric-panel"><div className="panel-kicker"><span>Selected model</span><span className="model-tag">Test set · 1,057 rows</span></div><h2>{modelSummary.name}</h2><div className="metric-grid"><div><span>ROC-AUC</span><strong>{modelSummary.rocAuc.toFixed(3)}</strong></div><div><span>Recall</span><strong>{modelSummary.recall.toFixed(3)}</strong></div><div><span>PR-AUC</span><strong>{modelSummary.prAuc.toFixed(3)}</strong></div><div><span>Features</span><strong>{modelSummary.features}</strong></div></div><div className="selection-note"><ShieldCheck size={18} /><p>Selected objectively for balanced ranking quality and recall, rather than accuracy alone.</p></div></div><div className="panel comparison-panel"><div className="panel-kicker"><span>Model comparison</span><span>Test metrics</span></div><table><thead><tr><th>Model</th><th>Accuracy</th><th>Recall</th><th>F1</th><th>ROC-AUC</th></tr></thead><tbody><tr><td>Logistic Regression</td><td>0.748</td><td>0.804</td><td>0.627</td><td>0.844</td></tr><tr className="selected-row"><td><b>Random Forest</b><em>Selected</em></td><td>0.763</td><td>0.740</td><td>0.625</td><td>0.835</td></tr><tr><td>Gradient Boosting</td><td>0.796</td><td>0.548</td><td>0.590</td><td>0.841</td></tr></tbody></table></div></div></>;
    if (section === "batch") return <><SectionHeader eyebrow="Operations" title="Batch scoring" description="Upload a CSV to score multiple customers in-browser with the exported production model. No data leaves this page." /><div className="batch-panel panel"><div className="upload-zone"><Upload size={24} /><h3>Drop your customer CSV here</h3><p>Required fields include tenure, MonthlyCharges, and Contract.</p><label className="secondary-button"><FileUp size={17} /> Choose CSV<input type="file" accept=".csv,text/csv" hidden onChange={(event) => event.target.files?.[0] && void handleCsv(event.target.files[0])} /></label></div>{batchResults.length > 0 && <div className="batch-results"><div className="panel-kicker"><span>{batchResults.length} customers scored</span><button className="text-button" onClick={downloadBatch}><Download size={16} /> Download CSV</button></div><div className="table-wrap"><table><thead><tr><th>Customer ID</th><th>Prediction</th><th>Probability</th><th>Risk</th></tr></thead><tbody>{batchResults.map((row, index) => <tr key={`${String(row.customerID)}-${index}`}><td>{String(row.customerID ?? `row-${index + 1}`)}</td><td>{row.prediction}</td><td>{pct(Number(row.probability))}</td><td><span className="risk-mini" style={{ color: riskColor(String(row.riskLevel)) }}>{String(row.riskLevel)} risk</span></td></tr>)}</tbody></table></div></div>}</div></>;
    return <><SectionHeader eyebrow="Portfolio overview" title="Good morning, analyst" description="A clear view of predicted churn exposure across the customer base." /><div className="kpi-grid"><KpiCard label="Total customers" value={analyticsData.overview.totalCustomers.toLocaleString()} detail="IBM Telco dataset" icon={Users} tone="#2f6ee4" /><KpiCard label="Predicted churn" value={analyticsData.overview.predictedChurn.toLocaleString()} detail={`${pct(analyticsData.overview.predictedChurnPercent)} of base`} icon={Activity} tone="#e35d6a" /><KpiCard label="High-risk customers" value={analyticsData.overview.highRisk.toLocaleString()} detail="Probability above 70%" icon={Bell} tone="#df9a3c" /><KpiCard label="Test ROC-AUC" value={modelSummary.rocAuc.toFixed(3)} detail="Random Forest v1.0.0" icon={BrainCircuit} tone="#32a783" /></div><div className="overview-grid"><div className="panel exposure-panel"><div className="panel-kicker"><span>Risk exposure</span><span>7,043 scored customers</span></div><div className="exposure-total"><div><strong>{pct(analyticsData.overview.predictedChurnPercent)}</strong><span>predicted churn rate</span></div><div className="exposure-ring"><div style={{ background: `conic-gradient(#e35d6a ${analyticsData.overview.predictedChurnPercent * 360}deg, #edf1f6 0)` }}><span>{analyticsData.overview.predictedChurn}</span></div></div></div><div className="risk-legend">{analyticsData.riskDistribution.map((row) => <div key={row.risk as string}><i style={{ background: riskColor(row.risk as string) }} /><span>{row.risk} risk</span><b>{Number(row.count).toLocaleString()}</b></div>)}</div></div><div className="panel insight-panel"><div className="panel-kicker"><span>Model insight</span><span className="model-tag">Explainable AI</span></div><h2>Short-term contracts are the clearest signal.</h2><p>Observed churn is materially higher among month-to-month customers. Combine risk scores with retention context before acting.</p><div className="insight-footer"><div className="mini-icon"><Sparkles size={18} /></div><div><b>Next best action</b><span>Review high-risk customers with month-to-month contracts</span></div><ChevronRight size={18} /></div></div></div><div className="quick-actions"><button onClick={() => setSection("prediction")}><Target size={18} /><span><b>Score a customer</b><small>Assess a specific profile</small></span><ArrowUpRight size={17} /></button><button onClick={() => setSection("batch")}><FileUp size={18} /><span><b>Upload a CSV</b><small>Score your customer list</small></span><ArrowUpRight size={17} /></button><button onClick={() => setSection("performance")}><Gauge size={18} /><span><b>Review the model</b><small>Metrics and selection logic</small></span><ArrowUpRight size={17} /></button></div></>;
  };

  return <div className="app-shell"><aside className={`sidebar ${mobileNav ? "open" : ""}`}><div className="brand"><div className="brand-mark"><Activity size={20} /></div><div><b>Signal<span>IQ</span></b><small>Customer intelligence</small></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div><div className="workspace"><span>WORKSPACE</span><button><span className="workspace-dot" /> Retention team <ChevronRight size={15} /></button></div><nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? "active" : ""} onClick={() => { setSection(id); setMobileNav(false); }}><Icon size={18} /><span>{label}</span>{id === "batch" && <em>NEW</em>}</button>)}</nav><div className="sidebar-bottom"><div className="data-source"><span className="status-dot" /> <div><b>Model online</b><small>Random Forest · 1.0.0</small></div></div><button className="help-link"><CircleHelp size={17} /> Documentation</button><div className="profile"><div className="avatar">AN</div><div><b>Analyst</b><small>Workspace member</small></div><PanelLeftClose size={16} /></div></div></aside><main className="main-area"><header className="topbar"><button className="menu-button" onClick={() => setMobileNav(true)}><Menu size={21} /></button><div className="breadcrumb"><span>SignalIQ</span><ChevronRight size={14} /><b>{current.label}</b></div><div className="topbar-actions"><span className="saved-state"><span className="status-dot" /> All systems normal</span><button className="icon-button"><Bell size={18} /></button><div className="top-avatar">AN</div></div></header><div className="page-content">{renderContent()}<footer>SignalIQ · AI Customer Churn Analytics <span>Built on IBM Telco Customer Churn · Model version {modelSummary.version}</span></footer></div></main></div>;
}
