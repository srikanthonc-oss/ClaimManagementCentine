import { describe, it, expect } from 'vitest'
import {
  ClaimSchema,
  ClaimsAPIConfigSchema,
  EDIGatewayConfigSchema,
  FileUploadConfigSchema,
  FHIRAPIConfigSchema,
  SFTPFeedConfigSchema,
  DataSourceSchema,
  FileUploadSchema,
  validateClaim,
  validateDataSource,
  validateFileUpload,
  validateDataSourceConfig,
  formatValidationErrors,
  isPlatform,
  isClassification,
  isClaimStatus,
  isDataSourceType,
} from './schemas'

describe('ClaimSchema', () => {
  it('should validate a valid claim', () => {
    const validClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(validClaim)
    expect(result.success).toBe(true)
  })

  it('should reject claim with negative billedAmount', () => {
    const invalidClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: -100,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(invalidClaim)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('positive')
    }
  })

  it('should reject claim with zero billedAmount', () => {
    const invalidClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 0,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(invalidClaim)
    expect(result.success).toBe(false)
  })

  it('should reject claim with negative daysAged', () => {
    const invalidClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 85,
      daysAged: -5,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(invalidClaim)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('non-negative')
    }
  })

  it('should accept claim with zero daysAged', () => {
    const validClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 85,
      daysAged: 0,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(validClaim)
    expect(result.success).toBe(true)
  })

  it('should reject claim with non-integer daysAged', () => {
    const invalidClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 85,
      daysAged: 10.5,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(invalidClaim)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('integer')
    }
  })

  it('should reject claim with confidence below 0', () => {
    const invalidClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: -1,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(invalidClaim)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at least 0')
    }
  })

  it('should reject claim with confidence above 100', () => {
    const invalidClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 101,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(invalidClaim)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('at most 100')
    }
  })

  it('should accept claim with confidence at boundaries (0 and 100)', () => {
    const claimWith0 = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 0,
      daysAged: 10,
      state: 'CA',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const claimWith100 = { ...claimWith0, confidence: 100 }

    expect(ClaimSchema.safeParse(claimWith0).success).toBe(true)
    expect(ClaimSchema.safeParse(claimWith100).success).toBe(true)
  })

  it('should convert state to uppercase', () => {
    const claim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'ca',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(claim)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.state).toBe('CA')
    }
  })

  it('should reject state with invalid length', () => {
    const invalidClaim = {
      id: 'claim-123',
      claimNumber: 'CLM-2024-001',
      classification: 'DUAL',
      platform: 'Facet',
      providerName: 'Dr. Smith',
      billedAmount: 1500.50,
      status: 'Pending',
      confidence: 85,
      daysAged: 10,
      state: 'CAL',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = ClaimSchema.safeParse(invalidClaim)
    expect(result.success).toBe(false)
  })
})

