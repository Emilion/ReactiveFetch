import {isArray} from 'rxjs/internal-compatibility';
import {fromFetchWIthInterceptors} from './fromFetchWIthInterceptors';
import {Interceptors} from "./interceptors";

class ReactiveHttp {

  headers = new Headers();
  private interceptors: Interceptors = {requestInterceptors: [], responseInterceptors: []};

  configure(interceptors?: Interceptors, headers?: Headers) {
    if (interceptors) {
      this.interceptors = interceptors;
    }

    if (headers) {
      this.setHeaders(headers);
    }
  }

  // Assembling interceptors
  private getInterceptorAssembly = (additionalInterceptors: Interceptors) => {
    let assembly = {...this.interceptors};

    if (!additionalInterceptors) return assembly;
    if (isArray(additionalInterceptors.requestInterceptors)) {
      assembly.requestInterceptors = [...assembly.requestInterceptors, ...additionalInterceptors.requestInterceptors]
    }

    if (isArray(additionalInterceptors.responseInterceptors)) {
      assembly.responseInterceptors = [...assembly.responseInterceptors, ...additionalInterceptors.responseInterceptors]
    }
    return assembly;
  };

  setHeaders(headers: { [key: string]: any }) {
    for (const key in headers) {
      this.headers.set(key, headers[key]);
    }
  }

  /**
   * Assembling global headers with request specific headers
   *
   * @param newHeaders
   * @returns {Headers}
   */
  composeHeaders(newHeaders: { [key: string]: any }) {
    const composedHeaders = new Headers();

    this.headers.forEach(((value: string, key: string) => {
      composedHeaders.set(key, value);
    }));

    for (const key in newHeaders) {
      composedHeaders.set(key, newHeaders[key]);
    }

    return composedHeaders;
  }


  private fetch(opts: methodOptions) {
    const {url, init = {}, interceptors = {requestInterceptors: [], responseInterceptors: []}} = opts;

    const assembledInterceptors = this.getInterceptorAssembly(interceptors) || {};

    let reqHeaders;
    const {headers, ...other} = init;
    if (headers) {
      reqHeaders = this.composeHeaders(headers);
    }
    const options = {
      ...other,
      headers: reqHeaders
    };
    const request = new Request(url, options);

    return fromFetchWIthInterceptors(request, options, {
      requestInterceptors: assembledInterceptors.requestInterceptors,
      responseInterceptors: assembledInterceptors.responseInterceptors
    });
  }

  /**
   * GET
   * TODO: documentation
   */
  public get(opts: methodOptions) {
    const getOpts: methodOptions = {...opts, init: {...opts.init, method: "GET"}};
    return this.fetch(getOpts);
  }

  /**
   * POST method
   *
   */
  post(opts: methodOptions) {
    const getOpts: methodOptions = {...opts, init: {...opts.init, method: "POST"}};
    return this.fetch(getOpts);
  }

  /**
   * PUT method
   * @inheritDoc
   */
  put(opts: methodOptions) {
    const getOpts: methodOptions = {...opts, init: {...opts.init, method: "PUT"}};
    return this.fetch(getOpts);
  }

  /**
   * PATCH method
   * @inheritDoc
   */
  patch(opts: methodOptions) {
    const getOpts: methodOptions = {...opts, init: {...opts.init, method: "PATCH"}};
    return this.fetch(getOpts);
  }

  /**
   * Delete method
   * @inheritDoc
   */
  delete(opts: methodOptions) {
    const getOpts: methodOptions = {...opts, init: {...opts.init, method: "DELETE"}};
    return this.fetch(getOpts);
  }
}

let reactiveFetchInst = new ReactiveHttp();

export default reactiveFetchInst;

type methodOptions = { url: string, init?: RequestInit, interceptors?: Interceptors };