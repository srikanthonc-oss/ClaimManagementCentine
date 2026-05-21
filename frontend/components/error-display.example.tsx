'use client'

import * as React from 'react'
import { ErrorDisplay } from './error-display'
import { Button } from '@/components/ui/button'

/**
 * ErrorDisplay Component Examples
 * 
 * This file demonstrates various use cases of the ErrorDisplay component.
 */

export function ErrorDisplayExamples() {
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [showDismissable, setShowDismissable] = React.useState(true)

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      setIsRetrying(false)
      alert('Retry completed!')
    }, 2000)
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">ErrorDisplay Component Examples</h2>
        <p className="text-muted-foreground mb-8">
          Demonstrating various error types and configurations
        </p>
      </div>

      {/* Connection Error */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Connection Error</h3>
        <ErrorDisplay
          type="connection"
          message="Unable to connect to the Claims API"
          details="Connection timeout after 30 seconds. Please check your network connection and try again."
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      </section>

      {/* Parsing Error */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Parsing Error</h3>
        <ErrorDisplay
          type="parsing"
          title="Invalid File Format"
          message="The uploaded file contains invalid data"
          details="Missing required columns: ClaimNumber, BilledAmount, Platform"
        />
      </section>

      {/* Network Error */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Network Error</h3>
        <ErrorDisplay
          type="network"
          message="Failed to fetch claims data. Please check your internet connection."
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      </section>

      {/* Validation Error */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Validation Error</h3>
        <ErrorDisplay
          type="validation"
          message="Invalid data in the uploaded file"
          details="Row 5: BilledAmount must be a positive number (received: -150.00)\nRow 12: DaysAged must be a non-negative integer (received: -5)"
        />
      </section>

      {/* General Error */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">General Error</h3>
        <ErrorDisplay
          type="general"
          message="An unexpected error occurred while processing your request"
        />
      </section>

      {/* Inline Variant - Connection */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Inline Variant - Connection Error</h3>
        <ErrorDisplay
          type="connection"
          message="Failed to connect to data source"
          variant="inline"
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      </section>

      {/* Inline Variant - Validation */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Inline Variant - Validation Error</h3>
        <ErrorDisplay
          type="validation"
          message="Please enter a valid claim number (format: CLM-XXXXXX)"
          variant="inline"
        />
      </section>

      {/* With Dismiss Button */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">With Dismiss Button</h3>
        {showDismissable && (
          <ErrorDisplay
            type="network"
            message="Failed to save changes"
            onRetry={handleRetry}
            onDismiss={() => setShowDismissable(false)}
            isRetrying={isRetrying}
          />
        )}
        {!showDismissable && (
          <div className="p-4 border rounded-md bg-muted/50">
            <p className="text-sm text-muted-foreground">Error dismissed</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDismissable(true)}
              className="mt-2"
            >
              Show Error Again
            </Button>
          </div>
        )}
      </section>

      {/* Custom Title */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Custom Title</h3>
        <ErrorDisplay
          type="parsing"
          title="XLS File Processing Failed"
          message="Unable to parse the uploaded Excel file"
          details="The file appears to be corrupted or in an unsupported format."
        />
      </section>

      {/* Long Error Message */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Long Error Message</h3>
        <ErrorDisplay
          type="general"
          message="The system encountered multiple errors while processing your request. This could be due to network issues, server problems, or invalid data in your submission. Please review your input and try again. If the problem persists, contact support."
        />
      </section>

      {/* Inline with Dismiss */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Inline with Dismiss</h3>
        <ErrorDisplay
          type="validation"
          message="Invalid email format"
          variant="inline"
          onDismiss={() => alert('Error dismissed')}
        />
      </section>

      {/* Multiple Errors in a Form Context */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Multiple Inline Errors (Form Context)</h3>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Claim Number</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="CLM-123456"
            />
            <div className="mt-2">
              <ErrorDisplay
                type="validation"
                message="Claim number is required"
                variant="inline"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Billed Amount</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="0.00"
            />
            <div className="mt-2">
              <ErrorDisplay
                type="validation"
                message="Amount must be a positive number"
                variant="inline"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ErrorDisplayExamples
