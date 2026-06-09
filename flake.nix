{
  description = "Kalepi development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            uv
            python3
            nodejs_22
            pnpm
            gnumake
          ];
          env = {
            UV_PYTHON_DOWNLOADS = "never";
            UV_PYTHON = "${pkgs.python3}/bin/python3";
          };
          shellHook = ''
            uv sync
            pnpm install
          '';
        };
      });
}
