# PETC — PetCoin, монета проекта PetNFT

Своя монета на Solana (SPL Token, **devnet**), сделанная по практике
[0xnurda/solana-practice](https://github.com/0xnurda/solana-practice) и привязанная к нашему проекту
[PetNFT](https://petnft-production.up.railway.app) — тамагочи на Solana, где питомцы вылупляются из яиц.

**PETC** — внутриигровая валюта PetNFT. В игре её зарабатывают в мини-играх с питомцем
(Solana Snake, Sol Catcher, Block Runner) и тратят в магазине на еду, тренировки и предметы.
Этот репозиторий выпускает её как настоящий токен в блокчейне и показывает весь цикл жизни монеты:

| Шаг | Что происходит в блокчейне | Что это значит в PetNFT |
|---|---|---|
| 1. `createMint` | создаётся монета PETC, 6 знаков после запятой | выпуск валюты проекта |
| 2. `mintTo` | печатается 10 000 PETC на счёт казны | казна игры |
| 3. `transfer` + Memo | по 100 PETC трём одногруппникам, с подписью в транзакции | награда за мини-игру |
| 4. `burn` | 50 PETC сжигаются навсегда | покупка еды питомцу — монеты уходят из оборота |
| 5. `getAccount` / `getMint` | итоговый баланс казны и общий оборот | отчёт |
| 6. `createMetadataAccountV3` | имя, символ и логотип записываются в Metaplex Token Metadata | кошельки показывают «PetCoin (PETC)» с логотипом |

## Результат (devnet)

<img src="assets/petc.png" width="120" alt="PETC">

### Доказательство: транзакция перевода PETC

Перевод **100 PETC** с казны на кошелёк `C12GQVyms9ZV1E8zex3UeLV4M857H81ZjmMhqx6v1LTL`:

[`zsf25jnVG4rtK9PMG5tZDLvRAkV2khRrr9tkDQ9EwMQ2VPs1XVBokAhbb3arg61Afnff2ytdaNrzUkr4kJcJhaw`](https://explorer.solana.com/tx/zsf25jnVG4rtK9PMG5tZDLvRAkV2khRrr9tkDQ9EwMQ2VPs1XVBokAhbb3arg61Afnff2ytdaNrzUkr4kJcJhaw?cluster=devnet)

В Explorer во вкладке «Token Balances» видно, что баланс получателя PETC изменился с 0 до 100,
а в инструкции Memo — подпись «PetNFT: награда за мини-игру».

### Все данные

* Монета PETC: [`J2en1PhJiqbR8suv7KLmPEeU1Ebx1ujneEKPeJmXzjcA`](https://explorer.solana.com/address/J2en1PhJiqbR8suv7KLmPEeU1Ebx1ujneEKPeJmXzjcA?cluster=devnet)
* Напечатано 10 000 PETC, сожжено 50 → в обороте **9 950 PETC**
* Награды по 100 PETC: [игрок 1](https://explorer.solana.com/tx/2XgaBPA376W3KT9TBvdMYUGtKRNzXF89PJb76cRRyNm9J9uCA7EvRfStqHkN8R19wqxGibqqqFh7Lmkc3En65Uz1?cluster=devnet) ·
  [игрок 2](https://explorer.solana.com/tx/zsf25jnVG4rtK9PMG5tZDLvRAkV2khRrr9tkDQ9EwMQ2VPs1XVBokAhbb3arg61Afnff2ytdaNrzUkr4kJcJhaw?cluster=devnet) ·
  [игрок 3](https://explorer.solana.com/tx/4dX3ZvEWeDtxVUn7eCgJA2gsEzzuU7bQ9NQQSXFpPEriUmCzku3Ng7GWeAjT15mZX6rceEhagCagWx28cwB6CPCk?cluster=devnet)
* [Сжигание 50 PETC](https://explorer.solana.com/tx/Rh4LVqC2qhEbhyMhe3BBNtbSu41t8P7kQ2NoCh6WkNKnZkDJb7mNtv6tfV9hKRTVAYvD78JLS57dW4xu9Lbusyn?cluster=devnet)
* Все адреса — в [`mint-info.json`](mint-info.json)

## Запуск

```bash
npm install
npm run dev               # часть 1: перевод 0.01 SOL с Memo
npm run mint              # часть 2: монета PETC
npm run balance           # балансы PETC (нужен MINT_ADDRESS в .env)
npm run metadata          # имя, символ и логотип монеты для кошельков
```

### Создайте файл `.env` в корне проекта

```env
SECRET_KEY=''      # приватный ключ вашего devnet-кошелька Phantom (base58)
RECIPIENT_1=''     # публичный адрес 1-го одногруппника
RECIPIENT_2=''     # публичный адрес 2-го одногруппника
RECIPIENT_3=''     # публичный адрес 3-го одногруппника
MINT_ADDRESS=''    # необязательно: адрес уже созданного PETC
```

* Приватный ключ: Phantom → Настройки → ваш аккаунт → «Показать приватный ключ».
  Переключите Phantom на **Devnet** (Настройки → Сеть разработчика).
* На кошельке нужно ~0.05 SOL devnet: https://faucet.solana.com
* После первого `npm run mint` скрипт напечатает адрес монеты — впишите его в `MINT_ADDRESS`,
  чтобы повторные запуски не создавали новую монету, а работали с той же.

> `.env` есть в `.gitignore` и **никогда** не попадает на GitHub. Не публикуйте `SECRET_KEY`
> и не отправляйте его никому. Скрипты ключ не печатают — только публичный адрес.
> Используйте отдельный кошелёк для devnet, а не тот, где лежат настоящие деньги.

## Что где лежит

```
SolanaCoin/
├── src/
│   ├── config.ts           общие настройки: имя/символ/decimals монеты, подключение к devnet,
│   │                       загрузка кошелька из .env, перевод PETC ↔ минимальные единицы
│   ├── solana-practice.ts  часть 1: перевод 0.01 SOL + Memo «Hello Solana from PetNFT»
│   ├── token-mint.ts       часть 2: создание PETC, печать, награды, сжигание, итоги
│   ├── balance.ts          проверка балансов PETC у казны и одногруппников
│   └── metadata.ts         метаданные монеты (имя, символ, логотип) через Metaplex
├── assets/
│   ├── petc.png            логотип монеты
│   ├── petc.svg            исходник логотипа
│   └── petc.json           описание монеты, на которое ссылаются метаданные
├── .gitignore              не пускает в Git .env, node_modules, dist, package-lock.json
├── package.json            зависимости и команды npm run dev / mint / balance
├── tsconfig.json           настройки TypeScript
└── mint-info.json          появляется после npm run mint — публичные адреса для отчёта
```

## Связь с PetNFT

В основном проекте ([Mezmer1337/StartUpSolana](https://github.com/Mezmer1337/StartUpSolana))
PetCoins начисляются за мини-игры и тратятся в магазине. Этот репозиторий — отдельное учебное
задание: он выпускает ту же валюту как классический SPL-токен и показывает, как награды
(transfer) и траты (burn) выглядят прямо в блокчейне.
