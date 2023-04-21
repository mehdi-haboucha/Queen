importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.1/workbox-sw.js');

const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { registerRoute } = workbox.routing;
const { NetworkFirst, CacheFirst, NetworkOnly } = workbox.strategies;

/* Custom timeout network, default is 300 sec -> to long */
/* Timeout in seconds for questionnaire before fallback to cache */
const QUEEN_NETWORK_TIMEOUT_QUESTIONNAIRE = 8;
/* Timeout in seconds for online status before failure */
const QUEEN_NETWORK_TIMEOUT_ONLINE_STATUS = 5;

const getQueenOnlineFile = url => url.concat('/online.json');

const getQueenUrlRegex = url => {
  return url.replace('http', '^http').concat('/(.*)((.js)|(.png)|(.svg))');
};

const getQueenUrlRegexJson = url => {
  return url.replace('http', '^http').concat('/(.*)(.json)');
};

const getQuestionnaireUrlRegex = () => '^http.*/api/questionnaire/(.){1,}';

const getRequiredResourceUrlRegex = () =>
  '^http.*/api/questionnaire/(.){1,}/required-nomenclatures';

const getResourceUrlRegex = () => '^http.*/api/nomenclature/(.){1,}';

const queenCacheName = 'queen-cache';
console.log('"Loading Queen SW into another SW"');

registerRoute(
  new RegExp(getQueenOnlineFile(self._QUEEN_URL)),
  new NetworkOnly({
    networkTimeoutSeconds: QUEEN_NETWORK_TIMEOUT_QUESTIONNAIRE,
  })
);

registerRoute(
  new RegExp(getQueenUrlRegexJson(self._QUEEN_URL)),
  new NetworkFirst({
    cacheName: queenCacheName,
    networkTimeoutSeconds: QUEEN_NETWORK_TIMEOUT_QUESTIONNAIRE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  new RegExp(getQueenUrlRegex(self._QUEEN_URL)),
  new CacheFirst({
    cacheName: queenCacheName,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  new RegExp(getRequiredResourceUrlRegex()),
  new NetworkFirst({
    cacheName: 'queen-required-resource',
    networkTimeoutSeconds: QUEEN_NETWORK_TIMEOUT_QUESTIONNAIRE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  new RegExp(getQuestionnaireUrlRegex()),
  new NetworkFirst({
    cacheName: 'queen-questionnaire',
    networkTimeoutSeconds: QUEEN_NETWORK_TIMEOUT_QUESTIONNAIRE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  new RegExp(getResourceUrlRegex()),
  new CacheFirst({
    cacheName: 'queen-resource',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

const queenPrecacheController = async () => {
  const cache = await caches.open(queenCacheName);
  const urlsToPrecache = self.__WB_MANIFEST.reduce(
    (_, { url }) => [..._, `${self._QUEEN_URL}/${url}`],
    []
  );
  await cache.addAll(urlsToPrecache);
  cache
    .add(`${self._QUEEN_URL}/keycloak.json`)
    .catch(() => cache.add(`${self._QUEEN_URL}/oidc.json`))
    .catch(() => console.error('Failed to cache auth file'));
};

self.addEventListener('install', event => {
  console.log('QUEEN sw : installing ...');
  event.waitUntil(queenPrecacheController());
});

self.addEventListener('activate', event => {
  console.log('QUEEN sw : activating ...');
});
