/**
 * Code Analysis Service
 * Parses GitHub repos, HTTP URLs, and ZIP files to extract architecture info
 */

export interface ServiceNode {
  id: string;
  name: string;
  type: "api" | "database" | "cache" | "service" | "frontend" | "gateway" | "queue";
  port?: number;
  language?: string;
  framework?: string;
  description?: string;
}

export interface AnalysisResult {
  projectName: string;
  description: string;
  services: ServiceNode[];
  dependencies: Array<{ from: string; to: string; type: string }>;
  databases: ServiceNode[];
  frameworks: string[];
  languages: string[];
  metrics: {
    totalServices: number;
    totalDatabases: number;
    complexity: "low" | "medium" | "high";
    estimatedLoad: number;
    suggestedServers: number;
  };
  files: {
    packageJson?: any;
    dockerfile?: string;
    dockerCompose?: string;
    envVars?: string[];
  };
}

/**
 * Parse GitHub repository URL and analyze it
 */
export async function analyzeGitHubRepo(repoUrl: string): Promise<AnalysisResult> {
  try {
    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error("Invalid GitHub URL");

    const [, owner, repo] = match;

    // Fetch repo contents from GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github.v3.raw" },
    });

    if (!response.ok) throw new Error("Repository not found");

    return await parseProjectStructure(owner, repo, apiUrl);
  } catch (error) {
    throw new Error(`Failed to analyze GitHub repo: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

import { analyzeWebsiteAdvanced } from "./websiteAnalyzer";

/**
 * Analyze HTTP URL (website/deployed app) - extracts meta info and performance data
 */
export async function analyzeHttpUrl(httpUrl: string): Promise<AnalysisResult> {
  try {
    console.log(`Analyzing website: ${httpUrl}`);
    
    // Get real website analysis
    const websiteAnalysis = await analyzeWebsiteAdvanced(httpUrl);
    
    const services: ServiceNode[] = [];
    const databases: ServiceNode[] = [];
    const frameworks = websiteAnalysis.frameworks;
    const languages = websiteAnalysis.languages;

    // Add frontend service
    services.push({
      id: "service-frontend",
      name: "Frontend Application",
      type: "frontend",
      language: languages[0] || "JavaScript/TypeScript",
      framework: frameworks[0] || "Unknown",
      port: 80,
      description: `Web application at ${new URL(httpUrl).hostname}`,
    });

    // Add backend based on detection
    if (websiteAnalysis.frameworks.some(f => 
      ["Express.js", "Django", "Rails", "ASP.NET"].includes(f)
    )) {
      services.push({
        id: "service-api",
        name: "API Server",
        type: "api",
        language: languages.find(l => !l.includes("JavaScript")) || "Node.js",
        framework: websiteAnalysis.frameworks.find(f => 
          ["Express.js", "Django", "Rails", "ASP.NET"].includes(f)
        ),
        port: 3000,
        description: "Backend API server",
      });
    }

    // Add reverse proxy/gateway
    if (websiteAnalysis.services.length > 0) {
      services.push({
        id: "gateway-proxy",
        name: "Reverse Proxy",
        type: "gateway",
        description: websiteAnalysis.services.find(s => s.name === "Nginx") ? "Nginx" : "Load Balancer",
      });
    }

    // Add CDN/Cloudflare if detected
    if (websiteAnalysis.services.some(s => s.name === "Cloudflare")) {
      services.push({
        id: "cdn-cloudflare",
        name: "Cloudflare CDN",
        type: "gateway",
        description: "Cloudflare edge network",
      });
    }

    // Add detected databases
    websiteAnalysis.databases.forEach((db, idx) => {
      databases.push({
        id: `db-${db.toLowerCase()}`,
        name: db,
        type: "database",
        description: `${db} database instance`,
      });
    });

    // Default database if none detected
    if (databases.length === 0) {
      databases.push({
        id: "db-primary",
        name: "Primary Database",
        type: "database",
        description: "Main application database",
      });
    }

    // Add Firebase if detected
    if (websiteAnalysis.services.some(s => s.name === "Firebase")) {
      services.push({
        id: "firebase-backend",
        name: "Firebase Backend",
        type: "api",
        description: "Firebase Realtime Database & Functions",
      });
    }

    return {
      projectName: new URL(httpUrl).hostname,
      description: `Analysis of ${new URL(httpUrl).hostname} - Response time: ${websiteAnalysis.metrics.responseTime.toFixed(0)}ms`,
      services,
      dependencies: services.length > 1
        ? [
            { from: services[0].id, to: services[1]?.id || databases[0].id, type: "calls" },
            { from: services[1]?.id || services[0].id, to: databases[0].id, type: "uses" },
          ]
        : [{ from: services[0].id, to: databases[0].id, type: "uses" }],
      databases,
      frameworks,
      languages,
      metrics: {
        totalServices: services.length,
        totalDatabases: databases.length,
        complexity: websiteAnalysis.estimates.complexity as any,
        estimatedLoad: websiteAnalysis.estimates.estimatedLoad,
        suggestedServers: websiteAnalysis.estimates.estimatedServers,
      },
      files: {
        packageJson: {
          description: `Website Performance: ${websiteAnalysis.metrics.responseTime.toFixed(0)}ms response time`,
          ttfb: websiteAnalysis.metrics.performance.ttfb,
          contentLength: websiteAnalysis.metrics.contentLength,
          hasGzip: websiteAnalysis.metrics.hasGzip,
          cdn: websiteAnalysis.metrics.cdn,
          ssl: websiteAnalysis.metrics.ssl,
        },
      },
    };
  } catch (error) {
    console.error("HTTP URL analysis error:", error);
    
    // Fallback result
    const hostname = new URL(httpUrl).hostname;
    return {
      projectName: hostname,
      description: `Analysis of ${hostname}`,
      services: [
        { id: "service-frontend", name: "Frontend", type: "frontend", description: "Frontend application", port: 80 },
        { id: "service-api", name: "API Server", type: "api", description: "Backend API" },
      ],
      dependencies: [
        { from: "service-frontend", to: "service-api", type: "calls" },
      ],
      databases: [
        { id: "db-primary", name: "Database", type: "database", description: "Application database" },
      ],
      frameworks: ["Unknown"],
      languages: ["JavaScript/TypeScript"],
      metrics: {
        totalServices: 2,
        totalDatabases: 1,
        complexity: "low",
        estimatedLoad: 500,
        suggestedServers: 2,
      },
      files: {},
    };
  }
}

/**
 * Analyze local ZIP file
 */
export async function analyzeLocalZip(zipFile: File): Promise<AnalysisResult> {
  try {
    // For now, use a basic ZIP parser approach
    const text = await zipFile.text().catch(() => "");

    // Parse the ZIP as text to detect file names and content
    const services: ServiceNode[] = [];
    const databases: ServiceNode[] = [];
    const frameworks: string[] = [];
    const languages: string[] = [];
    let packageJson: any = null;

    // Try to detect project structure from ZIP
    if (
      zipFile.name.includes("package.json") ||
      text.includes("package.json") ||
      text.includes("node_modules")
    ) {
      languages.push("JavaScript/TypeScript");
      frameworks.push("Node.js");

      // Try to extract package.json data if available
      try {
        const match = text.match(/package\.json[\s\S]{0,2000}?"name"\s*:\s*"([^"]+)"/);
        if (match) packageJson = { name: match[1] };
      } catch {}
    }

    if (text.includes("requirements.txt") || text.includes("Django") || text.includes("FastAPI")) {
      languages.push("Python");
      if (text.includes("django")) frameworks.push("Django");
      if (text.includes("fastapi")) frameworks.push("FastAPI");
    }

    if (text.includes("docker-compose.yml")) {
      // Add services detected from docker-compose
      if (text.includes("postgres")) {
        databases.push({
          id: "db-postgres",
          name: "PostgreSQL",
          type: "database",
          description: "PostgreSQL database",
        });
      }
      if (text.includes("redis")) {
        databases.push({
          id: "cache-redis",
          name: "Redis",
          type: "cache",
          description: "Redis cache",
        });
      }
      if (text.includes("mongodb")) {
        databases.push({
          id: "db-mongo",
          name: "MongoDB",
          type: "database",
          description: "MongoDB database",
        });
      }
    }

    // Add default services
    if (services.length === 0) {
      services.push({
        id: "service-api",
        name: "API Server",
        type: "api",
        language: languages[0] || "Unknown",
        framework: frameworks[0] || "Unknown",
        description: "Main API service",
      });
    }

    if (databases.length === 0) {
      databases.push({
        id: "db-default",
        name: "Database",
        type: "database",
        description: "Default database",
      });
    }

    return {
      projectName: zipFile.name.replace(".zip", ""),
      description: `Analysis of uploaded project: ${zipFile.name}`,
      services,
      dependencies: services.length > 1
        ? [{ from: services[0].id, to: databases[0].id, type: "uses" }]
        : [],
      databases,
      frameworks,
      languages,
      metrics: {
        totalServices: services.length,
        totalDatabases: databases.length,
        complexity: services.length > 5 ? "high" : services.length > 2 ? "medium" : "low",
        estimatedLoad: services.length > 5 ? 1000 : services.length > 2 ? 500 : 100,
        suggestedServers: services.length > 5 ? 8 : services.length > 2 ? 4 : 2,
      },
      files: {
        packageJson,
      },
    };
  } catch (error) {
    throw new Error(
      `Failed to analyze ZIP file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Parse project structure from repository
 */
async function parseProjectStructure(owner: string, repo: string, apiUrl: string): Promise<AnalysisResult> {
  const services: ServiceNode[] = [];
  const dependencies: Array<{ from: string; to: string; type: string }> = [];
  const databases: ServiceNode[] = [];
  let packageJson: any = null;
  let dockerCompose: string | undefined;
  let dockerfile: string | undefined;
  const languages: string[] = [];
  const frameworks: string[] = [];

  // Detect folder structure to identify services
  const dirs = ["backend", "frontend", "api", "services", "apps", "packages"];
  for (const dir of dirs) {
    const path = `${owner}/${repo}/contents/${dir}`;
    try {
      const res = await fetch(`https://api.github.com/repos/${path}`, {
        headers: { Accept: "application/vnd.github.v3.json" },
      });
      if (res.ok) {
        const items = await res.json();
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.type === "dir") {
              services.push({
                id: `service-${item.name}`,
                name: item.name,
                type: "service",
                description: `Service: ${item.name}`,
              });
            }
          }
        }
      }
    } catch {}
  }

  // Try to fetch package.json to detect dependencies
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      { headers: { Accept: "application/vnd.github.v3.raw" } }
    );
    if (res.ok) {
      const text = await res.text();
      packageJson = JSON.parse(text);
      languages.push("JavaScript/TypeScript");

      // Detect frameworks
      if (packageJson.dependencies) {
        if (packageJson.dependencies.express) frameworks.push("Express.js");
        if (packageJson.dependencies.next) frameworks.push("Next.js");
        if (packageJson.dependencies.react) frameworks.push("React");
        if (packageJson.dependencies.fastify) frameworks.push("Fastify");
        if (packageJson.dependencies.mongoose) {
          databases.push({
            id: "db-mongodb",
            name: "MongoDB",
            type: "database",
            description: "MongoDB instance",
          });
        }
        if (packageJson.dependencies.redis) {
          databases.push({
            id: "cache-redis",
            name: "Redis",
            type: "cache",
            description: "Redis cache",
          });
        }
        if (packageJson.dependencies.pg || packageJson.dependencies.mysql) {
          databases.push({
            id: "db-sql",
            name: "SQL Database",
            type: "database",
            description: "PostgreSQL or MySQL",
          });
        }
      }

      // Add main API service
      services.unshift({
        id: "service-api",
        name: "API Server",
        type: "api",
        language: "JavaScript/TypeScript",
        framework: frameworks[0],
        port: 3000,
        description: "Main API server",
      });
    }
  } catch {}

  // Try to fetch requirements.txt for Python
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/requirements.txt`,
      { headers: { Accept: "application/vnd.github.v3.raw" } }
    );
    if (res.ok) {
      languages.push("Python");
      const text = await res.text();
      if (text.includes("django")) frameworks.push("Django");
      if (text.includes("fastapi")) frameworks.push("FastAPI");
      if (text.includes("flask")) frameworks.push("Flask");
    }
  } catch {}

  // Try to fetch docker-compose.yml
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/docker-compose.yml`,
      { headers: { Accept: "application/vnd.github.v3.raw" } }
    );
    if (res.ok) {
      dockerCompose = await res.text();
      parseDockerCompose(dockerCompose, services, databases);
    }
  } catch {}

  // Try to fetch Dockerfile
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/Dockerfile`,
      { headers: { Accept: "application/vnd.github.v3.raw" } }
    );
    if (res.ok) {
      dockerfile = await res.text();
    }
  } catch {}

  // Add frontend if React detected
  if (frameworks.includes("React") || frameworks.includes("Next.js")) {
    services.push({
      id: "service-frontend",
      name: "Frontend",
      type: "frontend",
      language: "JavaScript/TypeScript",
      framework: frameworks.find((f) => f.includes("React")) || "React",
      port: 3000,
      description: "Frontend application",
    });
  }

  // Add API gateway if multiple services
  if (services.length > 2) {
    services.unshift({
      id: "gateway-nginx",
      name: "API Gateway",
      type: "gateway",
      description: "NGINX reverse proxy",
    });
  }

  // Create dependencies
  if (services.length > 0) {
    services.forEach((service) => {
      if (service.type !== "gateway") {
        dependencies.push({
          from: service.id,
          to: "db-mongodb",
          type: "uses",
        });
      }
    });
  }

  const totalServices = services.length;
  const totalDatabases = databases.length;
  const complexity = totalServices > 5 ? "high" : totalServices > 2 ? "medium" : "low";
  const estimatedLoad = complexity === "high" ? 1000 : complexity === "medium" ? 500 : 100;
  const suggestedServers = complexity === "high" ? 8 : complexity === "medium" ? 4 : 2;

  return {
    projectName: repo,
    description: `Analysis of ${owner}/${repo} repository`,
    services,
    dependencies,
    databases,
    frameworks,
    languages,
    metrics: {
      totalServices,
      totalDatabases,
      complexity,
      estimatedLoad,
      suggestedServers,
    },
    files: {
      packageJson,
      dockerfile,
      dockerCompose,
      envVars: dockerfile ? parseEnvVars(dockerfile) : undefined,
    },
  };
}

/**
 * Parse docker-compose.yml to extract services and databases
 */
function parseDockerCompose(
  yaml: string,
  services: ServiceNode[],
  databases: ServiceNode[]
) {
  // Simple YAML parsing for docker-compose
  const lines = yaml.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("postgres") || line.includes("postgres")) {
      databases.push({
        id: "db-postgres",
        name: "PostgreSQL",
        type: "database",
        description: "PostgreSQL database service",
      });
    }
    if (line.startsWith("mysql") || line.includes("mysql")) {
      databases.push({
        id: "db-mysql",
        name: "MySQL",
        type: "database",
        description: "MySQL database service",
      });
    }
    if (line.startsWith("redis") || line.includes("redis")) {
      databases.push({
        id: "cache-redis",
        name: "Redis",
        type: "cache",
        description: "Redis cache service",
      });
    }
    if (line.startsWith("elasticsearch") || line.includes("elasticsearch")) {
      databases.push({
        id: "search-elastic",
        name: "Elasticsearch",
        type: "database",
        description: "Elasticsearch search engine",
      });
    }
  }
}

/**
 * Extract environment variables from Dockerfile
 */
function parseEnvVars(dockerfile: string): string[] {
  const envVars: string[] = [];
  const lines = dockerfile.split("\n");

  for (const line of lines) {
    if (line.includes("ENV ")) {
      const envMatch = line.match(/ENV\s+(\w+)/);
      if (envMatch) {
        envVars.push(envMatch[1]);
      }
    }
  }

  return envVars;
}
