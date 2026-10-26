/** Synthetic LOCAL display catalog. Not official offers, quotations or a production seed. */
import { createHash } from 'node:crypto';
export const demoId = key => { const h = createHash('sha256').update(`anabelle-catalog-demo-v1:${key}`).digest('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`; };
export const categories = [
 ['ramos','Ramos florales',25], ['arreglos','Arreglos florales',20], ['cajas','Cajas florales',12],
 ['especiales','Girasoles y flores especiales',10], ['plantas','Plantas',8], ['peluches','Peluches',7],
 ['chocolates','Chocolates',5], ['globos','Globos',5], ['regalos','Regalos y detalles',8],
].map(([key,name,count])=>({key,name,count,id:demoId(`category:${key}`)}));
export const seasons=['Todo el año','San Valentín','Día de la Madre','Primavera','Navidad','Temporada de graduaciones'];
export const occasions=['Amor','Cumpleaños','Aniversario','Felicitaciones','Graduación','Agradecimiento','Condolencias','Amistad'];
const names = {
 ramos:['Ramo Pasión de Rosas','Bouquet Jardín de Primavera','Ramo Doce Rosas Rojas','Ramo Dulce Amanecer','Bouquet Encanto Rosado','Ramo Rosas en Papel Kraft','Bouquet Brisa Lila','Ramo Susurro de Claveles','Bouquet Rosas en Azul','Ramo Abrazo Blanco','Ramo Sol de la Mañana','Bouquet Armonía de Gerberas','Ramo Seis Rosas de Amor','Ramo Rosas de Gratitud','Bouquet Mariposa Rosa','Ramo Jardín Silvestre','Bouquet Ilusión de Lirios','Ramo Dulce Melodía','Ramo Rosas de Aniversario','Bouquet Primavera Suave','Ramo Pequeño Cariño','Ramo Gran Romance','Bouquet Encuentro Floral','Ramo Rosas para Mamá','Bouquet Felicidad Compartida'],
 arreglos:['Arreglo Elegancia Floral','Arreglo Sueño de Primavera','Centro Jardín Sereno','Arreglo Rosas de Bienvenida','Arreglo Luz en Flor','Centro Armonía Blanca','Arreglo Gerberas de Fiesta','Arreglo Dulce Compañía','Centro Encanto Natural','Arreglo Lirios de Gratitud','Arreglo Rosas del Alba','Arreglo Brisa de Claveles','Centro Esencia Rosada','Arreglo Flores de Felicitación','Arreglo Jardín de Esperanza','Centro Elegancia de Rosas','Arreglo Celebración Floral','Arreglo Abrazo de Flores','Centro Primavera Viva','Arreglo Serenidad y Recuerdo'],
 cajas:['Caja Dulce Encanto','Caja Corazón de Rosas','Caja Jardín Rosado','Caja Abrazo Floral','Caja Rosas de Seda','Caja Luz de Primavera','Caja Pequeño Romance','Caja Gran Celebración','Caja Lirios y Rosas','Caja Ilusión Blanca','Caja Jardín de Mamá','Caja Flores de Gratitud'],
 especiales:['Girasoles en Florero','Girasoles de Alegría','Ramo Luz de Girasoles','Florero Girasoles al Sol','Girasoles Luz de Ventana','Ramo Lirios Elegantes','Bouquet Tulipanes de Primavera','Gerberas de Colores','Ramo Claveles de Ternura','Ramo Alstroemerias del Jardín'],
 plantas:['Orquídea Blanca en Maceta','Orquídea Amarilla de Ventana','Orquídea Rosada Elegante','Suculenta en Cerámica','Jardín de Suculentas','Anturio Rojo Natural','Espatifilo en Maceta','Cactus Pequeño Encanto'],
 peluches:['Oso de Peluche Clásico Pequeño','Oso de Peluche Mediano','Oso Corazón Rosa','Oso Abrazo Grande','Conejito de Peluche','Perrito de Peluche','Oso de Peluche Crema'],
 chocolates:['Caja de Chocolates Marmoleados','Caja de Chocolates Surtidos','Bombones Corazón','Trufas de Chocolate','Detalle de Chocolate con Leche'],
 globos:['Globo Corazón Rojo','Globo Feliz Cumpleaños','Globo Estrella Dorada','Globo Corazón Rosado','Globo Felicitaciones'],
 regalos:['Set Dulce Sorpresa','Detalle Romántico','Regalo Para Ti','Taza con Mensaje de Cariño','Vela Aromática de Regalo','Tarjeta Especial con Sobre','Bolsa de Regalo Elegante','Set Oso y Chocolates'],
};
export const materials = [
 ['roja','Rosa roja','flor','tallo',1500],['rosada','Rosa rosada','flor','tallo',1500],['blanca','Rosa blanca','flor','tallo',1200],
 ['girasol','Girasol','flor','tallo',500],['clavel','Clavel','flor','tallo',800],['lirio','Lirio','flor','tallo',400],['gerbera','Gerbera','flor','tallo',500],['tulipan','Tulipán','flor','tallo',350],['alstroemeria','Alstroemeria','flor','tallo',500],['crisantemo','Crisantemo','flor','tallo',500],['paniculata','Paniculata','flor','rama',600],
 ['follaje','Follaje decorativo','insumo','rama',1200],['papel','Papel de envoltura','insumo','hoja',600],['cinta','Cinta de satén','insumo','metro',600],['tarjeta','Tarjeta de dedicatoria','insumo','unidad',500],['caja','Caja floral','insumo','unidad',200],['espuma','Espuma floral','insumo','bloque',200],['base','Base para arreglo','insumo','unidad',200],['florero','Florero de vidrio','insumo','unidad',120],['bolsa','Bolsa de regalo','insumo','unidad',250],
].map(([key,name,type,unit,stock])=>({key,name,type,unit,stock,id:demoId(`material:${key}`)}));
const prices={ramos:[95,145,180,125,210,135,165,85,195,155,100,150,100,160,175,120,230,140,260,185,55,480,220,200,280],arreglos:[240,280,190,220,180,260,160,210,195,270,235,150,320,250,185,450,380,290,215,340],cajas:[220,350,270,240,310,280,145,580,390,260,320,230],especiales:[150,100,140,195,180,210,280,95,75,110],plantas:[190,210,230,45,95,150,120,35],peluches:[45,80,65,140,60,55,75],chocolates:[75,55,35,45,20],globos:[25,30,25,25,30],regalos:[110,135,90,45,55,15,18,140]};
const photoMap={'ramos:1':4331696,'ramos:4':31860717,'ramos:5':23331187,'ramos:6':17635080,'ramos:8':33886751,'ramos:14':17588254,'especiales:0':15416274,'especiales:3':17683268,'especiales:4':34312709,'plantas:0':1309769,'plantas:1':20130986,'chocolates:0':14275709,'chocolates:1':29188958,'globos:0':3905842,'regalos:7':35579570};
function recipeFor(category,index,name) {
 const recipe=[]; const add=(key,quantity)=>recipe.push({key,quantity});
 if(['ramos','arreglos','cajas','especiales'].includes(category)) {
  let flower=name.includes('Girasol')||name.includes('girasol')?'girasol':name.includes('Clavel')?'clavel':name.includes('Lirio')?'lirio':name.includes('Gerbera')?'gerbera':name.includes('Tulipan')||name.includes('Tulipán')?'tulipan':name.includes('Alstroemeria')?'alstroemeria':/Blanc|Blanc/.test(name)?'blanca':/Rosad|Rosa en Azul/.test(name)?'rosada':'roja';
  if(category==='ramos' && [1,4,5,6,8,14].includes(index)) flower='rosada';
  add(flower,name.includes('Doce')?12:name.includes('Seis')?6:4+(index%5)*2);
  if(category==='ramos' && index===1) add('paniculata',2);
  if(category==='ramos' && index===14) add('crisantemo',2);
  if(category==='especiales' && index===3) add('blanca',2);
  if(category==='especiales' && index===4) add('rosada',2);
  add('follaje',2); add('cinta',0.5); add('tarjeta',1);
  if(category==='cajas'){add('caja',1);add('espuma',1);}else if(category==='arreglos'){add('base',1);add('espuma',1);}else if(category==='especiales'&&[0,3,4].includes(index)){add('florero',1);}else add('papel',2);
 } else {const key=`finished:${category}:${index}`; const packaging=category==='regalos'&&[0,1,7].includes(index); materials.push({key,name:packaging?`Presentación vacía para ${name}`:`${name} · unidad física`,type:packaging?'insumo':category==='plantas'?'producto':'componente',unit:'unidad',stock:category==='globos'&&index===4?0:category==='peluches'&&index===6?2:30,id:demoId(`material:${key}`)});add(key,1);if(category==='regalos')add('bolsa',1);}
 return recipe;
}
export const products=categories.flatMap(category=>names[category.key].map((name,index)=>{
 const recipe=recipeFor(category.key,index,name); const floral=['ramos','arreglos','cajas','especiales'].includes(category.key);
 return {id:demoId(`product:${category.key}:${index}`),key:`${category.key}:${index}`,categoryKey:category.key,categoryId:category.id,name,price:prices[category.key][index],
 description:floral?`${name}: una composición ${category.key==='cajas'?'en caja floral':category.key==='arreglos'?'sobre base decorativa':'de flores frescas'} con ${recipe.filter(x=>materials.find(m=>m.key===x.key)?.type==='flor').map(x=>materials.find(m=>m.key===x.key).name.toLowerCase()).join(' y ')}, follaje y presentación cuidada. Incluye tarjeta para tu dedicatoria. Catálogo de demostración: composición y precio simulados; fotografías de banco ilustrativas cuando estén disponibles.`:`${name}, presentado para acompañar tus flores o regalar por separado. ${category.key==='plantas'?'Planta natural en su presentación indicada.':'El cliente decide si desea añadirlo a su compra.'} Artículo y precio sintéticos de demostración, no una oferta comercial oficial.`,
 occasion:floral?occasions[index%occasions.length]:null,season:index%7===0?seasons[1+(index%5)]:seasons[0],active:!(category.key==='cajas'&&index===11),order:0,featured:index===0,recipe,photoId:photoMap[`${category.key}:${index}`]??null};
})).map((p,i)=>({...p,order:i+1}));
// Included products are real references; no duplicate physical stock is created.
export const included=[{parent:'regalos:0',child:'chocolates:4'},{parent:'regalos:1',child:'globos:0'},{parent:'regalos:7',child:'peluches:0'},{parent:'regalos:7',child:'chocolates:1'}];
export const promotions=[
 {name:'Semana de las Rosas',type:'producto',discountType:'porcentaje',value:10,keys:['ramos:0','ramos:2','ramos:12'],minimum:0},
 {name:'Celebra con Flores',type:'producto',discountType:'monto_fijo',value:20,keys:['arreglos:1','arreglos:6'],minimum:150},
 {name:'Dúo Romántico',type:'combo',keys:['ramos:0','chocolates:1'],comboPrice:135},
 {name:'Girasoles y un Abrazo',type:'combo',keys:['especiales:1','peluches:0'],comboPrice:130},
 {name:'Fiesta Floral',type:'combo',keys:['arreglos:0','globos:1'],comboPrice:250},
 {name:'Caja con un Detalle',type:'combo',keys:['cajas:0','regalos:4'],comboPrice:250},
 {name:'Regalo Romántico para Dos',type:'combo',keys:['ramos:12','chocolates:0'],comboPrice:155},
 {name:'Detalles para Enamorar',type:'producto',discountType:'porcentaje',value:12,keys:['regalos:1','regalos:7'],future:true},
 {name:'Regalos que Sorprenden',type:'producto',discountType:'monto_fijo',value:5,keys:['chocolates:2'],expired:true},
];
export const productByKey=key=>products.find(p=>p.key===key);
