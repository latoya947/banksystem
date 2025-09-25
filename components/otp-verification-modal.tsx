"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface OtpVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerify: (otp: string) => Promise<void>
}

export function OtpVerificationModal({ isOpen, onClose, onVerify }: OtpVerificationModalProps) {
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) return

    setIsVerifying(true)
    try {
      await onVerify(otp)
      setOtp("")
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>OTP Verification Required</DialogTitle>
          <DialogDescription>
            Please enter the 6-digit verification code to complete your transaction. The code expires in 10 minutes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-lg tracking-widest"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isVerifying || otp.length !== 6} className="flex-1">
              {isVerifying ? "Verifying..." : "Verify & Complete"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
