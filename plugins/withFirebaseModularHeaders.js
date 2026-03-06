const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Firebase Swift pods require modular headers for their dependencies.
 * Instead of using useFrameworks: "static" (which breaks ExpoModulesCore),
 * this plugin injects $RNFirebaseAsStaticFramework and use_modular_headers!
 * directly into the Podfile.
 */
module.exports = function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let content = fs.readFileSync(podfilePath, "utf8");

      // Add RNFirebaseAsStaticFramework and use_modular_headers before the first target
      const injection = [
        "$RNFirebaseAsStaticFramework = true",
        "use_modular_headers!",
        "",
      ].join("\n");

      if (!content.includes("$RNFirebaseAsStaticFramework")) {
        // Insert before the first 'target' line
        content = content.replace(
          /^(target\s)/m,
          injection + "\n$1"
        );
      }

      fs.writeFileSync(podfilePath, content);
      return config;
    },
  ]);
};
