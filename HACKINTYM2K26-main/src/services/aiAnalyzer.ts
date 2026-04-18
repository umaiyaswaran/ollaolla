/**
 * AI/ML Analysis Engine
 * Analyzes infrastructure and provides intelligent recommendations
 */

import type { AnalysisResult } from "./codeAnalyzer";

export interface AIRecommendation {
  category: "performance" | "scaling" | "cost" | "security" | "reliability";
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  action: string;
  estimatedBenefit: string;
}

export interface PredictionResult {
  deploymentRisk: number; // 0-100
  estimatedLatency: number; // ms
  estimatedLoad: number; // requests/sec
  scalingNeeded: boolean;
  bottlenecks: string[];
  recommendations: AIRecommendation[];
  mlScore: {
    stability: number; // 0-100
    performance: number; // 0-100
    scalability: number; // 0-100
    reliability: number; // 0-100
  };
}

/**
 * Main AI Analysis Function
 */
export function analyzeWithAI(analysis: AnalysisResult): PredictionResult {
  const bottlenecks = detectBottlenecks(analysis);
  const recommendations = generateRecommendations(analysis, bottlenecks);
  const deploymentRisk = calculateDeploymentRisk(analysis);
  const mlScore = calculateMLScore(analysis);
  const estimatedLatency = estimateLatency(analysis);
  const estimatedLoad = analysis.metrics.estimatedLoad;

  return {
    deploymentRisk,
    estimatedLatency,
    estimatedLoad,
    scalingNeeded: analysis.metrics.totalServices > 5 || estimatedLoad > 1000,
    bottlenecks,
    recommendations,
    mlScore,
  };
}

/**
 * Detect bottlenecks in architecture - uses real metrics when available
 */
function detectBottlenecks(analysis: AnalysisResult): string[] {
  const bottlenecks: string[] = [];

  // Check for real performance issues (from website metrics)
  const realResponseTime = analysis.files?.packageJson?.ttfb || 0;
  if (realResponseTime > 2000) {
    bottlenecks.push(
      `Slow response time detected (${realResponseTime}ms > 2000ms). Implement caching and optimize queries.`
    );
  }

  // Check for missing gzip compression
  if (analysis.files?.packageJson) {
    if (!analysis.files.packageJson.hasGzip) {
      bottlenecks.push("Gzip compression not detected. Enable compression to reduce payload size by 60-70%.");
    }
  }

  // Check for single point of failure
  if (analysis.services.length === 1) {
    bottlenecks.push("Single service - no redundancy. Add load balancing.");
  }

  // Check for missing cache layer
  if (
    analysis.metrics.estimatedLoad > 500 &&
    !analysis.databases.some((db) => db.type === "cache")
  ) {
    const cacheRec = !analysis.files?.packageJson?.hasGzip 
      ? "Add Redis cache + enable gzip compression" 
      : "Add Redis cache layer for high-load scenarios.";
    bottlenecks.push(`No caching layer detected. ${cacheRec}`);
  }

  // Check for missing CDN
  if (analysis.files?.packageJson && !analysis.files.packageJson.cdn) {
    bottlenecks.push("No CDN detected. Use Cloudflare, AWS CloudFront, or similar for global distribution and faster delivery.");
  }

  // Check for missing API gateway
  if (analysis.services.length > 3 && !analysis.services.some((s) => s.type === "gateway")) {
    bottlenecks.push(
      `Missing API Gateway. Add NGINX or Kong to manage traffic across ${analysis.services.length} services.`
    );
  }

  // Check for synchronous-only communication
  if (analysis.frameworks.every((f) => !f.includes("Queue") && !f.includes("Event") && !f.includes("Firebase"))) {
    bottlenecks.push("No async messaging detected. Consider RabbitMQ, Kafka, or AWS SQS for async operations.");
  }

  // Check database distribution
  if (analysis.services.length > 5 && analysis.databases.length < 2) {
    bottlenecks.push(
      `${analysis.services.length} services sharing one database. Consider database federation or sharding.`
    );
  }

  // Check for SSL/HTTPS
  if (analysis.files?.packageJson && !analysis.files.packageJson.ssl) {
    bottlenecks.push("No SSL/HTTPS detected. Ensure all traffic is encrypted for security compliance.");
  }

  return bottlenecks;
}

/**
 * Generate AI recommendations - uses real metrics when available
 */
