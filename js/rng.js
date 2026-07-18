// Seeded PRNG (mulberry32) so event sequences are identical per GAME_VERSION.
// Run-over-run metrics stay comparable (GDD directive 6).
(function (root) {
  'use strict';

  // FNV-1a hash: turns a version string into a 32-bit seed.
  function hashSeed(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const RNG = {
    hashSeed,
    fromVersion(version) { return mulberry32(hashSeed(version)); },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = RNG;
  else root.TrailRNG = RNG;
})(typeof self !== 'undefined' ? self : this);
