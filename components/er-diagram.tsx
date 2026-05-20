'use client'

import React from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

/** Custom node component for entities */
function EntityNode({ data }: { data: { label: string; fields: string[]; color: string } }) {
  return (
    <div
      className="rounded-lg border-2 bg-background shadow-lg min-w-[160px]"
      style={{ borderColor: data.color }}
    >
      {/* Header */}
      <div
        className="rounded-t-md px-3 py-1.5 text-xs font-bold text-white"
        style={{ backgroundColor: data.color }}
      >
        {data.label}
      </div>
      {/* Fields */}
      <div className="px-3 py-2 space-y-0.5">
        {data.fields.map((field, i) => (
          <p key={i} className="text-[10px] text-muted-foreground font-mono">
            {i === 0 && <span className="text-amber-500 mr-1">🔑</span>}
            {field}
          </p>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = { entity: EntityNode }

/** Initial node definitions */
const initialNodes: Node[] = [
  {
    id: 'member',
    type: 'entity',
    position: { x: 350, y: 0 },
    data: {
      label: 'Member',
      fields: ['memberId', 'name', 'dateOfBirth', 'state', 'planId'],
      color: '#3b82f6',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'plan',
    type: 'entity',
    position: { x: 650, y: 0 },
    data: {
      label: 'Plan',
      fields: ['planId', 'planName', 'carrier', 'effectiveDate', 'type'],
      color: '#3b82f6',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'claim',
    type: 'entity',
    position: { x: 200, y: 180 },
    data: {
      label: 'Claim',
      fields: ['claimNumber', 'classification', 'billedAmount', 'status', 'daysAged', 'serviceDate'],
      color: '#22c55e',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'provider',
    type: 'entity',
    position: { x: 500, y: 180 },
    data: {
      label: 'Provider',
      fields: ['providerId', 'providerName', 'npi', 'state', 'specialty'],
      color: '#22c55e',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'platform',
    type: 'entity',
    position: { x: 750, y: 180 },
    data: {
      label: 'Platform',
      fields: ['platformId', 'name (Facet/Amisys/Xcelys)', 'endpoint', 'status'],
      color: '#6366f1',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'pendcase',
    type: 'entity',
    position: { x: 100, y: 380 },
    data: {
      label: 'Pend Case',
      fields: ['caseId', 'claimNumber', 'pendCode', 'status', 'assignedAgent', 'confidence'],
      color: '#a855f7',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'eob',
    type: 'entity',
    position: { x: 380, y: 380 },
    data: {
      label: 'EOB Document',
      fields: ['documentId', 'caseId', 'storageUrl', 'uploadedAt', 'type'],
      color: '#a855f7',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  {
    id: 'auditlog',
    type: 'entity',
    position: { x: 650, y: 380 },
    data: {
      label: 'Audit Log',
      fields: ['logId', 'entityId', 'action', 'agent', 'timestamp', 'details'],
      color: '#f59e0b',
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
]

/** Initial edge definitions */
const initialEdges: Edge[] = [
  {
    id: 'member-claim',
    source: 'member',
    target: 'claim',
    label: 'has many',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
  {
    id: 'member-plan',
    source: 'member',
    target: 'plan',
    label: 'enrolled in',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
  {
    id: 'claim-provider',
    source: 'claim',
    target: 'provider',
    label: 'billed by',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
  {
    id: 'claim-platform',
    source: 'claim',
    target: 'platform',
    label: 'sourced from',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
  {
    id: 'claim-pendcase',
    source: 'claim',
    target: 'pendcase',
    label: 'creates',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
  {
    id: 'pendcase-eob',
    source: 'pendcase',
    target: 'eob',
    label: 'references',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
  {
    id: 'pendcase-audit',
    source: 'pendcase',
    target: 'auditlog',
    label: 'logs to',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
  {
    id: 'provider-platform',
    source: 'provider',
    target: 'platform',
    label: 'registered on',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#64748b', strokeDasharray: '5,5' },
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  },
]

export function ERDiagram() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges] = useEdgesState(initialEdges)

  return (
    <div className="h-[500px] w-full rounded-lg border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          animated: false,
        }}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 rounded-lg border bg-background/90 backdrop-blur px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
          <span className="text-[10px] text-muted-foreground">Member Domain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-[10px] text-muted-foreground">Claims Domain</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#a855f7' }} />
          <span className="text-[10px] text-muted-foreground">Operations</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#f59e0b' }} />
          <span className="text-[10px] text-muted-foreground">Audit</span>
        </div>
      </div>
    </div>
  )
}
