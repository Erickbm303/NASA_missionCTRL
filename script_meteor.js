// ---------------- Utils ----------------
function parseCSV(text){
  const rows=[]; let row=[], i=0, cur='', q=false;
  while(i<text.length){
    const ch=text[i];
    if(q){
      if(ch=='"'){ if(text[i+1]=='"'){cur+='"'; i++;} else {q=false;} }
      else cur+=ch;
    }else{
      if(ch=='"') q=true;
      else if(ch==','){ row.push(cur); cur=''; }
      else if(ch=='\n'){ row.push(cur); rows.push(row); row=[]; cur=''; }
      else if(ch=='\r'){ /*ignore*/ }
      else cur+=ch;
    }
    i++;
  }
  if(cur.length>0 || row.length>0){ row.push(cur); rows.push(row); }
  return rows;
}
function toNum(x){ if(x===null||x===undefined) return NaN; const n=Number(String(x).replace(/[^0-9eE+\.\-]/g,'')); return Number.isFinite(n)?n:NaN; }
function deg2rad(d){ return d*Math.PI/180; }
function havKm(aLat,aLon,bLat,bLon){
  const R=6371, dLat=deg2rad(bLat-aLat), dLon=deg2rad(bLon-aLon);
  const la1=deg2rad(aLat), la2=deg2rad(bLat);
  const h=Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
}
function groupBy(arr,key){ const m=new Map(); for(const it of arr){ const k=key(it); if(!m.has(k)) m.set(k,[]); m.get(k).push(it);} return m; }
function colIndex(letter){ return letter.trim().toUpperCase().charCodeAt(0)-65; }

// ---------------- Map ----------------
const map=L.map('map').setView([40.7,-74.0],4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(map);

const impactMarker=L.circleMarker([40.7,-74.0],{radius:7,color:'#22c55e',weight:2,fillOpacity:.9}).addTo(map);
let craterCircle=null, tsunamiCircle=null;
const quakeLayer=L.layerGroup().addTo(map);
const tsunamiLayer=L.layerGroup().addTo(map);
const cityLayer=L.layerGroup().addTo(map);

map.on('click',e=>impactMarker.setLatLng(e.latlng));

// ---------------- State ----------------
let neoRows=[], quakeRows=[], tsunamiRows=[];
const meteorSelect=document.getElementById('meteorSelect');
const loadStatus=document.getElementById('loadStatus');

// ---------------- Cities ----------------
const cities=[
  {name:'New York',lat:40.7128,lon:-74.0060,continent:'North America'},
  {name:'Los Angeles',lat:34.0522,lon:-118.2437,continent:'North America'},
  {name:'Mexico City',lat:19.4326,lon:-99.1332,continent:'North America'},
  {name:'Toronto',lat:43.6532,lon:-79.3832,continent:'North America'},
  {name:'São Paulo',lat:-23.5505,lon:-46.6333,continent:'South America'},
  {name:'Buenos Aires',lat:-34.6037,lon:-58.3816,continent:'South America'},
  {name:'Lima',lat:-12.0464,lon:-77.0428,continent:'South America'},
  {name:'Bogotá',lat:4.7110,lon:-74.0721,continent:'South America'},
  {name:'London',lat:51.5074,lon:-0.1278,continent:'Europe'},
  {name:'Paris',lat:48.8566,lon:2.3522,continent:'Europe'},
  {name:'Berlin',lat:52.5200,lon:13.4050,continent:'Europe'},
  {name:'Madrid',lat:40.4168,lon:-3.7038,continent:'Europe'},
  {name:'Lagos',lat:6.5244,lon:3.3792,continent:'Africa'},
  {name:'Cairo',lat:30.0444,lon:31.2357,continent:'Africa'},
  {name:'Johannesburg',lat:-26.2041,lon:28.0473,continent:'Africa'},
  {name:'Nairobi',lat:-1.2921,lon:36.8219,continent:'Africa'},
  {name:'Tokyo',lat:35.6762,lon:139.6503,continent:'Asia'},
  {name:'Shanghai',lat:31.2304,lon:121.4737,continent:'Asia'},
  {name:'Delhi',lat:28.7041,lon:77.1025,continent:'Asia'},
  {name:'Seoul',lat:37.5665,lon:126.9780,continent:'Asia'},
  {name:'Sydney',lat:-33.8688,lon:151.2093,continent:'Oceania'},
  {name:'Melbourne',lat:-37.8136,lon:144.9631,continent:'Oceania'},
  {name:'Auckland',lat:-36.8485,lon:174.7633,continent:'Oceania'},
  {name:'Perth',lat:-31.9523,lon:115.8613,continent:'Oceania'},
  {name:'McMurdo Station',lat:-77.8419,lon:166.6863,continent:'Antarctica'},
  {name:'Amundsen-Scott South Pole',lat:-90,lon:0,continent:'Antarctica'}
];

// ---------------- Auto-load CSVs from assets ----------------
async function loadCSV(url){
  try{
    const res=await fetch(url);
    const text=await res.text();
    return parseCSV(text);
  }catch(err){
    console.error('Failed to load CSV:', url, err);
    return [];
  }
}

(async()=>{
  neoRows = (await loadCSV('/neo_data_five_highlighted_only.csv')).slice(1);
  quakeRows = (await loadCSV('/global_earthquake_30_data_clean.csv')).slice(1);
  tsunamiRows = (await loadCSV('/tsunamis_cleaned.csv')).slice(1);
  updateLoadStatus();
  populateMeteorSelect(); // Optional: if you have a function to fill the dropdown
})();

// Remove old file upload listeners if you want, or leave them as fallback
