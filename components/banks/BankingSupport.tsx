'use client'

import { useActions, useUIState } from 'ai/rsc'
import { useState } from 'react'
import {
  AlertTriangle,
  CreditCard,
  Lock,
  DollarSign,
  HelpCircle,
  ChevronRight,
  Mail,
  Phone
} from 'lucide-react'

interface BankingIssue {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

interface Bank {
  id: number
  name: string
  email: string
  phone: string
}

const bankingIssues: BankingIssue[] = [
  {
    id: 1,
    title: 'Customer Support',
    description: 'Contact to customer care of any bank',
    icon: <CreditCard className="shrink-0 text-blue-500 w-4 h-4" />
  },
  {
    id: 2,
    title: 'Account Security',
    description: 'Suspicious activity, fraud alerts, or account locks',
    icon: <AlertTriangle className="shrink-0 text-red-500 w-4 h-4" />
  },
  {
    id: 3,
    title: 'Online Banking',
    description: 'Login issues, password reset, or app troubleshooting',
    icon: <Lock className="shrink-0 text-green-500 w-4 h-4" />
  },
  {
    id: 4,
    title: 'Transactions & Payments',
    description: 'Transfer errors, payment issues, or transaction disputes',
    icon: <DollarSign className="shrink-0 text-yellow-500 w-4 h-4" />
  },
  {
    id: 5,
    title: 'General Inquiries',
    description: 'Account information, fees, or other banking questions',
    icon: <HelpCircle className="shrink-0 text-purple-500 w-4 h-4" />
  }
]

const banks: Bank[] = [
  {
    id: 1,
    name: 'GlobalBank',
    email: 'support@globalbank.com',
    phone: '1-800-123-4567'
  },
  {
    id: 2,
    name: 'CityFinance',
    email: 'help@cityfinance.com',
    phone: '1-888-765-4321'
  },
  {
    id: 3,
    name: 'NationalTrust',
    email: 'care@nationaltrust.com',
    phone: '1-877-987-6543'
  }
]

export const BankingSupport = () => {
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState()
  const [selectedIssue, setSelectedIssue] = useState<BankingIssue | null>(null)
  const [needRepresentative, setNeedRepresentative] = useState<boolean | null>(
    null
  )
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [issueDetails, setIssueDetails] = useState<string>('')

  const handleIssueSelection = async (issue: BankingIssue) => {
    setSelectedIssue(issue)
    const response = await submitUserMessage(
      `I need assistance with ${issue.title}. Specifically, ${issue.description}. Can you help me?`
    )
    setMessages((currentMessages: any[]) => [...currentMessages, response])
  }

  const handleRepresentativeNeed = (need: boolean) => {
    setNeedRepresentative(need)
    setSelectedBank(null)
  }

  const handleBankSelection = (bank: Bank) => {
    setSelectedBank(bank)
  }

  const handleIssueDetailsSubmit = async () => {
    if (selectedBank && issueDetails) {
      console.log(`Sending email to ${selectedBank.email}:
Subject: Support Request - ${selectedIssue?.title}
Body: ${issueDetails}`)

      const response = await submitUserMessage(
        `I've sent an email to ${selectedBank.name} customer support regarding your ${selectedIssue?.title} issue. They will respond to you shortly. Is there anything else I can help you with?`
      )
      setMessages((currentMessages: any[]) => [...currentMessages, response])

      setIssueDetails('')
      setSelectedBank(null)
      setNeedRepresentative(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">
        Welcome to our Secure Banking Support. How can we assist you today?
      </h1>
      <div className="grid gap-3 border border-zinc-200 rounded-xl bg-white shadow-sm p-3">
        {bankingIssues.map(issue => (
          <button
            key={issue.id}
            className="flex items-center justify-between p-2 text-left transition-colors bg-zinc-50 hover:bg-zinc-100 rounded-lg cursor-pointer"
            onClick={() => handleIssueSelection(issue)}
          >
            <div className="flex items-center">
              {issue.icon}
              <div className="ml-2">
                <div className="font-medium text-sm">{issue.title}</div>
                <div className="text-xs text-zinc-600">{issue.description}</div>
              </div>
            </div>
            <ChevronRight
              className="shrink-0 ml-2 text-zinc-400 w-4 h-4"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      {selectedIssue && (
        <div className="mt-3 p-3 border border-zinc-200 rounded-xl bg-white shadow-sm">
          <p className="mb-2 text-sm">
            Need to speak with a banking representative?
          </p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              onClick={() => handleRepresentativeNeed(true)}
            >
              Yes
            </button>
            <button
              className="px-3 py-1 text-xs text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
              onClick={() => handleRepresentativeNeed(false)}
            >
              No
            </button>
          </div>
        </div>
      )}
      {needRepresentative && (
        <div className="mt-3 p-3 border border-zinc-200 rounded-xl bg-white shadow-sm">
          <p className="mb-2 text-sm">
            Which bank customer care do you want to contact?
          </p>
          <div className="grid gap-2">
            {banks.map(bank => (
              <button
                key={bank.id}
                className="px-3 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                onClick={() => handleBankSelection(bank)}
              >
                {bank.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedBank && (
        <div className="mt-3 p-3 border border-zinc-200 rounded-xl bg-white shadow-sm">
          <h3 className="font-semibold text-sm mb-1">
            {selectedBank.name} Contact Information:
          </h3>
          <p className="text-xs">Email: {selectedBank.email}</p>
          <p className="text-xs">Phone: {selectedBank.phone}</p>
          <div className="mt-2">
            <p className="mb-1 text-sm">
              Would you like to draft an email about your issue?
            </p>
            <textarea
              className="w-full p-2 text-xs border border-gray-300 rounded-md"
              rows={3}
              value={issueDetails}
              onChange={e => setIssueDetails(e.target.value)}
              placeholder="Describe your issue in detail..."
            />
            <button
              className="mt-2 px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              onClick={handleIssueDetailsSubmit}
            >
              Send Email
            </button>
          </div>
        </div>
      )}
    </div>
  )
}