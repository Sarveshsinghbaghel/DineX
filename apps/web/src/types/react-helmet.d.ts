declare module 'react-helmet' {
  import type { PropsWithChildren, ReactElement } from 'react';

  export function Helmet(props: PropsWithChildren): ReactElement | null;
}
