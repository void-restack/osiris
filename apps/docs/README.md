1. Quickstart Osiris MCP SDK & CLI
   1. Build authenticated and stateful MCPs adhering to scopes and policies
   2. Use them in agents, list them on Osiris and start earning through MCPs
2. MCP Discovery problem and its brittle infrastructure
   1. Explain the discovery problem
   2. Explain from where the brittleness comes from and how we are solving it
   3. Brittleness - Streamable HTTP transport stalls connections and its results
3. MCP SDK
   1. Introduction
   2. Authentication Context
   3. Authenticators (Future plans of adding more Authenticators)
      1. Google
         1. Authenticator
         2. Client
      2. Github
         1. Authenticator
         2. Client
      3. Discord
         1. User APIs
         2. Bot
      4. Linear
      5. Notion
      6. Slack
      7. Turnkey
         1. EVM Client
         2. Solana support coming soon
      8. Postgres
      9.  Generic OAuth2 Authenticator
      10. Generic Secret Sharing Authenticator
      11. Request any authenticator
   4. Local vs Hub Authentication
   5. Database Adapters
      1. Memory
      2. PostgreSQL
      3. MongoDB
      4. Redis
      5. SQLite
   6. Local Authentication Routes
   7. Error Handling
   8. Deploy MCP
   9.  Use MCP through Osiris
4. Agent SDK
   1. Introduction
   2. Use MCPs in Agents
   3. Agentic pattern
   4. Libraries supported
      1. Langchain
      2. Vercel AI
      3. Crew AI
      4. <More SDKs>
5. Policy Engine
   1. Introduction
   2. Examples
      1. ERC20
      2. Uniswap
      3. Hyperliquid
      4. <More Examples>
   3. Policy Builder
      1. UI
      2. SDK
6. Community RFPs
   1. OAuth