function generateRecommendations(
  analysis: AnalysisResult,
  bottlenecks: string[]
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Performance recommendations based on REAL response time metrics
  const realResponseTime = analysis.files?.packageJson?.ttfb || 0;
  if (realResponseTime > 2000) {
    recommendations.push({
      category: "performance",
      title: `Fix Slow Response Time (Currently ${realResponseTime}ms)`,
      description: `Response time is ${realResponseTime}ms - critical for user experience. Implement optimization strategies.`,
      priority: "critical",
      impact: `Reduce response time from ${realResponseTime}ms to <500ms`,
      action: "1) Enable Gzip 2) Add caching layer (Redis) 3) Optimize queries 4) Use CDN",
      estimatedBenefit: `${(realResponseTime / 3).toFixed(0)}ms target (70% improvement)`,
    });
  } else if (realResponseTime > 1000) {
    recommendations.push({
      category: "performance",
      title: `Optimize Response Time (Currently ${realResponseTime}ms)`,
      description: `Response time is moderate (${realResponseTime}ms). Can be improved for better UX.`,
      priority: "high",
      impact: `Reduce response time from ${realResponseTime}ms to <300ms`,
      action: "Enable caching, optimize database queries, implement CDN",
      estimatedBenefit: "50% faster response times",
    });
  }

  // Gzip recommendation if not enabled
  if (analysis.files?.packageJson && !analysis.files.packageJson.hasGzip) {
    recommendations.push({
      category: "performance",
      title: "Enable Gzip Compression",
      description: "Gzip compression is not enabled. This can reduce payload size significantly.",
      priority: "high",
      impact: "Reduce payload by 60-70%",
      action: "Enable gzip in nginx/server configuration",
      estimatedBenefit: "3-4x smaller responses",
    });
  }

  // CDN recommendation
  if (analysis.files?.packageJson && !analysis.files.packageJson.cdn) {
    recommendations.push({
      category: "performance",
      title: "Implement Global CDN",
      description: "No CDN detected. Implement Cloudflare, AWS CloudFront, or similar for global edge caching.",
      priority: "high",
      impact: "Reduce latency for global users, improve performance by 40-60%",
      action: "Configure DNS to use CDN, enable aggressive caching headers",
      estimatedBenefit: "Global users see 60% faster load times",
    });
  }

  // Redis cache for high-load scenarios
  if (analysis.metrics.estimatedLoad > 500) {
    recommendations.push({
      category: "performance",
      title: `Implement Redis Cache Layer (Load: ${analysis.metrics.estimatedLoad} req/sec)`,
      description: `With estimated load of ${analysis.metrics.estimatedLoad} req/sec, caching is essential to prevent database overload.`,
      priority: "critical",
      impact: "Reduce database load by 70-80%, improve response time",
      action: "Add Redis cluster, implement cache-aside pattern, set TTLs",
      estimatedBenefit: "Handle 5x more concurrent users",
    });
  }

  // Scaling recommendations based on services
  if (analysis.services.length > 3) {
    recommendations.push({
      category: "scaling",
      title: `Scale ${analysis.services.length} Services Horizontally`,
      description: `Architecture has ${analysis.services.length} services. Implement horizontal scaling for reliability.`,
      priority: "high",
      impact: "Handle 3-5x more traffic with auto-scaling",
      action: "Deploy with Kubernetes, implement service mesh (Istio), configure HPA",
      estimatedBenefit: "5x traffic capacity with zero-downtime",
    });
  }

  // Cost optimization
  if (analysis.metrics.complexity === "high" && analysis.services.length > 5) {
    recommendations.push({
      category: "cost",
      title: "Optimize Infrastructure Costs",
      description: `Complex architecture with ${analysis.services.length} services. Consolidate and optimize resource usage.`,
      priority: "medium",
      impact: "Reduce infrastructure costs by 30-40%",
      action: "Profile services, auto-scale based on metrics, use spot instances",
      estimatedBenefit: "$1000+/month savings at scale",
    });
  }

  // Security - SSL recommendation
  if (analysis.files?.packageJson && !analysis.files.packageJson.ssl) {
    recommendations.push({
      category: "security",
      title: "Enable SSL/HTTPS",
      description: "No SSL certificate detected. All traffic must be encrypted for security compliance.",
      priority: "critical",
      impact: "Encrypt all user data, meet compliance requirements",
      action: "Install Let's Encrypt SSL, configure HTTPS redirect",
      estimatedBenefit: "HTTPS-only infrastructure, P compliance",
    });
  }

  // Reliability - Add redundancy
  if (analysis.services.length === 1) {
    recommendations.push({
      category: "reliability",
      title: "Add Redundancy & Load Balancing",
      description: "Single service architecture has no redundancy. Implement high availability.",
      priority: "critical",
      impact: "99.9% uptime SLA achievable",
      action: "Add multiple replicas, configure load balancer (NGINX/HAProxy), health checks",
      estimatedBenefit: "Eliminate single point of failure",
    });
  }

  // Add Firebase-specific recommendations
  if (analysis.frameworks.some(f => f === "Firebase")) {
    recommendations.push({
      category: "reliability",
      title: "Leverage Firebase Features",
      description: "Firebase detected. Optimize for serverless architecture.",
      priority: "high",
      impact: "Reduce operational overhead, auto-scale without limits",
      action: "Use Firebase Cloud Functions, Realtime Database indexes, Storage rules",
      estimatedBenefit: "Zero infrastructure management",
    });
  }

  return recommendations;
}

