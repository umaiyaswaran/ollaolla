/**
 * Quick test script to verify website analyzer works with real websites
 * Run with: npx ts-node TEST_WEBSITE_ANALYZER.ts
 */

import { analyzeWebsiteAdvanced } from "./src/services/websiteAnalyzer";

async function testAnalyzer() {
  const testUrls = [
    "https://www.google.com",
    "https://github.com",
    "https://vercel.com",
    "https://nextjs.org",
  ];

  for (const url of testUrls) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Testing: ${url}`);
    console.log("=".repeat(60));
    
    try {
      const result = await analyzeWebsiteAdvanced(url);
      
      console.log(`✓ Response Time: ${result.metrics.responseTime}ms`);
      console.log(`✓ Frameworks: ${result.frameworks.join(", ") || "Unknown"}`);
      console.log(`✓ Databases: ${result.databases.join(", ") || "None detected"}`);
      console.log(`✓ Services: ${result.services.map(s => s.name).join(", ")}`);
      console.log(`✓ Has Gzip: ${result.metrics.hasGzip}`);
      console.log(`✓ Has CDN: ${result.metrics.cdn}`);
      console.log(`✓ SSL: ${result.metrics.ssl}`);
      console.log(`✓ Estimated Complexity: ${result.estimates.complexity}`);
    } catch (err) {
      console.error(`✗ Error analyzing ${url}:`, err instanceof Error ? err.message : String(err));
    }
  }
}

testAnalyzer();