describe('DataSourceConfig Schemas', () => {
  describe('ClaimsAPIConfigSchema', () => {
    it('should validate valid Claims API config', () => {
      const config = {
        endpoint: 'https://api.example.com/claims',
        apiKey: 'test-api-key-123',
        timeout: 5000,
      }

      const result = ClaimsAPIConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL', () => {
      const config = {
        endpoint: 'not-a-url',
        apiKey: 'test-api-key-123',
      }

      const result = ClaimsAPIConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })

    it('should accept config without optional timeout', () => {
      const config = {
        endpoint: 'https://api.example.com/claims',
        apiKey: 'test-api-key-123',
      }

      const result = ClaimsAPIConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })
  })

  describe('EDIGatewayConfigSchema', () => {
    it('should validate valid EDI Gateway config', () => {
      const config = {
        host: 'edi.example.com',
        port: 8080,
        username: 'edi-user',
        password: 'secure-password',
      }

      const result = EDIGatewayConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should reject port below 1', () => {
      const config = {
        host: 'edi.example.com',
        port: 0,
        username: 'edi-user',
        password: 'secure-password',
      }

      const result = EDIGatewayConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })

    it('should reject port above 65535', () => {
      const config = {
        host: 'edi.example.com',
        port: 65536,
        username: 'edi-user',
        password: 'secure-password',
      }

      const result = EDIGatewayConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('FileUploadConfigSchema', () => {
    it('should validate valid File Upload config', () => {
      const config = {
        allowedExtensions: ['.xls', '.xlsx'],
        maxFileSize: 52428800, // 50MB
      }

      const result = FileUploadConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should reject empty allowedExtensions array', () => {
      const config = {
        allowedExtensions: [],
        maxFileSize: 52428800,
      }

      const result = FileUploadConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })

    it('should reject negative maxFileSize', () => {
      const config = {
        allowedExtensions: ['.xls'],
        maxFileSize: -1,
      }

      const result = FileUploadConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('FHIRAPIConfigSchema', () => {
    it('should validate valid FHIR API config', () => {
      const config = {
        baseUrl: 'https://fhir.example.com',
        version: 'R4',
        authToken: 'bearer-token-123',
      }

      const result = FHIRAPIConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should reject invalid baseUrl', () => {
      const config = {
        baseUrl: 'not-a-url',
        version: 'R4',
        authToken: 'bearer-token-123',
      }

      const result = FHIRAPIConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })

  describe('SFTPFeedConfigSchema', () => {
    it('should validate valid SFTP Feed config', () => {
      const config = {
        host: 'sftp.example.com',
        port: 22,
        username: 'sftp-user',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\n...',
        remotePath: '/data/claims',
      }

      const result = SFTPFeedConfigSchema.safeParse(config)
      expect(result.success).toBe(true)
    })

    it('should reject invalid port range', () => {
      const config = {
        host: 'sftp.example.com',
        port: 70000,
        username: 'sftp-user',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----\n...',
        remotePath: '/data/claims',
      }

      const result = SFTPFeedConfigSchema.safeParse(config)
      expect(result.success).toBe(false)
    })
  })
})

describe('FileUploadSchema', () => {
  it('should validate valid XLS file', () => {
    const file = new File(['test content'], 'claims.xls', { type: 'application/vnd.ms-excel' })
    const result = FileUploadSchema.safeParse({ file })
    expect(result.success).toBe(true)
  })

  it('should validate valid XLSX file', () => {
    const file = new File(['test content'], 'claims.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const result = FileUploadSchema.safeParse({ file })
    expect(result.success).toBe(true)
  })

  it('should reject file exceeding 50MB', () => {
    // Create a mock file object with size property set to exceed 50MB
    // Using Object.defineProperty to avoid actually creating a large file
    const file = new File(['test'], 'large.xls', { type: 'application/vnd.ms-excel' })
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024, writable: false })
    const result = FileUploadSchema.safeParse({ file })
    expect(result.success).toBe(false)
  })

  it('should reject empty file', () => {
    const file = new File([], 'empty.xls', { type: 'application/vnd.ms-excel' })
    const result = FileUploadSchema.safeParse({ file })
    expect(result.success).toBe(false)
  })

  it('should reject non-XLS file', () => {
    const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' })
    const result = FileUploadSchema.safeParse({ file })
    expect(result.success).toBe(false)
  })

  it('should handle case-insensitive file extensions', () => {
    const file = new File(['test content'], 'claims.XLS', { type: 'application/vnd.ms-excel' })
    const result = FileUploadSchema.safeParse({ file })
    expect(result.success).toBe(true)
  })
})

describe('Validation Utility Functions', () => {
  describe('validateClaim', () => {
    it('should return success for valid claim', () => {
      const validClaim = {
        id: 'claim-123',
        claimNumber: 'CLM-2024-001',
        classification: 'DUAL',
        platform: 'Facet',
        providerName: 'Dr. Smith',
        billedAmount: 1500.50,
        status: 'Pending',
        confidence: 85,
        daysAged: 10,
        state: 'CA',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateClaim(validClaim)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toBeUndefined()
    })

    it('should return errors for invalid claim', () => {
      const invalidClaim = {
        id: 'claim-123',
        billedAmount: -100,
        confidence: 150,
      }

      const result = validateClaim(invalidClaim)
      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('validateDataSource', () => {
    it('should return success for valid data source', () => {
      const validDataSource = {
        id: 'ds-123',
        name: 'Claims API Source',
        type: 'Claims API',
        config: {
          endpoint: 'https://api.example.com/claims',
          apiKey: 'test-key',
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = validateDataSource(validDataSource)
      expect(result.success).toBe(true)
    })
  })

  describe('validateFileUpload', () => {
    it('should return success for valid file', () => {
      const file = new File(['test'], 'claims.xls', { type: 'application/vnd.ms-excel' })
      const result = validateFileUpload(file)
      expect(result.success).toBe(true)
    })

    it('should return errors for invalid file', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })
      const result = validateFileUpload(file)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('validateDataSourceConfig', () => {
    it('should validate Claims API config', () => {
      const config = {
        endpoint: 'https://api.example.com',
        apiKey: 'test-key',
      }

      const result = validateDataSourceConfig('Claims API', config)
      expect(result.success).toBe(true)
    })

    it('should validate EDI Gateway config', () => {
      const config = {
        host: 'edi.example.com',
        port: 8080,
        username: 'user',
        password: 'pass',
      }

      const result = validateDataSourceConfig('EDI Gateway', config)
      expect(result.success).toBe(true)
    })

    it('should return errors for invalid config', () => {
      const config = {
        endpoint: 'not-a-url',
      }

      const result = validateDataSourceConfig('Claims API', config)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('formatValidationErrors', () => {
    it('should return empty string for no errors', () => {
      const result = formatValidationErrors([])
      expect(result).toBe('')
    })

    it('should return single error message', () => {
      const errors = [{ path: 'billedAmount', message: 'Must be positive' }]
      const result = formatValidationErrors(errors)
      expect(result).toBe('Must be positive')
    })

    it('should format multiple errors', () => {
      const errors = [
        { path: 'billedAmount', message: 'Must be positive' },
        { path: 'confidence', message: 'Must be between 0 and 100' },
      ]
      const result = formatValidationErrors(errors)
      expect(result).toContain('billedAmount: Must be positive')
      expect(result).toContain('confidence: Must be between 0 and 100')
    })
  })

  describe('Type Guards', () => {
    describe('isPlatform', () => {
      it('should return true for valid platforms', () => {
        expect(isPlatform('Facet')).toBe(true)
        expect(isPlatform('Amisys')).toBe(true)
        expect(isPlatform('Xcelys')).toBe(true)
      })

      it('should return false for invalid platforms', () => {
        expect(isPlatform('InvalidPlatform')).toBe(false)
        expect(isPlatform('')).toBe(false)
        expect(isPlatform(null)).toBe(false)
        expect(isPlatform(undefined)).toBe(false)
      })
    })

    describe('isClassification', () => {
      it('should return true for valid classifications', () => {
        expect(isClassification('DUAL')).toBe(true)
        expect(isClassification('Duplicate')).toBe(true)
        expect(isClassification('COB')).toBe(true)
      })

      it('should return false for invalid classifications', () => {
        expect(isClassification('Invalid')).toBe(false)
        expect(isClassification('')).toBe(false)
      })
    })

    describe('isClaimStatus', () => {
      it('should return true for valid statuses', () => {
        expect(isClaimStatus('Pending')).toBe(true)
        expect(isClaimStatus('Approved')).toBe(true)
        expect(isClaimStatus('Denied')).toBe(true)
        expect(isClaimStatus('In Review')).toBe(true)
      })

      it('should return false for invalid statuses', () => {
        expect(isClaimStatus('Invalid')).toBe(false)
      })
    })

    describe('isDataSourceType', () => {
      it('should return true for valid data source types', () => {
        expect(isDataSourceType('Claims API')).toBe(true)
        expect(isDataSourceType('EDI Gateway')).toBe(true)
        expect(isDataSourceType('File Upload')).toBe(true)
        expect(isDataSourceType('FHIR API')).toBe(true)
        expect(isDataSourceType('SFTP Feed')).toBe(true)
      })

      it('should return false for invalid data source types', () => {
        expect(isDataSourceType('Invalid')).toBe(false)
      })
    })
  })
})
