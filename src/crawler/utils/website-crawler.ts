import axios from 'axios';
import cheerio from 'cheerio';
import Redis from 'ioredis';
import { Job } from 'bullmq';
import { WebsiteData } from '../interfaces/website-data.interface';

export class WebsiteCrawler {
  constructor(private readonly url: string, private readonly redisClient) {
    this.redisClient = new Redis(process.env.REDIS_URL);
  }

  private async fetchHtml(): Promise<string> {
    const { data: html } = await axios.get(this.url);
    return html;
  }

  private parseHtml(html: string): WebsiteData {
    const $ = cheerio.load(html);
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') ?? '';
    const faviconUrl = $('link[rel="shortcut icon"]').attr('href') ?? '';

    const scriptUrls: string[] = [];
    $('script').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        scriptUrls.push(src);
      }
    });

    const stylesheetUrls: string[] = [];
    $('link[rel="stylesheet"]').each((_i, el) => {
      const href = $(el).attr('href');
      if (href) {
        stylesheetUrls.push(href);
      }
    });

    const imageUrls: string[] = [];
    $('img').each((_i, el) => {
      const src = $(el).attr('src');
      if (src) {
        imageUrls.push(src);
      }
    });

    return {
      title,
      metaDescription,
      faviconUrl,
      scriptUrls,
      stylesheetUrls,
      imageUrls,
    };
  }

  public async crawl(job: Job): Promise<WebsiteData> {
    const html = await this.fetchHtml();
    const websiteData = this.parseHtml(html);
    await this.redisClient.set(job.id, JSON.stringify(websiteData));
    return websiteData;
  }
}
