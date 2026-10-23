// Crop the owner's original identity sheet; never redraw or generate a logo.
// Usage: node scripts/prepare-brand-assets.mjs "path/to/original.png"
import sharp from 'sharp';
import fs from 'node:fs/promises';
const source=process.argv[2];
if(!source)throw Error('Provide the original 1254px identity sheet.');
const metadata=await sharp(source).metadata();
if(metadata.width!==1254 || metadata.height!==1254)throw Error('Unexpected sheet dimensions; review crop coordinates first.');
await fs.mkdir('public/brand',{recursive:true});
const crops={horizontal:{left:644,top:229,width:591,height:202},complete:{left:60,top:70,width:525,height:545},monogram:{left:125,top:760,width:403,height:380}};
for(const [name,extract] of Object.entries(crops))await sharp(source).extract(extract).webp({quality:92}).toFile(`public/brand/anabelle-${name}.webp`);
// ICO embeds a standard PNG frame, preserving the original raster identity.
const png=await sharp(source).extract(crops.monogram).resize(64,64,{fit:'contain',background:'#f5edf5'}).ensureAlpha().png().toBuffer();
const header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header[6]=64;header[7]=64;header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(png.length,14);header.writeUInt32LE(22,18);
await fs.writeFile('src/app/favicon.ico',Buffer.concat([header,png]));
await fs.writeFile('src/app/icon.png',await sharp(source).extract(crops.monogram).resize(192,192,{fit:'contain',background:'#f5edf5'}).png().toBuffer());
console.log('Original horizontal, complete, monogram and icons prepared. Original backgrounds retained.');
