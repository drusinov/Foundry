export type ContextDocument = {
  project: {
    name: string
    description: string
    stack: string[]
  }

  architecture: {
    summary: string
    decisions: string[]
  }

  operationalState: {
    currentBranch: string
    lastStableCheckpoint: string
    deploymentStatus: string
  }

  activeTasks: string[]

  recentEvents: string[]

  sessionSummary: string
}
