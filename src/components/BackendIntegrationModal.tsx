import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Code2, Copy, Check } from 'lucide-react';
import { BackendIntegrationConfig } from '../types/sora';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendIntegrationConfig;
  onSaveConfig: (newConfig: BackendIntegrationConfig) => void;
  onTestConnection: () => Promise<void>;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
}) => {
  const [formData, setFormData] = useState<BackendIntegrationConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (formData.mode === 'offline-mas-baseline') {
        setTimeout(() => {
          setIsTesting(false);
          setTestResult({
            success: true,
            message: 'Operating in official MAS baseline mode. All overnight and compounded benchmarks are loaded.',
          });
        }, 300);
        return;
      }

      const res = await fetch(formData.customUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(formData.apiKey ? { Authorization: `Bearer ${formData.apiKey}` } : {}),
        },
      });

      if (res.ok) {
        setTestResult({
          success: true,
          message: `Connection successful! Server responded with HTTP status ${res.status}.`,
        });
      } else {
        setTestResult({
          success: false,
          message: `Server returned HTTP error status ${res.status} (${res.statusText}).`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Failed to reach endpoint: ${err.message || 'Network error / CORS blocked'}.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig(formData);
    onClose();
  };

  const sampleJsonSchema = `{
  "records": [
    {
      "date": "2026-10-02",
      "overnightRate": 3.0150,
      "soraIndex": 114.892,
      "compSora1M": 3.0425,
      "compSora3M": 3.0780,
      "compSora6M": 3.1120,
      "aggregateVolumeMillion": 4210,
      "daysWeight": 3
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Backend API Integration Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure your upcoming backend proxy or microservice to stream live MAS data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Data Source Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, mode: 'offline-mas-baseline' }))}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  formData.mode === 'offline-mas-baseline'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">
                  MAS Baseline Dataset
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  High-fidelity official MAS overnight rates bundled on the client. Zero setup required.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, mode: 'custom-backend' }))}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  formData.mode === 'custom-backend'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">
                  Custom Backend Service
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Connect to your Express, Python, or Cloud Run backend proxy endpoint.
                </div>
              </button>
            </div>
          </div>

          {/* Custom Backend Inputs */}
          {formData.mode === 'custom-backend' && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Backend API Endpoint URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. http://localhost:5000/api/mas/sora or /api/sora"
                  value={formData.customUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 block font-mono">
                  Your backend should proxy MAS API requests or serve cached rate JSON.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  API Key / Bearer Token (Optional)
                </label>
                <input
                  type="password"
                  placeholder="Bearer token if endpoint is secured"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Test Button */}
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Test Endpoint Connection</span>
                </button>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Backend Developer Quick-Start Specification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-blue-600" />
                Expected Backend JSON Contract
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sampleJsonSchema);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Schema'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed">
              {sampleJsonSchema}
            </pre>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When you implement your backend, have your endpoint return an array of <code className="font-mono text-slate-700">records</code> formatted as above. The calculator will automatically parse and update all daily compounding schedules in real time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
