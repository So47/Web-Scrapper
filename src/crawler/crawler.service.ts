import { JobStatus } from './enums/job-status.enum';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { WebsiteData } from './interfaces/website-data.interface';
import { CrawlerQueue } from './queues/crawler.queue';
import { CrawlResult } from './interfaces/crawl-result.interface';

@Injectable()
export class CrawlerService {
  constructor(private readonly queue: CrawlerQueue) {}

  async getAllJobs(): Promise<Job<WebsiteData>[]> {
    return await this.queue.getJobs([
      JobStatus.WAITING,
      JobStatus.ACTIVE,
      JobStatus.COMPLETED,
      JobStatus.FAILED,
    ]);
  }

  async enqueue(url: string): Promise<CrawlResult> {
    const job = await this.queue.add('crawl', { url });
    const JobState = await job.getState();

    return {
      jobId: job.id,
      message: 'Crawl job created successfully',
      status: JobState,
    };
  }

  async getCompletedCrawlResult(jobId: string): Promise<WebsiteData> {
    const job = await this.queue.getJob(jobId);
    const JobState = await job.getState();

    if (job && JobState === JobStatus.COMPLETED) {
      const result = job.returnvalue;
      return result;
    }
    return null;
  }

  async cleanCompletedJobs(): Promise<void> {
    await this.queue.clean(0, 10, JobStatus.COMPLETED);
  }

  async cancel(id: string): Promise<CrawlResult | boolean> {
    const job = await this.queue.getJob(id);
    const JobState = await job.getState();

    if (job) {
      await job.remove();
      return {
        jobId: job.id,
        message: 'Crawl job cancelled successfully',
        status: JobState,
      };
    }
    return false;
  }

  async startCrawl(id: string): Promise<CrawlResult> {
    const job = await this.queue.getJob(id);
    const JobState = await job.getState();

    const result = await this.queue.processCrawlJob(job);
    console.log(job.progress);
    // if (!job || JobState !== JobStatus.COMPLETED) {
    //   throw new Error('The crawl has not started yet');
    // }

    return {
      data: result,
      jobId: job.id,
      message: 'Crawl job started successfully',
      status: JobState,
    };
  }

  async stopCrawl(): Promise<CrawlResult> {
    const activeJobs = await this.queue.getActiveCount();

    if (activeJobs > 0) {
      await this.queue.pause();
      await this.queue.clean(0, 10, JobStatus.COMPLETED);
    }

    return {
      message: 'Crawl job stopped successfully',
    };
  }

  async getStatus(id: string): Promise<any> {
    const job = await this.queue.getJob(id);
    if (job) {
      return {
        id: job.id,
        data: job.data,
        state: await job.getState(),
        progress: job.progress,
        created: job.timestamp,
        finished: job.finishedOn,
      };
    } else {
      return null;
    }
  }

  async monitorCrawl(): Promise<string> {
    const workers = await this.queue.getJobs();
    const workerStates = workers.map(
      (w) => `Job with id ${w.id} >> progress: ${w.progress}`,
    );

    return workerStates.join('\n');
  }
}
