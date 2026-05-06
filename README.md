# Remotion MapLibre example

https://github.com/user-attachments/assets/e394fbf1-66d7-4e28-8f6e-ffa9428956e4

This example shows how to render deterministic MapLibre GL JS map animations with Remotion.

It is based on the [Remotion Mapbox example](https://github.com/remotion-dev/mapbox-example), adapted to use MapLibre without a Mapbox access token.

It demonstrates:

- Rendering a MapLibre map in a Remotion composition
- Animating a camera along a route
- Revealing a GeoJSON route line over time
- Moving a point along the route using Turf
- Rendering WebGL output with the `angle` OpenGL renderer

Unlike the Mapbox example, this example does not require a Mapbox access token.
It uses the public OpenFreeMap MapLibre style.

## Special considerations for using Remotion with MapLibre

- Map rendering uses WebGL, so the `angle` renderer is enabled in `remotion.config.ts`.
- Render with `--concurrency=1` for predictable GPU-backed map rendering.
- MapLibre animations and transitions are disabled with `interactive: false` and `fadeDuration: 0`.
- Initial map loading and per-frame updates are wrapped with `delayRender()` / `continueRender()`.
- GeoJSON sources and MapLibre layers are used for the route and moving point.
- Turf is used for route distances, slicing, and positions along the route.

## Commands

**Install dependencies**

```console
npm i
```

**Start preview**

```console
npm start
```

**Render video**

```console
npm run build
```

**Upgrade Remotion**

```console
npm run upgrade
```

## Docs

- [Remotion fundamentals](https://www.remotion.dev/docs/the-fundamentals)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Turf.js](https://turfjs.org/)

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
