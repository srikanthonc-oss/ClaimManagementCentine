import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import dotenv from 'dotenv'

dotenv.config()

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export const dynamoDB = DynamoDBDocumentClient.from(client)

const HITL_TABLE = process.env.HITL_TABLE || 'we-bt-cob-agent-state-DynamoDB-D-01'

/**
 * Store agent execution state in DynamoDB
 */
export async function putAgentState(claimNumber: string, agentName: string, state: any) {
  await dynamoDB.send(new PutCommand({
    TableName: HITL_TABLE,
    Item: {
      pk: `CLAIM#${claimNumber}`,
      sk: `AGENT#${agentName}`,
      claimNumber,
      agentName,
      state,
      updatedAt: new Date().toISOString(),
    },
  }))
}

/**
 * Get agent state for a claim
 */
export async function getAgentState(claimNumber: string, agentName: string) {
  const result = await dynamoDB.send(new GetCommand({
    TableName: HITL_TABLE,
    Key: {
      pk: `CLAIM#${claimNumber}`,
      sk: `AGENT#${agentName}`,
    },
  }))
  return result.Item
}

/**
 * Get all agent states for a claim
 */
export async function getAllAgentStates(claimNumber: string) {
  const result = await dynamoDB.send(new QueryCommand({
    TableName: HITL_TABLE,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': `CLAIM#${claimNumber}` },
  }))
  return result.Items || []
}
