/** Reviewed stock-photo candidates for synthetic LOCAL catalog only. No hotlinking. */
export const photoSources = [
 [4331696,'bouquet-of-pink-flowers','Amelia Cui'],[31860717,'vibrant-bouquet-of-pink-roses-in-elegant-wrapping',null],
 [23331187,'carrying-a-bouquet-of-pink-roses-wrapped-in-kraft-paper','Iryna Varanovich'],[17635080,'bouquet-of-roses-wrapped-in-pink-paper-and-tied-with-a-ribbon',null],
 [33886751,'elegant-bouquet-of-pink-roses-with-blue-wrapper',null],[17588254,'bouquet-wrapped-paper',null],
 [15416274,'sunflower-bouquet-in-a-vase','Lisa Fotios'],[17683268,'bouquet-with-sunflowers-in-glass-vase',null],
 [34312709,'vibrant-sunflower-bouquet-in-glass-vase-indoors',null],
 [1309769,'green-leafed-orchid-plant-on-pot','Tom Swinnen'],[20130986,'yellow-orchid-on-a-windowsill',null],
 [14275709,'exclusive-candy-chocolates-in-box',null],[29188958,'luxurious-assorted-chocolates-in-a-box',null],
 [3905842,'red-heart-balloon-on-white-background','Polina Tankilevitch'],[35579570,'adorable-teddy-bear-with-heart-shaped-chocolates',null],
].map(([id,slug,author])=>({id,page:`https://www.pexels.com/photo/${slug}-${id}/`,download:`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`,author,license:'Pexels License',licenseUrl:'https://www.pexels.com/license/',notes:'Foto de banco ilustrativa. No representa trabajo realizado por Anabelle. Verificar correspondencia antes de asociar; no reutilizar para otras composiciones.'}));
