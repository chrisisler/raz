declare module 'one-cache' {
  export default function(key: string, fn: <A>() => Promise<A>): Promise<A>
}
