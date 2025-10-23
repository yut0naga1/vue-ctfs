// for TypeScript to recognize .vue
declare module '*.vue' { const c: any; export default c }

export {}
declare global { interface Window { __FLAG_XSS: string } }
