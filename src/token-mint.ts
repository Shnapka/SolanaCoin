// Часть 2 практики: своя монета PETC (PetCoin) для проекта PetNFT.
// Создаём SPL-токен → печатаем 10 000 PETC → раздаём по 100 PETC трём
// одногруппникам как «награду за игру» → сжигаем 50 PETC как «покупку еды
// питомцу» → показываем итоговый баланс и ссылки на Explorer.
import { LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  burn,
  createMint,
  createTransferInstruction,
  getAccount,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { writeFileSync } from "node:fs";
import {
  DECIMALS,
  MEMO_PROGRAM_ID,
  TOKEN_NAME,
  TOKEN_SYMBOL,
  connection,
  explorerAddress,
  explorerTx,
  fromRaw,
  loadPayer,
  optionalPublicKey,
  toRaw,
} from "./config";

const INITIAL_SUPPLY = 10_000; // печатаем в казну проекта
const REWARD = 100; // награда каждому игроку
const BURN = 50; // «потрачено в магазине» — сжигаем

async function main() {
  const payer = loadPayer();
  console.log("👛 Казна PetNFT (payer):", payer.publicKey.toBase58());

  const sol = await connection.getBalance(payer.publicKey);
  console.log("💰 Баланс:", sol / LAMPORTS_PER_SOL, "SOL");
  if (sol < 0.05 * LAMPORTS_PER_SOL) {
    throw new Error("Нужно хотя бы 0.05 SOL на комиссии и аренду аккаунтов: https://faucet.solana.com");
  }

  const recipients = ["RECIPIENT_1", "RECIPIENT_2", "RECIPIENT_3"]
    .map((name) => optionalPublicKey(name))
    .filter((key): key is PublicKey => key !== null);
  if (recipients.length === 0) {
    throw new Error("Укажите в .env хотя бы RECIPIENT_1 — публичный адрес одногруппника.");
  }

  // ─── 1. Создаём монету (или берём уже созданную из MINT_ADDRESS) ───
  let mint = optionalPublicKey("MINT_ADDRESS");
  if (mint) {
    const info = await getMint(connection, mint);
    if (!info.mintAuthority?.equals(payer.publicKey)) {
      throw new Error("MINT_ADDRESS принадлежит другому кошельку — печатать его может только mint authority.");
    }
    console.log(`\n🪙 Используем существующий ${TOKEN_SYMBOL}:`, mint.toBase58());
  } else {
    console.log(`\n🪙 Создаём ${TOKEN_NAME} (${TOKEN_SYMBOL})...`);
    mint = await createMint(
      connection,
      payer, // платит за создание
      payer.publicKey, // mint authority — кто может печатать новые монеты
      payer.publicKey, // freeze authority — кто может заморозить чужой счёт
      DECIMALS
    );
    console.log("✅ Адрес монеты (mint):", mint.toBase58());
    console.log("👉 Добавьте в .env строку MINT_ADDRESS=" + mint.toBase58() + ", чтобы не создавать новую при повторном запуске");
  }
  console.log("🔗", explorerAddress(mint.toBase58()));

  // ─── 2. Счёт казны (ATA) и печать 10 000 PETC ───
  console.log("\n📦 Счёт казны для PETC (Associated Token Account)...");
  const treasuryAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  console.log("✅ ATA:", treasuryAta.address.toBase58());

  console.log(`\n🏭 Печатаем ${INITIAL_SUPPLY.toLocaleString("ru")} ${TOKEN_SYMBOL}...`);
  const mintSig = await mintTo(connection, payer, mint, treasuryAta.address, payer, toRaw(INITIAL_SUPPLY));
  console.log("✅ Напечатано");
  console.log("🔗", explorerTx(mintSig));

  // ─── 3. Награды игрокам: перевод + Memo в одной транзакции ───
  console.log(`\n🎁 Выдаём по ${REWARD} ${TOKEN_SYMBOL} игрокам...`);
  for (let i = 0; i < recipients.length; i++) {
    const player = recipients[i];
    const playerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, player);

    const tx = new Transaction().add(
      createTransferInstruction(treasuryAta.address, playerAta.address, payer.publicKey, toRaw(REWARD)),
      new TransactionInstruction({
        programId: MEMO_PROGRAM_ID,
        keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
        data: Buffer.from(`PetNFT: награда за мини-игру, игрок #${i + 1} 🐾`, "utf8"),
      })
    );
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);

    console.log(`✅ Игрок ${i + 1}:`, player.toBase58());
    console.log("🔗", explorerTx(sig));
  }

  // ─── 4. Сжигаем 50 PETC: так монеты «тратятся» в магазине и уходят из оборота ───
  console.log(`\n🔥 Сжигаем ${BURN} ${TOKEN_SYMBOL} (покупка еды питомцу)...`);
  const burnSig = await burn(connection, payer, treasuryAta.address, mint, payer, toRaw(BURN));
  console.log("✅ Сожжено");
  console.log("🔗", explorerTx(burnSig));

  // ─── 5. Итоги ───
  const account = await getAccount(connection, treasuryAta.address);
  const supply = (await getMint(connection, mint)).supply;
  console.log(`\n💰 Баланс казны: ${fromRaw(account.amount)} ${TOKEN_SYMBOL}`);
  console.log(`🌐 Всего в обороте: ${fromRaw(supply)} ${TOKEN_SYMBOL}`);
  console.log("🔗 Монета в Explorer:", explorerAddress(mint.toBase58()));

  // Публичные данные (без ключей) — для отчёта по заданию.
  writeFileSync(
    "mint-info.json",
    JSON.stringify(
      {
        name: TOKEN_NAME,
        symbol: TOKEN_SYMBOL,
        decimals: DECIMALS,
        network: "devnet",
        mint: mint.toBase58(),
        mintAuthority: payer.publicKey.toBase58(),
        treasuryAta: treasuryAta.address.toBase58(),
        recipients: recipients.map((r) => r.toBase58()),
        supply: fromRaw(supply),
        explorer: explorerAddress(mint.toBase58()),
      },
      null,
      2
    ) + "\n"
  );
  console.log("📝 Сохранено в mint-info.json");
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
