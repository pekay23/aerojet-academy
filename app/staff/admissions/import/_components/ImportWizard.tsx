'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { CustomFieldDefinition, ProgrammeChoice, ApplicationStage } from '@prisma/client'
import { Upload, ArrowRight, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react'

type Step = 'UPLOAD' | 'MAP' | 'VALIDATE' | 'IMPORT'

const STANDARD_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'programmeChoice', label: 'Programme Choice', required: true },
  { key: 'stage', label: 'Application Stage', required: false },
]

export default function ImportWizard({ customFields }: { customFields: CustomFieldDefinition[] }) {
  const [step, setStep] = useState<Step>('UPLOAD')
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({}) // targetField -> csvHeader
  
  const [validationResults, setValidationResults] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importStats, setImportStats] = useState<{ imported: number, errors: string[] } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const allTargetFields = [
    ...STANDARD_FIELDS,
    ...customFields.map(cf => ({ key: `custom_${cf.slug}`, label: `Custom: ${cf.name}`, required: cf.isRequired }))
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvHeaders(results.meta.fields || [])
        setCsvData(results.data)
        
        // Auto-map where possible
        const initialMapping: Record<string, string> = {}
        const lowerHeaders = (results.meta.fields || []).map(h => ({ original: h, lower: h.toLowerCase() }))
        
        allTargetFields.forEach(tf => {
          const match = lowerHeaders.find(h => 
            h.lower === tf.key.toLowerCase() || 
            h.lower === tf.label.toLowerCase() ||
            h.lower === tf.key.replace('custom_', '').toLowerCase()
          )
          if (match) initialMapping[tf.key] = match.original
        })
        
        setMapping(initialMapping)
        setStep('MAP')
      }
    })
  }

  const handleValidate = async () => {
    setIsImporting(true)

    // Build rows according to mapping
    const rowsToValidate = csvData.map(row => {
      const parsed: any = { customFields: {} }
      
      allTargetFields.forEach(tf => {
        const csvCol = mapping[tf.key]
        if (!csvCol) return
        
        const val = row[csvCol]
        if (tf.key.startsWith('custom_')) {
          const slug = tf.key.replace('custom_', '')
          parsed.customFields[slug] = val
        } else {
          parsed[tf.key] = val
        }
      })
      
      // Defaults if missing mapping
      if (!parsed.stage) parsed.stage = 'REGISTERED'
      
      return parsed
    })

    try {
      const res = await fetch('/api/staff/admissions/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToValidate })
      })
      const data = await res.json()
      if (data.results) {
        setValidationResults(data.results)
        setStep('VALIDATE')
      } else {
        alert(data.error || 'Validation failed')
      }
    } catch (e) {
      alert('Error validating data')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    const validRows = validationResults.filter(r => r.valid).map(r => r.data)

    try {
      const res = await fetch('/api/staff/admissions/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validRows })
      })
      const data = await res.json()
      if (data.importedCount !== undefined) {
        setImportStats({ imported: data.importedCount, errors: data.errors || [] })
        setStep('IMPORT')
      } else {
        alert(data.error || 'Import failed')
      }
    } catch (e) {
      alert('Error executing import')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between text-sm font-medium text-slate-500">
          <span className={step === 'UPLOAD' ? 'text-aerojet-blue font-bold dark:text-aerojet-sky' : ''}>1. Upload</span>
          <ArrowRight className="h-4 w-4" />
          <span className={step === 'MAP' ? 'text-aerojet-blue font-bold dark:text-aerojet-sky' : ''}>2. Map Columns</span>
          <ArrowRight className="h-4 w-4" />
          <span className={step === 'VALIDATE' ? 'text-aerojet-blue font-bold dark:text-aerojet-sky' : ''}>3. Validate</span>
          <ArrowRight className="h-4 w-4" />
          <span className={step === 'IMPORT' ? 'text-aerojet-blue font-bold dark:text-aerojet-sky' : ''}>4. Result</span>
        </div>
      </div>

      <div className="p-6">
        {step === 'UPLOAD' && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-16 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <FileSpreadsheet className="mb-4 h-12 w-12 text-slate-400" />
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Upload CSV File</h3>
            <p className="mb-6 max-w-sm text-sm text-slate-500">
              Ensure your file has a header row. Legacy data will automatically create applications and user profiles.
            </p>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-aerojet-blue px-6 py-2.5 text-sm font-bold text-white hover:bg-aerojet-blue/90"
            >
              Select CSV File
            </button>
          </div>
        )}

        {step === 'MAP' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Map Columns</h3>
            <p className="text-sm text-slate-500">Match the fields in your CSV to the system properties.</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {allTargetFields.map(tf => (
                <div key={tf.key} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {tf.label}
                      {tf.required && <span className="ml-1 text-red-500">*</span>}
                    </div>
                  </div>
                  <select
                    className="w-1/2 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                    value={mapping[tf.key] || ''}
                    onChange={e => setMapping({ ...mapping, [tf.key]: e.target.value })}
                  >
                    <option value="">-- Ignore --</option>
                    {csvHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleValidate}
                disabled={isImporting}
                className="rounded-lg bg-aerojet-blue px-6 py-2 font-bold text-white hover:bg-aerojet-blue/90 disabled:opacity-50"
              >
                {isImporting ? 'Validating...' : 'Validate Data'}
              </button>
            </div>
          </div>
        )}

        {step === 'VALIDATE' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Validation Results</h3>
            
            <div className="flex gap-4">
              <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300 flex-1 border border-green-200 dark:border-green-800/50">
                <div className="font-bold text-xl">{validationResults.filter(r => r.valid).length}</div>
                <div className="text-sm">Ready to Import</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300 flex-1 border border-red-200 dark:border-red-800/50">
                <div className="font-bold text-xl">{validationResults.filter(r => !r.valid).length}</div>
                <div className="text-sm">Rows with Errors</div>
              </div>
            </div>

            {validationResults.filter(r => !r.valid).length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-red-200 bg-red-50/50 p-4 text-sm dark:border-red-900/50 dark:bg-red-900/10">
                <h4 className="mb-2 font-bold text-red-800 dark:text-red-400">Errors found:</h4>
                <ul className="list-disc pl-5 space-y-1 text-red-700 dark:text-red-300">
                  {validationResults.filter(r => !r.valid).slice(0, 50).map((r, i) => (
                    <li key={i}>Row {r.row + 1}: {r.errors?.join(', ')}</li>
                  ))}
                  {validationResults.filter(r => !r.valid).length > 50 && (
                    <li className="font-medium text-red-800">+ {validationResults.filter(r => !r.valid).length - 50} more errors</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep('MAP')}
                disabled={isImporting}
                className="rounded-lg border border-slate-300 px-6 py-2 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Back to Mapping
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting || validationResults.filter(r => r.valid).length === 0}
                className="rounded-lg bg-green-600 px-6 py-2 font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : `Import ${validationResults.filter(r => r.valid).length} Valid Rows`}
              </button>
            </div>
          </div>
        )}

        {step === 'IMPORT' && importStats && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Import Complete!</h3>
            <p className="text-slate-500">Successfully imported {importStats.imported} records.</p>

            {importStats.errors.length > 0 && (
              <div className="mt-4 w-full max-w-lg rounded-lg border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  {importStats.errors.length} Execution Errors:
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {importStats.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {importStats.errors.length > 10 && (
                    <li>...and {importStats.errors.length - 10} more.</li>
                  )}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setStep('UPLOAD')
                setCsvData([])
                setCsvHeaders([])
                setMapping({})
                setValidationResults([])
                setImportStats(null)
              }}
              className="mt-6 rounded-lg bg-slate-900 px-6 py-2.5 font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Start New Import
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
