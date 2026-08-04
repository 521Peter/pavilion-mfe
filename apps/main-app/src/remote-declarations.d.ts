declare module 'demo-app/main' {
  import type { SubAppLifecycle } from '@pavilion-mfe/router'
  const lifecycle: SubAppLifecycle
  export default lifecycle
}

declare module 'react-app/main' {
  import type { SubAppLifecycle } from '@pavilion-mfe/router'
  const lifecycle: SubAppLifecycle
  export default lifecycle
}
