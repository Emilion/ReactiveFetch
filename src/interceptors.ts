export interface Interceptors {
    requestInterceptors: RequestInterceptor[];
    responseInterceptors: ResponseInterceptor[];
}

export type RequestInterceptor = (request: Request) => Request | void
export type ResponseInterceptor = (response: Response) => Response | void