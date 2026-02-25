# NAB AL Tools - Application Insights KQL Queries

This folder contains **Kusto Query Language (KQL)** scripts for analyzing telemetry data from the NAB AL Tools VS Code extension in Azure Application Insights.

## Overview

The NAB AL Tools extension logs telemetry data to Application Insights, including:

- User activities and feature usage
- Extension installations and version adoption
- Build operations and success rates
- Exceptions and errors
- Language Model (Chat) tool interactions

## Available Query Files

### 1. [usage-overview.kql](usage-overview.kql)

**Purpose:** High-level usage metrics and trends

**Key Queries:**

- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- Total events over time
- Top 20 most used features
- Events per active user (engagement metric)
- Usage by hour of day
- Daily summary dashboard

**Use this to:** Get a quick overview of extension adoption and usage patterns.

---

### 2. [user-adoption.kql](user-adoption.kql)

**Purpose:** User growth, retention, and churn analysis

**Key Queries:**

- New installations over time
- Cumulative user growth
- First-time vs returning users
- Weekly retention cohort analysis
- Day 1, Day 7, Day 30 retention rates
- User engagement buckets (power users, casual users, etc.)
- Churn analysis

**Use this to:** Understand how users adopt and stick with the extension over time.

---

### 3. [feature-usage-breakdown.kql](feature-usage-breakdown.kql)

**Purpose:** Detailed feature usage analysis by category

**Key Queries:**

- Usage by feature category (Translation, Documentation, Chat Tools, etc.)
- Top 30 features with user adoption
- Translation feature details
- Chat/LLM tools usage analysis
- Feature usage trends over time
- Power users by feature
- Least used features
- Glossary tool language preferences

**Use this to:** Identify which features are popular and which need improvement.

---

### 4. [chat-tools-analysis.kql](chat-tools-analysis.kql)

**Purpose:** Deep analysis of Language Model (Chat) Tools usage and effectiveness

**Key Queries:**

- Overall chat tool adoption rate
- Chat tools usage ranking and success rates
- Translation tools language preferences
- Glossary tool detailed analysis
- Build tool performance metrics
- Chat tool power users
- Tool combination patterns
- Chat tool error analysis
- User journey and retention
- Translation workflow analysis
- Chat vs non-chat users engagement comparison
- SaveTranslatedTexts success tracking
- Chat tool adoption by extension version

**Use this to:** Understand AI-assisted feature adoption, effectiveness, and user workflows.

---

### 5. [version-distribution.kql](version-distribution.kql)

**Purpose:** Extension and VS Code version analysis

**Key Queries:**

- Current extension version distribution
- Extension version usage over time
- VS Code version distribution
- Update adoption speed
- Version migration patterns
- Latest version adoption rate
- Users on old versions (support implications)
- Installation events by version

**Use this to:** Track version adoption and identify users who need upgrade support.

---

### 6. [errors-and-exceptions.kql](errors-and-exceptions.kql)

**Purpose:** Error tracking and reliability metrics

**Key Queries:**

- Exception overview and trends
- Most common exception types and messages
- Exception details with stack traces
- Exception rate per active user
- BuildAlPackage tool success/failure analysis
- Exception rate by extension version
- Users affected by exceptions
- Chat tool error analysis
- Error spike detection (anomalies)

**Use this to:** Monitor extension reliability and identify areas needing bug fixes.

---

## How to Use These Queries

### Prerequisites

1. Access to the NAB AL Tools Application Insights resource in Azure
2. Permissions to run queries in Application Insights Analytics

### Running Queries

