module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'run.py',
      interpreter: 'python',
      cwd: 'C:/Users/355749.adm/Documents/Agentic-Claim-Operation-Demo/backend',
    },
    {
      name: 'frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -H 0.0.0.0',
      cwd: 'C:/Users/355749.adm/Documents/Agentic-Claim-Operation-Demo/frontend',
      interpreter: 'node',
    },
  ],
}
