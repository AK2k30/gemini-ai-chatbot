interface EmailDraft {
  subject: string
  body: string
}

let storedEmailJSON: string | null = null

export function storeEmail(subject: string, body: string) {
  const emailDraft: EmailDraft = { subject, body }
  storedEmailJSON = JSON.stringify(emailDraft)
  if (typeof window !== 'undefined') {
    localStorage.setItem('storedEmail', storedEmailJSON)
  }
}

export function getStoredEmail(): EmailDraft | null {
  if (typeof window !== 'undefined') {
    const localStorageEmail = localStorage.getItem('storedEmail')
    if (localStorageEmail) {
      storedEmailJSON = localStorageEmail
    }
  }
  if (storedEmailJSON) {
    return JSON.parse(storedEmailJSON)
  }
  return null
}

export function clearStoredEmail() {
  storedEmailJSON = null
  if (typeof window !== 'undefined') {
    localStorage.removeItem('storedEmail')
  }
}

// Optional: Function to get the raw JSON string
export function getStoredEmailJSON(): string | null {
  return storedEmailJSON
}