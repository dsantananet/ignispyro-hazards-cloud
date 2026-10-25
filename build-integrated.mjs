import {readFile,writeFile} from 'node:fs/promises';
const html=await readFile('index.html','utf8');
await writeFile('site/integrated.html',html.replaceAll('href="site/','href="').replaceAll('src="site/','src="'));
