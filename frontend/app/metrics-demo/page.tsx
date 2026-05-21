'use client'

import { MetricsCard } from '@/components/metrics-card'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

/**
 * MetricsCard Demo Page
 * 
 * This page demonstrates all the features and variations of the MetricsCard component.
 * Visit /metrics-demo to see this page in action.
 */
export default function MetricsDemoPage() {
  return (
    <div className="container mx-auto space-y-8 p-8">
      <div>
        <h1 className="mb-2 text-4xl font-bold">MetricsCard Component Demo</h1>
        <p className="text-muted-foreground">
          Explore all the features and variations of the MetricsCard component
        </p>
      </div>

      {/* Basic Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic Examples</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricsCard title="Simple Metric" value={1234} />
          <MetricsCard title="With Icon" value={567} icon={<FileText className="h-4 w-4" />} />
          <MetricsCard title="String Value" value="85.5%" />
        </div>
      </section>

      {/* Trend Indicators */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Trend Indicators</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricsCard
            title="Positive Trend"
            value={1234}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={5.2}
          />
          <MetricsCard
            title="Negative Trend"
            value={567}
            icon={<Clock className="h-4 w-4" />}
            trend={-3.8}
          />
          <MetricsCard
            title="Zero Trend"
            value={890}
            icon={<FileText className="h-4 w-4" />}
            trend={0}
          />
        </div>
      </section>

      {/* Dashboard Simulation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard Simulation</h2>
        <p className="text-sm text-muted-foreground">
          Example of how MetricsCards would appear on the Claims Dashboard
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Total Claims"
            value={formatNumber(1234)}
            icon={<FileText className="h-4 w-4" />}
            trend={5.2}
          />
          <MetricsCard
            title="Pending Claims"
            value={formatNumber(567)}
            icon={<Clock className="h-4 w-4" />}
            trend={-3.8}
          />
          <MetricsCard
            title="Approved Claims"
            value={formatNumber(456)}
            icon={<CheckCircle className="h-4 w-4" />}
            trend={8.1}
          />
          <MetricsCard
            title="Denied Claims"
            value={formatNumber(89)}
            icon={<XCircle className="h-4 w-4" />}
            trend={-1.2}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricsCard
            title="Total Billed Amount"
            value={formatCurrency(1234567.89)}
            icon={<DollarSign className="h-4 w-4" />}
            trend={12.5}
          />
          <MetricsCard
            title="Average Days Aged"
            value="12.5"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={-5.3}
          />
          <MetricsCard
            title="Approval Rate"
            value="85.5%"
            icon={<CheckCircle className="h-4 w-4" />}
            trend={2.3}
          />
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading States</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricsCard
            title="Loading Metric"
            value={0}
            icon={<FileText className="h-4 w-4" />}
            isLoading={true}
          />
          <MetricsCard
            title="Loading with Trend"
            value={0}
            icon={<Clock className="h-4 w-4" />}
            trend={5.2}
            isLoading={true}
          />
          <MetricsCard title="Loading Simple" value={0} isLoading={true} />
        </div>
      </section>

      {/* Custom Styling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Custom Styling</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricsCard
            title="Priority Claims"
            value={89}
            icon={<AlertCircle className="h-4 w-4" />}
            trend={15.7}
            className="border-red-500 bg-red-50 dark:bg-red-950"
          />
          <MetricsCard
            title="High Value Claims"
            value={formatCurrency(500000)}
            icon={<DollarSign className="h-4 w-4" />}
            trend={8.3}
            className="border-green-500 bg-green-50 dark:bg-green-950"
          />
          <MetricsCard
            title="Active Users"
            value={234}
            icon={<Users className="h-4 w-4" />}
            trend={12.1}
            className="border-blue-500 bg-blue-50 dark:bg-blue-950"
          />
        </div>
      </section>

      {/* Edge Cases */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Edge Cases</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricsCard title="Zero Value" value={0} icon={<FileText className="h-4 w-4" />} />
          <MetricsCard
            title="Very Large Number"
            value={formatNumber(999999999)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricsCard
            title="Very Large Trend"
            value={100}
            icon={<AlertCircle className="h-4 w-4" />}
            trend={999.99}
          />
          <MetricsCard
            title="Very Small Trend"
            value={100}
            icon={<CheckCircle className="h-4 w-4" />}
            trend={0.01}
          />
          <MetricsCard
            title="Long Title That Might Wrap to Multiple Lines"
            value={1234}
            icon={<FileText className="h-4 w-4" />}
          />
          <MetricsCard title="Empty String" value="" icon={<FileText className="h-4 w-4" />} />
        </div>
      </section>

      {/* Responsive Layout */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Responsive Layout</h2>
        <p className="text-sm text-muted-foreground">
          Resize your browser to see how the grid adapts: 1 column on mobile, 2 on tablet, 4 on
          desktop
        </p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <MetricsCard
              key={i}
              title={`Metric ${i + 1}`}
              value={Math.floor(Math.random() * 10000)}
              icon={<FileText className="h-4 w-4" />}
              trend={Math.random() * 20 - 10}
            />
          ))}
        </div>
      </section>

      {/* Theme Support */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Theme Support</h2>
        <p className="text-sm text-muted-foreground">
          Toggle between light and dark themes using the theme switcher in the navigation to see
          how the cards adapt
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricsCard
            title="Light/Dark Theme"
            value={1234}
            icon={<FileText className="h-4 w-4" />}
            trend={5.2}
          />
          <MetricsCard
            title="Positive Trend Colors"
            value={567}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={8.5}
          />
          <MetricsCard
            title="Negative Trend Colors"
            value={890}
            icon={<Clock className="h-4 w-4" />}
            trend={-4.2}
          />
        </div>
      </section>
    </div>
  )
}
