'use client'

import * as React from 'react'
import { LoadingSpinner } from './loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/**
 * LoadingSpinner Examples
 * 
 * This file demonstrates various use cases for the LoadingSpinner component.
 * These examples can be used as a reference for implementing loading states
 * throughout the application.
 */

export function LoadingSpinnerExamples() {
  const [isLoading, setIsLoading] = React.useState(false)

  const simulateLoading = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 3000)
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">LoadingSpinner Examples</h1>
        <p className="text-muted-foreground">
          Various examples of the LoadingSpinner component in different contexts
        </p>
      </div>

      {/* Basic Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic Examples</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Default Spinner</CardTitle>
            <CardDescription>Basic spinner without text</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spinner with Text</CardTitle>
            <CardDescription>Spinner with loading message</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner text="Loading claims data..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Centered Spinner</CardTitle>
            <CardDescription>Spinner centered in container with minimum height</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner text="Processing..." centered />
          </CardContent>
        </Card>
      </section>

      {/* Size Variants */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Size Variants</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Small Spinner</CardTitle>
            <CardDescription>Compact spinner for inline use</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-8">
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="sm" text="Loading..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Spinner</CardTitle>
            <CardDescription>Standard size for most use cases</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-8">
            <LoadingSpinner size="default" />
            <LoadingSpinner size="default" text="Loading..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Large Spinner</CardTitle>
            <CardDescription>Prominent spinner for full-page loading</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-8">
            <LoadingSpinner size="lg" />
            <LoadingSpinner size="lg" text="Loading..." />
          </CardContent>
        </Card>
      </section>

      {/* Practical Use Cases */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Practical Use Cases</h2>

        <Card>
          <CardHeader>
            <CardTitle>Loading Button</CardTitle>
            <CardDescription>Button with loading state</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={simulateLoading} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Click to Load'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Loading State</CardTitle>
            <CardDescription>Full card with centered loading spinner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4">
              <LoadingSpinner 
                text="Fetching dashboard metrics..." 
                size="default"
                centered 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inline Loading</CardTitle>
            <CardDescription>Small spinner inline with text</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-muted-foreground">
                Uploading file...
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Table Loading State</CardTitle>
            <CardDescription>Loading state for data tables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <div className="p-8">
                <LoadingSpinner 
                  text="Loading claims table..." 
                  size="default"
                  centered 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Upload Progress</CardTitle>
            <CardDescription>Loading state during file upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8">
              <LoadingSpinner 
                text="Parsing XLS file..." 
                size="lg"
                centered 
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Custom Styling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Custom Styling</h2>

        <Card>
          <CardHeader>
            <CardTitle>Custom Background</CardTitle>
            <CardDescription>Spinner with custom background and padding</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner 
              text="Loading..." 
              className="bg-muted rounded-lg p-8"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Spacing</CardTitle>
            <CardDescription>Spinner with custom margin and padding</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner 
              text="Processing data..." 
              className="my-8 p-4 border rounded-md"
            />
          </CardContent>
        </Card>
      </section>

      {/* Context Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Context-Specific Examples</h2>

        <Card>
          <CardHeader>
            <CardTitle>Dashboard Loading</CardTitle>
            <CardDescription>Loading state for dashboard metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner 
              text="Loading dashboard metrics..." 
              size="lg"
              centered 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Source Connection</CardTitle>
            <CardDescription>Loading state when testing data source connection</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner 
              text="Testing connection to Claims API..." 
              size="default"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classification Tab Loading</CardTitle>
            <CardDescription>Loading state when switching between classification tabs</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner 
              text="Loading DUAL claims..." 
              size="default"
              centered 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Filter Loading</CardTitle>
            <CardDescription>Loading state when applying platform filters</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSpinner 
              text="Filtering claims by platform..." 
              size="sm"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default LoadingSpinnerExamples
