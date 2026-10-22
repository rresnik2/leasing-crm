// Node module-resolution hook used by seed-demo-data.js.
//
// The app's source files (src/**) import each other without file extensions
// ("./dateUtils"), which Vite resolves but plain Node ESM does not. This hook
// retries a failed relative import with ".js" appended so the script can reuse
// src/utils/followUp.js and friends unchanged.

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (relative && error?.code === 'ERR_MODULE_NOT_FOUND' && !/\.[a-z]+$/i.test(specifier)) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw error;
  }
}
