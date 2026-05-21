import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import dotenv from 'dotenv'

dotenv.config()

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.S3_BUCKET || 'dice-bpaas-bucket'

/**
 * Upload a file to S3
 */
export async function uploadToS3(key: string, body: Buffer, contentType: string) {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return `s3://${BUCKET}/${key}`
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedFileUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * List files for a claim
 */
export async function listClaimFiles(claimNumber: string) {
  const result = await s3Client.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: `claims/${claimNumber}/`,
  }))
  return result.Contents || []
}
