// Export only synthetic public data, without a database connection, to a separate staging directory.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const root = process.cwd();
if (execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim() !== "codex/inventory-refunds-dashboard-2") throw Error("Wrong branch.");
const lab = path.join(process.env.LOCALAPPDATA, "NOVA-Floreria/inventory-refunds-final-replay");
if (fs.existsSync(path.join(lab, "supabase/.temp/project-ref")) || !/project_id\s*=\s*"NOVA-LOCAL-INTEGRITY"/.test(fs.readFileSync(path.join(lab, "supabase/config.toml"), "utf8"))) throw Error("Unlinked local lab required.");
const target = fs.mkdtempSync(path.join(os.tmpdir(), "Anabelle-visual-preview-"));
const origin = "http://127.0.0.1:3116";
const localHosts = new Set(["localhost", "127.0.0.1", ...Object.values(os.networkInterfaces()).flat().filter(Boolean).map(address => address.address)]);
async function json(route) {
  const response = await fetch(origin + route, { redirect: "error", signal: AbortSignal.timeout(30000) });
  const data = await response.json(); if (!response.ok || !data.success) throw Error("LOCAL public export failed."); return data;
}
const sources = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const configFiles = ["package.json", "package-lock.json", "next.config.ts", "tsconfig.json", "postcss.config.mjs", "vercel.json"];
for (const file of sources.filter(file => file.startsWith("src/") || file.startsWith("public/") || configFiles.includes(file))) {
  // The visual package contains no login/admin pages or commercial API handlers,
  // even if someone attempts to bypass Proxy. Normal repository routes stay intact.
  if (file.startsWith("src/app/") && file.slice("src/app/".length).includes("/") && !["src/app/checkout/", "src/app/seguimiento/", "src/app/api/visual-preview/"].some(prefix => file.startsWith(prefix))) continue;
  if (file.startsWith("public/visual-preview/") || file.split("/").some(part => part.startsWith(".env")) || fs.lstatSync(path.join(root, file)).isSymbolicLink()) throw Error("Unexpected staging source.");
  const destination = path.join(target, file); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.copyFileSync(path.join(root, file), destination);
}
const assets = path.join(target, "public/visual-preview"); fs.mkdirSync(assets, { recursive: true });
const images = new Map();
async function image(source) {
  if (images.has(source.public_url)) return { ...source, public_url: images.get(source.public_url) };
  const url = new URL(source.public_url);
  if (url.protocol !== "http:" || url.port !== "62621" || !localHosts.has(url.hostname) || !url.pathname.startsWith("/storage/v1/object/public/product-images/") || url.search || url.hash || url.username || url.password) throw Error("Non-local product image refused.");
  url.hostname = "127.0.0.1";
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error("LOCAL image export failed.");
  const extensions = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg" };
  const extension = extensions[response.headers.get("content-type")?.split(";")[0]]; if (!extension) throw Error("Unsupported image type.");
  const bytes = Buffer.from(await response.arrayBuffer());
  const filename = `${crypto.createHash("sha256").update(bytes).digest("hex")}.${extension}`;
  fs.writeFileSync(path.join(assets, filename), bytes); const publicUrl = `/visual-preview/${filename}`; images.set(source.public_url, publicUrl);
  return { id: source.id, public_url: publicUrl, alt_text: source.alt_text, sort_order: source.sort_order };
}
const listed = [];
for (let page = 1; ; page++) {
  const data = await json(`/api/products?limit=60&page=${page}`); listed.push(...data.products);
  if (page >= data.pagination.total_pages) break;
}
if (listed.length !== 100 || listed.some(product => !/^(LAB50|LAB100|TEST)\b/.test(product.name))) throw Error("Expected exactly 100 existing synthetic products.");
const products = [];
for (const entry of listed) {
  const { product } = await json(`/api/products/${entry.id}`);
  // Explicit public field allowlist: never copy orders, customers, tokens or staff data.
  products.push({ id: product.id, name: product.name, price: product.price, category_id: product.category_id, occasion: product.occasion, season_id: product.season_id, is_featured: product.is_featured, is_available: product.is_available, is_sold_out: product.is_sold_out, catalog_order: product.catalog_order, images: await Promise.all((product.images ?? []).map(image)), description: product.description, components: product.components ?? [], customization_options: (product.customization_options ?? []).map(option => ({ id: option.id, option_type: option.option_type, name: option.name, value: option.value, extra_price: option.extra_price })) });
}
const sourcePromotions = (await json("/api/promotions")).promotions;
if (sourcePromotions.some(offer => !/^(LAB50|LAB100|TEST)\b/.test(offer.name))) throw Error("Non-synthetic promotion refused.");
const promotions = sourcePromotions.map(offer => ({ id: offer.id, name: offer.name, description: offer.description, promotion_type: offer.promotion_type, discount_type: offer.discount_type, discount_value: offer.discount_value, combo_price: offer.combo_price, starts_at: offer.starts_at, ends_at: offer.ends_at, minimum_purchase: offer.minimum_purchase, products: (offer.products ?? []).map(line => ({ product_id: line.product_id, quantity: line.quantity, unit_price: line.unit_price, product: products.find(product => product.id === line.product_id) ?? null })) }));
const categories = (await json("/api/categories")).categories.map(({ id, name, description }) => ({ id, name, description }));
const hours = await json("/api/business-hours");
const snapshot = { version: 1, synthetic: true, products, categories, promotions, hours: { status: hours.status, week: hours.week } };
const encoded = JSON.stringify(snapshot);
if (/https?:\/\/|receipt_token|customer_phone|guest_phone|sb_secret_|eyJ[A-Za-z0-9_-]+\./.test(encoded)) throw Error("Unexpected external URL or sensitive data in synthetic export.");
fs.mkdirSync(path.join(target, ".visual-preview")); fs.writeFileSync(path.join(target, ".visual-preview/snapshot.json"), encoded);
fs.writeFileSync(path.join(target, ".vercelignore"), ".env*\n.git\nnode_modules\n.next*\n*.private.json\n");
fs.writeFileSync(path.join(target, ".gitignore"), "node_modules/\n.next*/\n.env*\n.vercel/\n");
const visualVercelConfig = JSON.parse(fs.readFileSync(path.join(target, "vercel.json"), "utf8"));
visualVercelConfig.buildCommand = "npm run build -- --webpack";
fs.writeFileSync(path.join(target, "vercel.json"), JSON.stringify(visualVercelConfig, null, 2));
fs.writeFileSync(path.join(target, "PREVIEW_ONLY.txt"), "Synthetic visual snapshot. No database. No orders/payments/Auth/WhatsApp. Requires both visual preview flags. Never deploy to Production.\n");
const result = { staging: target, products: products.length, promotions: promotions.length, images: images.size, snapshotSha256: crypto.createHash("sha256").update(encoded).digest("hex") };
fs.writeFileSync(path.join(lab, "visual-preview-staging.private.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
