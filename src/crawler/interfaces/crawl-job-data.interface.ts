export interface CrawlJobData {
  url: string;
  links?: string[];
  maxDepth?: number;
  maxConcurrency?: number;
}
