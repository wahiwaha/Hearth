const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Two problems need to be solved simultaneously:
 *
 * Problem 1: Firebase Swift pods need use_modular_headers! to import their ObjC
 *   dependencies (GoogleUtilities, nanopb, etc.) when building as static libraries.
 *   Without it: "Swift pod X depends upon Y, which does not define modules"
 *
 * Problem 2: use_modular_headers! causes CocoaPods to add
 *   -fmodule-map-file=.../gRPC-Core.modulemap to gRPC-C++ xcconfig,
 *   but that file is never created. Without a fix: "module map file not found"
 *
 * Solution:
 * 1. Add $RNFirebaseAsStaticFramework + use_modular_headers! (fixes Problem 1)
 * 2. Inject gRPC fix INTO the existing post_install block — not a new one,
 *    because CocoaPods only supports one post_install block.
 *    The fix creates the missing gRPC-Core.modulemap file. (fixes Problem 2)
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

      // 1. Add $RNFirebaseAsStaticFramework = true and use_modular_headers!
      //    before the first target block.
      const preamble = [
        "$RNFirebaseAsStaticFramework = true",
        "use_modular_headers!",
        "",
      ].join("\n");

      if (!content.includes("$RNFirebaseAsStaticFramework")) {
        content = content.replace(/^(target\s)/m, preamble + "\n$1");
      }

      // 2. Inject the gRPC-Core.modulemap fix INTO the existing post_install block.
      //    CocoaPods only allows one post_install block, so we inject into the
      //    existing one that Expo generates (which calls react_native_post_install).
      //    The fix creates the missing private module map that gRPC-C++ references.
      const grpcFixCode = `
  # Fix: create the missing gRPC-Core private module map that gRPC-C++ references.
  # use_modular_headers! causes CocoaPods to add -fmodule-map-file flags pointing
  # to this file, but it's never generated. An empty module declaration satisfies
  # the compiler without affecting functionality (gRPC-C++ uses #include, not @import).
  require 'fileutils'
  grpc_private_dir = "#{installer.sandbox.root}/Headers/Private/grpc"
  modulemap_path = "#{grpc_private_dir}/gRPC-Core.modulemap"
  unless File.exist?(modulemap_path)
    FileUtils.mkdir_p(grpc_private_dir)
    File.write(modulemap_path, "module gRPC_Core { }\\n")
  end

  # Fix: Suppress non-modular-include-in-framework-module errors.
  # use_modular_headers! causes CocoaPods to add -Werror=non-modular-include-in-framework-module
  # to pod xcconfigs. The Xcode build setting CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES
  # is not enough because xcconfig flags override it. We must add -Wno-non-modular-include-in-
  # framework-module to OTHER_CFLAGS at the target level so it appears LAST in the compiler
  # invocation (Clang uses last-flag-wins).
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      cflags = config.build_settings.fetch('OTHER_CFLAGS', '$(inherited)')
      unless cflags.include?('-Wno-non-modular-include-in-framework-module')
        config.build_settings['OTHER_CFLAGS'] = "#{cflags} -Wno-non-modular-include-in-framework-module"
      end
    end
  end
`;

      if (!content.includes("gRPC-Core.modulemap")) {
        // Find the existing post_install block and inject at the top of it
        content = content.replace(
          /^(\s*post_install do \|installer\|)/m,
          `$1${grpcFixCode}`
        );
      }

      fs.writeFileSync(podfilePath, content);
      return config;
    },
  ]);
};
