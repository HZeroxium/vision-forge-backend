// import { HttpModule, HttpService } from '@nestjs/axios';
import { 
    Post,
    Controller,
    Req,
    Res,
    Body,
} from '@nestjs/common';
import { Request, Response } from 'express'
import { CrawlerApiPostDto, CrawlerModuleDto, CrawlerApiResultDto } from './crawler-api.dto'
import Crawler from 'js-crawler'
import { StringUtil } from 'src/common/utils/string.util'

@Controller('crawler-api')
export class CrawlerController {
    @Post()
    search (@Req() req : Request, @Res() res : Response, @Body() body : CrawlerApiPostDto) : void {
        const result : string[] = [] // text extracted from page html 
        const resultUrls : string[] = [] // correspoding urls

        // wait for crawler to finish before sending
        let workingWiki = false;
        let workingPubMed = false;

        if (body.wikipedia)
        {
            workingWiki = true;
            const crawler = new Crawler().configure({
                depth: 2, // check only links on the search page
                maxRequestsPerSecond: 30,
                ignoreRelative : true,
                shouldCrawl : this.wikipediaUrl
            });

            try {
                crawler.crawl(`https://en.wikipedia.org/w/index.php?search=${body.searchString}&fulltext=1&ns0=1`,
                    function onSuccess(page : CrawlerModuleDto) {
                        let rawText : string = StringUtil.removeTags(page.content);
                        rawText = StringUtil.removeDoubleSpace(rawText);
                        result.push(rawText);
                        resultUrls.push(page.url);
                    }, 
                    null, 
                    function onAllFinished(crawledUrls) {
                        // for (const url of crawledUrls) 
                        // {
                        //     console.log(url);
                        // }
                        workingWiki = false;
                    });
            }
            catch {
                workingWiki = false;
            }
        }

        if (body.pubMed)
        {
            workingPubMed = true;
            const crawler = new Crawler().configure({
                depth: 2,
                maxRequestsPerSecond: 30,
                ignoreRelative : true,
                shouldCrawl : this.pubMedUrl
            });

            try {
                crawler.crawl(``, //// get correct url to crawl here
                    function onSuccess(page : CrawlerModuleDto) {
                        let rawText : string = StringUtil.removeTags(page.content);
                        rawText = StringUtil.removeDoubleSpace(rawText);
                        result.push(rawText);
                        resultUrls.push(page.url);
                    }, 
                    null, 
                    function onAllFinished(crawledUrls) {
                        // for (const url of crawledUrls) 
                        // {
                        //     console.log(url);
                        // }
                        workingPubMed = false;
                    });
            }
            catch {
                workingPubMed = false;
            }
        }

        while (workingWiki || workingPubMed) {} // wait
        const message : CrawlerApiResultDto = {
            result : result,
            resultUrls : resultUrls,
        }
        res.json(message);
    }

    // check if url should be crawled
    private wikipediaUrl (url : string) : boolean { 
        return url.indexOf("en.wikipedia.org") >= 0 && !/wiki\/Special:/.test(url) && !/wiki\/Wikipedia:/.test(url);
    }
    private pubMedUrl (url : string) : boolean {
        //// url check here
        return true;
    }
};