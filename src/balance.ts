// Показывает баланс PETC у казны и у игроков из .env.
import { PublicKey } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddressSync, getMint } from "@solana/spl-token";
import { TOKEN_SYMBOL, connection, explorerAddress, fromRaw, loadPayer, optionalPublicKey } from "./config";

async function balanceOf(mint: PublicKey, owner: PublicKey): Promise<number> {
  try {
    const account = await getAccount(connection, getAssociatedTokenAddressSync(mint, owner));
    return fromRaw(account.amount);
  } catch {
    return 0; // счёта ещё нет — значит, монет нет
  }
}

async function main() {
  const mint = optionalPublicKey("MINT_ADDRESS");
  if (!mint) throw new Error("Укажите MINT_ADDRESS в .env (его печатает npm run mint).");

  const info = await getMint(connection, mint);
  console.log(`🪙 ${TOKEN_SYMBOL}:`, mint.toBase58());
  console.log("🌐 В обороте:", fromRaw(info.supply), TOKEN_SYMBOL);
  console.log("🔗", explorerAddress(mint.toBase58()));

  const owners: [string, PublicKey][] = [["Казна", loadPayer().publicKey]];
  for (const name of ["RECIPIENT_1", "RECIPIENT_2", "RECIPIENT_3"]) {
    const key = optionalPublicKey(name);
    if (key) owners.push([name, key]);
  }
  console.log();
  for (const [label, owner] of owners) {
    console.log(`${label.padEnd(12)} ${owner.toBase58()}  ${await balanceOf(mint, owner)} ${TOKEN_SYMBOL}`);
  }
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
