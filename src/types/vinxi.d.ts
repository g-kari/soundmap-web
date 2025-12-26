declare module "vinxi/http" {
  export function getEvent(): {
    node: {
      req: {
        headers: {
          cookie?: string;
        };
      };
      res: {
        setHeader(name: string, value: string): void;
      };
    };
  };
}

declare module "vinxi/types/client" {}

declare module "@tanstack/react-start/router-manifest" {
  export function getRouterManifest(): any;
}

declare module "@tanstack/react-start/client" {
  import { ReactNode } from "react";
  export function StartClient(props: { router: any }): ReactNode;
}

declare module "@tanstack/react-start/server" {
  export function createStartHandler(options: any): (handler: any) => any;
  export const defaultStreamHandler: any;
}

// Node.js require for dynamic imports
declare const require: (module: string) => any;
