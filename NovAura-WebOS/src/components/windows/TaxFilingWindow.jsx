import React, { useState, useRef, useMemo, useCallback } from 'react';
import { kernelStorage } from '../../kernel/kernelStorage.js';
import {
  FileText, Camera, Upload, ChevronRight, ChevronLeft, Check, Download,
  User, Users, DollarSign, Home, Calculator, Send, AlertCircle, Eye,
  Trash2, Plus, X, Building, Briefcase, Heart, Baby, Shield
} from 'lucide-react';


// ─── Tax Brackets 2025 ───
const FED_BRACKETS = {
  single:            [[11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37]],
  married_joint:     [[23200, 0.10], [94300, 0.12], [201050, 0.22], [383900, 0.24], [487450, 0.32], [731200, 0.35], [Infinity, 0.37]],
  married_separate:  [[11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [365600, 0.35], [Infinity, 0.37]],
  head_of_household: [[16550, 0.10], [63100, 0.12], [100500, 0.22], [191950, 0.24], [243700, 0.32], [609350, 0.35], [Infinity, 0.37]],
};

const STANDARD_DEDUCTION = { single: 14600, married_joint: 29200, married_separate: 14600, head_of_household: 21900 };
const FILING_STATUSES = [
  { id: 'single', label: 'Single', icon: User },
  { id: 'married_joint', label: 'Married Filing Jointly', icon: Users },
  { id: 'married_separate', label: 'Married Filing Separately', icon: User },
  { id: 'head_of_household', label: 'Head of Household', icon: Home },
];

function calcFedTax(taxableIncome, status) {
  const brackets = FED_BRACKETS[status] || FED_BRACKETS.single;
  let tax = 0, prev = 0;
  for (const [limit, rate] of brackets) {
    if (taxableIncome <= prev) break;
    const amount = Math.min(taxableIncome, limit) - prev;
    tax += amount * rate;
    prev = limit;
  }
  return Math.round(tax * 100) / 100;
}

const STEPS = ['scan', 'personal', 'income', 'deductions', 'review'];
const STEP_LABELS = ['Documents', 'Personal Info', 'Income', 'Deductions', 'Review & File'];

export default function TaxFilingWindow({ onAIChat }) {
  const [step, setStep] = useState(0);
  const [docs, setDocs] = useState([]);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef(null);

  // Personal
  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', ssn: '', dob: '',
    spouseFirst: '', spouseLast: '', spouseSsn: '',
    address: '', city: '', state: '', zip: '',
    filingStatus: 'single', dependents: [],
  });

  // Income
  const [income, setIncome] = useState({
    wages: '', interest: '', dividends: '', selfEmployment: '',
    capitalGains: '', otherIncome: '', federalWithheld: '', stateWithheld: '',
  });

  // Deductions
  const [deductionType, setDeductionType] = useState('standard');
  const [itemized, setItemized] = useState({
    mortgage: '', stateLocalTax: '', charity: '', medical: '', other: '',
  });

  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(kernelStorage.getItem('tax_returns') || '[]'); } catch { return []; }
  });

  const updatePersonal = (key, val) => setPersonal(prev => ({ ...prev, [key]: val }));
  const updateIncome = (key, val) => setIncome(prev => ({ ...prev, [key]: val }));
  const updateItemized = (key, val) => setItemized(prev => ({ ...prev, [key]: val }));

  const addDependent = () => updatePersonal('dependents', [...personal.dependents, { name: '', ssn: '', relation: 'child' }]);
  const removeDependent = (i) => updatePersonal('dependents', personal.dependents.filter((_, idx) => idx !== i));
  const updateDependent = (i, key, val) => {
    const deps = [...personal.dependents];
    deps[i] = { ...deps[i], [key]: val };
    updatePersonal('dependents', deps);
  };

  // ─── Document Scanning ───
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const doc = { id: `doc-${Date.now()}-${Math.random()}`, name: file.name, type: file.type, preview: ev.target.result, extracted: null };
        setDocs(prev => [...prev, doc]);

        // Try AI OCR extraction
        if (onAIChat) {
          setScanning(true);
          try {
            const result = await onAIChat(
              `Extract tax document data from this uploaded file named "${file.name}". Return JSON with fields: documentType (W-2, 1099-INT, 1099-NEC, 1099-DIV, etc), employerName, wages, federalWithheld, stateWithheld, ssn (last 4 only), ein, interest, dividends, nonemployeeComp. Only include fields relevant to the document type.`,
              'analysis'
            );
            if (result?.response) {
              try {
                const jsonMatch = result.response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const extracted = JSON.parse(jsonMatch[0]);
                  setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, extracted } : d));
                  // Auto-fill income fields
                  if (extracted.wages) setIncome(prev => ({ ...prev, wages: String(Number(prev.wages || 0) + Number(extracted.wages)) }));
                  if (extracted.federalWithheld) setIncome(prev => ({ ...prev, federalWithheld: String(Number(prev.federalWithheld || 0) + Number(extracted.federalWithheld)) }));
                  if (extracted.stateWithheld) setIncome(prev => ({ ...prev, stateWithheld: String(Number(prev.stateWithheld || 0) + Number(extracted.stateWithheld)) }));
                  if (extracted.interest) setIncome(prev => ({ ...prev, interest: String(Number(prev.interest || 0) + Number(extracted.interest)) }));
                  if (extracted.dividends) setIncome(prev => ({ ...prev, dividends: String(Number(prev.dividends || 0) + Number(extracted.dividends)) }));
                  if (extracted.nonemployeeComp) setIncome(prev => ({ ...prev, selfEmployment: String(Number(prev.selfEmployment || 0) + Number(extracted.nonemployeeComp)) }));
                }
              } catch {} // JSON parse failed, no auto-fill
            }
          } catch {} // AI unavailable
          setScanning(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDoc = (id) => setDocs(prev => prev.filter(d => d.id !== id));

  // ─── Calculations ───
  const calc = useMemo(() => {
    const totalIncome = ['wages', 'interest', 'dividends', 'selfEmployment', 'capitalGains', 'otherIncome']
      .reduce((sum, k) => sum + (Number(income[k]) || 0), 0);
    const selfTax = (Number(income.selfEmployment) || 0) * 0.1413; // SE tax (employer portion deductible)
    const stdDed = STANDARD_DEDUCTION[personal.filingStatus] || 14600;
    const itmDed = Object.values(itemized).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const deduction = deductionType === 'standard' ? stdDed : itmDed;
    const taxableIncome = Math.max(0, totalIncome - deduction);
    const fedTax = calcFedTax(taxableIncome, personal.filingStatus);
    const totalTax = fedTax + selfTax;
    const withheld = (Number(income.federalWithheld) || 0);
    const owed = totalTax - withheld;
    return { totalIncome, deduction, taxableIncome, fedTax, selfTax, totalTax, withheld, owed, refund: owed < 0 ? Math.abs(owed) : 0, due: owed > 0 ? owed : 0 };
  }, [income, personal.filingStatus, deductionType, itemized]);

  // ─── Save & Export ───
  const saveReturn = () => {
    const ret = { id: `return-${Date.now()}`, personal, income, deductionType, itemized, calc, createdAt: new Date().toISOString() };
    const updated = [...saved, ret];
    setSaved(updated);
    kernelStorage.setItem('tax_returns', JSON.stringify(updated));
  };

  const exportPDF = () => {
    const text = `
FEDERAL TAX RETURN - ${new Date().getFullYear() - 1}
========================================
${personal.firstName} ${personal.lastName}
${personal.address}, ${personal.city}, ${personal.state} ${personal.zip}
Filing Status: ${FILING_STATUSES.find(f => f.id === personal.filingStatus)?.label || personal.filingStatus}
Dependents: ${personal.dependents.length}

INCOME
  Wages & Salary:      $${Number(income.wages || 0).toLocaleString()}
  Interest:            $${Number(income.interest || 0).toLocaleString()}
  Dividends:           $${Number(income.dividends || 0).toLocaleString()}
  Self-Employment:     $${Number(income.selfEmployment || 0).toLocaleString()}
  Capital Gains:       $${Number(income.capitalGains || 0).toLocaleString()}
  Other Income:        $${Number(income.otherIncome || 0).toLocaleString()}
  TOTAL INCOME:        $${calc.totalIncome.toLocaleString()}

DEDUCTIONS
  Type: ${deductionType === 'standard' ? 'Standard' : 'Itemized'}
  Amount:              $${calc.deduction.toLocaleString()}

TAX CALCULATION
  Taxable Income:      $${calc.taxableIncome.toLocaleString()}
  Federal Tax:         $${calc.fedTax.toLocaleString()}
  Self-Employment Tax: $${calc.selfTax.toLocaleString()}
  Total Tax:           $${calc.totalTax.toLocaleString()}
  Federal Withheld:    $${calc.withheld.toLocaleString()}

${calc.refund > 0 ? `REFUND: $${calc.refund.toLocaleString()}` : `AMOUNT DUE: $${calc.due.toLocaleString()}`}
========================================
Generated by NovAura Tax Filing
    `.trim();
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a'); a.download = `tax-return-${Date.now()}.txt`; a.href = URL.createObjectURL(blob); a.click();
  };

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-900/30 to-blue-900/20 border-b border-slate-800 shrink-0">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-semibold">Tax Filing</span>
        <span className="text-[10px] text-slate-500 ml-auto">{new Date().getFullYear() - 1} Return</span>
      </div>

      {/* Progress */}
      <div className="flex items-center px-3 py-1.5 border-b border-slate-800/50 shrink-0 gap-0.5">
        {STEP_LABELS.map((label, i) => (
          <React.Fragment key={i}>
            <button onClick={() => setStep(i)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium transition-all ${i === step ? 'bg-emerald-500/30 text-emerald-300' : i < step ? 'bg-slate-800 text-slate-300' : 'text-slate-600'}`}>
              {i < step ? <Check className="w-2.5 h-2.5" /> : <span className="w-2.5 text-center">{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < STEP_LABELS.length - 1 && <ChevronRight className="w-2.5 h-2.5 text-slate-700 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Step 0: Document Scan */}
        {step === 0 && (
          <>
            <div className="text-center py-4">
              <FileText className="w-10 h-10 text-emerald-400/40 mx-auto mb-2" />
              <div className="text-xs text-slate-400 mb-1">Upload your tax documents</div>
              <div className="text-[9px] text-slate-600">W-2, 1099-INT, 1099-NEC, 1099-DIV, etc.</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 py-3 border border-dashed border-slate-700 rounded-lg hover:border-emerald-600/50 transition-all text-center">
                <Upload className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400">Upload File</div>
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 py-3 border border-dashed border-slate-700 rounded-lg hover:border-emerald-600/50 transition-all text-center">
                <Camera className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400">Take Photo</div>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileUpload} className="hidden" />
            {scanning && <div className="text-center text-[10px] text-emerald-400 animate-pulse">Scanning document with AI...</div>}
            {docs.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[9px] text-slate-500 uppercase">Uploaded Documents ({docs.length})</div>
                {docs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium truncate">{doc.name}</div>
                      {doc.extracted ? (
                        <div className="text-[8px] text-emerald-400">Extracted: {doc.extracted.documentType || 'Document'} {doc.extracted.wages ? `• $${Number(doc.extracted.wages).toLocaleString()} wages` : ''}</div>
                      ) : (
                        <div className="text-[8px] text-slate-600">Uploaded</div>
                      )}
                    </div>
                    <button onClick={() => removeDoc(doc.id)} className="p-1 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="text-[9px] text-slate-600 text-center">You can also skip scanning and enter information manually</div>
          </>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <>
            <div className="text-[9px] text-slate-500 uppercase">Filing Status</div>
            <div className="grid grid-cols-2 gap-1.5">
              {FILING_STATUSES.map(fs => {
                const Icon = fs.icon;
                return (
                  <button key={fs.id} onClick={() => updatePersonal('filingStatus', fs.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${personal.filingStatus === fs.id ? 'border-emerald-500 bg-emerald-900/20' : 'border-slate-800 bg-slate-900/30 hover:border-slate-600'}`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px]">{fs.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[9px] text-slate-500 uppercase mt-2">Your Information</div>
            <div className="grid grid-cols-2 gap-2">
              {[['firstName', 'First Name'], ['lastName', 'Last Name']].map(([k, l]) => (
                <div key={k}>
                  <label className="text-[8px] text-slate-600">{l}</label>
                  <input value={personal[k]} onChange={e => updatePersonal(k, e.target.value)}
                    className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600/50" placeholder={l} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] text-slate-600">SSN</label>
                <input value={personal.ssn} onChange={e => updatePersonal('ssn', e.target.value)} placeholder="XXX-XX-XXXX" type="password"
                  className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600/50" />
              </div>
              <div>
                <label className="text-[8px] text-slate-600">Date of Birth</label>
                <input value={personal.dob} onChange={e => updatePersonal('dob', e.target.value)} type="date"
                  className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white focus:outline-none focus:border-emerald-600/50" />
              </div>
            </div>
            <div className="text-[9px] text-slate-500 uppercase mt-1">Address</div>
            <input value={personal.address} onChange={e => updatePersonal('address', e.target.value)} placeholder="Street Address"
              className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600/50" />
            <div className="grid grid-cols-3 gap-2">
              {[['city', 'City'], ['state', 'State'], ['zip', 'ZIP']].map(([k, l]) => (
                <div key={k}>
                  <input value={personal[k]} onChange={e => updatePersonal(k, e.target.value)} placeholder={l}
                    className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600/50" />
                </div>
              ))}
            </div>
            {(personal.filingStatus === 'married_joint' || personal.filingStatus === 'married_separate') && (
              <>
                <div className="text-[9px] text-slate-500 uppercase mt-1">Spouse Information</div>
                <div className="grid grid-cols-3 gap-2">
                  {[['spouseFirst', 'First'], ['spouseLast', 'Last'], ['spouseSsn', 'SSN']].map(([k, l]) => (
                    <input key={k} value={personal[k]} onChange={e => updatePersonal(k, e.target.value)} placeholder={l}
                      type={k === 'spouseSsn' ? 'password' : 'text'}
                      className="w-full px-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600/50" />
                  ))}
                </div>
              </>
            )}
            <div className="flex items-center justify-between mt-1">
              <div className="text-[9px] text-slate-500 uppercase">Dependents ({personal.dependents.length})</div>
              <button onClick={addDependent} className="text-[9px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {personal.dependents.map((dep, i) => (
              <div key={i} className="flex gap-2 items-center p-2 bg-slate-900/30 border border-slate-800 rounded">
                <Baby className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input value={dep.name} onChange={e => updateDependent(i, 'name', e.target.value)} placeholder="Name" className="flex-1 px-2 py-1 bg-black/30 border border-slate-700 rounded text-[10px] text-white placeholder-slate-600 focus:outline-none" />
                <select value={dep.relation} onChange={e => updateDependent(i, 'relation', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-[9px] text-slate-300">
                  <option value="child">Child</option><option value="parent">Parent</option><option value="other">Other</option>
                </select>
                <button onClick={() => removeDependent(i)} className="p-0.5 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </>
        )}

        {/* Step 2: Income */}
        {step === 2 && (
          <>
            <div className="text-[9px] text-slate-500 uppercase">Income Sources</div>
            {[
              ['wages', 'Wages & Salary (W-2)', Briefcase],
              ['interest', 'Interest Income (1099-INT)', DollarSign],
              ['dividends', 'Dividends (1099-DIV)', DollarSign],
              ['selfEmployment', 'Self-Employment (1099-NEC)', Building],
              ['capitalGains', 'Capital Gains', DollarSign],
              ['otherIncome', 'Other Income', DollarSign],
            ].map(([key, label, Icon]) => (
              <div key={key} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <label className="text-[10px] text-slate-400 flex-1">{label}</label>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">$</span>
                  <input value={income[key]} onChange={e => updateIncome(key, e.target.value)} type="number" placeholder="0"
                    className="w-full pl-5 pr-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white text-right focus:outline-none focus:border-emerald-600/50" />
                </div>
              </div>
            ))}
            <div className="text-[9px] text-slate-500 uppercase mt-2">Tax Withheld</div>
            {[
              ['federalWithheld', 'Federal Tax Withheld'],
              ['stateWithheld', 'State Tax Withheld'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <label className="text-[10px] text-slate-400 flex-1">{label}</label>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">$</span>
                  <input value={income[key]} onChange={e => updateIncome(key, e.target.value)} type="number" placeholder="0"
                    className="w-full pl-5 pr-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white text-right focus:outline-none focus:border-emerald-600/50" />
                </div>
              </div>
            ))}
            <div className="p-2 bg-emerald-900/10 border border-emerald-800/20 rounded-lg mt-1">
              <div className="text-[10px] text-emerald-400 font-medium">Total Income: ${calc.totalIncome.toLocaleString()}</div>
            </div>
          </>
        )}

        {/* Step 3: Deductions */}
        {step === 3 && (
          <>
            <div className="text-[9px] text-slate-500 uppercase">Deduction Type</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDeductionType('standard')}
                className={`p-3 rounded-lg border text-left transition-all ${deductionType === 'standard' ? 'border-emerald-500 bg-emerald-900/20' : 'border-slate-800 bg-slate-900/30'}`}>
                <div className="text-[11px] font-medium">Standard Deduction</div>
                <div className="text-[10px] text-emerald-400 font-semibold">${STANDARD_DEDUCTION[personal.filingStatus]?.toLocaleString()}</div>
                <div className="text-[8px] text-slate-500 mt-0.5">Recommended for most filers</div>
              </button>
              <button onClick={() => setDeductionType('itemized')}
                className={`p-3 rounded-lg border text-left transition-all ${deductionType === 'itemized' ? 'border-emerald-500 bg-emerald-900/20' : 'border-slate-800 bg-slate-900/30'}`}>
                <div className="text-[11px] font-medium">Itemized Deductions</div>
                <div className="text-[10px] text-slate-400">${Object.values(itemized).reduce((s, v) => s + (Number(v) || 0), 0).toLocaleString()}</div>
                <div className="text-[8px] text-slate-500 mt-0.5">If you have significant expenses</div>
              </button>
            </div>
            {deductionType === 'itemized' && (
              <>
                <div className="text-[9px] text-slate-500 uppercase mt-1">Itemized Expenses</div>
                {[
                  ['mortgage', 'Mortgage Interest'],
                  ['stateLocalTax', 'State & Local Taxes (max $10k)'],
                  ['charity', 'Charitable Donations'],
                  ['medical', 'Medical (over 7.5% AGI)'],
                  ['other', 'Other Deductions'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <label className="text-[10px] text-slate-400 flex-1">{label}</label>
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600">$</span>
                      <input value={itemized[key]} onChange={e => updateItemized(key, e.target.value)} type="number" placeholder="0"
                        className="w-full pl-5 pr-2 py-1.5 bg-black/30 border border-slate-700 rounded text-[10px] text-white text-right focus:outline-none focus:border-emerald-600/50" />
                    </div>
                  </div>
                ))}
              </>
            )}
            <div className="p-2 bg-emerald-900/10 border border-emerald-800/20 rounded-lg">
              <div className="text-[10px] text-emerald-400 font-medium">
                Your Deduction: ${calc.deduction.toLocaleString()}
                {deductionType === 'itemized' && calc.deduction < STANDARD_DEDUCTION[personal.filingStatus] &&
                  <span className="text-amber-400 ml-2">(Standard would be higher!)</span>}
              </div>
            </div>
          </>
        )}

        {/* Step 4: Review & File */}
        {step === 4 && (
          <>
            <div className="text-[9px] text-slate-500 uppercase">Tax Return Summary</div>
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-2">
              <div className="flex justify-between text-[10px]"><span className="text-slate-400">Name</span><span>{personal.firstName} {personal.lastName}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-slate-400">Status</span><span>{FILING_STATUSES.find(f => f.id === personal.filingStatus)?.label}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-slate-400">Dependents</span><span>{personal.dependents.length}</span></div>
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-1.5">
              <div className="text-[9px] text-slate-500 uppercase mb-1">Income</div>
              {[['Wages', income.wages], ['Interest', income.interest], ['Dividends', income.dividends], ['Self-Employment', income.selfEmployment], ['Capital Gains', income.capitalGains], ['Other', income.otherIncome]]
                .filter(([, v]) => Number(v) > 0)
                .map(([label, val]) => (
                  <div key={label} className="flex justify-between text-[10px]"><span className="text-slate-400">{label}</span><span>${Number(val).toLocaleString()}</span></div>
                ))}
              <div className="flex justify-between text-[11px] font-medium pt-1 border-t border-slate-800"><span>Total Income</span><span>${calc.totalIncome.toLocaleString()}</span></div>
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-1.5">
              <div className="flex justify-between text-[10px]"><span className="text-slate-400">Deduction ({deductionType})</span><span>-${calc.deduction.toLocaleString()}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-slate-400">Taxable Income</span><span>${calc.taxableIncome.toLocaleString()}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-slate-400">Federal Tax</span><span>${calc.fedTax.toLocaleString()}</span></div>
              {calc.selfTax > 0 && <div className="flex justify-between text-[10px]"><span className="text-slate-400">SE Tax</span><span>${Math.round(calc.selfTax).toLocaleString()}</span></div>}
              <div className="flex justify-between text-[10px]"><span className="text-slate-400">Withheld</span><span>-${calc.withheld.toLocaleString()}</span></div>
            </div>
            <div className={`p-4 rounded-lg border text-center ${calc.refund > 0 ? 'bg-emerald-900/20 border-emerald-600/30' : 'bg-red-900/20 border-red-600/30'}`}>
              <div className="text-[10px] text-slate-400">{calc.refund > 0 ? 'Estimated Refund' : 'Estimated Amount Due'}</div>
              <div className={`text-2xl font-bold ${calc.refund > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${(calc.refund > 0 ? calc.refund : calc.due).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveReturn} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 flex items-center justify-center gap-1">
                <Save className="w-3 h-3" /> Save Return
              </button>
              <button onClick={exportPDF} className="flex-1 py-2 bg-emerald-600/50 hover:bg-emerald-500/50 rounded-lg text-[10px] text-emerald-200 flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
            <div className="p-2 bg-blue-900/10 border border-blue-800/20 rounded-lg text-center">
              <div className="text-[10px] text-blue-300 font-medium mb-0.5">Ready to File?</div>
              <div className="text-[9px] text-slate-500">Submit your return through IRS Direct File or an authorized filing partner.</div>
              <button className="mt-1.5 px-4 py-1.5 bg-blue-600/40 hover:bg-blue-500/40 rounded text-[10px] text-blue-200 flex items-center gap-1 mx-auto">
                <Send className="w-3 h-3" /> Open IRS Direct File
              </button>
            </div>
            <div className="text-center">
              <AlertCircle className="w-3 h-3 text-amber-500/50 inline mr-1" />
              <span className="text-[8px] text-slate-600">This tool provides estimates only. Consult a tax professional for complex situations.</span>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800 shrink-0">
        <button onClick={prev} disabled={step === 0}
          className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400">
          <ChevronLeft className="w-3 h-3" /> Back
        </button>
        <div className="text-[9px] text-slate-600">{step + 1} / {STEPS.length}</div>
        {step < STEPS.length - 1 ? (
          <button onClick={next}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/50 hover:bg-emerald-500/50 rounded text-[10px] text-emerald-200">
            Next <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>
    </div>
  );
}
