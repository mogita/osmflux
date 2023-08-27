# OsmFlux

OsmFlux provides a graphical interface for a curated range of OSM tools to help working on the map data, format conversion, calculations and more.

> Currently at pre-alpha stage.

# Downloads

- Latest release
  - Linux (unzip and run the `osmflux` binary)
    - [Linux x64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-linux-x64.zip)
    - [Linux arm64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-linux-arm64.zip)
  - macOS (currently not signed, you might need to allow it from Gatekeeper, [here's how](macOS-how-to.md))
    - [macOS x64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-darwin-x64.app.zip)
    - [macOS arm64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-darwin-arm64.app.zip)
- [All releases](/-/releases)

# Screenshot

![OsmFlux Screenshot](preview.png 'OsmFlux Screenshot')

# Features

- [x] JOSM Validation Conversion
- [ ] Osmfilter
- [ ] Osmconvert
- [ ] Osmosis

# Supported Platforms

- macOS
- Linux

# Development

After cloning the project to your local environment, start dev server with the following command:

```bash
# install or update dependencies first
yarn

# start dev server
yarn dev
```

# Credit

This project contains pre-compiled binaries from the following projects:

- [glancet](https://gitlab.com/mogita/glancet)
- [osmfilter](https://gitlab.com/osm-c-tools/osmctools)

# License

This project is licensed under the terms of the [MIT license](LICENSE).
