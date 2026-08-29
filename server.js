import express from "express";
import multer from "multer";
import Database from "better-sqlite3";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";

fs.mkdirSync(path.join(__dirname, "uploads"), {recursive:true});
const db = new Database(path.join(__dirname, "data", "signatures.db"));
db.exec(`
CREATE TABLE IF NOT EXISTS students(
  signature_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS signatures(
  signature_id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL
);
`);

const upload = multer({dest:path.join(__dirname,"uploads")});
app.use(express.json({limit:"10mb"}));
app.use(express.static(path.join(__dirname,"public")));

function admin(req,res,next){
  if(req.headers["x-admin-password"] !== ADMIN_PASSWORD)
    return res.status(401).json({error:"Unauthorized"});
  next();
}

app.get("/api/student/:id",(req,res)=>{
  const id=req.params.id.trim();
  const row=db.prepare("SELECT signature_id,name FROM students WHERE signature_id=?").get(id);
  if(!row) return res.status(404).json({error:"Invalid Signature ID"});
  const submitted=db.prepare("SELECT 1 FROM signatures WHERE signature_id=?").get(id);
  res.json({...row, submitted:!!submitted});
});

app.post("/api/signature", async (req,res)=>{
  const {signature_id,image}=req.body;
  if(!signature_id || !image) return res.status(400).json({error:"Missing data"});
  const student=db.prepare("SELECT 1 FROM students WHERE signature_id=?").get(signature_id);
  if(!student) return res.status(404).json({error:"Invalid Signature ID"});
  if(db.prepare("SELECT 1 FROM signatures WHERE signature_id=?").get(signature_id))
    return res.status(409).json({error:"Signature already submitted"});
  const base64=image.replace(/^data:image\/png;base64,/,"");
  try{
    fs.writeFileSync(path.join(__dirname,"uploads",`${signature_id}.png`),base64,"base64");
    db.prepare("INSERT INTO signatures(signature_id,submitted_at) VALUES(?,?)")
      .run(signature_id,new Date().toISOString());
    res.json({ok:true,message:"Signature submitted successfully"});
  }catch(e){res.status(500).json({error:"Unable to save signature"});}
});

app.post("/api/admin/import", admin, upload.single("file"), (req,res)=>{
  try{
    const wb=XLSX.readFile(req.file.path);
    const ws=wb.Sheets[req.body.sheet || wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
    let added=0;
    const insert=db.prepare("INSERT OR REPLACE INTO students(signature_id,name) VALUES(?,?)");
    const tx=db.transaction(()=>{
      for(let i=1;i<rows.length;i++){
        const id=String(rows[i][0]||"").trim(); // Column A
        const name=String(rows[i][1]||"").trim(); // Column B
        if(id && name){insert.run(id,name);added++;}
      }
    });
    tx();
    fs.unlinkSync(req.file.path);
    res.json({ok:true,added});
  }catch(e){res.status(500).json({error:e.message});}
});

app.get("/api/admin/stats", admin,(req,res)=>{
  const total=db.prepare("SELECT COUNT(*) c FROM students").get().c;
  const submitted=db.prepare("SELECT COUNT(*) c FROM signatures").get().c;
  const rows=db.prepare(`
    SELECT s.signature_id,s.name,
    CASE WHEN g.signature_id IS NULL THEN 'Pending' ELSE 'Submitted' END status,
    g.submitted_at
    FROM students s LEFT JOIN signatures g ON s.signature_id=g.signature_id
    ORDER BY s.signature_id
  `).all();
  res.json({total,submitted,pending:total-submitted,rows});
});

app.post("/api/admin/reset/:id",admin,(req,res)=>{
  const id=req.params.id;
  db.prepare("DELETE FROM signatures WHERE signature_id=?").run(id);
  const f=path.join(__dirname,"uploads",`${id}.png`);
  if(fs.existsSync(f)) fs.unlinkSync(f);
  res.json({ok:true});
});

app.get("/api/admin/download-zip",admin,(req,res)=>{
  res.attachment("all-signatures.zip");
  const archive=archiver("zip",{zlib:{level:9}});
  archive.pipe(res);
  archive.directory(path.join(__dirname,"uploads"),false);
  archive.finalize();
});

app.listen(PORT,()=>console.log(`Running on port ${PORT}`));