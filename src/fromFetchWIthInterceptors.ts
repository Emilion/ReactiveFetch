import {EMPTY, Observable, throwError} from "rxjs";
import {fromFetch} from 'rxjs/fetch';
import {mergeMap} from "rxjs/operators";
import {fromPromise} from "rxjs/internal-compatibility";
import {Interceptors, RequestInterceptor, ResponseInterceptor} from "./interceptors";

const htmlRegex = /text\/html/;
const jsonRegex = /application\/json/;
export const fromFetchWIthInterceptors = <T>(request: Request, init: RequestInit, interceptors: Interceptors): Observable<Response> => {

    const {requestInterceptors, responseInterceptors} = interceptors;

    let resultRequest = request;

    const callInterceptor = (interceptor: RequestInterceptor | Function) => {
        if (typeof interceptor === "function") {
            const modifiedRequest = interceptor(resultRequest);
            // expecting interceptor to return a Request object, otherwise any changes would not be applied to request.
            if (modifiedRequest) {
                resultRequest = modifiedRequest;
            }
        }
    };
    /**
     *
     * @param interceptor
     * @param response
     */
    const callRespInterceptor = (interceptor: ResponseInterceptor, response: Response) => {
        let resultResponse;
        if (typeof interceptor === "function") {

            resultResponse = interceptor(response)
        }
        return resultResponse || response;
    };

    requestInterceptors.forEach(interceptor => {
            callInterceptor(interceptor);
        }
    );

    /**
     * Handling server response nad response interceptors
     */
    return fromFetch(resultRequest, init).pipe(
        mergeMap((response: Response): Observable<any> => {

            let resultResponse = response.clone();
            // executing global and request specific req Interceptors
            responseInterceptors.forEach(interceptor => {
                    resultResponse = callRespInterceptor(interceptor, resultResponse);
                }
            );

            if (response.ok) {

                /*
                 * Data subscription
                 * */
                let contentType = resultResponse.headers.get('content-type');

                let dataObservable: Observable<T | any> = EMPTY;
                /*
                    Handling different response body types
                 */
                if (jsonRegex.test(<string>contentType)) {
                    dataObservable = fromPromise(resultResponse.json());
                }
                if (htmlRegex.test(<string>contentType)) {
                    dataObservable = fromPromise(resultResponse.text());
                }
                // TODO: handle formData
                return dataObservable;
            }
            return throwError(resultResponse);
        })
    );
};
