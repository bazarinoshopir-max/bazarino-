function getProductId(){
  return new URLSearchParams(window.location.search).get("id");
}

let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

function renderGallery(p){
  const wrap = document.getElementById("gallery");
  const images = p.images && p.images.length ? p.images : ["assets/placeholder.svg"];
  if(p.galleryStyle === "reel"){
    wrap.className = "gallery reel";
    wrap.innerHTML = images.map(src=>`<div class="reel-item"><img src="${src}"></div>`).join("");
  } else {
    wrap.className = "gallery slider";
    wrap.innerHTML = `
      <div class="slider-track">${images.map(src=>`<img src="${src}">`).join("")}</div>
      <button class="sl-nav prev">&#10095;</button>
      <button class="sl-nav next">&#10094;</button>
      <div class="sl-dots">${images.map((_,i)=>`<span data-i="${i}" class="${i===0?'active':''}"></span>`).join("")}</div>
    `;
    let idx=0;
    const track = wrap.querySelector(".slider-track");
    const dots = wrap.querySelectorAll(".sl-dots span");
    function go(i){
      idx = (i+images.length)%images.length;
      track.style.transform = `translateX(${idx*100}%)`;
      dots.forEach(d=>d.classList.remove("active"));
      dots[idx].classList.add("active");
    }
    wrap.querySelector(".prev").onclick = ()=>go(idx-1);
    wrap.querySelector(".next").onclick = ()=>go(idx+1);
    dots.forEach(d=>d.onclick=()=>go(Number(d.dataset.i)));
  }
}

function renderOptions(p){
  const colorBox = document.getElementById("colorOptions");
  const sizeBox = document.getElementById("sizeOptions");

  if(p.colors && p.colors.length){
    colorBox.innerHTML = p.colors.map(c=>`<button class="opt-chip" data-color="${c}">${c}</button>`).join("");
    colorBox.querySelectorAll("button").forEach(b=>{
      b.onclick = ()=>{
        colorBox.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        selectedColor = b.dataset.color;
      };
    });
  } else { colorBox.innerHTML = `<span style="color:var(--text-dim)">—</span>`; }

  if(p.sizes && p.sizes.length){
    sizeBox.innerHTML = p.sizes.map(s=>`<button class="opt-chip" data-size="${s}">${s}</button>`).join("");
    sizeBox.querySelectorAll("button").forEach(b=>{
      b.onclick = ()=>{
        sizeBox.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        selectedSize = b.dataset.size;
      };
    });
  } else { sizeBox.innerHTML = `<span style="color:var(--text-dim)">—</span>`; }
}

function buildOrderText(p){
  let t = `سلام، سفارش از سایت بازارینو:\n${p.name}`;
  if(selectedColor) t += `\nرنگ: ${selectedColor}`;
  if(selectedSize) t += `\nسایز: ${selectedSize}`;
  return t;
}

function loadProduct(){
  const id = getProductId();
  if(!id){ document.getElementById("productWrap").innerHTML = "محصول یافت نشد."; return; }
  db.collection("products").doc(id).get().then(doc=>{
    if(!doc.exists){ document.getElementById("productWrap").innerHTML = "محصول یافت نشد."; return; }
    currentProduct = { id: doc.id, ...doc.data() };
    const p = currentProduct;
    document.title = p.name + " | بازارینو";
    document.getElementById("pName").textContent = p.name;
    document.getElementById("pPrice").textContent = Number(p.price||0).toLocaleString('fa-IR') + " تومان";
    document.getElementById("pStock").textContent = (p.stock>0) ? `موجود (${p.stock} عدد)` : "ناموجود";
    renderGallery(p);
    renderOptions(p);
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  loadProduct();
  document.getElementById("buyBtn").addEventListener("click",()=>{
    document.getElementById("buyModal").classList.add("show");
  });
  document.querySelectorAll("[data-close]").forEach(b=>{
    b.addEventListener("click",(e)=> e.target.closest(".modal-overlay").classList.remove("show"));
  });
  document.getElementById("buyTelegram").addEventListener("click",()=>{
    const text = encodeURIComponent(buildOrderText(currentProduct));
    window.open(`${SOCIAL_LINKS.telegram}?text=${text}`, "_blank");
  });
  document.getElementById("buyRubika").addEventListener("click",()=>{
    window.open(SOCIAL_LINKS.rubika, "_blank");
  });
  document.getElementById("buyBale").addEventListener("click",()=>{
    window.open(SOCIAL_LINKS.bale, "_blank");
  });
});
