const PAGE_SIZE = 12;
let allProducts = [];
let allCategories = [];
let currentPage = 1;
let activeCategory = "all";

// ---------- بازدید (آمار ساده) ----------
function trackVisit(){
  db.collection("stats").doc("visits").set(
    { count: firebase.firestore.FieldValue.increment(1) }, { merge:true }
  );
  if(!localStorage.getItem("bzr_visitor_id")){
    localStorage.setItem("bzr_visitor_id", Date.now()+"-"+Math.random().toString(36).slice(2));
    db.collection("stats").doc("uniqueUsers").set(
      { count: firebase.firestore.FieldValue.increment(1) }, { merge:true }
    );
  }
}

// ---------- دسته‌بندی‌ها (منو کرکره‌ای) ----------
function renderMenu(){
  const box = document.getElementById("menuAccordion");
  box.innerHTML = `<li><a href="#" data-cat="all">همه محصولات</a></li>` +
    allCategories.map(c=>`<li><a href="#" data-cat="${c.id}">${c.name}</a></li>`).join("");
  box.querySelectorAll("a").forEach(a=>{
    a.addEventListener("click",(e)=>{
      e.preventDefault();
      activeCategory = a.dataset.cat;
      currentPage = 1;
      renderProducts();
      document.getElementById("menuBox").classList.remove("open");
    });
  });
}

function loadCategories(){
  db.collection("categories").orderBy("order","asc").onSnapshot(snap=>{
    allCategories = snap.docs.map(d=>({id:d.id,...d.data()}));
    renderMenu();
  });
}

// ---------- محصولات ----------
function loadProducts(){
  db.collection("products").orderBy("createdAt","desc").onSnapshot(snap=>{
    allProducts = snap.docs.map(d=>({id:d.id,...d.data()}));
    renderProducts();
  });
}

function renderProducts(){
  const grid = document.getElementById("productsGrid");
  const filtered = activeCategory==="all" ? allProducts
    : allProducts.filter(p=>p.categoryId===activeCategory);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if(currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage-1)*PAGE_SIZE;
  const pageItems = filtered.slice(start, start+PAGE_SIZE);

  grid.innerHTML = pageItems.length ? pageItems.map(p=>`
    <a class="product-card" href="product.html?id=${p.id}">
      <div class="img-wrap"><img src="${(p.images&&p.images[0])||'assets/placeholder.svg'}" alt="${p.name}"></div>
      <div class="info">
        <h4>${p.name}</h4>
        <div class="price">${Number(p.price||0).toLocaleString('fa-IR')} تومان</div>
      </div>
    </a>`).join("") : `<p style="color:var(--text-dim);padding:30px;text-align:center">محصولی یافت نشد.</p>`;

  renderPagination(totalPages);
}

function renderPagination(totalPages){
  const box = document.getElementById("pagination");
  if(totalPages<=1){ box.innerHTML=""; return; }
  let html = "";
  for(let i=1;i<=totalPages;i++){
    html += `<button class="${i===currentPage?'active':''}" data-p="${i}">${i.toLocaleString('fa-IR')}</button>`;
  }
  box.innerHTML = html;
  box.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click",()=>{ currentPage = Number(b.dataset.p); renderProducts(); window.scrollTo({top:300,behavior:"smooth"}); });
  });
}

// ---------- تبلیغات ----------
function loadBanners(){
  db.collection("settings").doc("banners").onSnapshot(doc=>{
    const data = doc.data() || {};
    ["slot1","slot2","slot3"].forEach((key,i)=>{
      const el = document.getElementById("ad"+(i+1));
      const slot = data[key];
      if(slot && slot.img){
        el.innerHTML = `<a href="${slot.link||'#'}" target="_blank"><img src="${slot.img}"></a>`;
      } else {
        el.innerHTML = `جای تبلیغات ${i+1}`;
      }
    });
  });
}

// ---------- اسلایدر مطالب جدید ----------
function loadNews(){
  db.collection("settings").doc("news").onSnapshot(doc=>{
    const slides = (doc.data()||{}).slides || [];
    const track = document.getElementById("newsTrack");
    if(!slides.length){ track.innerHTML = `<div style="padding:16px;color:var(--text-dim);font-size:.85rem">مطلبی ثبت نشده</div>`; return; }
    track.innerHTML = slides.map((s,i)=>`
      <div class="news-slide ${i===0?'active':''}">
        <img src="${s.img}"><span>${s.title||''}</span>
      </div>`).join("");
    let idx=0;
    setInterval(()=>{
      const items = track.querySelectorAll(".news-slide");
      items[idx].classList.remove("active");
      idx = (idx+1)%items.length;
      items[idx].classList.add("active");
    }, 3500);
  });
}

// ---------- اطلاعات تماس ----------
function loadContact(){
  db.collection("settings").doc("contact").onSnapshot(doc=>{
    document.getElementById("contactBody").innerHTML =
      (doc.data()||{}).content || "اطلاعات تماس هنوز ثبت نشده است.";
  });
}

// ---------- UI عمومی ----------
document.addEventListener("DOMContentLoaded",()=>{
  trackVisit();
  loadCategories();
  loadProducts();
  loadBanners();
  loadNews();
  loadContact();

  document.getElementById("menuToggle").addEventListener("click",()=>{
    document.getElementById("menuBox").classList.toggle("open");
  });
  document.getElementById("contactBtn").addEventListener("click",()=>{
    document.getElementById("contactModal").classList.add("show");
  });
  document.querySelectorAll("[data-close]").forEach(b=>{
    b.addEventListener("click",(e)=> e.target.closest(".modal-overlay").classList.remove("show"));
  });
});
