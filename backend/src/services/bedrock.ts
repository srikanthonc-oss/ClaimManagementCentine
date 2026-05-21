import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import dotenv from 'dotenv'

dotenv.config()

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const SONNET_MODEL = process.env.BEDROCK_SONNET_MODEL || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
const HAIKU_MODEL = process.env.BEDROCK_HAIKU_MODEL || 'anthropic.claude-3-haiku-20240307-v1:0'

/**
 * Invoke Bedrock model for claim processing
 */
export async function invokeAgent(prompt: string, useHaiku = false): Promise<string> {
  const modelId = useHaiku ? HAIKU_MODEL : SONNET_MODEL

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: new TextEncoder().encode(body),
  })

  const response = await bedrockClient.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))

  return responseBody.content[0]?.text || ''
}

/**
 * Run eligibility check agent
 */
export async function runEligibilityAgent(claimData: any): Promise<any> {
  const prompt = `You are an EligibilityAgent for healthcare claims processing.
Analyze this claim and verify eligibility:
${JSON.stringify(claimData, null, 2)}

Return a JSON object with:
- eligible: boolean
- primaryInsurance: string
- secondaryInsurance: string (if applicable)
- effectiveDate: string
- termDate: string
- confidence: number (0-100)
- reasoning: string`

  const result = await invokeAgent(prompt, true)
  try { return JSON.parse(result) } catch { return { raw: result } }
}

/**
 * Run COB coordination agent
 */
export async function runCOBAgent(claimData: any, eligibilityResult: any): Promise<any> {
  const prompt = `You are a COB Coordination Agent.
Given this claim and eligibility data, determine coordination of benefits:
Claim: ${JSON.stringify(claimData, null, 2)}
Eligibility: ${JSON.stringify(eligibilityResult, null, 2)}

Return a JSON object with:
- primaryPayer: string
- secondaryPayer: string
- coordinationRule: string (birthday, NAIC, MSP)
- secondaryPayment: number
- confidence: number (0-100)
- reasoning: string`

  const result = await invokeAgent(prompt)
  try { return JSON.parse(result) } catch { return { raw: result } }
}

/**
 * Run auto-adjudication agent
 */
export async function runResolutionAgent(claimData: any, agentResults: any): Promise<any> {
  const prompt = `You are the Auto-Adjudication Resolution Agent.
Based on all agent results, make a final decision:
Claim: ${JSON.stringify(claimData, null, 2)}
Agent Results: ${JSON.stringify(agentResults, null, 2)}

Return a JSON object with:
- recommendation: "auto-resolve" | "hitl-review" | "deny"
- confidence: { eligibility: number, pricing: number, compliance: number, overall: number }
- reasoningSummary: string
- holdCodeAnalysis: { reason: string, description: string }`

  const result = await invokeAgent(prompt)
  try { return JSON.parse(result) } catch { return { raw: result } }
}
