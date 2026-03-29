import { useState, useRef } from "react";

/* ═══════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════ */
const TODAY   = new Date().toISOString().slice(0,10);
const G       = "#2ecc71";
const G2      = "#27ae60";
const API_HOST = "v3.football.api-sports.io";
const API_BASE = `https://${API_HOST}`;

const LEAGUES = [
  // ── UEFA Interclub
  {name:"Champions League",id:2},
  {name:"Europa League",id:3},
  {name:"Conference League",id:848},
  // ── Top 5
  {name:"Premier League (ENG)",id:39},
  {name:"La Liga (ES)",id:140},
  {name:"Serie A (IT)",id:135},
  {name:"Bundesliga (DE)",id:78},
  {name:"Ligue 1 (FR)",id:61},
  // ── Anglia
  {name:"Championship (ENG)",id:40},
  {name:"League One (ENG)",id:41},
  {name:"FA Cup",id:45},
  {name:"EFL Cup",id:48},
  // ── Spania
  {name:"La Liga 2 (ES)",id:141},
  {name:"Copa del Rey",id:143},
  // ── Italia
  {name:"Serie B (IT)",id:136},
  {name:"Coppa Italia",id:137},
  // ── Germania
  {name:"Bundesliga 2 (DE)",id:79},
  {name:"DFB Pokal",id:81},
  // ── Franta
  {name:"Ligue 2 (FR)",id:62},
  {name:"Coupe de France",id:66},
  // ── Olanda
  {name:"Eredivisie (NL)",id:88},
  {name:"Eerste Divisie (NL)",id:89},
  {name:"KNVB Beker",id:90},
  // ── Portugalia
  {name:"Primeira Liga (PT)",id:94},
  {name:"Liga Portugal 2",id:95},
  {name:"Taca de Portugal",id:96},
  // ── Turcia
  {name:"Süper Lig (TR)",id:203},
  {name:"1. Lig (TR)",id:204},
  // ── Belgia
  {name:"Pro League (BE)",id:144},
  // ── Scotia
  {name:"Scottish Premiership",id:179},
  {name:"Scottish Championship",id:180},
  // ── Austria
  {name:"Bundesliga (AT)",id:218},
  // ── Polonia
  {name:"Ekstraklasa (PL)",id:106},
  // ── Cehia
  {name:"Czech Liga",id:345},
  // ── Ungaria
  {name:"OTP Bank Liga (HU)",id:271},
  // ── Croatia
  {name:"HNL (HR)",id:210},
  // ── Serbia
  {name:"SuperLiga (RS)",id:286},
  // ── Ucraina
  {name:"Premier League (UA)",id:333},
  // ── Danemarca
  {name:"Superliga (DK)",id:119},
  // ── Norvegia
  {name:"Eliteserien (NO)",id:103},
  // ── Suedia
  {name:"Allsvenskan (SE)",id:113},
  // ── Finlanda
  {name:"Veikkausliiga (FI)",id:244},
  // ── Elvetia
  {name:"Super League (CH)",id:207},
  // ── Grecia
  {name:"Super League (GR)",id:197},
  // ── Cipru
  {name:"1. Division (CY)",id:234},
  // ── Slovacia
  {name:"Fortuna Liga (SK)",id:332},
  // ── Slovenia
  {name:"PrvaLiga (SI)",id:292},
  // ── Bulgaria
  {name:"First League (BG)",id:172},
  // ── Bosnia
  {name:"Premier Liga (BA)",id:327},
  // ── Albania
  {name:"Kategoria (AL)",id:387},
  // ── Romania
  {name:"Superliga (RO)",id:283},
  {name:"Liga 2 (RO)",id:285},
  {name:"Cupa Romaniei",id:284},
  // ── Israel
  {name:"Ligat HaAl (IL)",id:272},
  // ── Rusia
  {name:"Premier Liga (RU)",id:235},
  // ── Asia
  {name:"AFC Champions League",id:17},
  {name:"J1 League (JP)",id:98},
  {name:"K League 1 (KR)",id:292},
  {name:"Saudi Pro League",id:307},
  {name:"UAE League",id:435},
  // ── Africa
  {name:"CAF Champions League",id:20},
  // ── America de Sud
  {name:"Copa Libertadores",id:13},
  {name:"Copa Sudamericana",id:11},
  {name:"Brasileirao (BR)",id:71},
  {name:"Primera Division (AR)",id:128},
  // ── America de Nord
  {name:"MLS (USA)",id:253},
  {name:"Liga MX (MX)",id:262},
  {name:"CONCACAF Champions",id:16},
  // ── International
  {name:"Nations League",id:5},
  {name:"World Cup Qualif. (EU)",id:32},
  {name:"Euro 2024 Calif.",id:960},
  {name:"Mondiale Cluburi",id:15},
  // ── Amicale
  {name:"Amicale Cluburi",id:667},
  {name:"Amicale Nationale",id:10},
];
const SEASON = 2025;

const p2o = p => p>0 ? (100/p).toFixed(2) : "—";

/* ═══════════════════════════════════════
   API-FOOTBALL CALLS
═══════════════════════════════════════ */
async function apf(apiKey, path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers:{"x-rapidapi-key":apiKey,"x-rapidapi-host":API_HOST},
  });
  if(!res.ok) throw new Error(`API ${res.status}`);
  const d = await res.json();
  if(d.errors && Object.keys(d.errors).length>0) throw new Error(JSON.stringify(d.errors));
  return d.response;
}

async function findTeam(apiKey, name) {
  const res = await apf(apiKey, `/teams?search=${encodeURIComponent(name)}`);
  if(!res?.length) throw new Error(`Echipa "${name}" negăsită. Scrie numele exact în engleză.`);
  return res[0].team;
}

async function getTeamStats(apiKey, teamId, leagueId) {
  const [stats, lastFive, injuries] = await Promise.all([
    apf(apiKey, `/teams/statistics?team=${teamId}&league=${leagueId}&season=${SEASON}`),
    apf(apiKey, `/fixtures?team=${teamId}&league=${leagueId}&season=${SEASON}&last=5`),
    apf(apiKey, `/injuries?team=${teamId}&league=${leagueId}&season=${SEASON}`).catch(()=>[]),
  ]);

  const form = (lastFive||[]).map(f=>{
    const isH = f.teams.home.id===teamId;
    const gs  = isH ? f.goals.home : f.goals.away;
    const gc  = isH ? f.goals.away : f.goals.home;
    return {
      result: gs>gc?"W":gs<gc?"L":"D",
      score: `${f.teams.home.name} ${f.goals.home}-${f.goals.away} ${f.teams.away.name}`,
      opponent: isH?f.teams.away.name:f.teams.home.name,
      date: f.fixture.date?.slice(0,10),
      isHome: isH,
    };
  }).reverse();

  return {
    stats,
    form,
    injuries: (injuries||[]).slice(0,6).map(i=>({name:i.player.name,reason:i.player.reason||"accidentat"})),
  };
}

async function getH2H(apiKey, id1, id2) {
  const res = await apf(apiKey, `/fixtures/headtohead?h2h=${id1}-${id2}&last=10`);
  return (res||[]).map(f=>({
    date: f.fixture.date?.slice(0,10),
    home: f.teams.home.name,
    away: f.teams.away.name,
    score: `${f.goals.home}-${f.goals.away}`,
    winner: f.teams.home.winner?"home":f.teams.away.winner?"away":"draw",
  }));
}

