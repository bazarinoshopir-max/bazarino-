let pColors = [];
let pSizes = [];
let pImageUrls = [];
let categoriesCache = [];

// ====== ورود / خروج ======
auth.onAuthStateChanged(user=>{
  document.getElementById("loginScreen").style.display = user ? "none" : "block";
  document.getElementById("dashboard").style.display = user ? "block" : "none";
  if(user){ initDashboard(); }
});

document.getElementById("loginBtn").addEventListener("click",()=>{
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPass").value;
  auth.signInWithEmailAndPassword(email, pass).catch(err=>{
    document.getElementById("loginMsg").innerHTML = `<div class="msg-box msg-err">ایمیل یا رمز عبور اشتباه است.</div>`;
  });
});
document.getElementById("logoutBtn").addEventListener("click",()=> auth.signOut());

// ====== تب‌ها ======
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-"+btn.dataset.tab).classList.add("active");
  });
});

function initDashboard(){
  loadCategoriesAdmin();
  loadProductsAdmin();
  loadBannersAdmin();
  loadNewsAdmin();
  loadContactAdmin();
  loadStatsAdmin();
}

// ====== دسته‌بندی‌ها ======
function loadCategoriesAdmin(){
  db.collection("categories").orderBy("order","asc").onSnapshot(snap=>{
    categoriesCache = snap.docs.map(d=>({id:d.id,...d.data()}));
    const select = document.getElementById("pCategory");
    select.innerHTML = categoriesCache.map(c=>`<option value="${c.id}">${c.name}</option>`).join("");
    const table = document.getElementById("categoriesTable");
    table.innerHTML = categoriesCache.map(c=>`
      <tr><td>${c.name}</td><td>${c.order}</td>
      <td><button class="btn-sm btn-danger" onclick="deleteCategory('${c.id}')">حذف</button></td></tr>
    `).join("");
  });
}
document.getElementById("addCatBtn").addEventListener("click",()=>{
  const name = document.getElementById("catName").value.trim();
  if(!name) return;
  db.collection("categories").add({ name, order: categoriesCache.length });
  document.getElementById("catName").value = "";
});
function deleteCategory(id){
  if(confirm("این شاخه حذف شود؟ محصولات داخلش حذف نمیشن ولی بی‌دسته میشن.")){
    db.collection("categories").doc(id).delete();
  }
}

// ====== چیپ‌های رنگ و سایز ======
function renderChips(containerId, arr){
  document.getElementById(containerId).innerHTML = arr.map((v,i)=>
    `<span class="chip">${v}<span onclick="removeChip('${containerId}',${i})">×</span></span>`).join("");
}
function removeChip(containerId, i){
  if(containerId==="pColorChips"){ pColors.splice(i,1); renderChips("pColorChips",pColors); }
  else { pSizes.splice(i,1); renderChips("pSizeChips",pSizes); }
}
document.getElementById("pColorInput").addEventListener("keydown",(e)=>{
  if(e.key==="Enter" && e.target.value.trim()){
    e.preventDefault();
    pColors.push(e.target.value.trim()); e.target.value="";
    renderChips("pColorChips",pColors);
  }
});
document.getElementById("pSizeInput").addEventListener("keydown",(e)=>{
  if(e.key==="Enter" && e.target.value.trim()){
    e.preventDefault();
    pSizes.push(e.target.value.trim()); e.target.value="";
    renderChips("pSizeChips",pSizes);
  }
});

// ====== آپلود عکس محصول ======
document.getElementById("pImages").addEventListener("change", async (e)=>{
  const files = Array.from(e.target.files);
  const progressEl = document.getElementById("uploadProgress");
  for(const file of files){
    const path = `products/${Date.now()}_${file.name}`;
    const ref = storage.ref().child(path);
    const task = ref.put(file);
    await new Promise((resolve,reject)=>{
      task.on("state_changed",
        snap=>{ progressEl.textContent = `در حال آپلود... ${Math.round(snap.bytesTransferred/snap.totalBytes*100)}%`; },
        err=>{ progressEl.textContent = "خطا در آپلود عکس"; reject(err); },
        async ()=>{
          const url = await task.snapshot.ref.getDownloadURL();
          pImageUrls.push(url);
          document.getElementById("imgThumbs").innerHTML += `<img src="${url}">`;
          progressEl.textContent = "";
          resolve();
        });
    });
  }
});

