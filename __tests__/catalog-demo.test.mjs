import{describe,it,expect}from'vitest';
import{products,categories,materials,included,promotions,productByKey,demoId,seasons,occasions}from'../scripts/catalog-demo-data.mjs';
import{photoSources}from'../scripts/catalog-demo-photos.mjs';
describe('Isolated synthetic commercial demo definitions',()=>{
 it('contains exactly 100 natural unique product names and stable identifiers',()=>{
  expect(products).toHaveLength(100);expect(new Set(products.map(p=>p.id)).size).toBe(100);expect(new Set(products.map(p=>p.name)).size).toBe(100);
  for(const p of products){expect(p.name).not.toMatch(/TEST|LAB100|LAB50|PRUEBA|Producto \d/i);expect(p.id).toBe(demoId(`product:${p.key}`));}
 });
 it('preserves the requested nine-category distribution',()=>{
  expect(categories.map(c=>c.count)).toEqual([25,20,12,10,8,7,5,5,8]);for(const c of categories)expect(products.filter(p=>p.categoryId===c.id)).toHaveLength(c.count);
 });
 it('uses varied positive Bs prices and explicit synthetic descriptions',()=>{
  expect(new Set(products.map(p=>p.price)).size).toBeGreaterThan(30);
  for(const p of products){expect(p.price).toBeGreaterThan(0);expect(p.price).toBeLessThan(1000);expect(p.description).toMatch(/demostración/);expect(p.description.length).toBeLessThanOrEqual(2000);}
 });
 it('reuses the four inventory types with valid recipes and a dedicated card supply',()=>{
  expect([...new Set(materials.map(m=>m.type))].sort()).toEqual(['componente','flor','insumo','producto']);
  const keys=new Set(materials.map(m=>m.key));for(const p of products){expect(p.recipe.length).toBeGreaterThan(0);for(const r of p.recipe){expect(keys.has(r.key)).toBe(true);expect(r.quantity).toBeGreaterThan(0);}}
  expect(materials.find(m=>m.key==='tarjeta').type).toBe('insumo');expect(products.filter(p=>p.categoryKey==='ramos').every(p=>p.recipe.some(r=>r.key==='tarjeta'))).toBe(true);
 });
 it('keeps draft, zero-stock and low-stock scenarios without manipulating derived balances',()=>{
  expect(products.filter(p=>!p.active)).toHaveLength(1);expect(materials.filter(m=>m.stock===0)).toHaveLength(1);expect(materials.some(m=>m.stock===2)).toBe(true);
  expect(seasons).toHaveLength(6);expect(occasions).toHaveLength(8);
 });
 it('uses existing commercial product references for included gifts and affordable combos',()=>{
  for(const relation of included){expect(productByKey(relation.parent)).toBeDefined();expect(productByKey(relation.child)).toBeDefined();expect(relation.parent).not.toBe(relation.child);}
  expect(promotions.filter(p=>p.type==='combo')).toHaveLength(5);
  for(const p of promotions){const total=p.keys.reduce((sum,k)=>sum+productByKey(k).price,0);if(p.type==='combo'){expect(p.comboPrice).toBeGreaterThan(0);expect(p.comboPrice).toBeLessThan(total);}else{expect(p.value).toBeGreaterThan(0);if(p.discountType==='porcentaje')expect(p.value).toBeLessThanOrEqual(100);else expect(p.value).toBeLessThan(Math.min(...p.keys.map(k=>productByKey(k).price)));}}
 });
 it('records original license/source URLs and never treats missing photography as a fabricated asset',()=>{
  const ids=new Set(photoSources.map(s=>s.id));for(const p of products.filter(p=>p.photoId))expect(ids.has(p.photoId)).toBe(true);
  for(const s of photoSources){expect(s.page).toMatch(/^https:\/\/www\.pexels\.com\/photo\//);expect(s.licenseUrl).toBe('https://www.pexels.com/license/');expect(s.notes).toContain('No representa trabajo realizado por Anabelle');}
 });
});
