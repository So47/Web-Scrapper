import { WebsiteData } from './interfaces/website-data.interface';
import { CrawlResult } from './interfaces/crawl-result.interface';
import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrawlerService } from './crawler.service';
import { CreateCrawlerDto } from './dto/create-crawler.dto';
import { JobStatus } from './enums/job-status.enum';
import { Job } from 'bullmq';

@ApiTags('crawl')
@Controller('crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @ApiOperation({ summary: 'Gets all the jobs' })
  // @ApiResponse({ status: 200, description: '' })
  @Get()
  async getAllJobs(): Promise<Job<WebsiteData>[]> {
    return this.crawlerService.getAllJobs();
  }

  @ApiOperation({ summary: 'Add a new crawl job' })
  @ApiResponse({
    status: 201,
    description: 'Returns the ID of the created job',
  })
  @Post('crawl')
  create(@Body() createCrawlerDto: CreateCrawlerDto) {
    return this.crawlerService.enqueue(createCrawlerDto.url);
  }

  @ApiOperation({ summary: 'Get the status of a crawl job' })
  @ApiResponse({ status: 200, description: 'Returns the status of the job' })
  @Get('status/:id')
  async getStatus(@Param('id') id: string): Promise<JobStatus | unknown> {
    return this.crawlerService.getStatus(id);
  }

  @ApiOperation({ summary: 'Cancels the crawl job' })
  @ApiResponse({ status: 200, description: 'Returns boolean value' })
  @Delete('cancel/:id')
  async cancelJob(@Param('id') id: string): Promise<boolean | CrawlResult> {
    return this.crawlerService.cancel(id);
  }

  @ApiOperation({ summary: 'Starts the crawl job for specific id' })
  @Get('start/:id')
  async startCrawler(@Param('id') id: string): Promise<CrawlResult> {
    const result = await this.crawlerService.startCrawl(id);
    return result;
  }

  @ApiOperation({ summary: 'Stops the crawl job' })
  @Get('stop')
  async stopCrawler(): Promise<CrawlResult> {
    const result = await this.crawlerService.stopCrawl();
    return result;
  }

  @ApiOperation({ summary: 'Monitors the crawl job' })
  @Get('monitor')
  async monitorCrawler(): Promise<string> {
    const result = await this.crawlerService.monitorCrawl();
    return result;
  }

  @ApiOperation({ summary: 'Monitors specific job' })
  @Get('monitor/:id')
  async getCompletedCrawlResult(@Param('id') id: string): Promise<WebsiteData> {
    const result = await this.crawlerService.getCompletedCrawlResult(id);
    return result;
  }
}
