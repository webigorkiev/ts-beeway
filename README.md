<h1 align="center"> ts-beeway </h1>
<p align="center">
  <b>ts-beeway is a library sending  sms by beeway.com.ua</b>
</p>

## Documentations

https://webigorkiev.github.io/ts-beeway/

## Installation

```bash
yarn add ts-beeway
```

## Usage

### Send sms

```typescript
import {beeway} from "ts-beeway";

const provider = beeway({
    token: "Basic auth password",
    from: "Aplpha name" // less 11 symbol latin or number
})
await provider.send({
    to: "<phone>",
    message: "sms text"
});
```