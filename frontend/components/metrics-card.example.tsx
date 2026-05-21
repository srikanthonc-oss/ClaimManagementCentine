/**
 * MetricsCard Component Usage Examples
 * 
 * This file demonstrates various ways to use the MetricsCard component
 * in the Claims Management UI application.
 */

import { MetricsCard } from './metrics-card'
import { FileText, Clock, CheckCircle, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'

/**
 * Example 1: Basic MetricsCard with numeric value
 */
export function BasicMetricsCard() {
  return <MetricsCard title="Total Claims" value={1234} />
}

/**
 * Example 2: MetricsCard with icon
 */
export function MetricsCardWithIcon() {
  return (
    <MetricsCard
      title="Total Claims"
      value={1234}
      icon={<FileText className="h-4 w-4" />}
    />
  )
}

/**
 * Example 3: MetricsCard with positive trend
 */
export function MetricsCardWithPositiveTrend() {
  return (
    <MetricsCard
      title="Total Claims"
      value={1234}
      icon={<FileText className="h-4 w-4" />}
      trend={5.2}
    />
  )
}

/**
 * Example 4: MetricsCard with negative trend
 */
export function MetricsCardWithNegativeTrend() {
  return (
    <MetricsCard
      title="Pending Claims"
      value={567}
      icon={<Clock className="h-4 w-4" />}
      trend={-3.8}
    />
  )
}

/**
 * Example 5: MetricsCard with formatted currency
 */
export function MetricsCardWithCurrency() {
  const totalBilled = 1234567.89
  return (
    <MetricsCard
      title="Total Billed Amount"
      value={formatCurrency(totalBilled)}
      icon={<DollarSign className="h-4 w-4" />}
      trend={12.5}
    />
  )
}

/**
 * Example 6: MetricsCard with percentage value
 */
export function MetricsCardWithPercentage() {
  return (
    <MetricsCard
      title="Approval Rate"
      value="85.5%"
      icon={<CheckCircle className="h-4 w-4" />}
      trend={2.3}
    />
  )
}

/**
 * Example 7: MetricsCard in loading state
 */
export function MetricsCardLoading() {
  return (
    <MetricsCard
      title="Total Claims"
      value={0}
      icon={<FileText className="h-4 w-4" />}
      isLoading={true}
    />
  )
}

/**
 * Example 8: Dashboard grid with multiple MetricsCards
 */
export function DashboardMetricsGrid() {
  // Sample data
  const metrics = {
    totalClaims: 1234,
    pendingClaims: 567,
    approvedClaims: 456,
    deniedClaims: 89,
    totalBilled: 1234567.89,
    averageDaysAged: 12.5,
    approvalRate: 85.5,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        title="Total Claims"
        value={formatNumber(metrics.totalClaims)}
        icon={<FileText className="h-4 w-4" />}
        trend={5.2}
      />
      <MetricsCard
        title="Pending Claims"
        value={formatNumber(metrics.pendingClaims)}
        icon={<Clock className="h-4 w-4" />}
        trend={-3.8}
      />
      <MetricsCard
        title="Approved Claims"
        value={formatNumber(metrics.approvedClaims)}
        icon={<CheckCircle className="h-4 w-4" />}
        trend={8.1}
      />
      <MetricsCard
        title="Denied Claims"
        value={formatNumber(metrics.deniedClaims)}
        icon={<AlertCircle className="h-4 w-4" />}
        trend={-1.2}
      />
      <MetricsCard
        title="Total Billed Amount"
        value={formatCurrency(metrics.totalBilled)}
        icon={<DollarSign className="h-4 w-4" />}
        trend={12.5}
      />
      <MetricsCard
        title="Average Days Aged"
        value={metrics.averageDaysAged.toFixed(1)}
        icon={<TrendingUp className="h-4 w-4" />}
        trend={-5.3}
      />
      <MetricsCard
        title="Approval Rate"
        value={`${metrics.approvalRate.toFixed(1)}%`}
        icon={<CheckCircle className="h-4 w-4" />}
        trend={2.3}
      />
    </div>
  )
}

/**
 * Example 9: Responsive dashboard layout
 */
export function ResponsiveDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Claims Dashboard</h1>
      
      {/* Main metrics - 4 columns on large screens, 2 on medium, 1 on small */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Claims"
          value="1,234"
          icon={<FileText className="h-4 w-4" />}
          trend={5.2}
        />
        <MetricsCard
          title="Pending Claims"
          value="567"
          icon={<Clock className="h-4 w-4" />}
          trend={-3.8}
        />
        <MetricsCard
          title="Approval Rate"
          value="85.5%"
          icon={<CheckCircle className="h-4 w-4" />}
          trend={2.3}
        />
        <MetricsCard
          title="Total Billed"
          value="$1.2M"
          icon={<DollarSign className="h-4 w-4" />}
          trend={12.5}
        />
      </div>

      {/* Secondary metrics - 3 columns on large screens */}
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricsCard
          title="Average Days Aged"
          value="12.5"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricsCard
          title="High Dollar Claims"
          value="45"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <MetricsCard
          title="Duplicate Claims"
          value="23"
          icon={<FileText className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}

/**
 * Example 10: Custom styled MetricsCard
 */
export function CustomStyledMetricsCard() {
  return (
    <MetricsCard
      title="Priority Claims"
      value={89}
      icon={<AlertCircle className="h-4 w-4" />}
      trend={15.7}
      className="border-red-500 bg-red-50 dark:bg-red-950"
    />
  )
}
