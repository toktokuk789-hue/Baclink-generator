# BacklinkForge — Provider System Architecture

## Overview

BacklinkForge is built around a pluggable provider abstraction, ensuring that external API integrations can be introduced, tested, and upgraded without rewriting core application logic.

---

## 1. Provider Interfaces

Every external data source implements standard interfaces:

```typescript
export interface BaseProvider {
  id: string;
  name: string;
  category: ProviderCategory;
  isConfigured: boolean;
  testConnection(): Promise<{ success: boolean; message: string }>;
  getUsageMetrics(): { callsToday: number; monthlyLimit: number };
}
```

### Provider Categories:
1. **BacklinkProvider**: Ahrefs, Moz, DataForSEO, User CSV Import.
2. **SERPProvider**: SerpAPI, Valueserp, Google Custom Search.
3. **KeywordProvider**: Google Ads Keyword Planner, DataForSEO.
4. **DomainMetricsProvider**: Majestic, Moz DA, OpenPageRank.
5. **ContactProvider**: Hunter.io, Anymail Finder, Clearbit.
6. **LLMProvider**: OpenAI (GPT-4o), Anthropic (Claude 3.5), Google Gemini, Local Ollama.
7. **EmailProvider**: Gmail OAuth2, Microsoft Graph, Standard SMTP.
8. **BrowserProvider**: Local Chrome CDP, Headless Chromium.

---

## 2. Transparent Data Attribution

Every metric displayed in the interface explicitly declares its source:
* `Provider: User CSV`
* `Provider: BacklinkForge Local Crawler`
* `Provider: OpenPageRank`
* `Provider: Not Configured (Using Local Signals)`

The system strictly avoids fabricating data when an external provider key is not configured.
