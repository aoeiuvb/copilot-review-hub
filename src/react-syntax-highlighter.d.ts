declare module 'react-syntax-highlighter' {
  import { ComponentType, ReactNode } from 'react'

  export interface SyntaxHighlighterProps {
    language?: string
    style?: Record<string, unknown>
    children?: ReactNode
    PreTag?: keyof JSX.IntrinsicElements | ComponentType<any>
    customStyle?: Record<string, string | number>
    codeTagProps?: Record<string, unknown>
    wrapLongLines?: boolean
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const oneDark: Record<string, unknown>
  export const oneLight: Record<string, unknown>
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism/one-light' {
  const style: Record<string, unknown>
  export default style
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism/one-dark' {
  const style: Record<string, unknown>
  export default style
}
