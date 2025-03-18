import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CrawlerApiPostDto {
    @IsOptional()
    @IsBoolean()
    wikipedia : boolean;

    @IsOptional()
    @IsBoolean()
    pubMed : boolean;

    @IsString()
    @IsNotEmpty( { message : "Search string required" } )
    searchString : string;
};

export class CrawlerModuleDto {
    @IsOptional()
    url : string;

    @IsOptional()
    content : string;

    @IsOptional()
    status : number;
}

export class CrawlerApiResultDto {
    result : string[];
    resultUrls : string[];
}