import { CrawlerQueue } from './queues/crawler.queue';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'crawler',
    }),
  ],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerQueue, Object],
})
export class CrawlerModule {}
