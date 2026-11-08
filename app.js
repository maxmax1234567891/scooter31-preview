const $=id=>document.getElementById(id), money=n=>Number(n).toLocaleString('ru-RU')+' ₽';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s).toLowerCase().replace(/,/g,'.').replace(/[хx–—]/g,'-').replace(/\s/g,'');
const icons={search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',barcode:'<path d="M3 7V3h4m10 0h4v4M3 17v4h4m10 0h4v-4M7 7v10m3-10v10m4-10v10m3-10v10"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',compare:'<path d="M5 20V10m7 10V4m7 16V7"/>',bag:'<path d="M4 7h16l1 14H3zM8 8V6a4 4 0 0 1 8 0v2"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',filter:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',sort:'<path d="M6 4v16m-3-3 3 3 3-3M13 6h8m-8 6h6m-6 6h3"/>',truck:'<path d="M2 5h12v12H2zM14 9h4l4 4v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>'};
const icon=k=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[k]+'</svg>';
function decorate(root=document){root.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));root.querySelectorAll('[data-icon-before]').forEach(e=>{if(!e.querySelector('svg'))e.insertAdjacentHTML('afterbegin',icon(e.dataset.iconBefore))})}
function readStore(k,fallback){try{return JSON.parse(localStorage.getItem('s31-'+k))??fallback}catch{return fallback}}
function save(k,v){try{localStorage.setItem('s31-'+k,JSON.stringify(v))}catch{}}
const cart=readStore('cart',{}),favorites=new Set(readStore('favorites',[])),compared=new Set(readStore('compare',[]));
let category='tubes',favoriteOnly=false,toastTimer,scanMode='photo',scanUrl;
PRODUCTS.forEach((p,i)=>{Object.assign(p,CONTENT[p.id]);p.slug=p.category+'-'+(p.article||String(i+1))});
Object.keys(cart).forEach(id=>{const p=PRODUCTS.find(x=>x.id===id);if(!p)delete cart[id];else cart[id]=Math.min(p.qty,Math.max(0,Number(cart[id])||0))});
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2400)}
const filterIDs=['diameter','width','profile','strong','kind','minPrice','maxPrice'];
// Presentation only: original name, article and ID remain the accounting identity.
function sizeData(p){
 const n=p.name.replace(/(\d),(?=\d)/g,'$1.').replace(/(?<=\d)[хx×](?=\d)/g,'-').replace(/\s*-\s*/g,'-');
 const tuples=[],metric=/\b(\d{2,3})\/(\d{2,3})-(\d{1,2})\b/g;
 let m;while((m=metric.exec(n)))tuples.push({diameter:m[3],width:'mm:'+Number(m[1]),profile:String(Number(m[2]))});
 // Inch notation is never converted into a guessed metric width/profile.
 const inch=n.replace(/^(?:Шина|Камера)\s*(?:R\d+\s*)?/i,'').match(/(?:^|\()(\d\.\d+(?:\/\d\.\d+)*)(?:-(\d{1,2}))?(?:\/(\d\.\d+))?(?![\d.a-zа-я])/i);
 if(inch){const rim=inch[2]||p.diameter;[...inch[1].split('/'),...(inch[3]?[inch[3]]:[])].forEach(w=>tuples.push({diameter:String(rim),width:'in:'+Number(w),profile:''}))}
 const bicycle=n.match(/\b(10)-(\d\.\d+(?:\/\d\.\d+)+)/);
 if(bicycle)bicycle[2].split('/').forEach(w=>tuples.push({diameter:bicycle[1],width:'in:'+Number(w),profile:''}));
 return tuples;
}
function sizeMatch(p,d,w,h){return !w&&!h?(!d||p.diameter===d):sizeData(p).some(s=>(!d||s.diameter===d)&&(!w||s.width===w)&&(!h||s.profile===h))}
function widthLabel(v){return v.startsWith('mm:')?v.slice(3)+' мм':Number(v.slice(3)).toLocaleString('ru-RU',{minimumFractionDigits:2})+'″'}
function cardName(p){
 const n=p.name.replace(/(\d),(?=\d)/g,'$1.').replace(/(?<=\d)[хx×](?=\d)/g,'-').replace(/\s*-\s*/g,'-').replace(/^(Шина|Камера)\s*/i,'').replace(/^R\d+\s*/i,'');
 const m=n.match(/^\d[\d./]*(?:-\d[\d./]*)?/);
 let size=m?m[0]:'Обод '+p.diameter+'″';if(m&&!size.includes('-'))size+='-'+p.diameter;if(/^10-1\./.test(size))size=size.replace('10-','10×');size=size.replace(/^(\d\.\d+)-(\d+)\/(\d\.\d+)$/,'$1/$3-$2');
 let model=m?n.slice(m[0].length).trim():n;
 // Alternative size stays visible in the full original title inside the product.
 model=model.replace(/^\([\d./-]+\)\s*/,'').replace(/^[,\s]+/,'');
 return {size,model:model||(p.category==='tubes'?'Мотокамера':'Мотошина')};
}
function syncSizeFilters(){
 const pool=PRODUCTS.filter(p=>($('search').value||favoriteOnly||p.category===category)&&(!favoriteOnly||favorites.has(p.id))&&matches(p,$('search').value));
 function options(id,values,label,empty){const e=$(id),v=e.value;e.innerHTML='<option value="">'+empty+'</option>'+values.map(x=>'<option value="'+esc(x)+'">'+esc(label(x))+'</option>').join('');e.value=values.includes(v)?v:''}
 options('diameter',[...new Set(pool.map(p=>p.diameter).filter(Boolean))].sort((a,b)=>a-b),v=>v+'″','Любой');
 let ss=pool.flatMap(sizeData).filter(s=>!$('diameter').value||s.diameter===$('diameter').value);
 options('width',[...new Set(ss.map(s=>s.width))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),widthLabel,'Любая');
 ss=ss.filter(s=>!$('width').value||s.width===$('width').value);
 const profiles=[...new Set(ss.map(s=>s.profile).filter(Boolean))].sort((a,b)=>a-b);
 options('profile',profiles,v=>v+'%',profiles.length?'Любой':'Не указан в маркировке');
 $('profile').disabled=!profiles.length;
}

function matches(p,q){return CatalogSearch.matches(p,q)}
function resetFilters(){filterIDs.forEach(id=>$(id).value='')}
function changeCategory(c){category=c;favoriteOnly=false;resetFilters();$('search').value='';hideSuggestions();const ds=[...new Set(PRODUCTS.filter(p=>p.category===c).map(p=>p.diameter).filter(Boolean))].sort((a,b)=>a-b);$('diameter').innerHTML='<option value="">Любой</option>'+ds.map(d=>'<option value="'+d+'">'+d+' дюймов</option>').join('');draw()}
const goods=n=>n+' '+(n%100>=11&&n%100<=14?'товаров':n%10===1?'товар':n%10>=2&&n%10<=4?'товара':'товаров');
function rowsForView(){const q=$('search').value;let rows=PRODUCTS.filter(p=>(q||favoriteOnly||p.category===category)&&(!favoriteOnly||favorites.has(p.id))&&matches(p,q)&&sizeMatch(p,$('diameter').value,$('width').value,$('profile').value)&&(!$('strong').value||p.strong)&&(!$('kind').value||p.kind===$('kind').value)&&(!$('minPrice').value||p.price>=Number($('minPrice').value))&&(!$('maxPrice').value||p.price<=Number($('maxPrice').value)));
return rows.sort((a,b)=>(b.qty>0)-(a.qty>0)||($('sort').value==='cheap'?a.price-b.price:$('sort').value==='expensive'?b.price-a.price:$('sort').value==='diameter'?Number(a.diameter)-Number(b.diameter):CatalogSearch.score(b,q)-CatalogSearch.score(a,q)||b.pop-a.pop||a.name.localeCompare(b.name,'ru')))}
function photoSlides(p){const srcs=[...new Set([p.photo,...(p.photos||[])].filter(Boolean))];return srcs.length>1?srcs.map(src=>({src})):srcs.length?[{src:srcs[0]},{src:srcs[0],zoom:true}]:[]}
function photoHTML(p){const slides=photoSlides(p);return '<div class="image-area">'+photoBadge(p)+'<div class="photo-track" tabindex="0" aria-label="Фотографии: '+esc(p.name)+'">'+slides.map(s=>'<a class="media" href="#product/'+encodeURIComponent(p.slug)+'" aria-label="'+esc(p.name)+(s.zoom?', крупный фрагмент':'')+'"><img src="'+esc(s.src.endsWith('.webp')?s.src.replace('.webp','-thumb.webp'):s.src)+'" alt="'+esc(p.name)+'" loading="lazy" draggable="false"'+(s.zoom?' class="detail-crop"':'')+'>'+'</a>').join('')+'</div><div class="image-actions"><button class="icon-button '+(favorites.has(p.id)?'liked':'')+'" data-fav="'+esc(p.id)+'" aria-label="В избранное: '+esc(p.name)+'" aria-pressed="'+favorites.has(p.id)+'">'+icon('heart')+'</button></div></div><div class="dots">'+slides.map((s,i)=>'<button class="'+(!i?'active':'')+'" data-slide="'+i+'" aria-label="'+(s.zoom?'Крупный фрагмент':'Фото '+(i+1))+'"></button>').join('')+'</div>'}

/* Approval-only examples. No promotion flags or prices are written to product data. */
const promoDemo=new URLSearchParams(location.search).get('promo')!=='off';
const promoExamples=new Map(PRODUCTS.filter(p=>p.category==='tires').sort((a,b)=>b.pop-a.pop||a.name.localeCompare(b.name,'ru')).slice(0,4).map((p,i)=>[p.id,[{badge:'Хит',tone:'hit'},{badge:'Новинка',tone:'new'},{badge:'Распродажа',tone:'sale',percent:20},{badge:'−15%',tone:'hit',percent:15}][i]]));
function demoPromo(p){return promoDemo?promoExamples.get(p.id):null}
function photoBadge(p){const demo=demoPromo(p);return demo?.badge?'<span class="photo-badge promo-badge '+demo.tone+'">'+demo.badge+'</span>':''}
function cardMeta(p){return '<div class="card-meta"><button class="card-compare" data-compare="'+esc(p.id)+'" aria-label="Сравнить: '+esc(p.name)+'" aria-pressed="'+compared.has(p.id)+'">'+icon('compare')+'<span class="compare-label">'+(compared.has(p.id)?'В сравнении':'Сравнить')+'</span></button></div>'}

function priceHTML(p){const demo=demoPromo(p),previous=demo?.percent?Math.round(p.price/(1-demo.percent/100)/10)*10:p.old_price;const sale=(!!demo?.percent||p.old_price_verified)&&previous>p.price;return '<strong class="price'+(sale?' sale-price':'')+'">'+money(p.price)+'</strong>'+(sale?'<s class="old-price">'+money(previous)+'</s>'+(demo?'':'<span class="discount">−'+Math.round(100*(1-p.price/previous))+'%</span>'):'')}
function draw(){syncSizeFilters();const rows=rowsForView(),q=$('search').value;document.querySelectorAll('[data-category]').forEach(b=>b.classList.toggle('active',!favoriteOnly&&!q&&b.dataset.category===category));$('heading').textContent=favoriteOnly?'Избранное':q?'Результаты поиска':category==='tires'?'Мотошины':'Мотокамеры';$('count').textContent=goods(rows.length);$('navFavorite').classList.toggle('active',favoriteOnly);$('navCatalog').classList.toggle('active',!favoriteOnly);
$('strongLabel').hidden=category!=='tubes';$('kindLabel').hidden=category!=='tires';
const quick=category==='tires'?[['kind','Дорожные','Дорожные'],['kind','Внедорожные','Внедорожные'],['kind','Универсальные','Универсальные']]:[['strong','yes','Усиленные']];
const ds=[...new Set(PRODUCTS.filter(p=>p.category===category).map(p=>p.diameter).filter(Boolean))].sort((a,b)=>a-b);
const chipDemand=([k,v])=>PRODUCTS.filter(p=>p.category===category&&(k==='strong'?p.strong:p[k]===v)).reduce((sum,p)=>sum+Number(p.pop||0),0);
const oldScroll=$('chips').scrollLeft;$('chips').innerHTML=[...quick,...ds.map(d=>['diameter',d,d+'″'])].sort((a,b)=>chipDemand(b)-chipDemand(a)).map(([k,v,t])=>'<button data-filter="'+k+'" data-value="'+v+'" class="'+($(k).value===v?'active':'')+'">'+t+'</button>').join('');$('chips').scrollLeft=oldScroll;
const active=filterIDs.filter(id=>$(id).value);$('filterCount').textContent=active.length||'';$('activeFilters').innerHTML=active.map(id=>'<button data-reset="'+id+'">'+esc(id==='width'?widthLabel($(id).value):id==='profile'?$(id).value+'%':id==='strong'?'Усиленные':id==='minPrice'?'От '+money($(id).value):id==='maxPrice'?'До '+money($(id).value):$(id).value+(id==='diameter'?'″':''))+' ×</button>').join('');$('applyFilters').textContent='Показать '+goods(rows.length);
$('products').innerHTML=rows.map(p=>'<article class="product" data-product="'+esc(p.id)+'">'+photoHTML(p)+'<div class="info">'+cardMeta(p)+'<div class="price-row">'+priceHTML(p)+'</div><a href="#product/'+encodeURIComponent(p.slug)+'"><h2><span class="product-size">'+esc(cardName(p).size)+'</span><span class="product-model">'+esc((p.category==='tires'?'Мотошина':'Мотокамера')+(cardName(p).model===(p.category==='tires'?'Мотошина':'Мотокамера')?'':' '+cardName(p).model))+'</span></h2></a><button class="primary" data-buy="'+esc(p.id)+'">'+(cart[p.id]?'В корзине · '+cart[p.id]:'В корзину')+'</button></div></article>').join('')||'<div class="empty">'+(favoriteOnly?'Сохраняйте понравившиеся товары сердечком. Они появятся здесь.':'Не нашли подходящий вариант. Попробуйте другой размер или сбросьте фильтры.')+'</div>';
$('products').querySelectorAll('.product').forEach(card=>{const track=card.querySelector('.photo-track'),dots=card.querySelectorAll('[data-slide]');track.addEventListener('scroll',()=>{const i=Math.round(track.scrollLeft/track.clientWidth);dots.forEach((b,j)=>b.classList.toggle('active',i===j))},{passive:true});dots.forEach(b=>b.onclick=()=>track.scrollTo({left:Number(b.dataset.slide)*track.clientWidth,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));});updateBadges()}
function updateBadges(){$('savedCount').textContent=new Set([...favorites,...compared]).size||'';$('favoriteCount').textContent=favorites.size||'';$('compareCount').textContent=compared.size||'';$('cartCount').textContent=Object.values(cart).reduce((a,b)=>a+b,0)||''}
function addCart(id){const p=PRODUCTS.find(p=>p.id===id);if(!p)return;if((cart[id]||0)>=p.qty){toast('Больше доступного количества добавить нельзя');return}cart[id]=(cart[id]||0)+1;save('cart',cart);updateBadges();document.querySelectorAll('[data-buy]').forEach(b=>{if(b.dataset.buy===id)b.textContent='В корзине · '+cart[id]});toast('Добавлено в корзину')}
function updateCart(){save('cart',cart);updateBadges();$('cartRows').innerHTML=Object.entries(cart).filter(([id,q])=>q>0).map(([id,q])=>{const p=PRODUCTS.find(p=>p.id===id);return '<div class="cartrow"><span>'+esc(p.name)+'<br>'+money(p.price)+' × '+q+'</span><button data-minus="'+id+'" aria-label="Уменьшить количество">−</button><button data-plus="'+id+'" aria-label="Увеличить количество">+</button></div>'}).join('')||'<p class="muted">В корзине пока пусто</p>';$('total').textContent=money(Object.entries(cart).reduce((s,[id,q])=>s+PRODUCTS.find(p=>p.id===id).price*q,0))}
function compareView(){const ps=PRODUCTS.filter(p=>compared.has(p.id));$('comparison').innerHTML=!ps.length?'<p class="muted">Нажмите «Сравнить» внутри карточки товара. Можно выбрать до четырёх позиций.</p>':'<div class="comparison-scroll"><table><thead><tr><th>Характеристики</th>'+ps.map(p=>'<th><img src="'+esc(p.photo.endsWith('.webp')?p.photo.replace('.webp','-thumb.webp'):p.photo)+'" alt=""><a href="#product/'+encodeURIComponent(p.slug)+'" data-close="compareDialog">'+esc(p.name)+'</a><br><button data-remove-compare="'+esc(p.id)+'">Убрать</button></th>').join('')+'</tr></thead><tbody>'+[['Цена',p=>money(p.price)],['Размер',p=>p.name.match(/\d[\d.,/]*(?:[-хx][\d.,/]+)+/)?.[0]||'Смотрите маркировку'],['Обод',p=>p.diameter+'″'],['Вентиль',p=>p.valve||'Нет данных'],['Исполнение',p=>p.strong?'Усиленная':'Не указано'],['Протектор',p=>p.kind||'Нет данных']].map(([t,f])=>'<tr><td>'+t+'</td>'+ps.map(p=>'<td>'+esc(f(p))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'}
function hideSuggestions(){$('suggestions').hidden=true;$('search').setAttribute('aria-expanded','false')}
function suggest(){const q=$('search').value,rows=PRODUCTS.filter(p=>p.qty>0&&matches(p,q)).sort((a,b)=>CatalogSearch.score(b,q)-CatalogSearch.score(a,q)||b.pop-a.pop).slice(0,5);$('suggestions').innerHTML='<p>'+(q?'Есть в нашем каталоге':'Популярное в нашем магазине')+'</p>'+rows.map(p=>'<button data-suggestion="'+esc(p.slug)+'"><img src="'+esc(p.photo.endsWith('.webp')?p.photo.replace('.webp','-thumb.webp'):p.photo)+'" alt=""><span><strong>'+esc(p.name)+'</strong><small>'+money(p.price)+'</small></span></button>').join('')+(rows.length?'':'<p>Попробуйте размер или артикул с упаковки</p>');$('suggestions').hidden=false;$('search').setAttribute('aria-expanded','true')}
function catalogView(){if(location.hash.startsWith('#product/'))location.hash='#'+category;$('detailView').hidden=true;$('catalogView').hidden=false}
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!e.target.closest('.search-wrap'))hideSuggestions();if(!b)return;
if(b.dataset.close)$(b.dataset.close).close();
if(b.hasAttribute('data-delivery'))$('deliveryDialog').showModal();
if(b.dataset.buy)addCart(b.dataset.buy);
if(b.dataset.fav){const id=b.dataset.fav;favorites.has(id)?favorites.delete(id):favorites.add(id);save('favorites',[...favorites]);b.classList.toggle('liked',favorites.has(id));b.setAttribute('aria-pressed',favorites.has(id));updateBadges();if(favoriteOnly)draw()}
if(b.dataset.compare){const id=b.dataset.compare;if(compared.has(id))compared.delete(id);else if(compared.size<4)compared.add(id);else return toast('Сравнить можно до четырёх товаров');save('compare',[...compared]);b.setAttribute('aria-pressed',compared.has(id));const label=b.querySelector('.compare-label');if(label)label.textContent=compared.has(id)?'В сравнении':'Сравнить';updateBadges()}
if(b.dataset.removeCompare){compared.delete(b.dataset.removeCompare);save('compare',[...compared]);compareView();draw()}
if(b.dataset.filter){const k=b.dataset.filter;$(k).value=$(k).value===b.dataset.value?'':b.dataset.value;draw()}
if(b.dataset.reset){$(b.dataset.reset).value='';draw()}
if(b.dataset.category){changeCategory(b.dataset.category);location.hash='#'+category;catalogView();window.scrollTo(0,0)}
if(b.dataset.suggestion){hideSuggestions();$('search').blur();location.hash='#product/'+encodeURIComponent(b.dataset.suggestion)}
if(b.dataset.minus){cart[b.dataset.minus]=Math.max(0,cart[b.dataset.minus]-1);updateCart();draw()}
if(b.dataset.plus){addCart(b.dataset.plus);updateCart();draw()}
});
$('search').oninput=()=>{catalogView();document.body.classList.remove('scroll-down');draw();suggest()};$('search').onfocus=suggest;$('search').onkeydown=e=>{if(e.key==='Escape')hideSuggestions();if(e.key==='Enter'){hideSuggestions();$('search').blur();catalogView();draw()}};
[...filterIDs,'sort'].forEach(id=>$(id).addEventListener('input',draw));
$('filterToggle').onclick=()=>{$('filterDialog').showModal()};$('applyFilters').onclick=()=>$('filterDialog').close();$('resetFilters').onclick=()=>{resetFilters();draw()};
$('cartButton').onclick=()=>{updateCart();$('cartDialog').showModal()};
$('navCatalog').onclick=()=>{favoriteOnly=false;resetFilters();$('search').value='';catalogView();draw();window.scrollTo(0,0)};
$('navFavorite').onclick=()=>{$('savedDialog').close();favoriteOnly=true;resetFilters();$('search').value='';catalogView();draw();window.scrollTo(0,0)};
$('navSaved').onclick=()=>$('savedDialog').showModal();
$('navCompare').onclick=()=>{$('savedDialog').close();compareView();$('compareDialog').showModal()};
document.querySelectorAll('input[name=delivery]').forEach(e=>{e.checked=e.value===readStore('delivery','pickup');e.onchange=()=>save('delivery',e.value)});
function openScan(mode){scanMode=mode;$('scanTitle').textContent=mode==='barcode'?'По штрихкоду':'По фото маркировки';$('scanHelp').textContent=mode==='barcode'?'Покажите штрихкод на упаковке. Вручную можно ввести артикул.':'Снимите размер на боковине шины или упаковке камеры. По одному рисунку протектора точный подбор невозможен.';$('scanStatus').textContent=mode==='barcode'?'Штрихкоды товаров из 1С ещё не загружены. Считывание кода не гарантирует нахождение товара.':'В этом макете распознавание фото ещё не подключено. Можно открыть снимок и ввести маркировку ниже.';$('scanFile').value='';$('scanText').value='';$('scanPreview').hidden=true;hideSuggestions();$('scanDialog').showModal()}
$('photoSearch').onclick=()=>openScan('photo');$('barcodeSearch').onclick=()=>openScan('barcode');
$('scanFile').onchange=async()=>{const f=$('scanFile').files[0];if(!f)return;if(f.size>20*1024*1024){$('scanStatus').textContent='Выберите фото размером до 20 МБ.';return}if(scanUrl)URL.revokeObjectURL(scanUrl);scanUrl=URL.createObjectURL(f);$('scanPreview').src=scanUrl;$('scanPreview').hidden=false;
if(scanMode==='barcode'){if(!('BarcodeDetector' in window)){$('scanStatus').textContent='Этот браузер не поддерживает считывание. Введите артикул вручную.';return}try{const image=await createImageBitmap(f),formats=await BarcodeDetector.getSupportedFormats(),detector=new BarcodeDetector({formats:formats.filter(x=>['ean_13','ean_8','code_128','code_39','upc_a','upc_e'].includes(x))}),result=await detector.detect(image);image.close();if(result[0]){$('scanText').value=result[0].rawValue;$('scanStatus').textContent='Код считан. Точное сопоставление станет доступно после загрузки штрихкодов из 1С.'}else $('scanStatus').textContent='Код не прочитан. Снимите ближе, без бликов, или введите артикул.'}catch{$('scanStatus').textContent='Не удалось прочитать фото. Введите артикул вручную.'}}};
$('scanFind').onclick=()=>{const q=$('scanText').value.trim();if(!q){$('scanText').focus();return}resetFilters();favoriteOnly=false;$('search').value=q;$('scanDialog').close();catalogView();draw();window.scrollTo(0,0)};
decorate();changeCategory(location.hash==='#tubes'?'tubes':'tires');
if(promoDemo)document.querySelector('.draft-banner').textContent='На согласование: плашки и скидки условные, цены товаров не изменены';
new ResizeObserver(()=>document.documentElement.style.setProperty('--top',document.querySelector('.topbar').getBoundingClientRect().height+'px')).observe(document.querySelector('.topbar'));

let lastScroll=window.scrollY,scrollAnchor=window.scrollY;
window.addEventListener('scroll',()=>{const y=Math.max(0,window.scrollY);document.body.classList.toggle('scrolled',y>35);if(Math.abs(y-scrollAnchor)>55){const down=y>scrollAnchor;document.body.classList.toggle('scroll-down',down&&y>150&&!document.querySelector('dialog[open]')&&document.activeElement!==$('search'));scrollAnchor=y}if(y<100)document.body.classList.remove('scroll-down');lastScroll=y},{passive:true});
$('search').addEventListener('focus',()=>document.body.classList.remove('scroll-down'));
