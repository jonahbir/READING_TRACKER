declare module 'react-router-hash-link' {
  import { ComponentType } from 'react';
  import { LinkProps } from 'react-router-dom';
  
  export const HashLink: ComponentType<LinkProps>;
}