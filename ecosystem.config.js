// pm2 start npm --name "drn-api" -- run serve

module.exports = {
    apps: [
        {
            name   : "drn-api",
            script : "npm",
            args   : "run serve"
        }
    ]
}
