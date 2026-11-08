
function approvedProductPage(p){
 const page=p.productPage;
 const photos=[...new Set([p.photo,...(p.photos||[])].filter(Boolean))];
 $('detailView').classList.add('sample-product');
 document.title=page.title+' | Скутер31';
 $('detailView').innerHTML='<a class="back-link" href="#'+category+'">← Вернуться к подбору</a><div class="detail-layout"><div><img id="detailPhoto" class="detail-photo" src="'+esc(photos[0])+'" alt="'+esc(page.title)+'">'+(photos.length>1?'<div class="gallery">'+photos.map((src,i)=>'<button data-photo="'+esc(src)+'" aria-label="Фото '+(i+1)+'"><img src="'+esc(src)+'" alt="Ракурс '+(i+1)+'"></button>').join('')+'</div>':'')+'</div><section><div class="eyebrow">Мотошины</div><h1 class="detail-title">'+esc(page.title)+'</h1><p class="sample-subtitle">'+esc(page.subtitle)+'</p><div class="stock">В наличии в магазине</div><div class="detail-buy"><div class="price-row">'+priceHTML(p)+'</div><button class="primary" data-buy="'+esc(p.id)+'">'+(cart[p.id]?'В корзине · '+cart[p.id]:'В корзину')+'</button></div><button class="detail-compare" data-compare="'+esc(p.id)+'" aria-pressed="'+compared.has(p.id)+'" data-icon-before="compare"><span class="compare-label">'+(compared.has(p.id)?'В сравнении':'Сравнить')+'</span></button><button data-delivery data-icon-before="truck">Получение</button><div class="sample-copy"><h2>О шине</h2><p>'+esc(page.intro)+'</p><h2>Характеристики</h2><dl class="sample-specs">'+page.specs.map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl></div></section></div>';
 $('detailView').querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{$('detailPhoto').src=b.dataset.photo});
 decorate($('detailView'));window.scrollTo(0,0);
}
let catalogScroll=0,catalogState=null,detailOpen=false;
history.scrollRestoration='manual';
function rememberCatalog(){if($('catalogView').hidden)return;catalogScroll=window.scrollY;catalogState={category,favoriteOnly,query:$('search').value,sort:$('sort').value,filters:Object.fromEntries(filterIDs.map(id=>[id,$(id).value]))};}
function restoreCatalog(){if(!catalogState)return;category=catalogState.category;favoriteOnly=catalogState.favoriteOnly;$('search').value=catalogState.query;$('sort').value=catalogState.sort;resetFilters();syncSizeFilters();for(const id of filterIDs){$(id).value=catalogState.filters[id]||'';if(['diameter','width'].includes(id))syncSizeFilters()}draw();}
document.addEventListener('click',e=>{if(e.target.closest('a[href^="#product/"],button[data-suggestion]'))rememberCatalog()},true);

function showProduct(){
 const match=location.hash.match(/^#product\/(.+)$/);
 const p=match&&PRODUCTS.find(x=>x.slug===decodeURIComponent(match[1])||x.id===decodeURIComponent(match[1]));
 if(!p){const returning=detailOpen&&$('catalogView').hidden;detailOpen=false;if(returning)restoreCatalog();if(location.hash==='#tires'||location.hash==='#tubes'){const next=location.hash.slice(1);if(category!==next)changeCategory(next)}$('detailView').hidden=true;$('catalogView').hidden=false;document.title='Шины и камеры | Скутер31';if(returning){document.body.classList.remove('scroll-down');requestAnimationFrame(()=>window.scrollTo(0,catalogScroll))}return}
 if(!$('catalogView').hidden&&!catalogState)rememberCatalog();detailOpen=true;
 $('catalogView').hidden=true;$('detailView').hidden=false;hideSuggestions();
 $('detailView').classList.remove('sample-product');
 if(p.productPage){approvedProductPage(p);return}
 document.title=p.name+' | Скутер31';
 const photos=[...new Set([p.photo,...(p.photos||[])].filter(Boolean))];
 const photoNote=p.category==='tires'&&(p.photo_mode==='generic'||p.photo_mode==='family')?(p.id==='НФ-00002660'?'Образец протектора MC-802. На исходном фото размер 120/70-12; товар в этой карточке 130/70-13.':p.photo_mode==='generic'?'Временная иллюстрация для макета. Точный рисунок этой модели ещё не подтверждён.':'Фото другого размера этой модели. Требуется сверка нашей партии.'):'';
 const specs=[['Диаметр обода',p.diameter+'″'],['Вентиль',p.valve],['Назначение',p.category==='tires'?p.kind:''],['Исполнение',p.strong?'Усиленная':'']].filter(x=>x[1]);
 $('detailView').innerHTML='<a class="back-link" href="#'+category+'">← Вернуться к подбору</a><div class="detail-layout"><div><img id="detailPhoto" class="detail-photo" src="'+esc(photos[0])+'" alt="'+esc(p.name)+'">'+(photos.length>1?'<div class="gallery">'+photos.map((src,i)=>'<button data-photo="'+esc(src)+'" aria-label="Фото '+(i+1)+'"><img src="'+esc(src)+'" alt="Ракурс '+(i+1)+'"></button>').join('')+'</div>':'')+(photoNote?'<p class="detail-copy photo-review-note">'+esc(photoNote)+'</p>':'')+'</div><section><div class="eyebrow">'+(p.category==='tires'?'Мотошины':'Мотокамеры')+'</div><h1 class="detail-title">'+esc(p.name)+'</h1><div class="stock">В наличии в магазине</div><div class="specs">'+specs.map(([k,v])=>'<div><small>'+k+'</small>'+esc(v)+'</div>').join('')+'</div><p class="detail-copy">'+esc(p.description)+'</p><div class="detail-buy"><div class="price-row">'+priceHTML(p)+'</div><button class="primary" data-buy="'+esc(p.id)+'">'+(cart[p.id]?'В корзине · '+cart[p.id]:'В корзину')+'</button></div><button class="detail-compare" data-compare="'+esc(p.id)+'" aria-pressed="'+compared.has(p.id)+'" data-icon-before="compare"><span class="compare-label">'+(compared.has(p.id)?'В сравнении':'Сравнить')+'</span></button><button data-delivery data-icon-before="truck">Способы получения</button><div class="fitbox"><h2>Подойдёт вашему колесу?</h2><p class="detail-copy">'+esc(p.recommendation)+'</p></div></section></div>';
 $('detailView').querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{$('detailPhoto').src=b.dataset.photo});
 decorate($('detailView'));window.scrollTo(0,0);
}
window.addEventListener('hashchange',showProduct);showProduct();