/**
 * Calculate deployment risk (0-100)
 */
function calculateDeploymentRisk(analysis: AnalysisResult): number {
  let risk = 30; // Base risk

  // Real metrics factor - CRITICAL
  const realResponseTime = analysis.files?.packageJson?.ttfb || 0;
  if (realResponseTime > 5000) {
    risk += 40; // Critical performance issue = very high risk
  } else if (realResponseTime > 2000) {
    risk += 25; // High response time = high risk
  } else if (realResponseTime > 1000) {
    risk += 15; // Moderate response time = some risk
  }

  // Security factors
  if (!analysis.files?.packageJson?.ssl) risk += 20; // No SSL = security risk
  const hasGzip = analysis.files?.packageJson?.hasGzip || false;
  if (!hasGzip && realResponseTime > 500) risk += 10; // Uncompressed + slow

  // Factor 1: Complexity
  if (analysis.metrics.complexity === "high") risk += 25;
  else if (analysis.metrics.complexity === "medium") risk += 15;

  // Factor 2: Number of services
  if (analysis.services.length > 8) risk += 20;
  else if (analysis.services.length > 5) risk += 10;

  // Factor 3: Missing components (except for Firebase which is self-contained)
  const isFirebase = analysis.frameworks.some(f => f === "Firebase");
  if (!isFirebase && !analysis.services.some((s) => s.type === "gateway")) risk += 10;
  if (!isFirebase && analysis.databases.length === 0) risk += 15;
  if (!analysis.frameworks.some((f) => f.includes("Test") || f.includes("Jest"))) risk += 10;

  // Factor 4: Single points of failure
  if (analysis.services.length === 1) risk += 30;
  if (analysis.databases.length === 1 && !isFirebase) risk += 15;

  // Factor 5: Infrastructure maturity
  const hasCDN = !!analysis.files?.packageJson?.cdn;
  const hasCache = analysis.databases.some((db) => db.type === "cache");
  if (hasCDN) risk -= 10; // CDN reduces risk
  if (hasCache) risk -= 10; // Cache layer reduces risk

  // Firebase special handling (lower risk due to managed service)
  if (isFirebase) risk -= 15;

  return Math.min(100, Math.max(10, risk)); // Clamp between 10-100
}

/**
 * Calculate ML scoring
 */
