import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class UrlMonitoringService {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      maxRedirects: 5,
    });
  }

  async analyzeUrl(url: string) {
    try {
      const startTime = performance.now();
      const dnsStart = performance.now();

      // Validate URL format
      const urlObj = new URL(url);
      const dnsTime = performance.now() - dnsStart;

      // TCP/TLS timing
      const tcpStart = performance.now();
      const response = await this.httpClient.get(url, {
        validateStatus: () => true,
      });
      const tcpTime = performance.now() - tcpStart;

      const totalTime = performance.now() - startTime;

      // Calculate metrics
      const statusCode = response.status;
      const latency = totalTime;
      const responseSize = JSON.stringify(response.data).length;

      // Calculate health score (0-100)
      const healthScore = this.calculateHealthScore(statusCode, latency);

      // Calculate performance score (0-100)
      const performanceScore = this.calculatePerformanceScore(latency, responseSize);

      // Estimate uptime (simulated for now)
      const uptime = statusCode === 200 ? 99.9 : 85;

      // Error rate estimation
      const errorRate = statusCode !== 200 ? 50 : 1;

      // Get suggestions
      const suggestions = this.generateSuggestions(
        statusCode,
        latency,
        healthScore,
        performanceScore,
      );

      return {
        url,
        statusCode,
        latency,
        healthScore,
        performanceScore,
        responseTime: totalTime,
        uptime,
        errorRate,
        suggestions,
        metrics: {
          dns: dnsTime,
          tcp: tcpTime,
          tls: tcpTime * 0.3, // Estimated
          firstByte: tcpTime + dnsTime,
          pageLoad: totalTime,
          resourceSize: responseSize,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      // Handle error scenarios
      return {
        url,
        statusCode: 0,
        latency: 0,
        healthScore: 0,
        performanceScore: 0,
        responseTime: 0,
        uptime: 0,
        errorRate: 100,
        suggestions: [
          'URL is unreachable',
          'Check network connectivity',
          'Verify URL format and domain availability',
          error.message,
        ],
        metrics: {
          dns: 0,
          tcp: 0,
          tls: 0,
          firstByte: 0,
          pageLoad: 0,
          resourceSize: 0,
        },
        timestamp: new Date(),
      };
    }
  }

  private calculateHealthScore(statusCode: number, latency: number): number {
    let score = 100;

    // Status code health
    if (statusCode >= 500) score -= 50;
    else if (statusCode >= 400) score -= 30;
    else if (statusCode === 200) score += 0;
    else if (statusCode >= 300) score -= 15;

    // Latency health
    if (latency > 5000) score -= 30;
    else if (latency > 3000) score -= 20;
    else if (latency > 1000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculatePerformanceScore(latency: number, responseSize: number): number {
    let score = 100;

    // Latency score
    if (latency > 5000) score -= 40;
    else if (latency > 3000) score -= 25;
    else if (latency > 1000) score -= 10;
    else if (latency < 200) score += 10;

    // Response size score
    const sizeMB = responseSize / (1024 * 1024);
    if (sizeMB > 10) score -= 20;
    else if (sizeMB > 5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private generateSuggestions(
    statusCode: number,
    latency: number,
    healthScore: number,
    performanceScore: number,
  ): string[] {
    const suggestions: string[] = [];

    if (statusCode >= 500) {
      suggestions.push('Server error detected. Contact server administrators.');
    }
    if (statusCode >= 400) {
      suggestions.push('Client error detected. Verify request parameters.');
    }
    if (latency > 3000) {
      suggestions.push(
        'High latency detected. Consider CDN implementation or server optimization.',
      );
      suggestions.push('Check network conditions and server load.');
    }
    if (latency > 5000) {
      suggestions.push(
        'Critical latency issue. Immediate optimization required.',
      );
    }
    if (healthScore < 50) {
      suggestions.push('Website health is poor. Urgent action required.');
    }
    if (performanceScore < 50) {
      suggestions.push(
        'Performance is degraded. Review server configuration and database queries.',
      );
    }
    if (suggestions.length === 0) {
      suggestions.push('Website is performing normally.');
    }

    return suggestions;
  }
}
