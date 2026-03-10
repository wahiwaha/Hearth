const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Fix Firebase iOS build with use_frameworks! :linkage => :static
 *
 * 1. $RNFirebaseAsStaticFramework = true
 * 2. Disable clang modules for RNFB targets so #import <React/...> resolves
 *    via header search paths instead of the module system
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

      // 1. Add $RNFirebaseAsStaticFramework
      if (!content.includes("$RNFirebaseAsStaticFramework")) {
        content = content.replace(
          /^(target\s)/m,
          "$RNFirebaseAsStaticFramework = true\n\n$1"
        );
      }

      // 2. After react_native_post_install, fix RNFB build settings
      if (!content.includes("# RNFB: disable clang modules")) {
        const fix = [
          "",
          "",
          "    # RNFB: disable clang modules so React headers resolve via search paths",
          "    installer.pods_project.targets.each do |target|",
          "      if target.name.start_with?('RNFB')",
          "        target.build_configurations.each do |bc|",
          "          bc.build_settings['CLANG_ENABLE_MODULES'] = 'NO'",
          "        end",
          "      end",
          "    end",
        ].join("\n");

        content = content.replace(
          /^(\s*end\s*\nend\s*)$/m,
          fix + "\n$1"
        );
      }

      fs.writeFileSync(podfilePath, content);
      return config;
    },
  ]);
};
