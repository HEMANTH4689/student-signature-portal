const headers=()=>({"x-admin-password":document.getElementById("pass").value});
const msg=document.getElementById("msg");
async function importExcel(){
 const f=document.getElementById("excel").files[0]; if(!f)return msg.textContent="Select Excel file";
 const fd=new FormData();fd.append("file",f);
 const r=await fetch("/api/admin/import",{method:"POST",headers:headers(),body:fd});const d=await r.json();
 msg.textContent=r.ok?`Imported ${d.added} students`:d.error; if(r.ok)loadStats();
}
async function loadStats(){
 const r=await fetch("/api/admin/stats",{headers:headers()});const d=await r.json();if(!r.ok){msg.textContent=d.error;return;}
 document.getElementById("stats").innerHTML=`<h2>Total: ${d.total} | Submitted: ${d.submitted} | Pending: ${d.pending}</h2>`;
 document.getElementById("rows").innerHTML=d.rows.map(x=>`<tr><td>${x.signature_id}</td><td>${x.name}</td><td>${x.status}</td><td>${x.submitted_at||""}</td><td>${x.status==="Submitted"?`<button onclick="resetSig('${x.signature_id}')">Reset</button>`:""}</td></tr>`).join("");
}
async function resetSig(id){if(!confirm("Reset "+id+"?"))return;await fetch("/api/admin/reset/"+encodeURIComponent(id),{method:"POST",headers:headers()});loadStats();}
async function downloadZip(){
 const p=document.getElementById("pass").value;
 const r=await fetch("/api/admin/download-zip",{headers:{"x-admin-password":p}});
 if(!r.ok){msg.textContent="Unauthorized";return;}
 const b=await r.blob(),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="all-signatures.zip";a.click();
}