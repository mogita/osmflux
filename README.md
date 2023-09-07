# OsmFlux

OsmFlux provides a graphical interface for a curated range of OSM tools to help working on the map data, format conversion, calculations and more.

> Currently at pre-alpha stage, things might not be thoroughly tested. In case you spot any broken part please [file an issue](https://gitlab.com/mogita/osmflux/-/issues/new), thank you.

# Downloads

- Latest release
  - Linux (unzip and run the `osmflux` binary)
    - [Linux x64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-linux-x64.zip)
    - [Linux arm64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-linux-arm64.zip)
  - macOS (currently not signed, you might need to allow it from Gatekeeper, [here's how](macOS-how-to.md))
    - [macOS x64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-darwin-x64.app.zip)
    - [macOS arm64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-darwin-arm64.app.zip)
  - Windows
    - [Windows x64](https://static.mogita.com/osmflux/releases/stable/latest/osmflux-windows-x64.zip)
- [All releases](https://gitlab.com/mogita/osmflux/-/releases)

# Screenshot

![OsmFlux Screenshot](preview.png 'OsmFlux Screenshot')

# Roadmap

- ☑️ JOSM Validation Conversion
- 🚧 PBF Conversion
- 🚧 PBF Manipulation

# Supported Platforms

- Linux
- macOS
- Windows

# Development

After cloning the project to your local environment, start dev server with the following command:

```bash
# install or update dependencies first
yarn

# start dev server
yarn dev

# build binaries of OsmFlux
yarn build

# build binaries AND make packages for final distribution
yarn release
```

## Folder Structure

```bash
├── bin             # Neutralino.js binaries, only appears after dependency installation
├── commands        # binaries that will be included in OsmFlux to provide certain features
│   ├── glancet
│   ├── osmfilter
│   └── osmconvert
├── dist            # The output directory of building and packaging
│   ├── archives
│   ├── osmflux
│   └── packages
└── gui             # The source code of OsmFlux's UI and functionalities
    ├── build
    ├── public
    └── src
```

# Credit

This project contains pre-compiled binaries from the following projects:

- [glancet](https://gitlab.com/mogita/glancet)
- [osmctools](https://gitlab.com/osm-c-tools/osmctools)

You can read detailed credits in [CREDITS.md](CREDITS.md).

# License

This project is licensed under the terms of the [AGPLv3 license](LICENSE).
