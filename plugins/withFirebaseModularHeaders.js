const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Firebase Swift pods require modular headers for their dependencies.
 * Instead of using useFrameworks: "static" (which breaks ExpoModulesCore),
 * this plugin:
 * 1. Injects $RNFirebaseAsStaticFramework and use_modular_headers! into the Podfile.
 * 2. Creates the missing gRPC-Core private module map that gRPC-C++ references.
 *    With use_modular_headers!, CocoaPods adds -fmodule-map-file flags pointing to
 *    Pods/Headers/Private/grpc/gRPC-Core.modulemap, but that file is never generated.
 *    We create it with a minimal declaration so the compiler can find it.
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

      // 1. Add RNFirebaseAsStaticFramework and use_modular_headers before the first target
      const preamble = [
        "$RNFirebaseAsStaticFramework = true",
        "use_modular_headers!",
        "",
      ].join("\n");

      if (!content.includes("$RNFirebaseAsStaticFramework")) {
        content = content.replace(/^(target\s)/m, preamble + "\n$1");
      }

      // 2. Inject post_install hook to create the missing gRPC-Core private module map.
      //    The file Pods/Headers/Private/grpc/gRPC-Core.modulemap is referenced by
      //    gRPC-C++ build flags but never created by CocoaPods. Creating it with an
      //    empty module declaration satisfies the compiler without affecting functionality.
      const grpcFix = `
# Fix: create missing gRPC-Core private module map referenced by gRPC-C++ build flags.
post_install do |installer|
  require 'fileutils'
  grpc_private_dir = "#{installer.sandbox.root}/Headers/Private/grpc"
  modulemap_path = "#{grpc_private_dir}/gRPC-Core.modulemap"
  unless File.exist?(modulemap_path)
    FileUtils.mkdir_p(grpc_private_dir)
    File.write(modulemap_path, "module gRPC_Core { }\\n")
  end
end
`;

      if (!content.includes("gRPC-Core.modulemap")) {
        content += grpcFix;
      }

      fs.writeFileSync(podfilePath, content);
      return config;
    },
  ]);
};
