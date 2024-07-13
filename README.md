# `webpush` - Web Push library for Deno and other web compatible runtime.

![license MIT badge](https://img.shields.io/github/license/negrel/webpush)
![code size badge](https://img.shields.io/github/languages/code-size/negrel/webpush)

`webpush` is a Web Push library
([RFC 8291](https://www.rfc-editor.org/rfc/rfc8291) and
[RFC 8292](https://www.rfc-editor.org/rfc/rfc8292)) based on Web APIs.

> NOTE: This library hasn't been reviewed by crypto experts and may be unsecure.
> I've done my best to follow RFC recommandation and I only used primitives
> provided by the SubtleCrypto API.

## Getting started

Before sending Web Push message to a user agent, you need to create VAPID keys
(see [RFC 8292](https://www.rfc-editor.org/rfc/rfc8292)) to identify your server
(`Application`) to the `Push Service`:

```
+-------+           +--------------+       +-------------+
|  UA   |           | Push Service |       | Application |
+-------+           +--------------+       +-------------+
    |                      |                      |
    |        Setup         |                      |
    |<====================>|                      |
    |           Provide Subscription              |
    |-------------------------------------------->|
    |                      |                      |
    :                      :                      :
    |                      |     Push Message     |
    |    Push Message      |<---------------------|
    |<---------------------|                      |
    |                      |                      |
```

Run
[`generate-vapid-keys`](https://github.com/negrel/webpush/blob/master/cmd/generate-vapid-keys.ts)
script part of this repository to generate new keys:

```sh
# You can use any Web compatible runtime.
$ deno run https://raw.githubusercontent.com/negrel/webpush/master/cmd/generate-vapid-keys.ts
```

Copy the output of the command and save it in `example/vapid.json`. Now you can
run example server.

```
$ cd example/
$ deno run -A ./main.ts
```

## Dependencies

This library tries its best at keeping the minimum number of dependencies. It
has no external dependencies except some runtime agnostic `@std/` packages
maintained by Deno team and [`http-ece`](https://github.com/negrel/http-ece),
which I maintain.

[`http-ece`](https://github.com/negrel/http-ece) also only depends on `@std/`
packages.

## Contributing

If you want to contribute to `webpush` to add a feature or improve the code
contact me at [alexandre@negrel.dev](mailto:alexandre@negrel.dev), open an
[issue](https://github.com/negrel/webpush/issues) or make a
[pull request](https://github.com/negrel/webpush/pulls).

## :stars: Show your support

Please give a :star: if this project helped you!

[![buy me a coffee](https://github.com/negrel/.github/blob/master/.github/images/bmc-button.png?raw=true)](https://www.buymeacoffee.com/negrel)

## :scroll: License

MIT © [Alexandre Negrel](https://www.negrel.dev/)
