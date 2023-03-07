import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { WebsiteCrawler } from '../utils/website-crawler';
import { CrawlJobData } from '../interfaces/crawl-job-data.interface';
import { CrawlResult } from '../interfaces/crawl-result.interface';
import { Job, Queue } from 'bullmq';
import { Process } from '@nestjs/bull';
import Redis from 'ioredis';

@Processor('crawl')
export class CrawlerQueue extends Queue {
  private websiteCrawler: WebsiteCrawler;

  constructor(private readonly redisClient) {
    super('crawler');
    this.redisClient = new Redis(process.env.REDIS_URL);
  }

  @OnWorkerEvent('ready')
  onReady(worker: WorkerHost) {
    console.log(`Worker ${worker.worker} is ready`);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    console.error(`Worker error: ${error}`);
  }

  @OnWorkerEvent('completed')
  async onCompleted(jobId: number, result: CrawlResult) {
    await this.redisClient.set(`crawl:${jobId}`, JSON.stringify(result));
    console.log(`Job ${jobId} has completed`);
  }

  @OnWorkerEvent('failed')
  async onFailed(jobId: number, error: Error) {
    await this.redisClient.set(
      `crawl:${jobId}`,
      JSON.stringify({ message: error.message, name: error.name }),
    );
    console.error(`Job ${jobId} has failed with error: ${error}`);
  }

  @Process()
  async processCrawlJob(job: Job<CrawlJobData>) {
    const { data } = job;
    this.websiteCrawler = new WebsiteCrawler(data.url, this.redisClient);

    try {
      const result = await this.websiteCrawler.crawl(job);
      return result;
    } catch (error) {
      throw new Error(`Failed to crawl website: ${error}`);
    }
  }
}
