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
 * Detect bottlenecks in architecture
 */
function detectBottlenecks(analysis: AnalysisResult): string[] {
  const bottlenecks: string[] = [];

  // Check for single point of failure
  if (analysis.services.length === 1) {
    bottlenecks.push("Single service - no redundancy. Add load balancing.");
  }

  // Check for missing cache layer
  if (
    analysis.metrics.estimatedLoad > 500 &&
    !analysis.databases.some((db) => db.type === "cache")
  ) {
    bottlenecks.push(
      "No caching layer detected. Add Redis or Memcached for high-load scenarios."
    );
  }

  // Check for missing API gateway
  if (analysis.services.length > 3 && !analysis.services.some((s) => s.type === "gateway")) {
    bottlenecks.push(
      "Missing API Gateway. Add NGINX or Kong to manage traffic across "+ analysis.services.length + " services."
    );
  }

  // Check for synchronous-only communication
  if (analysis.frameworks.every((f) => !f.includes("Queue") && !f.includes("Event"))) {
    bottlenecks.push("No async messaging detected. Consider RabbitMQ or Kafka for async operations.");
  }

  // Check database distribution
  if (
    analysis.services.length > 5 &&
    analysis.databases.length < 2
  ) {
    bottlenecks.push(
      `${analysis.services.length} services sharing one database. Consider database federation.`
    );
  }

  // Check for missing search capability
  if (
    analysis.frameworks.some((f) => f.includes("React")) &&
    !analysis.databases.some((db) => db.name.includes("Elasticsearch"))
  ) {
    bottlenecks.push("No search engine detected. Add Elasticsearch for better search performance.");
  }

  return bottlenecks;
}

/**
 * Generate AI recommendations
 */
function generateRecommendations(
  analysis: AnalysisResult,
  bottlenecks: string[]
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  // Performance recommendations
  if (analysis.metrics.estimatedLoad > 500) {
    recommendations.push({
      category: "performance",
      title: "Implement Redis Cache Layer",
      description: "Add Redis to cache frequently accessed data and reduce database load",
      priority: "high",
      impact: "Reduce API latency by 60-70%",
      action: "Add Redis service to docker-compose and implement cache middleware",
      estimatedBenefit: "40% faster response times",
    });
  }

  // Scaling recommendations
  if (analysis.services.length > 3) {
    recommendations.push({
      category: "scaling",
      title: "Implement Horizontal Scaling",
      description: "Use load balancer and multiple service replicas for better scalability",
      priority: "high",
      impact: "Handle 3-5x more traffic",
      action: "Deploy with Kubernetes or Docker Swarm for orchestration",
      estimatedBenefit: "5x traffic capacity",
    });
  }

  // Cost recommendations
  if (analysis.metrics.complexity === "high") {
    recommendations.push({
      category: "cost",
      title: "Optimize Resource Usage",
      description: "Consolidate services and optimize memory/CPU allocation",
      priority: "medium",
      impact: "Reduce infrastructure costs by 30-40%",
      action: "Profile services and set resource limits appropriately",
      estimatedBenefit: "$500/month savings",
    });
  }

  // Security recommendations
  if (!analysis.frameworks.some((f) => f.includes("Security") || f.includes("Auth"))) {
    recommendations.push({
      category: "security",
      title: "Add Authentication & Authorization",
      description: "Implement JWT or OAuth2 authentication across all services",
      priority: "critical",
      impact: "Secure all endpoints",
      action: "Add Auth0 or Keycloak, implement middleware",
      estimatedBenefit: "Prevent unauthorized access",
    });
  }

  // Reliability recommendations
  if (analysis.services.length <= 2) {
    recommendations.push({
      category: "reliability",
      title: "Implement Health Checks & Monitoring",
      description: "Add health endpoints and comprehensive monitoring",
      priority: "high",
      impact: "Reduce downtime by 80%",
      action: "Add /health endpoints, integrate Datadog or New Relic",
      estimatedBenefit: "99.95% uptime",
    });
  }

  // Database optimization
  if (analysis.databases.length > 0) {
    recommendations.push({
      category: "performance",
      title: "Implement Database Replication",
      description: "Add read replicas to distribute database load",
      priority: "medium",
      impact: "Improve query performance by 50%",
      action: "Configure replication in "
        + analysis.databases[0].name
        + ", set up connection pooling",
      estimatedBenefit: "2x database throughput",
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Calculate deployment risk (0-100)
 */
function calculateDeploymentRisk(analysis: AnalysisResult): number {
  let risk = 30; // Base risk

  // Factor 1: Complexity
  if (analysis.metrics.complexity === "high") risk += 25;
  else if (analysis.metrics.complexity === "medium") risk += 15;

  // Factor 2: Number of services
  if (analysis.services.length > 8) risk += 20;
  else if (analysis.services.length > 5) risk += 10;

  // Factor 3: Missing components
  if (!analysis.services.some((s) => s.type === "gateway")) risk += 10;
  if (analysis.databases.length === 0) risk += 15;
  if (!analysis.frameworks.some((f) => f.includes("Test") || f.includes("Jest"))) risk += 10;

  // Factor 4: Single points of failure
  if (analysis.services.length === 1) risk += 30;
  if (analysis.databases.length === 1) risk += 15;

  return Math.min(100, risk);
}

/**
 * Calculate ML scoring
 */
function calculateMLScore(analysis: AnalysisResult) {
  // Stability Score (0-100)
  let stability = 70;
  if (analysis.metrics.totalDatabases > 1) stability += 15;
  if (analysis.services.length > 1) stability += 10;
  if (analysis.frameworks.includes("Kubernetes")) stability += 15;

  // Performance Score (0-100)
  let performance = 60;
  if (analysis.databases.some((db) => db.type === "cache")) performance += 20;
  if (analysis.languages.includes("Go") || analysis.languages.includes("Rust")) performance += 15;
  if (analysis.services.some((s) => s.type === "gateway")) performance += 10;

  // Scalability Score (0-100)
  let scalability = 40;
  if (analysis.metrics.totalServices > 5) scalability += 30;
  if (analysis.frameworks.some((f) => f.includes("Kubernetes") || f.includes("Docker")))
    scalability += 25;
  if (analysis.databases.some((db) => db.name.includes("MongoDB"))) scalability += 10;

  // Reliability Score (0-100)
  let reliability = 50;
  if (analysis.databases.length > 1) reliability += 20;
  if (analysis.services.every((s) => s.type !== "gateway")) reliability -= 15;
  if (analysis.frameworks.includes("Prometheus")) reliability += 15;

  return {
    stability: Math.min(100, stability),
    performance: Math.min(100, performance),
    scalability: Math.min(100, scalability),
    reliability: Math.min(100, reliability),
  };
}

/**
 * Estimate latency
 */
function estimateLatency(analysis: AnalysisResult): number {
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
