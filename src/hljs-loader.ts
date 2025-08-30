/**
 * This module handles the initialization of highlight.js from CDN
 */

// Define the type for the global hljs object
declare global {
  interface Window {
    hljs: any;
  }
}

// Version of highlight.js to use from CDN
const HLJS_VERSION = "11.9.0";

// Use the full build that includes common languages
const HLJS_FULL_CDN_URL = `https://cdn.jsdelivr.net/npm/highlight.js@${HLJS_VERSION}`;

// For fallback, also use the UMD build which includes all languages
const HLJS_UMD_CDN_URL = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${HLJS_VERSION}/highlight.min.js`;

// Variables to track initialization status
let initPromise: Promise<any> | null = null;
let hljsInstance: any = null;
let initAttempts = 0;

/**
 * Initialize highlight.js from CDN
 * @returns Promise that resolves with the hljs instance
 */
export function initHighlightJS(): Promise<any> {
  // If we already have an instance, return it
  if (hljsInstance) {
    return Promise.resolve(hljsInstance);
  }

  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // If hljs is already defined globally, store and return it
  if (typeof window !== "undefined" && window.hljs) {
    hljsInstance = window.hljs;
    return Promise.resolve(hljsInstance);
  }

  // Try loading highlight.js
  initPromise = new Promise((resolve, reject) => {
    // Try the full version first, then fallback to UMD if needed
    const tryLoadHLJS = () => {
      initAttempts++;

      // Choose which CDN URL to use based on attempt number
      const cdnUrl = initAttempts === 1 ? HLJS_FULL_CDN_URL : HLJS_UMD_CDN_URL;

      console.log(
        `Attempting to load highlight.js from ${cdnUrl} (attempt ${initAttempts})`
      );

      try {
        const script = document.createElement("script");
        script.src = cdnUrl;
        script.async = true;

        script.onload = () => {
          if (window.hljs) {
            console.log("highlight.js loaded successfully from CDN");
            hljsInstance = window.hljs;
            resolve(hljsInstance);
          } else {
            console.error(
              "highlight.js loaded but not available as window.hljs"
            );

            // If this is the first attempt, try the fallback
            if (initAttempts === 1) {
              console.log("Trying fallback CDN...");
              tryLoadHLJS();
            } else {
              reject(
                new Error(
                  "highlight.js not available after multiple loading attempts"
                )
              );
            }
          }
        };

        script.onerror = (error) => {
          console.error(`Failed to load highlight.js from ${cdnUrl}:`, error);

          // If this is the first attempt, try the fallback
          if (initAttempts === 1) {
            console.log("Trying fallback CDN...");
            tryLoadHLJS();
          } else {
            initPromise = null; // Reset so we can try again later
            reject(error);
          }
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Error setting up highlight.js script:", error);
        initPromise = null;
        reject(error);
      }
    };

    // Start the loading process
    tryLoadHLJS();
  });

  return initPromise;
}

/**
 * Get the highlight.js instance (initializing if needed)
 * @returns Promise resolving to the hljs instance
 */
export async function getHighlightJS(): Promise<any> {
  try {
    return await initHighlightJS();
  } catch (error) {
    console.error("Error getting highlight.js:", error);
    throw error;
  }
}

// Export the version for consistency across the app
export const HLJS_CDN_VERSION = HLJS_VERSION;
