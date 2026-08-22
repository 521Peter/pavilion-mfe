export type RateLimit = {
    ttl: number;
    limit: number;
    status: number;
};

export type RouterDetail = {
    operationId: string;
    description: string;
    path: string;
    isBearerAuth: boolean;
    isApiKeyAuth: boolean;
    routerPath: string;
    pathMatch: any; // TODO：将此类型修正为 PathMatch
    rateLimits: RateLimit[];
    extra?: NodeJS.Dict<any>;
};

export type RouterPathType = {
    [key in string]: RouterDetail[];
};