function calculateMLScore(analysis: AnalysisResult) {
  // Use REAL metrics if available from website analysis
  const realResponseTime = analysis.files?.packageJson?.ttfb || 0;
  const hasGzip = analysis.files?.packageJson?.hasGzip || false;
  const hasCDN = !!analysis.files?.packageJson?.cdn;
  const hasSSL = !!analysis.files?.packageJson?.ssl;

  // Stability Score (0-100) - based on real infrastructure
  let stability = 70;
  if (analysis.metrics.totalDatabases > 1) stability += 15;
  if (analysis.services.length > 1) stability += 10;
  if (hasSSL) stability += 10;
  if (analysis.frameworks.includes("Kubernetes")) stability += 15;
  if (analysis.frameworks.some(f => f === "Firebase")) stability += 20; // Firebase = highly stable

  // Performance Score (0-100) - BASED ON REAL RESPONSE TIME
  let performance = 60;
  if (realResponseTime && realResponseTime < 300) {
    performance = 95;
  } else if (realResponseTime && realResponseTime < 500) {
    performance = 85;
  } else if (realResponseTime && realResponseTime < 1000) {
    performance = 70;
  } else if (realResponseTime && realResponseTime > 2000) {
    performance = 35; // Critical performance issue
  }

  // Performance adjustments
  if (analysis.databases.some((db) => db.type === "cache")) performance += 15;
  if (hasGzip) performance += 10;
  if (hasCDN) performance += 15;
  if (analysis.services.some((s) => s.type === "gateway")) performance += 8;
  if (analysis.languages.includes("Go") || analysis.languages.includes("Rust")) performance += 10;

  // Scalability Score (0-100)
  let scalability = 40;
  if (analysis.metrics.totalServices > 5) scalability += 30;
  if (analysis.frameworks.some((f) => f.includes("Kubernetes") || f.includes("Docker")))
    scalability += 25;
  if (analysis.databases.some((db) => db.name.includes("MongoDB"))) scalability += 10;
  if (hasCDN) scalability += 15; // CDN improves global scalability
  if (analysis.frameworks.some(f => f === "Firebase")) scalability += 30; // Firebase autoscales

  // Reliability Score (0-100)
  let reliability = 50;
  if (analysis.databases.length > 1) reliability += 20;
  if (analysis.services.every((s) => s.type !== "gateway")) reliability -= 15;
  if (analysis.frameworks.includes("Prometheus")) reliability += 15;
  if (hasSSL) reliability += 10;
  if (hasCDN) reliability += 10; // CDN provides redundancy
  if (analysis.frameworks.some(f => f === "Firebase")) reliability += 25; // Firebase is highly reliable

  return {
    stability: Math.min(100, stability),
    performance: Math.min(100, performance),
    scalability: Math.min(100, scalability),
    reliability: Math.min(100, reliability),
  };
}

/**
 * Estimate latency - uses REAL measured latency when available
 */
function estimateLatency(analysis: AnalysisResult): number {
  // PREFER real measured latency from website analyzer
  const realResponseTime = analysis.files?.packageJson?.ttfb || 0;
  if (realResponseTime > 0) {
    // Measured latency is the ground truth - just return it
    // (It includes all network overhead from the site)
    return realResponseTime;
  }

  // Fallback: Estimate based on architecture if no real data
  let baseLatency = 50; // Base network latency in ms

  // Add per-service latency
  baseLatency += analysis.services.length * 5;

  // Add database query latency
  baseLatency += analysis.databases.length * 10;

  // Reduce if caching is present
  if (analysis.databases.some((db) => db.type === "cache")) {
    baseLatency = Math.max(20, baseLatency - 30);
  }

  // Increase if high complexity
  if (analysis.metrics.complexity === "high") {
    baseLatency += 50;
  }

  // Apply compression benefit
  const hasGzip = analysis.files?.packageJson?.hasGzip || false;
  if (hasGzip) {
    baseLatency = Math.max(20, baseLatency - 20);
  }

  return baseLatency;
}

/**
 * ML Model: Predict if deployment will smoothly
 */
export function predictDeploymentSuccess(analysis: AnalysisResult): {
  successRate: number; // 0-100
  confidence: number; // 0-100
  prediction: "go" | "caution" | "stop";
  reason: string;
} {
  const result = analyzeWithAI(analysis);
  const avgScore =
    (result.mlScore.reliability +
      result.mlScore.stability +
      result.mlScore.scalability +
      result.mlScore.performance) /
    4;

  let successRate = avgScore;
  const confidence = 85;

  // Adjust based on risk
  if (result.deploymentRisk > 70) {
    successRate = Math.max(0, successRate - 30);
  } else if (result.deploymentRisk > 50) {
    successRate = Math.max(0, successRate - 15);
  }

  let prediction: "go" | "caution" | "stop" = "go";
  let reason = "Architecture looks solid for deployment";

  if (successRate < 40) {
    prediction = "stop";
    reason = `High risk factors: ${result.bottlenecks.slice(0, 2).join(", ")}`;
  } else if (successRate < 70) {
    prediction = "caution";
    reason = `Medium risk. Address: ${result.bottlenecks[0]}`;
  }

  return {
    successRate: Math.round(successRate),
    confidence,
    prediction,
    reason,
  };
}
