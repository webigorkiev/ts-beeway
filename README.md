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

const {id}  = await provider.send({
    to: "<phone>",
    message: "sms text"
});
```

### Fetch status sms

```typescript
const {status} = await provider.status({
    id:"sms id"
});

```

### Send viber

```typescript
const {id}  = await provider.viber({
    to: "<phone>",
    message: "sms text"
});
```

### Fetch status viber

```typescript
const {status} = await provider.statusViber({
    id:"viber id"
});

```

### Bulk sms send

mailing lists are open from 10:00 to 20:00

```typescript
const {result}  = await provider.bulk({
    label: "label for batch",
    messages: [
        {
            to: "<phone>",
            message: "sms text"
        }
    ]
});
```

### Fetch balance


```typescript
const {balance}  = await provider.balance();
```