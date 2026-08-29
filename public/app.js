let currentId="", pad;
const msg=document.getElementById("msg"), form=document.getElementById("form");
function setMsg(t,ok=false){msg.textContent=t;msg.className=ok?"ok":"error";}
async function findStudent(){
  const id=document.getElementById("sid").value.trim();
  if(!id)return setMsg("Please enter Signature ID");
  msg.textContent="";
  const r=await fetch("/api/student/"+encodeURIComponent(id));
  const d=await r.json();
  if(!r.ok)return setMsg(d.error);
  if(d.submitted)return setMsg("Signature has already been submitted.");
  currentId=d.signature_id;
  document.getElementById("showId").textContent=d.signature_id;
  document.getElementById("showName").textContent=d.name;
  form.classList.remove("hidden");
  setupPad();
}
function setupPad(){
 const c=document.getElementById("canvas"), ratio=Math.max(window.devicePixelRatio||1,1);
 c.width=c.offsetWidth*ratio;c.height=220*ratio;c.getContext("2d").scale(ratio,ratio);
 pad=new SignaturePad(c,{minWidth:1,maxWidth:2.5});
}
function clearPad(){pad.clear();}
async function submitSignature(){
 if(!pad || pad.isEmpty())return setMsg("Please provide your signature first.");
 const image=pad.toDataURL("image/png");
 const r=await fetch("/api/signature",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({signature_id:currentId,image})});
 const d=await r.json();
 if(!r.ok)return setMsg(d.error);
 setMsg("✓ Signature submitted successfully!",true);
 form.classList.add("hidden"); document.getElementById("sid").value="";
}