/* ═══════════════════════════════════════
   CLAUDE ANALYSIS
═══════════════════════════════════════ */
async function claudeAnalyze(home, away, league, date, liveCtx, extraCtx) {
  const ctx = [liveCtx, extraCtx].filter(Boolean).join("\n\n");
  const prompt = `Analizează pentru pariuri: ${home} vs ${away}${league?" ("+league+")":""}, data: ${date}.
${ctx?"DATE REALE:\n"+ctx+"\n\n":""}
Returnează EXCLUSIV JSON fără text sau markdown în jur. Folosește datele reale furnizate. Înlocuiește valorile exemplu cu estimări bazate pe statisticile reale:
{"result_probs":{"home":50,"draw":25,"away":25,"home_draw":70,"draw_away":50},"goals":{"0":8,"1":22,"2":30,"3":24,"4+":16},"over_under":{"1.5":{"over":72,"under":28},"2.5":{"over":55,"under":45},"3.5":{"over":32,"under":68},"4.5":{"over":18,"under":82}},"btts":45,"clean_sheet_home":30,"clean_sheet_away":35,"top_scores":[{"score":"1-0","prob":11},{"score":"2-1","prob":10},{"score":"1-1","prob":9},{"score":"2-0","prob":9},{"score":"0-1","prob":8},{"score":"0-0","prob":7}],"cards":{"over_2_5":60,"over_3_5":38,"home_yellow":70,"away_yellow":65,"red_card":12},"corners":{"over_7_5":60,"over_9_5":38,"over_11_5":20,"home_more":52},"scorers":[{"name":"Jucator A","prob":42},{"name":"Jucator B","prob":35},{"name":"Jucator C","prob":28}],"handicap":{"home_minus1":30,"home_minus05":52,"away_plus1":70},"halftime":{"home_lead":40,"draw":35,"away_lead":25,"over_0_5":62,"over_1_5":36},"best_pick":{"label":"Over 2.5 goluri","prob":55,"reason":"Motivare concisă bazată pe date.","best_bookie":"Superbet"},"bookie_tips":[{"name":"Superbet","estimated_odd":"1.85","note":"boost disponibil"},{"name":"Betano","estimated_odd":"1.82","note":"cashback"},{"name":"Unibet","estimated_odd":"1.80","note":"freebet"},{"name":"bet365","estimated_odd":"1.83","note":"best odds"}],"analysis":"Analiză detaliată în română, 150-200 cuvinte, cu referințe la forma reală, statistici, absențe și h2h."}
IMPORTANT: scorers trebuie să conțină numele reale ale jucătorilor cheie. result_probs: home+draw+away=100. goals: suma=100. Toate numerele=procente 0-100.`;

  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-haiku-4-5-20251001",
      max_tokens:1800,
      system:"Returnezi EXCLUSIV JSON valid. Zero text înainte sau după. Zero markdown.",
      messages:[{role:"user",content:prompt}],
    }),
  });
  if(!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text().then(t=>t.slice(0,150))}`);
  const data = await res.json();
  if(data.error) throw new Error(data.error.message);
  const txt = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
  const m = txt.match(/\{[\s\S]*\}/);
  if(!m) throw new Error("Răspuns invalid Claude: "+txt.slice(0,120));
  return JSON.parse(m[0]);
}

/* ═══════════════════════════════════════
   PDF EXPORT (jsPDF via CDN)
═══════════════════════════════════════ */
async function exportPDF(home, away, date, analysis, h2h, homeStats, awayStats) {
  // Load jsPDF dynamically
  if(!window.jspdf) {
    await new Promise((res,rej)=>{
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload=res; s.onerror=rej;
      document.head.appendChild(s);
    });
  }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({unit:"mm",format:"a4"});
  const W=210, pad=15;
  let y=20;

  const text=(t,x,yy,opts={})=>{ doc.text(t,x,yy,opts); };
  const line=()=>{ doc.setDrawColor(50,50,50); doc.line(pad,y,W-pad,y); y+=5; };
  const nl=(n=5)=>{ y+=n; };
  const checkPage=()=>{ if(y>275){doc.addPage();y=20;} };

  // Header
  doc.setFillColor(15,8,0);
  doc.rect(0,0,W,30,"F");
  doc.setTextColor(232,112,58);
  doc.setFontSize(22);
  doc.setFont("helvetica","bold");
  text("FootballAnalyzer",pad,14);
  doc.setTextColor(200,150,100);
  doc.setFontSize(10);
  doc.setFont("helvetica","normal");
  text(`Analiză: ${home} vs ${away}  |  ${date}`,pad,22);
  y=38;

  // Generated
  doc.setTextColor(100,100,100);
  doc.setFontSize(8);
  text(`Generat: ${new Date().toLocaleString("ro-RO")}  |  ⚠ Analiză statistică, nu sfat financiar. 18+`,pad,y);
  y+=8; line();

  // Best pick
  if(analysis.best_pick){
    const p=analysis.best_pick;
    doc.setFillColor(10,31,10);
    doc.rect(pad,y,W-pad*2,22,"F");
    doc.setTextColor(46,204,113);
    doc.setFontSize(8);
    doc.setFont("helvetica","bold");
    text("★ PRONOSTIC RECOMANDAT",pad+3,y+6);
    doc.setFontSize(13);
    text(p.label,pad+3,y+13);
    doc.setFontSize(8);
    doc.setFont("helvetica","normal");
    doc.setTextColor(140,180,140);
    text(`Prob: ${p.prob}%  |  Cotă fair: ~${p2o(p.prob)}x  |  ${p.best_bookie}`,pad+3,y+19);
    y+=26; nl(2);
  }

  // Result probs
  if(analysis.result_probs){
    const r=analysis.result_probs;
    doc.setTextColor(120,80,50); doc.setFontSize(8); doc.setFont("helvetica","bold");
    text("REZULTAT FINAL",pad,y); y+=5;
    [
      {l:`1 — ${home}`,v:r.home,c:[46,204,113]},
      {l:"X — Egal",v:r.draw,c:[232,160,48]},
      {l:`2 — ${away}`,v:r.away,c:[224,80,64]},
    ].forEach(({l,v,c})=>{
      doc.setTextColor(180,140,100); doc.setFontSize(8); doc.setFont("helvetica","normal");
      text(l,pad,y);
      doc.setTextColor(...c); doc.setFont("helvetica","bold");
      text(`${v}%  (~${p2o(v)}x)`,W-pad,y,{align:"right"});
      // bar
      doc.setFillColor(30,20,10); doc.rect(pad+55,y-3,100,3,"F");
      doc.setFillColor(...c); doc.rect(pad+55,y-3,v,3,"F");
      y+=7; checkPage();
    });
    nl(3);
  }

  // Over/Under
  if(analysis.over_under){
    doc.setTextColor(120,80,50); doc.setFontSize(8); doc.setFont("helvetica","bold");
    text("OVER / UNDER GOLURI",pad,y); y+=5;
    Object.entries(analysis.over_under).forEach(([k,v])=>{
      doc.setTextColor(160,120,80); doc.setFont("helvetica","normal");
      text(`Over ${k}:`,pad,y);
      doc.setTextColor(46,204,113);
      text(`${v.over}%  (~${p2o(v.over)}x)`,pad+35,y);
      doc.setTextColor(160,120,80);
      text(`Under ${k}:`,pad+80,y);
      doc.setTextColor(224,80,64);
      text(`${v.under}%  (~${p2o(v.under)}x)`,pad+110,y);
      y+=6; checkPage();
    });
    nl(2);
  }

  // BTTS + Cards + Corners in columns
  line();
  const cols=[[],[],[]];
  if(analysis.btts!=null){
    cols[0].push("AMBELE MARCHEAZĂ");
    cols[0].push(`DA: ${analysis.btts}%  (~${p2o(analysis.btts)}x)`);
    cols[0].push(`NU: ${100-analysis.btts}%`);
    if(analysis.clean_sheet_home!=null) cols[0].push(`CS ${home}: ${analysis.clean_sheet_home}%`);
    if(analysis.clean_sheet_away!=null) cols[0].push(`CS ${away}: ${analysis.clean_sheet_away}%`);
  }
  if(analysis.cards){
    const c=analysis.cards;
    cols[1].push("CARTONAȘE");
    cols[1].push(`Over 2.5: ${c.over_2_5}%`);
    cols[1].push(`Over 3.5: ${c.over_3_5}%`);
    cols[1].push(`Galben ${home}: ${c.home_yellow}%`);
    cols[1].push(`Galben ${away}: ${c.away_yellow}%`);
    cols[1].push(`Roșu în meci: ${c.red_card}%`);
  }
  if(analysis.corners){
    const c=analysis.corners;
    cols[2].push("CORNERE");
    cols[2].push(`Over 7.5: ${c.over_7_5}%`);
    cols[2].push(`Over 9.5: ${c.over_9_5}%`);
    cols[2].push(`Over 11.5: ${c.over_11_5}%`);
    cols[2].push(`Mai multe ${home}: ${c.home_more}%`);
  }
  const maxR=Math.max(...cols.map(c=>c.length));
  const cw=58;
  for(let r=0;r<maxR;r++){
    cols.forEach((col,ci)=>{
      if(!col[r]) return;
      const x=pad+ci*cw;
      if(r===0){doc.setFont("helvetica","bold");doc.setTextColor(120,80,50);}
      else{doc.setFont("helvetica","normal");doc.setTextColor(160,120,80);}
      doc.setFontSize(7.5);
      text(col[r],x,y);
    });
    y+=5.5; checkPage();
  }
  nl(3);

  // Top scores
  if(analysis.top_scores){
    line();
    doc.setTextColor(120,80,50); doc.setFontSize(8); doc.setFont("helvetica","bold");
    text("SCORURI EXACTE",pad,y); y+=5;
    analysis.top_scores.forEach((s,i)=>{
      doc.setTextColor(i===0?[46,204,113]:[160,120,80]);
      if(Array.isArray(doc.getTextColor)) {}
      i===0?doc.setTextColor(46,204,113):doc.setTextColor(160,120,80);
      doc.setFont(i===0?"helvetica":"helvetica", i===0?"bold":"normal");
      doc.setFontSize(i===0?9:8);
      text(`${s.score}  ${s.prob}%  (~${p2o(s.prob)}x)`, pad+(i%3)*55, y+(Math.floor(i/3))*7);
    });
    y+=Math.ceil(analysis.top_scores.length/3)*7+4;
  }

  // Scorers
  if(analysis.scorers?.length){
    line();
    doc.setTextColor(120,80,50); doc.setFontSize(8); doc.setFont("helvetica","bold");
    text("MARCHEAZĂ ÎN MECI",pad,y); y+=5;
    analysis.scorers.forEach(s=>{
      doc.setTextColor(160,120,80); doc.setFont("helvetica","normal"); doc.setFontSize(8);
      text(`${s.name}: ${s.prob}%  (~${p2o(s.prob)}x)`,pad,y); y+=5.5; checkPage();
    });
  }

  // H2H
  if(h2h?.length){
    line(); checkPage();
    doc.setTextColor(120,80,50); doc.setFontSize(8); doc.setFont("helvetica","bold");
    text("HEAD TO HEAD (ultimele meciuri)",pad,y); y+=5;
    h2h.slice(0,8).forEach(m=>{
      doc.setTextColor(160,120,80); doc.setFont("helvetica","normal"); doc.setFontSize(7.5);
      const col = m.winner==="draw"?[200,160,48]:m.winner==="home"?[100,180,100]:[180,100,100];
      text(`${m.date}  ${m.home} ${m.score} ${m.away}`,pad,y);
      doc.setTextColor(...col);
      text(m.winner==="draw"?"EGAL":m.winner==="home"?"GAZDĂ":"OASPEȚI",W-pad,y,{align:"right"});
      doc.setTextColor(160,120,80);
      y+=5; checkPage();
    });
    nl(2);
  }

  // Halftime + Handicap
  if(analysis.halftime||analysis.handicap){
    line(); checkPage();
    const htCol=[], hcCol=[];
    if(analysis.halftime){
      const h=analysis.halftime;
      htCol.push("PRIMA REPRIZĂ");
      htCol.push(`${home} conduce: ${h.home_lead}%`);
      htCol.push(`Egal: ${h.draw}%`);
      htCol.push(`${away} conduce: ${h.away_lead}%`);
      htCol.push(`Over 0.5: ${h.over_0_5}%`);
      htCol.push(`Over 1.5: ${h.over_1_5}%`);
    }
    if(analysis.handicap){
      const h=analysis.handicap;
      hcCol.push("HANDICAP ASIATIC");
      hcCol.push(`${home} -1: ${h.home_minus1}%`);
      hcCol.push(`${home} -0.5: ${h.home_minus05}%`);
      hcCol.push(`${away} +1: ${h.away_plus1}%`);
    }
    const mr2=Math.max(htCol.length,hcCol.length);
    for(let r=0;r<mr2;r++){
      [htCol,hcCol].forEach((col,ci)=>{
        if(!col[r]) return;
        r===0?doc.setFont("helvetica","bold"):doc.setFont("helvetica","normal");
        r===0?doc.setTextColor(120,80,50):doc.setTextColor(160,120,80);
        doc.setFontSize(7.5);
        text(col[r],pad+ci*90,y);
      });
      y+=5.5; checkPage();
    }
    nl(2);
  }

  // Bookie tips
  if(analysis.bookie_tips){
    line(); checkPage();
    doc.setTextColor(120,80,50); doc.setFontSize(8); doc.setFont("helvetica","bold");
    text(`COTE ESTIMATE — ${analysis.best_pick?.label||""}`,pad,y); y+=5;
    analysis.bookie_tips.forEach((b,i)=>{
      i===0?doc.setTextColor(46,204,113):doc.setTextColor(160,120,80);
      doc.setFont(i===0?"helvetica":"helvetica",i===0?"bold":"normal");
      doc.setFontSize(8);
      text(`${i===0?"🥇":i===1?"🥈":"🥉"} ${b.name}`,pad,y);
      text(`~${b.estimated_odd}x`,pad+60,y);
      doc.setTextColor(120,80,60); doc.setFont("helvetica","normal");
      text(b.note,pad+90,y);
      y+=5.5; checkPage();
    });
    nl(2);
  }

  // Analysis text
  if(analysis.analysis){
    line(); checkPage();
    doc.setTextColor(120,80,50); doc.setFontSize(8); doc.setFont("helvetica","bold");
    text("ANALIZĂ",pad,y); y+=5;
    doc.setTextColor(160,130,100); doc.setFont("helvetica","normal"); doc.setFontSize(8);
    const lines=doc.splitTextToSize(analysis.analysis,W-pad*2);
    lines.forEach(l=>{ text(l,pad,y); y+=4.5; checkPage(); });
  }

  // Footer
  doc.setTextColor(80,50,30); doc.setFontSize(7);
  text("⚠ Analiză statistică generată de FootballAnalyzer. Nu reprezintă sfat financiar. Pariați responsabil. 18+",pad,285);

  doc.save(`FootballAnalyzer_${home.replace(/\s/g,"-")}_vs_${away.replace(/\s/g,"-")}_${date}.pdf`);
}

/* ═══════════════════════════════════════
   UI COMPONENTS
═══════════════════════════════════════ */
const BI = {
  width:"100%",background:"#1a0e06",border:"1px solid #3a1a08",
  color:"#f0d0b0",padding:"0.55rem 0.8rem",fontSize:"0.8rem",
  fontFamily:"'Outfit',sans-serif",borderRadius:6,outline:"none",
};

function Lbl({children,c}) {
  return <div style={{fontSize:"0.53rem",color:c||"#6a3a20",letterSpacing:"0.14em",marginBottom:"0.22rem",fontFamily:"'Outfit',sans-serif"}}>{children}</div>;
}
function Sect({title,children}) {
  return (
    <div style={{borderTop:"1px solid #2a1008",paddingTop:"0.8rem"}}>
      {title&&<Lbl>{title}</Lbl>}
      {children}
    </div>
  );
}
function Bar({label,value,color=G,sub}) {
  return (
    <div style={{marginBottom:"0.4rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.13rem"}}>
        <span style={{fontSize:"0.62rem",color:"#a07050"}}>{label}{sub&&<span style={{color:"#5a3020",marginLeft:"0.35rem",fontSize:"0.55rem"}}>{sub}</span>}</span>
        <span style={{fontSize:"0.62rem",color,fontWeight:600}}>{value}%</span>
      </div>
      <div style={{background:"#200e04",borderRadius:3,height:4,overflow:"hidden"}}>
        <div style={{width:`${Math.min(value,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width 0.9s ease"}}/>
      </div>
    </div>
  );
}
function MRow({label,prob}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.24rem 0",borderBottom:"1px solid #180a02"}}>
      <span style={{fontSize:"0.63rem",color:"#9a6040",flex:3}}>{label}</span>
      <span style={{fontSize:"0.63rem",color:G,fontWeight:600,flex:1,textAlign:"right"}}>{prob}%</span>
      <span style={{fontSize:"0.6rem",color:"#5a3020",flex:1,textAlign:"right"}}>~{p2o(prob)}x</span>
    </div>
  );
}
function GoalBars({goals}) {
  if(!goals) return null;
  const vals=Object.values(goals),max=Math.max(...vals,1);
  const cols=["#e8703a","#d4602a","#c05020","#ac4010","#603020"];
  return (
    <div>
      <Lbl>DISTRIBUȚIE NR. GOLURI</Lbl>
      <div style={{display:"flex",gap:"0.45rem",alignItems:"flex-end",height:58,marginBottom:"0.28rem"}}>
        {Object.entries(goals).map(([k,v],i)=>{
          const h=Math.max(5,Math.round((v/max)*50));
          return (
            <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"0.1rem"}}>
              <span style={{fontSize:"0.55rem",color:cols[i],fontWeight:600}}>{v}%</span>
              <div style={{width:"100%",height:h,background:cols[i],borderRadius:"3px 3px 0 0"}}/>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:"0.45rem"}}>
        {Object.keys(goals).map(k=><div key={k} style={{flex:1,textAlign:"center",fontSize:"0.54rem",color:"#4a2a10"}}>{k}G</div>)}
      </div>
    </div>
  );
}
function FormB({r}) {
  const c={W:G,D:"#e8a030",L:"#e05040"};
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:4,background:c[r]||"#2a1008",color:"#040d06",fontSize:"0.58rem",fontWeight:800}}>{r}</span>;
}

