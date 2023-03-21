import {Observable, of, throwError} from "rxjs";
import {fromFetch} from 'rxjs/fetch';
import {mergeMap} from "rxjs/operators";
import {fromPromise, isArray} from "rxjs/internal-compatibility";
import {Interceptors, RequestInterceptor, ResponseInterceptor} from "./interceptors";

const htmlRegex = /text\/html/;
const jsonRegex = /application\/json/;

/**
 *
 * @param response
 * @returns {Observable<any>}
 */
const getResultObservable = (response: Response) => {
    let contentType = response.headers.get('content-type');

    let dataObservable;
    if (jsonRegex.test(<string>contentType)) {
        dataObservable = fromPromise(response.json());
    }
    if (htmlRegex.test(<string>contentType)) {
        dataObservable = fromPromise(response.text());
    }
    /**
     * add new content-type handler bellow
     */

    if (!dataObservable) {
        dataObservable = of({});
    }

    return dataObservable;
};
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
            if (isArray(responseInterceptors)) {
                responseInterceptors.forEach(interceptor => {
                      resultResponse = callRespInterceptor(interceptor, resultResponse);
                  }
                )
            }

            if (response.ok) {

                getResultObservable(response);
            }
            return throwError(getResultObservable(response));
        })
    );
};
