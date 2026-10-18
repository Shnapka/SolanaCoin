// Часть 1 практики: обычный перевод SOL с заметкой (Memo) в devnet.
import {
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { MEMO_PROGRAM_ID, connection, explorerTx, loadPayer, optionalPublicKey } from "./config";

async function main() {
  const payer = loadPayer();
  console.log("👛 Отправитель:", payer.publicKey.toBase58());

  const balance = await connection.getBalance(payer.publicKey);
  console.log("💰 Баланс:", balance / LAMPORTS_PER_SOL, "SOL");
  if (balance < 0.02 * LAMPORTS_PER_SOL) {
    throw new Error("Мало SOL. Пополните devnet-кошелёк: https://faucet.solana.com");
  }

  // Получатель: первый одногруппник из .env, а если его нет — новый случайный адрес.
  const recipient = optionalPublicKey("RECIPIENT_1") ?? Keypair.generate().publicKey;
  console.log("🎯 Получатель:", recipient.toBase58());

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: recipient,
      lamports: 0.01 * LAMPORTS_PER_SOL,
    }),
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
      data: Buffer.from("Hello Solana from PetNFT 🐾", "utf8"),
    })
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [payer]);
  const status = await connection.getSignatureStatus(signature);

  console.log("\n✅ Отправлено 0.01 SOL");
  console.log("✍️  Подпись:", signature);
  console.log("📦 Слот:", status.value?.slot);
  console.log("🔗", explorerTx(signature));
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