/* ─── Odds Comparator ─── */
function OddsComparator({bestPick}) {
  const [myOdd, setMyOdd] = useState("");
  const fair = bestPick ? parseFloat(p2o(bestPick.prob)) : null;
  const myVal = parseFloat(myOdd);
  const isValue = fair && myVal && myVal > fair*1.02;
  const edge = fair && myVal ? (((myVal/fair)-1)*100).toFixed(1) : null;

  return (
    <div style={{background:"#12080a",border:"1px solid #3a1008",borderRadius:8,padding:"0.85rem 1rem"}}>
      <Lbl c="#e8703a">⚖ COMPARATOR COTE</Lbl>
      <div style={{fontSize:"0.65rem",color:"#8a5030",marginBottom:"0.6rem",lineHeight:1.5}}>
        Introdu cota găsită pe Superbet/Betano pentru <strong style={{color:"#e8c5a0"}}>{bestPick?.label||"pronosticul recomandat"}</strong>:
      </div>
      <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
        <input value={myOdd} onChange={e=>setMyOdd(e.target.value.replace(",","."))}
          placeholder="ex: 1.95"
          style={{...BI,flex:1,fontSize:"1rem",fontWeight:600,color:"#f0d0b0"}}
          onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor="#3a1a08"}/>
        {fair&&<div style={{fontSize:"0.62rem",color:"#6a3a20",whiteSpace:"nowrap"}}>Cotă fair: <strong style={{color:"#e8c5a0"}}>~{fair}x</strong></div>}
      </div>
      {myVal>0&&fair&&(
        <div style={{marginTop:"0.65rem",padding:"0.6rem 0.8rem",background:isValue?"#0a1f0a":"#1f0a08",border:`1px solid ${isValue?G:"#5a1010"}`,borderRadius:6}}>
          <div style={{fontSize:"0.9rem",fontWeight:700,color:isValue?G:"#e05040",marginBottom:"0.2rem"}}>
            {isValue?"✓ VALUE BET!":"✗ Fără valoare"}
          </div>
          <div style={{fontSize:"0.65rem",color:isValue?"#80b888":"#a06060",lineHeight:1.6}}>
            {isValue
              ?`Avantaj: +${edge}% față de cotă corectă. Merită pariat.`
              :`Cota ta (${myVal}x) e sub cota corectă (${fair}x). Casa are avantaj.`}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── H2H display ─── */
function H2HCard({h2h, home, away}) {
  if(!h2h?.length) return null;
  const homeW = h2h.filter(m=>{
    const hi = m.home===home||m.home.includes(home.split(" ")[0]);
    return hi?m.winner==="home":m.winner==="away";
  }).length;
  const awayW = h2h.filter(m=>{
    const ai = m.away===away||m.away.includes(away.split(" ")[0]);
    return ai?m.winner==="away":m.winner==="home";
  }).length;
  const draws = h2h.filter(m=>m.winner==="draw").length;

  return (
    <Sect title="HEAD TO HEAD">
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.6rem"}}>
        {[
          {l:`${home.split(" ")[0]} câștigă`,v:homeW,c:G},
          {l:"Egal",v:draws,c:"#e8a030"},
          {l:`${away.split(" ")[0]} câștigă`,v:awayW,c:"#e05040"},
        ].map(({l,v,c})=>(
          <div key={l} style={{flex:1,background:"#1a0e06",border:`1px solid ${c}30`,borderRadius:6,padding:"0.5rem",textAlign:"center"}}>
            <div style={{fontSize:"1.4rem",color:c,fontFamily:"'Outfit',sans-serif",fontWeight:800,lineHeight:1}}>{v}</div>
            <div style={{fontSize:"0.55rem",color:"#6a3a20",marginTop:"0.2rem"}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"0.22rem"}}>
        {h2h.slice(0,6).map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.22rem 0.5rem",background:"#140a02",borderRadius:4}}>
            <span style={{fontSize:"0.57rem",color:"#5a3020",minWidth:70}}>{m.date}</span>
            <span style={{fontSize:"0.63rem",color:"#c0a080",flex:1,textAlign:"center"}}>{m.home} <strong style={{color:"#f0d0b0"}}>{m.score}</strong> {m.away}</span>
            <span style={{fontSize:"0.55rem",color:m.winner==="draw"?"#e8a030":m.winner==="home"?"#60b070":"#e05040",minWidth:50,textAlign:"right"}}>
              {m.winner==="draw"?"EGAL":m.winner==="home"?"GAZDĂ":"OASPEȚI"}
            </span>
          </div>
        ))}
      </div>
    </Sect>
  );
}

/* ─── Live team card ─── */
function LiveTeamCard({data, name}) {
  if(!data) return null;
  const s = data.stats;
  return (
    <div style={{background:"#140a02",border:"1px solid #2a1008",borderRadius:6,padding:"0.65rem 0.8rem"}}>
      <div style={{fontSize:"0.68rem",color:"#e8b880",fontWeight:600,marginBottom:"0.4rem",fontFamily:"'Outfit',sans-serif"}}>{data.stats?.team?.name||name}</div>
      <div style={{display:"flex",gap:"0.2rem",marginBottom:"0.4rem"}}>
        {data.form.map((f,i)=><FormB key={i} r={f.result}/>)}
      </div>
      {s?.statistics&&(
        <div style={{fontSize:"0.59rem",color:"#7a4a30",lineHeight:1.75,display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 0.5rem"}}>
          <div>⚽ {s.goals?.for?.average?.total||"?"} goluri/meci</div>
          <div>🛡 {s.goals?.against?.average?.total||"?"} primite/meci</div>
          <div>🔒 {s.clean_sheet?.total||0} clean sheets</div>
          <div>❌ {s.failed_to_score?.total||0} fără gol</div>
        </div>
      )}
      {data.injuries?.length>0&&(
        <div style={{marginTop:"0.35rem",fontSize:"0.58rem",color:"#c05040",lineHeight:1.6}}>
          🚑 {data.injuries.map(i=>i.name).join(", ")}
        </div>
      )}
    </div>
  );
}

/* ─── Result Card ─── */
function ResultCard({d,home,away,onExport,exporting}) {
  if(!d) return null;
  const {a,h2h,homeData,awayData} = d;
  const pick = a.best_pick;

  return (
    <div style={{animation:"fadeUp 0.35s ease",marginTop:"1.2rem",background:"#130800",border:"1px solid #2a1008",borderRadius:10,overflow:"hidden"}}>
      <div style={{background:"linear-gradient(135deg,#1f0a02,#2a1008)",padding:"0.6rem 1rem",borderBottom:"1px solid #2a1008",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:"0.72rem",fontFamily:"'Outfit',sans-serif",fontWeight:700,color:"#e8703a"}}>
          {home.toUpperCase()} <span style={{color:"#4a2a10"}}>vs</span> {away.toUpperCase()}
        </span>
        <button onClick={onExport} disabled={exporting} style={{background:exporting?"#0a1808":`linear-gradient(135deg,${G},${G2})`,border:"none",color:exporting?G:"#040d06",padding:"0.3rem 0.75rem",fontFamily:"'Outfit',sans-serif",fontSize:"0.62rem",fontWeight:600,cursor:exporting?"not-allowed":"pointer",borderRadius:5,transition:"all 0.2s"}}>
          {exporting?"...":"⬇ PDF"}
        </button>
      </div>

      <div style={{padding:"1rem",display:"flex",flexDirection:"column",gap:"0.9rem"}}>

        {/* Live team data */}
        {(homeData||awayData)&&(
          <Sect title="DATE LIVE — API FOOTBALL">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
              <LiveTeamCard data={homeData} name={home}/>
              <LiveTeamCard data={awayData} name={away}/>
            </div>
          </Sect>
        )}

        {/* H2H */}
        <H2HCard h2h={h2h} home={home} away={away}/>

        {/* Best pick */}
        {pick&&(
          <div style={{background:"linear-gradient(135deg,#0a1f0a,#0d2810)",border:`1px solid ${G}`,borderRadius:8,padding:"0.85rem 1rem"}}>
            <Lbl c={G}>★ PRONOSTIC RECOMANDAT</Lbl>
            <div style={{fontSize:"1.05rem",color:"#fff",fontFamily:"'Outfit',sans-serif",fontWeight:700,marginBottom:"0.2rem"}}>{pick.label}</div>
            <div style={{fontSize:"0.65rem",color:"#80a888",marginBottom:"0.5rem",lineHeight:1.65}}>{pick.reason}</div>
            <div style={{display:"flex",gap:"0.42rem",flexWrap:"wrap"}}>
              <span style={{background:"#061208",border:`1px solid ${G2}`,borderRadius:4,padding:"0.2rem 0.5rem",fontSize:"0.62rem",color:G}}>Prob: <strong>{pick.prob}%</strong></span>
              <span style={{background:"#061208",border:`1px solid ${G2}`,borderRadius:4,padding:"0.2rem 0.5rem",fontSize:"0.62rem",color:"#90c070"}}>Cotă fair: <strong>~{p2o(pick.prob)}x</strong></span>
              <span style={{background:"#061208",border:`1px solid ${G2}`,borderRadius:4,padding:"0.2rem 0.5rem",fontSize:"0.62rem",color:"#b0d090"}}>{pick.best_bookie}</span>
            </div>
            <div style={{fontSize:"0.55rem",color:"#305030",marginTop:"0.42rem"}}>⚠ Analiză statistică, nu sfat financiar. 18+</div>
          </div>
        )}

        {/* Odds comparator */}
        <OddsComparator bestPick={pick}/>

        {/* 1X2 */}
        {a.result_probs&&(
          <Sect title="REZULTAT FINAL (1X2)">
            <Bar label={`1 — ${home}`} value={a.result_probs.home} color={G} sub={`~${p2o(a.result_probs.home)}x`}/>
            <Bar label="X — Egal" value={a.result_probs.draw} color="#e8a030" sub={`~${p2o(a.result_probs.draw)}x`}/>
            <Bar label={`2 — ${away}`} value={a.result_probs.away} color="#e05040" sub={`~${p2o(a.result_probs.away)}x`}/>
            <div style={{height:"0.25rem"}}/>
            <Bar label="1X" value={a.result_probs.home_draw} color="#60b080" sub={`~${p2o(a.result_probs.home_draw)}x`}/>
            <Bar label="X2" value={a.result_probs.draw_away} color="#9070b0" sub={`~${p2o(a.result_probs.draw_away)}x`}/>
          </Sect>
        )}

        {/* Goluri */}
        {a.goals&&<Sect title=""><GoalBars goals={a.goals}/></Sect>}

        {/* Over/Under */}
        {a.over_under&&(
          <Sect title="OVER / UNDER GOLURI">
            {Object.entries(a.over_under).map(([k,v])=>(
              <div key={k}>
                <MRow label={`Over ${k} goluri`} prob={v.over}/>
                <MRow label={`Under ${k} goluri`} prob={v.under}/>
              </div>
            ))}
          </Sect>
        )}

        {/* BTTS */}
        {a.btts!=null&&(
          <Sect title="AMBELE MARCHEAZĂ / CLEAN SHEET">
            <MRow label="Ambele marchează — DA" prob={a.btts}/>
            <MRow label="Ambele marchează — NU" prob={100-a.btts}/>
            {a.clean_sheet_home!=null&&<MRow label={`Clean sheet ${home}`} prob={a.clean_sheet_home}/>}
            {a.clean_sheet_away!=null&&<MRow label={`Clean sheet ${away}`} prob={a.clean_sheet_away}/>}
          </Sect>
        )}

        {/* Scoruri */}
        {a.top_scores&&(
          <Sect title="SCORURI EXACTE">
            <div style={{display:"flex",gap:"0.35rem",flexWrap:"wrap"}}>
              {a.top_scores.map((s,i)=>(
                <div key={i} style={{background:i===0?"#0a1f0a":"#1a0e06",border:`1px solid ${i===0?G:"#2a1008"}`,borderRadius:6,padding:"0.33rem 0.58rem",textAlign:"center",minWidth:52}}>
                  <div style={{fontSize:"0.88rem",color:i===0?G:"#906040",fontFamily:"'Outfit',sans-serif",fontWeight:700}}>{s.score}</div>
                  <div style={{fontSize:"0.54rem",color:"#4a2a10"}}>{s.prob}%</div>
                  <div style={{fontSize:"0.51rem",color:"#3a1a08"}}>~{p2o(s.prob)}x</div>
                </div>
              ))}
            </div>
          </Sect>
        )}

        {/* Cartonașe */}
        {a.cards&&(
          <Sect title="CARTONAȘE">
            <MRow label="Over 2.5 cartonașe" prob={a.cards.over_2_5}/>
            <MRow label="Over 3.5 cartonașe" prob={a.cards.over_3_5}/>
            <MRow label={`${home} — cartonaș galben`} prob={a.cards.home_yellow}/>
            <MRow label={`${away} — cartonaș galben`} prob={a.cards.away_yellow}/>
            <MRow label="Cartonaș roșu" prob={a.cards.red_card}/>
          </Sect>
        )}

        {/* Cornere */}
        {a.corners&&(
          <Sect title="CORNERE">
            <MRow label="Over 7.5" prob={a.corners.over_7_5}/>
            <MRow label="Over 9.5" prob={a.corners.over_9_5}/>
            <MRow label="Over 11.5" prob={a.corners.over_11_5}/>
            <MRow label={`Mai multe cornere — ${home}`} prob={a.corners.home_more}/>
          </Sect>
        )}

        {/* Marcatori */}
        {a.scorers?.length>0&&(
          <Sect title="MARCHEAZĂ ÎN MECI">
            {a.scorers.map((s,i)=><MRow key={i} label={s.name} prob={s.prob}/>)}
          </Sect>
        )}

        {/* Handicap */}
        {a.handicap&&(
          <Sect title="HANDICAP ASIATIC">
            <MRow label={`${home} -1`} prob={a.handicap.home_minus1}/>
            <MRow label={`${home} -0.5`} prob={a.handicap.home_minus05}/>
            <MRow label={`${away} +1`} prob={a.handicap.away_plus1}/>
          </Sect>
        )}

        {/* Pauza */}
        {a.halftime&&(
          <Sect title="PRIMA REPRIZĂ">
            <MRow label={`${home} conduce la pauză`} prob={a.halftime.home_lead}/>
            <MRow label="Egal la pauză" prob={a.halftime.draw}/>
            <MRow label={`${away} conduce la pauză`} prob={a.halftime.away_lead}/>
            <MRow label="Over 0.5 goluri R1" prob={a.halftime.over_0_5}/>
            <MRow label="Over 1.5 goluri R1" prob={a.halftime.over_1_5}/>
          </Sect>
        )}

        {/* Bookie tips */}
        {a.bookie_tips&&(
          <Sect title={`COTE ESTIMATE — ${pick?.label||""}`}>
            {a.bookie_tips.map((b,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.24rem 0",borderBottom:"1px solid #180a02"}}>
                <span style={{fontSize:"0.64rem",color:i===0?"#e8d080":"#906050"}}>{i===0?"🥇":i===1?"🥈":"🥉"} {b.name}</span>
                <span style={{fontSize:"0.64rem",color:i===0?G:"#507040",fontWeight:i===0?600:400}}>~{b.estimated_odd}x</span>
                <span style={{fontSize:"0.56rem",color:"#4a2a10"}}>{b.note}</span>
              </div>
            ))}
            <div style={{fontSize:"0.54rem",color:"#2a1008",marginTop:"0.42rem",lineHeight:1.6}}>ℹ Cotele sunt estimative. Verifică pe site-ul casei. 🔞 18+</div>
          </Sect>
        )}

        {/* Analiza */}
        {a.analysis&&(
          <Sect title="ANALIZĂ">
            <div style={{whiteSpace:"pre-wrap",lineHeight:1.85,color:"#b09070",fontSize:"0.73rem"}}>{a.analysis}</div>
          </Sect>
        )}

        <div style={{fontSize:"0.51rem",color:"#2a1008",borderTop:"1px solid #1a0802",paddingTop:"0.42rem"}}>
          {d.usedLive?"📡 API-Football + ":""}🤖 Claude AI · {new Date().toLocaleDateString("ro-RO")}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN APP
═══════════════════════════════════════ */
export default function FootballAnalyzer() {
  const [apiKey, setApiKey]   = useState("");
  const [showKey, setShowKey] = useState(false);
  const [home, setHome]       = useState("");
  const [away, setAway]       = useState("");
  const [league, setLeague]   = useState("");
  const [matchDate, setMatchDate] = useState(TODAY);
  const [extraCtx, setExtraCtx]   = useState("");
  const [chips, setChips]     = useState([]);
  const [tab, setTab]         = useState("main");

  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState("");
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);
  const [exporting, setExporting] = useState(false);

  const [pasteTxt, setPasteTxt]   = useState("");
  const [searchQ, setSearchQ]     = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchRes, setSearchRes]   = useState([]);
  const [searchSel, setSearchSel]   = useState([]);
  const [searchErr, setSearchErr]   = useState(null);

  const inject = text => {
    setChips(p=>[...p,{label:text.slice(0,55)+(text.length>55?"…":""),full:text}]);
    setExtraCtx(p=>p?p+"\n\n"+text:text);
    setTab("main");
  };
  const removeChip = i => {
    const c=chips[i];
    setChips(p=>p.filter((_,x)=>x!==i));
    setExtraCtx(p=>p.replace("\n\n"+c.full,"").replace(c.full,"").trim());
  };

  const doSearch = async () => {
    if(!searchQ.trim()) return;
    setSearchBusy(true); setSearchRes([]); setSearchSel([]); setSearchErr(null);
    try {
      const rssQ = encodeURIComponent(searchQ+" fotbal football");
      const url  = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("https://news.google.com/rss/search?q="+rssQ+"&hl=ro&gl=RO&ceid=RO:ro")}&count=6`;
      const res  = await fetch(url);
      const data = await res.json();
      if(data.status==="ok"&&data.items?.length>0) {
        setSearchRes(data.items.slice(0,6).map(item=>({
          title:(item.title||"").replace(/ - [^-]+$/,"").trim(),
          summary:(item.description||"").replace(/<[^>]+>/g,"").replace(/&amp;/g,"&").slice(0,220).trim(),
          source:item.author||"Google News",
        })));
      } else setSearchErr("Niciun rezultat.");
    } catch(e){setSearchErr(e.message);}
    finally{setSearchBusy(false);}
  };

  const analyze = async () => {
    if(!home.trim()||!away.trim()){setError("Introdu ambele echipe.");return;}
    setLoading(true); setResult(null); setError(null);

    let homeData=null, awayData=null, h2h=null, liveCtx="";
    const leagueInfo = LEAGUES.find(l=>l.name===league);

    // Step 1: API Football (if key + league)
    if(apiKey.trim()&&leagueInfo) {
      try {
        setStep("📡 Conectez la API-Football...");
        const [ht, at] = await Promise.all([findTeam(apiKey,home), findTeam(apiKey,away)]);
        setStep("📊 Preiau statistici, formă și accidentați...");
        const [hStats, aStats, h2hData] = await Promise.all([
          getTeamStats(apiKey, ht.id, leagueInfo.id),
          getTeamStats(apiKey, at.id, leagueInfo.id),
          getH2H(apiKey, ht.id, at.id),
        ]);
        homeData = {...hStats, teamId:ht.id};
        awayData = {...aStats, teamId:at.id};
        h2h = h2hData;

        // Build live context for Claude
        const fmtTeam = (name, d) => {
          const s = d.stats;
          const form = d.form.map(f=>`${f.result}(${f.score})`).join(", ");
          const inj = d.injuries.length ? `Accidentați: ${d.injuries.map(i=>i.name).join(", ")}.` : "";
          return `${name}: Formă recentă: ${form}. `
            +`Goluri marcate/meci: ${s?.goals?.for?.average?.total||"?"}, `
            +`primite: ${s?.goals?.against?.average?.total||"?"}. `
            +`Clean sheets: ${s?.clean_sheet?.total||0}. ${inj}`;
        };
        liveCtx = `DATE LIVE (API-Football, sezon 2025/26):\n${fmtTeam(home,homeData)}\n${fmtTeam(away,awayData)}`;
        if(h2h.length) {
          const h2hStr = h2h.slice(0,5).map(m=>`${m.date}: ${m.home} ${m.score} ${m.away}`).join("; ");
          liveCtx += `\nH2H recent: ${h2hStr}`;
        }
      } catch(e) {
        setStep(`⚠ API-Football: ${e.message}. Continui fără date live...`);
        await new Promise(r=>setTimeout(r,900));
      }
    } else if(!apiKey.trim()) {
      // Auto RSS search as fallback
      setStep("🔍 Caut știri despre meci...");
      try {
        const rssQ = encodeURIComponent(`${home} ${away} ${matchDate.slice(0,7)}`);
        const url  = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent("https://news.google.com/rss/search?q="+rssQ+"&hl=ro&gl=RO&ceid=RO:ro")}&count=5`;
        const res  = await fetch(url);
        const data = await res.json();
        if(data.status==="ok"&&data.items?.length>0) {
          liveCtx = "ȘTIRI RECENTE:\n"+data.items.slice(0,4).map(i=>`${(i.title||"").replace(/ - [^-]+$/,"").trim()}: ${(i.description||"").replace(/<[^>]+>/g,"").slice(0,200)}`).join("\n");
        }
      } catch(_) {}
    }

    // Step 2: Claude
    setStep("🤖 Generez probabilități pentru toate piețele...");
    try {
      const a = await claudeAnalyze(home, away, league, matchDate, liveCtx, extraCtx);
      setResult({a, h2h, homeData, awayData, usedLive:!!(homeData||awayData)});
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false); setStep("");
    }
  };

  const handleExport = async () => {
    if(!result) return;
    setExporting(true);
    try {
      await exportPDF(home, away, matchDate, result.a, result.h2h, result.homeData, result.awayData);
    } catch(e) {
      alert("Eroare PDF: "+e.message);
    } finally {
      setExporting(false);
    }
  };

  const TABS=[{id:"main",label:"⚙ Analiză"},{id:"search",label:"🔍 Căutare"},{id:"paste",label:"📋 Paste"}];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0f0800,#150b02,#100600)",fontFamily:"'Outfit',sans-serif",color:"#e8c5a0",padding:"1.5rem 1rem 3rem"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,textarea{outline:none;font-family:'Outfit',sans-serif}
        input::placeholder,textarea::placeholder{color:#4a2a10}
        select option{background:#1a0e06;color:#f0d0b0}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5) sepia(1) hue-rotate(-20deg);cursor:pointer}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#3a1a08}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.1}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(46,204,113,0.4)}50%{box-shadow:0 0 0 8px rgba(46,204,113,0)}}
      `}</style>

      <div style={{maxWidth:660,margin:"0 auto"}}>

        {/* Header */}
        <div style={{marginBottom:"1.6rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.25rem"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:G,animation:"pulse 2.5s infinite"}}/>
            <span style={{fontSize:"0.53rem",color:G,letterSpacing:"0.18em"}}>LIVE · 2026</span>
          </div>
          <h1 style={{fontFamily:"'Outfit',sans-serif",fontSize:"clamp(2.8rem,10vw,4rem)",fontWeight:800,lineHeight:1,background:"linear-gradient(135deg,#e8703a,#e84820,#c83010)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FootballAnalyzer</h1>
          <p style={{color:"#4a2a10",fontSize:"0.58rem",marginTop:"0.25rem",letterSpacing:"0.07em"}}>
            date live · h2h · toate piețele · comparator cote · export pdf
          </p>
        </div>

        {/* API Key */}
        <div style={{background:"#100800",border:`1px solid ${apiKey?"#2a4020":"#2a1008"}`,borderRadius:8,padding:"0.7rem 0.85rem",marginBottom:"0.85rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.32rem"}}>
            <Lbl>API-FOOTBALL KEY (pentru date live reale)</Lbl>
            <button onClick={()=>setShowKey(p=>!p)} style={{background:"none",border:"none",color:"#5a3020",fontSize:"0.57rem",cursor:"pointer"}}>{showKey?"ascunde":"arată"}</button>
          </div>
          <input type={showKey?"text":"password"} value={apiKey} onChange={e=>setApiKey(e.target.value)}
            placeholder="Cheia ta de pe rapidapi.com → API-Football"
            style={{...BI,border:`1px solid ${apiKey?G2:"#3a1a08"}`,background:"#0d0602"}}
            onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor=apiKey?G2:"#3a1a08"}/>
          {apiKey
            ?<div style={{fontSize:"0.56rem",color:G,marginTop:"0.25rem"}}>✓ Key activ — date live, H2H real, accidentați</div>
            :<div style={{fontSize:"0.56rem",color:"#4a2a10",marginTop:"0.25rem",lineHeight:1.55}}>Fără key: Claude analizează din cunoștințe + RSS. Cu key: statistici reale sezon 2025/26.</div>
          }
        </div>

        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #2a1008",marginBottom:"0.85rem"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"transparent",border:"none",borderBottom:`2px solid ${tab===t.id?"#e8703a":"transparent"}`,color:tab===t.id?"#e8703a":"#5a3020",padding:"0.4rem 0.85rem",fontFamily:"'Outfit',sans-serif",fontSize:"0.65rem",cursor:"pointer",letterSpacing:"0.04em",transition:"all 0.15s",marginBottom:"-1px"}}>{t.label}</button>
          ))}
          {chips.length>0&&(
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center"}}>
              <span style={{fontSize:"0.52rem",color:G,background:"#061408",border:`1px solid ${G2}`,borderRadius:10,padding:"0.07rem 0.38rem"}}>{chips.length} injectat{chips.length>1?"e":""}</span>
            </div>
          )}
        </div>

        {/* ── MAIN ── */}
        {tab==="main"&&(
          <div style={{animation:"fadeUp 0.2s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"0.5rem"}}>
              <div><Lbl>ECHIPA GAZDĂ</Lbl>
                <input value={home} onChange={e=>{setHome(e.target.value);setResult(null);}} placeholder="ex: Barcelona (în engleză)" style={BI} onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor="#3a1a08"}/>
              </div>
              <div><Lbl>ECHIPA OASPETE</Lbl>
                <input value={away} onChange={e=>{setAway(e.target.value);setResult(null);}} placeholder="ex: Celta Vigo (în engleză)" style={BI} onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor="#3a1a08"}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem",marginBottom:"0.5rem"}}>
              <div><Lbl>COMPETIȚIE</Lbl>
                <select value={league} onChange={e=>setLeague(e.target.value)} style={{...BI,cursor:"pointer",appearance:"none",color:league?"#f0d0b0":"#4a2a10"}}>
                  <option value="">— selectează —</option>
                  {LEAGUES.map(l=><option key={l.name} value={l.name}>{l.name}</option>)}
                </select>
              </div>
              <div><Lbl>DATA MECIULUI</Lbl>
                <input type="date" value={matchDate} onChange={e=>setMatchDate(e.target.value)} style={BI} onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor="#3a1a08"}/>
              </div>
            </div>

            {chips.length>0&&(
              <div style={{marginBottom:"0.5rem"}}>
                <Lbl>ȘTIRI ADĂUGATE</Lbl>
                <div style={{display:"flex",flexWrap:"wrap",gap:"0.25rem"}}>
                  {chips.map((c,i)=>(
                    <div key={i} style={{background:"#0a1808",border:`1px solid ${G2}`,color:"#60a870",fontSize:"0.57rem",padding:"0.14rem 0.4rem",borderRadius:4,display:"flex",alignItems:"center",gap:"0.27rem",maxWidth:220}}>
                      <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📎 {c.label}</span>
                      <button onClick={()=>removeChip(i)} style={{background:"none",border:"none",color:"#3a6030",cursor:"pointer",padding:0,fontSize:"0.62rem",flexShrink:0}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{marginBottom:"0.85rem"}}>
              <Lbl>CONTEXT EXTRA (opțional)</Lbl>
              <textarea value={extraCtx} onChange={e=>setExtraCtx(e.target.value)} placeholder="Absențe suplimentare, note tactice..." rows={2} style={{...BI,resize:"vertical",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor="#3a1a08"}/>
            </div>

            {step&&<div style={{fontSize:"0.64rem",color:"#e8a030",marginBottom:"0.48rem",display:"flex",alignItems:"center",gap:"0.4rem"}}><span style={{animation:"blink 1s infinite"}}>◆</span> {step}</div>}

            <button onClick={analyze} disabled={loading} style={{width:"100%",background:loading?"#0a1808":`linear-gradient(135deg,${G},${G2})`,border:`1px solid ${loading?G2:G}`,color:loading?G:"#030d04",padding:"0.82rem",fontFamily:"'Outfit',sans-serif",fontSize:"0.88rem",fontWeight:700,letterSpacing:"0.06em",cursor:loading?"not-allowed":"pointer",borderRadius:8,transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",boxShadow:loading?"none":`0 4px 24px rgba(46,204,113,0.28)`}}>
              {loading?<><span style={{animation:"blink 0.8s infinite"}}>◆</span> {step||"procesez..."}</>:"→ ANALIZEAZĂ"}
            </button>
            <div style={{fontSize:"0.54rem",color:"#3a1a08",marginTop:"0.42rem",textAlign:"center"}}>
              {apiKey?"date live API-Football + H2H + ":"news automat + "}Claude · toate piețele · comparator cote · PDF
            </div>
          </div>
        )}

        {/* ── SEARCH ── */}
        {tab==="search"&&(
          <div style={{animation:"fadeUp 0.2s ease"}}>
            <div style={{display:"flex",gap:"0.4rem",marginBottom:"0.75rem"}}>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="ex: Barcelona Celta, Lewandowski accidentat..." style={{...BI,flex:1}} onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor="#3a1a08"}/>
              <button onClick={doSearch} disabled={searchBusy} style={{background:searchBusy?"#0a1808":`linear-gradient(135deg,${G},${G2})`,border:"none",color:searchBusy?G:"#030d04",padding:"0 1rem",fontFamily:"'Outfit',sans-serif",fontSize:"0.7rem",fontWeight:500,cursor:searchBusy?"not-allowed":"pointer",borderRadius:6,minWidth:78}}>{searchBusy?"...":"CAUTĂ"}</button>
            </div>
            {searchErr&&<div style={{color:"#e05040",fontSize:"0.66rem",marginBottom:"0.5rem"}}>⚠ {searchErr}</div>}
            {searchRes.length>0&&(
              <>
                <div style={{display:"flex",flexDirection:"column",gap:"0.3rem",marginBottom:"0.55rem"}}>
                  {searchRes.map((r,i)=>(
                    <div key={i} onClick={()=>setSearchSel(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{background:searchSel.includes(i)?"#0a1808":"#1a0e06",border:`1px solid ${searchSel.includes(i)?G:"#2a1008"}`,padding:"0.48rem 0.68rem",borderRadius:6,cursor:"pointer",transition:"all 0.12s"}}>
                      <div style={{fontSize:"0.69rem",color:searchSel.includes(i)?G:"#e0b890",fontWeight:600,marginBottom:"0.1rem"}}>{searchSel.includes(i)?"✓ ":""}{r.title}</div>
                      <div style={{fontSize:"0.61rem",color:"#5a3020",lineHeight:1.5}}>{r.summary}</div>
                    </div>
                  ))}
                </div>
                {searchSel.length>0&&<button onClick={()=>{inject(searchSel.map(i=>`[${searchRes[i].source}] ${searchRes[i].title}: ${searchRes[i].summary}`).join("\n\n"));setSearchSel([]);}} style={{width:"100%",background:`linear-gradient(135deg,${G},${G2})`,border:"none",color:"#030d04",padding:"0.52rem",fontFamily:"'Outfit',sans-serif",fontSize:"0.7rem",fontWeight:500,cursor:"pointer",borderRadius:6,letterSpacing:"0.07em"}}>→ ADAUGĂ {searchSel.length} ȘTIR{searchSel.length===1?"E":"I"} LA CONTEXT</button>}
              </>
            )}
          </div>
        )}

        {/* ── PASTE ── */}
        {tab==="paste"&&(
          <div style={{animation:"fadeUp 0.2s ease"}}>
            <Lbl>PASTE TEXT DIN ORICE SURSĂ</Lbl>
            <textarea value={pasteTxt} onChange={e=>setPasteTxt(e.target.value)} rows={6} placeholder={"Lipești orice: știre, tweet, articol...\n\nex: «Lewandowski lipsește din cauza accidentării»"} style={{...BI,resize:"vertical",lineHeight:1.65}} onFocus={e=>e.target.style.borderColor="#e8703a"} onBlur={e=>e.target.style.borderColor="#3a1a08"}/>
            <div style={{display:"flex",gap:"0.4rem",marginTop:"0.38rem"}}>
              <button onClick={()=>{if(pasteTxt.trim()){inject(pasteTxt);setPasteTxt("");}}} style={{flex:1,background:pasteTxt.trim()?`linear-gradient(135deg,${G},${G2})`:"#1a0e06",border:`1px solid ${pasteTxt.trim()?G:"#2a1008"}`,color:pasteTxt.trim()?"#030d04":"#3a2010",padding:"0.5rem",fontFamily:"'Outfit',sans-serif",fontSize:"0.7rem",fontWeight:pasteTxt.trim()?500:400,cursor:pasteTxt.trim()?"pointer":"not-allowed",borderRadius:6,letterSpacing:"0.07em",transition:"all 0.15s"}}>→ ADAUGĂ LA CONTEXT</button>
              {pasteTxt&&<button onClick={()=>setPasteTxt("")} style={{background:"transparent",border:"1px solid #2a1008",color:"#4a2a10",padding:"0.5rem 0.68rem",fontFamily:"'Outfit',sans-serif",fontSize:"0.66rem",cursor:"pointer",borderRadius:6}}>✕</button>}
            </div>
            <div style={{fontSize:"0.55rem",color:"#2a1008",marginTop:"0.4rem",lineHeight:1.65}}>💡 PC: selectezi → Ctrl+C → Ctrl+V &nbsp;|&nbsp; 📱 Ții apăsat → Selectați tot → Lipiți</div>
          </div>
        )}

        {error&&<div style={{background:"#180608",border:"1px solid #4a1010",color:"#e06050",padding:"0.58rem 0.78rem",fontSize:"0.66rem",borderRadius:6,marginTop:"0.82rem"}}>⚠ {error}</div>}

        <ResultCard d={result} home={home} away={away} onExport={handleExport} exporting={exporting}/>
      </div>
    </div>
  );
}
