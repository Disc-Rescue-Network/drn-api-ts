import http from 'http'

/* To ensure extras are added onto the global */
import './lib'

import config from './config';


(async function() {
    async function shutdown(err?: unknown) {
        try {
            await store.default.close()
        } catch(e) {
            console.log(e)
        }

        process.exit(err ? 1 : 0)
    }

    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    async function onException(errOrReason: unknown) {
        if(errOrReason) { console.error(errOrReason) }
        shutdown(errOrReason)
    }

    process.on('uncaughtException', onException)
    process.on('unhandledRejection', onException)

    await config.init()

    const store = await import('./store')
    const web = await import('./web')

    /*
     * Start the server even if connection with outside resources is not
     * confirmed. Its speeds up the server startup needed in development. By
     * the time you switch to API client to test changes, all resources will
     * be connected to, hopefully.
     */
    const server = http.createServer();
    server.listen(config.port, () => {
        console.log()
        console.log((`  App is running at http://localhost:${config.port}`));
        console.log(`  Press CTRL-C to stop\n`);
    })

    await store.default.init()

    await web.default.init()

    server.addListener('request', web.default.getRequestListener())
})();
