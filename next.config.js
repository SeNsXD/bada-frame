// Use the SentryWebpack plugin to upload the source maps during build step
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});
const withWorkbox = require('@ente-io/next-with-workbox');

const {
    NEXT_PUBLIC_SENTRY_DSN: SENTRY_DSN,
    SENTRY_ORG,
    SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN,
    NODE_ENV,
    GITHUB_COMMIT_SHA: COMMIT_SHA,
} = process.env;

process.env.SENTRY_DSN = SENTRY_DSN;
const basePath = '';

module.exports = withWorkbox(withBundleAnalyzer({
    productionBrowserSourceMaps: true,
    future: {
        webpack5: true,
    },
    env: {
        // Make the COMMIT_SHA available to the client so that Sentry events can be
        // marked for the release they belong to. It may be undefined if running
        // outside of Vercel
        NEXT_PUBLIC_COMMIT_SHA: COMMIT_SHA,
    },
    workbox: {
        swSrc: 'src/serviceWorker.js',
        exclude: [/manifest\.json$/i],
    },
    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.resolve.alias['@sentry/node'] = '@sentry/browser';
        }
        // Define an environment variable so source code can check whether or not
        // it's running on the server so we can correctly initialize Sentry
        config.plugins.push(
            new webpack.DefinePlugin({
                'process.env.NEXT_IS_SERVER': JSON.stringify(
                    isServer.toString(),
                ),
            }),
        );
        if (
            SENTRY_DSN &&
            SENTRY_ORG &&
            SENTRY_PROJECT &&
            SENTRY_AUTH_TOKEN &&
            NODE_ENV === 'production'
        ) {
            config.plugins.push(
                new SentryWebpackPlugin({
                    include: ['.next/static/chunks'],
                    ignore: ['node_modules'],
                    stripPrefix: ['webpack://_N_E/'],
                    urlPrefix: `~${basePath}/_next`,
                }),
            );
        }
        return config;
    },
}));
