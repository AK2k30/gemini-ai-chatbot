'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { banks } from '@/components/banks/bankData'

interface SendEmailButtonProps {
  generatedEmail: string
}

export function SendEmailButton({ generatedEmail }: SendEmailButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)

  const handleSendEmail = async () => {
    if (!selectedBank) {
      setEmailStatus('Please select a bank')
      return
    }

    setEmailStatus('Sending email...')
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bank: selectedBank,
          emailContent: generatedEmail
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error details from server:', errorData)
        throw new Error('Failed to send email')
      }

      const data = await response.json()
      setEmailStatus('Email sent successfully!')
    } catch (error) {
      console.error('Error sending email:', error)
      setEmailStatus(
        'An error occurred while sending the email. Please try again later.'
      )
    }
  }

  return (
    <>
      <div className="flex justify-start mt-2">
        <Button onClick={() => setIsDialogOpen(true)}>Send Email</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>
          <Select onValueChange={setSelectedBank}>
            <SelectTrigger>
              <SelectValue placeholder="Select a bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map(bank => (
                <SelectItem key={bank.id} value={bank.name}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSendEmail}>Confirm and Send</Button>
          {emailStatus && <p>{emailStatus}</p>}
        </DialogContent>
      </Dialog>
    </>
  )
}