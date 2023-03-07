import { JobStatus } from '../enums/job-status.enum';

export interface CrawlResult {
  jobId?: string;
  status?: JobStatus | unknown;
  data?: any;
  error?: string;
  message?: string;
}
