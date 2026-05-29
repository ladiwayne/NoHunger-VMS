declare module 'next' {
  export type Metadata = any;
}

declare module 'next/link' {
  import * as React from 'react';
  const Link: React.ComponentType<any>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): any;
  export function useParams(): Record<string, string | undefined>;
  export function useSearchParams(): {
    get(name: string): string | null;
    has(name: string): boolean;
    toString(): string;
  };
  export function usePathname(): string;
  export function redirect(destination: string, statusCode?: number): void;
}

declare module 'next/server' {
  export interface NextUrl {
    protocol: string;
    pathname: string;
    search: string;
    [key: string]: any;
  }

  export interface NextRequest extends Request {
    nextUrl: NextUrl;
    cookies: {
      get(name: string): { value: string } | undefined;
      [key: string]: any;
    };
  }

  export class NextResponse extends Response {
    static json(body: any, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    cookies: {
      set(name: string, value: string, opts?: { maxAge?: number; path?: string; [key: string]: any }): void;
      get(name: string): { value: string } | undefined;
      delete(name: string, opts?: { path?: string }): void;
      [key: string]: any;
    };
  }
}

declare module 'next/image' {
  import * as React from 'react';
  const Image: React.ComponentType<any>;
  export default Image;
}

declare module 'next/headers' {
  export function cookies(): any;
}
