# fyre.fly

A fan site for Firefly from Honkai: Star Rail. Plain HTML, CSS and JS, no build step.

## Run locally

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000.

## Deploy

Any static host works. On Cloudflare Pages, connect the repo with no build command and `/` as the output directory, then add `fyre.fly` as a custom domain.

`_headers` tells browsers to keep everything in `assets/` for a year without checking for changes. So when you change a file in `assets/`, give it a new name (for example `golden.v2.mp4`) and update the HTML that points to it. Otherwise returning visitors keep seeing the old one.

## Contributing

Ideas, suggestions and pull requests are welcome. Open an issue or a pull request on [zaydanmd/fyredotfly](https://github.com/zaydanmd/fyredotfly).

## License

The code is under the MIT License (see `LICENSE`). Footage and art belong to HoYoverse and aren't covered by it. This is a non-commercial fan site.
