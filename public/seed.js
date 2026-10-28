export const categories = ['Cooking oils','Rice','Flour','Pulses','Spices','Snacks','Household essentials'];
export const products = [
['mustard','Mustard Cooking Oil','Cooking oils',1850,2100,'15 L tin','tin','mustard',32],
['sunflower','Sunflower Cooking Oil','Cooking oils',1650,1800,'15 L tin','tin','sunflower',48],
['groundnut','Groundnut Cooking Oil','Cooking oils',2350,2500,'15 L tin','tin','groundnut',18],
['rice','Everyday Basmati Rice','Rice',650,720,'5 kg box','box','rice',35],
['atta','Whole Wheat Atta','Flour',420,460,'10 kg box','box','atta',24],
['dal','Toor Dal','Pulses',320,350,'2 kg box','box','dal',28],
['spice','Kitchen Spice Collection','Spices',240,280,'500 g box','box','spice',8],
['snacks','Namkeen Snack Box','Snacks',180,200,'1 kg box','box','snacks',20],
['clean','Home Cleaning Essentials','Household essentials',290,320,'1 box','box','clean',12]
].map(([id,name,category,price,mrp,size,unit,art,stock])=>({id,name,category,price,mrp,size,unit,art,stock,brand:'Sample brand — editable',description:'Sample product listing. Replace the brand, specifications, ingredients, pack details and image before accepting real orders.',image:'',variants:[size],featured:true}));
export const settings={name:'khushi product',tagline:'cooking oil and grosery',address:'merta city jaitaran choki',phone:'9988776655',email:'mukesh@gmail.com',hours:'7 to 5',deliveryAreas:'All Rajasthan',deliveryCharge:10,freeDeliveryTins:50,minimumBoxes:1,offer:'A little goodness. Every day.',policy:'Delivery timelines and return conditions are awaiting shop confirmation. Please contact the shop before placing a real order.'};
