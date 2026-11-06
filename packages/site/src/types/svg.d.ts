// SVGs are imported as React components via gatsby-plugin-svgr. These types
// were previously provided by `react-scripts`.
// eslint-disable-next-line import/unambiguous
declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react';

  export const ReactComponent: FunctionComponent<
    SVGProps<SVGSVGElement> & { title?: string }
  >;
}
