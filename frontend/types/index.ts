// Core Types
export type Platform = 'Facet' | 'Amisys' | 'Xcelys'
export type Classification =
  | 'DUAL'
  | 'Duplicate'
  | 'COB'
  | 'Pricing'
  | 'Auth'
  | 'Corrected Claims'
  | 'High Dollar'
  | 'Other Pend'
export type ClaimStatus = 'Pending' | 'Processing' | 'Approved' | 'Denied' | 'In Review'
export type DataSourceType = 'Claims API' | 'EDI Gateway' | 'File Upload' | 'FHIR API' | 'SFTP Feed'

// Data Models
export interface Claim {
  id: string
  claimNumber: string
  classification: Classification
  platform: Platform
  providerName: string
  billedAmount: number
  status: ClaimStatus
  confidence: number // 0-100
  daysAged: number
  state: string // US state code
  createdAt: Date
  updatedAt: Date
  // Extended fields from upload
  holdCode?: string
  submitType?: string
  claimType?: string
  providerSpecialty?: string
  allowedAmount?: number
  subscriberId?: string
  parFlag?: string
  form?: string
  recvDt?: string
}

export interface DataSource {
  id: string
  name: string
  type: DataSourceType
  config: DataSourceConfig
  status: 'active' | 'inactive' | 'error'
  lastSync?: Date
  createdAt: Date
  updatedAt: Date
}

export type DataSourceConfig =
  | ClaimsAPIConfig
  | EDIGatewayConfig
  | FileUploadConfig
  | FHIRAPIConfig
  | SFTPFeedConfig

export interface ClaimsAPIConfig {
  endpoint: string
  apiKey: string
  timeout?: number
}

export interface EDIGatewayConfig {
  host: string
  port: number
  username: string
  password: string
}

export interface FileUploadConfig {
  allowedExtensions: string[]
  maxFileSize: number // bytes
}

export interface FHIRAPIConfig {
  baseUrl: string
  version: string // e.g., 'R4'
  authToken: string
}

export interface SFTPFeedConfig {
  host: string
  port: number
  username: string
  privateKey: string
  remotePath: string
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalClaims: number
  claimsByClassification: Record<Classification, number>
  claimsByPlatform: Record<Platform, number>
  claimsByStatus: Record<ClaimStatus, number>
  totalBilledAmount: number
  averageBilledAmount: number
  averageDaysAged: number
  lastUpdated: Date
}

// File Upload
export interface FileUploadResult {
  success: boolean
  claimsParsed: number
  errors: FileParseError[]
  claims: Claim[]
}

export interface FileParseError {
  row: number
  column?: string
  message: string
  severity: 'error' | 'warning'
}