// ====== ثبت محصول ======
document.getElementById("saveProductBtn").addEventListener("click",()=>{
  const name = document.getElementById("pName").value.trim();
  const categoryId = document.getElementById("pCategory").value;
  const price = Number(document.getElementById("pPrice").value||0);
  const stock = Number(document.getElementById("pStock").value||0);
  const galleryStyle = document.getElementById("pGalleryStyle").value;
  const msg = document.getElementById("productMsg");

  if(!name || !categoryId || !pImageUrls.length){
    msg.innerHTML = `<div class="msg-box msg-err">نام، دسته‌بندی و حداقل یک عکس الزامیه.</div>`;
    return;
  }
  db.collection("products").add({
    name, categoryId, price, stock, galleryStyle,
    colors: pColors, sizes: pSizes, images: pImageUrls,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(()=>{
    msg.innerHTML = `<div class="msg-box msg-ok">محصول با موفقیت در شاخه انتخاب‌شده ثبت شد.</div>`;
    document.getElementById("pName").value="";
    document.getElementById("pPrice").value="";
    document.getElementById("pStock").value="";
    pColors=[]; pSizes=[]; pImageUrls=[];
    renderChips("pColorChips",pColors); renderChips("pSizeChips",pSizes);
    document.getElementById("imgThumbs").innerHTML="";
  });
});

function loadProductsAdmin(){
  db.collection("products").orderBy("createdAt","desc").onSnapshot(snap=>{
    const table = document.getElementById("productsTable");
    table.innerHTML = snap.docs.map(d=>{
      const p = d.data();
      const cat = categoriesCache.find(c=>c.id===p.categoryId);
      return `<tr>
        <td><img src="${(p.images&&p.images[0])||''}" style="width:40px;height:40px;object-fit:cover;border-radius:6px"></td>
        <td>${p.name}</td><td>${cat?cat.name:'—'}</td>
        <td>${Number(p.price||0).toLocaleString('fa-IR')}</td><td>${p.stock}</td>
        <td><button class="btn-sm btn-danger" onclick="deleteProduct('${d.id}')">حذف</button></td>
      </tr>`;
    }).join("");
  });
}
function deleteProduct(id){
  if(confirm("این محصول حذف شود؟")) db.collection("products").doc(id).delete();
}

// ====== تبلیغات ======
function loadBannersAdmin(){
  db.collection("settings").doc("banners").get().then(doc=>{
    const data = doc.data() || {};
    const form = document.getElementById("bannersForm");
    form.innerHTML = ["slot1","slot2","slot3"].map((key,i)=>`
      <div class="field" style="border-bottom:1px solid #2a2a2e;padding-bottom:14px;margin-bottom:14px">
        <label>بنر ${i+1} (اندازه پیشنهادی: 300×400 پیکسل)</label>
        <input type="file" accept="image/*" id="banner_${key}_file">
        <input placeholder="لینک مقصد (اختیاری)" id="banner_${key}_link" value="${(data[key]&&data[key].link)||''}" style="margin-top:6px">
        <img src="${(data[key]&&data[key].img)||''}" style="width:80px;margin-top:6px;border-radius:6px;${data[key]&&data[key].img?'':'display:none'}">
        <button class="btn-sm" style="margin-top:8px" onclick="saveBanner('${key}')">ذخیره بنر ${i+1}</button>
      </div>
    `).join("");
  });
}
function saveBanner(key){
  const fileInput = document.getElementById(`banner_${key}_file`);
  const link = document.getElementById(`banner_${key}_link`).value.trim();
  const save = (img)=>{
    const payload = {}; payload[key] = { img, link };
    db.collection("settings").doc("banners").set(payload, { merge:true }).then(loadBannersAdmin);
  };
  if(fileInput.files[0]){
    const ref = storage.ref().child(`banners/${key}_${Date.now()}`);
    ref.put(fileInput.files[0]).then(snap=>snap.ref.getDownloadURL()).then(save);
  } else {
    db.collection("settings").doc("banners").get().then(doc=>{
      const old = (doc.data()||{})[key] || {};
      save(old.img || "");
    });
  }
}

// ====== مطالب جدید (اسلایدر) ======
function loadNewsAdmin(){
  db.collection("settings").doc("news").onSnapshot(doc=>{
    const slides = (doc.data()||{}).slides || [];
    document.getElementById("newsList").innerHTML = slides.map((s,i)=>`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <img src="${s.img}" style="width:50px;height:50px;object-fit:cover;border-radius:6px">
        <span style="flex:1">${s.title}</span>
        <button class="btn-sm btn-danger" onclick="deleteNewsSlide(${i})">حذف</button>
      </div>
    `).join("");
  });
}
document.getElementById("addNewsBtn").addEventListener("click",()=>{
  const title = document.getElementById("newsTitle").value.trim();
  const file = document.getElementById("newsImage").files[0];
  if(!title || !file) return alert("عنوان و عکس الزامیه");
  const ref = storage.ref().child(`news/${Date.now()}_${file.name}`);
  ref.put(file).then(snap=>snap.ref.getDownloadURL()).then(url=>{
    db.collection("settings").doc("news").get().then(doc=>{
      const slides = (doc.data()||{}).slides || [];
      slides.push({ title, img:url });
      db.collection("settings").doc("news").set({ slides }, { merge:true });
      document.getElementById("newsTitle").value="";
      document.getElementById("newsImage").value="";
    });
  });
});
function deleteNewsSlide(i){
  db.collection("settings").doc("news").get().then(doc=>{
    const slides = (doc.data()||{}).slides || [];
    slides.splice(i,1);
    db.collection("settings").doc("news").set({ slides });
  });
}

// ====== تماس با ما ======
function loadContactAdmin(){
  db.collection("settings").doc("contact").get().then(doc=>{
    document.getElementById("contactText").value = (doc.data()||{}).content || "";
  });
}
document.getElementById("saveContactBtn").addEventListener("click",()=>{
  const content = document.getElementById("contactText").value;
  db.collection("settings").doc("contact").set({ content }, { merge:true });
  alert("ذخیره شد");
});

// ====== آمار ======
function loadStatsAdmin(){
  db.collection("stats").doc("visits").onSnapshot(doc=>{
    document.getElementById("statVisits").textContent = ((doc.data()||{}).count||0).toLocaleString('fa-IR');
  });
  db.collection("stats").doc("uniqueUsers").onSnapshot(doc=>{
    document.getElementById("statUsers").textContent = ((doc.data()||{}).count||0).toLocaleString('fa-IR');
  });
}