1. **Open Application Insights:**
   - Navigate to [Azure Portal](https://portal.azure.com)
   - Find the NAB AL Tools Application Insights resource
   - Click on "Logs" in the left navigation menu

2. **Copy a Query:**
   - Open one of the `.kql` files in this folder
   - Copy the entire contents OR copy individual queries you want to run

3. **Paste and Run:**
   - Paste the query into the Application Insights query editor
   - Adjust the time range if needed (see Configuration section in each file)
   - Click "Run" to execute the query

4. **Analyze Results:**
   - Results appear in table format below the query
   - Click "Chart" to visualize data
   - Use "Export" to download results as CSV or Excel

### Customizing Time Ranges

Each query file has a configuration section at the top:

```kql
// Configuration
let timeRange = 30d; // Adjust this value: 7d, 30d, 90d, 365d
let startDate = ago(timeRange);
```

Common values:

- `7d` - Last 7 days
- `30d` - Last 30 days (default)
- `90d` - Last 90 days (3 months)
- `180d` - Last 180 days (6 months)
- `365d` - Last 365 days (1 year)

### Running Multiple Queries

You can run multiple queries at once by copying several query blocks. Separate them with blank lines. Each query will produce its own result set.

## Telemetry Data Structure

### Common Properties

All events include these properties:

- `installationId` - Anonymous user identifier (customDimensions)
- `version` - Extension version (customDimensions)
- `vscode` - VS Code version (customDimensions)
- `timestamp` - Event timestamp

### Event Categories

**Translation/XLIFF Operations:**

- `refreshXlfFilesFromGXlf`, `updateGXlf`, `updateAllXlfFiles`
- `matchFromXlfFile`, `matchTranslations`, `matchTranslationsFromBaseApplication`
- `sortXlfFiles`, `createNewTargetXlf`, `createCrossLanguageXlf`
- `copySourceToTarget`, `copyAllSourceToTarget`
- `findNextUntranslatedText`, `findAllUntranslatedText`, `findTranslatedTexts`
- `exportTranslationsCSV`, `importTranslationCSV`, `importTranslationsById`
- `setTranslationUnitToTranslated`, `setTranslationUnitToSignedOff`, `setTranslationUnitToFinal`

**Chat/LLM Tools:**

- `GetTextsToTranslateTool`, `GetTranslatedTextsMapTool`, `GetTranslatedTextsByStateTool`
- `SaveTranslatedTextsTool`, `CreateLanguageXlfTool`, `RefreshXlfTool`
- `GetTextsByKeywordTool`, `GetGlossaryTermsTool`
- `BuildAlPackageTool`, `OpenFileTool`

**Documentation:**

- `suggestToolTips`, `showSuggestedToolTip`, `generateToolTipDocumentation`
- `generateExternalDocumentation`, `cliCreateDocumentation`

**Testing/Troubleshooting:**

- `troubleshootParseCurrentFile`, `troubleshootParseAllFiles`
- `troubleshootFindTransUnitsWithoutSource`, `deployAndRunTestTool`

**Project/Tools:**

- `convertToPermissionSet`, `createPermissionSetForAllObjects`
- `createProjectFromTemplate`, `renumberALObjects`, `runTaskItems`

**PowerShell Operations:**

- `uninstallDependencies`, `signAppFile`

**System Events:**

- `install` - New installation event

## Tips and Best Practices

### Performance Tips

1. **Limit time ranges** - Use shorter time ranges (7d or 30d) for faster queries
2. **Use `take` or `top`** - Limit results when exploring data
3. **Filter early** - Apply `where` clauses before `summarize` operations

### Analysis Workflow

1. **Start broad** - Use `usage-overview.kql` to get general metrics
2. **Drill down** - Use specific files based on what interests you
3. **Compare periods** - Run the same query for different time ranges
4. **Export data** - Download results for presentations or further analysis

### Common KQL Patterns

**Count unique users:**

```kql
| summarize UniqueUsers = dcount(tostring(customDimensions.installationId))
```

**Group by time period:**

```kql
| summarize EventCount = count() by bin(timestamp, 1d) // Daily
| summarize EventCount = count() by bin(timestamp, 7d) // Weekly
```

**Filter by feature category:**

```kql
| where name in ("refreshXlfFilesFromGXlf", "updateGXlf", "sortXlfFiles")
```

**Calculate percentages:**

```kql
| extend Percentage = round(Count * 100.0 / Total, 2)
```

## Support and Contributions

If you create useful queries or improvements:

1. Test them thoroughly in Application Insights
2. Document what the query does
3. Submit a pull request to add them to this collection

## Privacy and Data

All telemetry data is:

- **Anonymous** - User IDs are randomly generated UUIDs
- **Anonymized** - File paths and personal information are removed
- **Optional** - Users can disable telemetry via `NAB.EnableTelemetry` setting
- **Compliant** - Follows Microsoft telemetry best practices

For privacy details, see the main [README](../../extension/README.md#telemetry).

---

## Quick Reference Card

| Query File                  | Primary Use Case              | Key Metric                    |
| --------------------------- | ----------------------------- | ----------------------------- |
| usage-overview.kql          | Daily operations dashboard    | DAU/WAU/MAU                   |
| user-adoption.kql           | Growth and retention tracking | Retention rates               |
| feature-usage-breakdown.kql | Feature popularity analysis   | Top features                  |
| chat-tools-analysis.kql     | AI/Chat tools effectiveness   | Tool adoption & success rates |
| version-distribution.kql    | Update rollout monitoring     | Version adoption              |
| errors-and-exceptions.kql   | Reliability monitoring        | Error rates                   |

---

**Last Updated:** 2026-02-21  
**Extension:** [NAB AL Tools](https://marketplace.visualstudio.com/items?itemName=nabsolutions.nab-al-tools)
