import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url);
const viteRequire=createRequire(require.resolve('vitest/package.json'));
const {createServer}=await import(pathToFileURL(viteRequire.resolve('vite')).href);
const root=process.cwd().replaceAll('\\','/');
const server=await createServer({configFile:false,root,resolve:{alias:{'@':root,'next/link':root+'/tests/ui/receivables/link.tsx'}},server:{host:'127.0.0.1',port:4177,strictPort:true},oxc:{jsx:{runtime:'automatic'}}});
await server.listen();console.log('Isolated UI fixture: http://127.0.0.1:4177/tests/ui/receivables/index.html');
