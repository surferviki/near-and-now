const events = [
  { title: 'Saturday Park Run', category: 'Get moving', kind: 'running', emoji: '🏃', date: 'Sat, 9:00 am', place: 'Battersea Park', distance: '1.2 miles', age: 'All ages', family: true, adults: true, tags: ['run','running','outside','active','fitness','sport','energy','fresh air'], description: 'A friendly 5K for every pace. Come for the run, stay for the coffee.' },
  { title: 'Little Makers: Big Colour', category: 'For little ones', kind: 'kids', emoji: '🎨', date: 'Sat, 10:30 am', place: 'The Drawing Room', distance: '0.8 miles', age: 'Ages 4–10', family: true, adults: false, tags: ['kids','children','creative','colour','color','art','craft','family','bored'], description: 'A playful morning of colour, big paper, and very small masterpieces.' },
  { title: 'Wild City Nature Walk', category: 'Fresh air', kind: 'nature', emoji: '🌿', date: 'Sat, 11:00 am', place: 'Clapham Common', distance: '1.6 miles', age: 'All ages', family: true, adults: true, tags: ['outside','nature','walk','calm','quiet','relax','family','kids'], description: 'Spot birds, learn the names of things, and take the long way round.' },
  { title: 'Sunday Makers Market', category: 'Browse & wander', kind: 'market', emoji: '🧺', date: 'Sun, 11:00 am', place: 'Venn Street Market', distance: '0.6 miles', age: 'All ages', family: true, adults: true, tags: ['market','food','browse','relaxed','wander','family','kids','hobby'], description: 'Local makers, good snacks, and plenty of lovely things to discover.' },
  { title: 'Clay & Chai Workshop', category: 'Make something', kind: 'art', emoji: '🏺', date: 'Sun, 2:00 pm', place: 'Common Ground Studio', distance: '2.1 miles', age: 'Ages 16+', family: false, adults: true, tags: ['creative','craft','art','hobby','calm','relax','adult','make'], description: 'A relaxed hand-building session. Make a small pot and enjoy a cup of chai.' },
  { title: 'Family Beats in the Garden', category: 'Music & play', kind: 'music', emoji: '🎶', date: 'Sun, 1:00 pm', place: 'The Bandstand', distance: '1.4 miles', age: 'All ages', family: true, adults: true, tags: ['music','dance','kids','children','family','fun','energy','outdoors'], description: 'A sunny afternoon of live music, dancing, and room to run around.' },
];
const tamilNaduEvents = [
  { title: 'Sunday Little Artists', category: 'For little ones', kind: 'kids', emoji: '🖍️', date: 'Sun, 10:00 am', place: 'Anna Nagar Community Hall', distance: '2.0 km', age: 'Ages 4–10', family: true, adults: false, tags: ['kids','children','creative','colour','color','art','craft','family','bored'], description: 'A cheerful drawing and colouring morning for curious young creators.' },
  { title: 'Marina Morning Walk', category: 'Fresh air', kind: 'nature', emoji: '🌊', date: 'Sat, 6:30 am', place: 'Marina Beach', distance: '4.5 km', age: 'All ages', family: true, adults: true, tags: ['outside','nature','walk','calm','quiet','relax','family','kids'], description: 'Start the day with sea air, a gentle stroll, and a chai stop.' },
  { title: 'Chennai 5K Community Run', category: 'Get moving', kind: 'running', emoji: '🏃', date: 'Sun, 6:00 am', place: 'Besant Nagar Beach', distance: '3.2 km', age: 'Ages 12+', family: true, adults: true, tags: ['run','running','outside','active','fitness','sport','energy','fresh air'], description: 'A welcoming timed 5K by the sea. Beginners and first-timers are welcome.' },
  { title: 'Pongal Pottery & Chai', category: 'Make something', kind: 'art', emoji: '🏺', date: 'Sat, 3:00 pm', place: 'Mylapore Arts Studio', distance: '5.1 km', age: 'Ages 16+', family: false, adults: true, tags: ['creative','craft','art','hobby','calm','relax','adult','make'], description: 'Shape a little clay keepsake in a relaxed, beginner-friendly workshop.' },
  { title: 'Neighbourhood Food Bazaar', category: 'Browse & wander', kind: 'market', emoji: '🥭', date: 'Sat, 4:00 pm', place: 'T. Nagar Market Square', distance: '1.8 km', age: 'All ages', family: true, adults: true, tags: ['market','food','browse','relaxed','wander','family','kids','hobby'], description: 'Local treats, handmade finds, and a good excuse to explore together.' },
  { title: 'Stories Under the Banyan', category: 'Music & play', kind: 'music', emoji: '📚', date: 'Sun, 4:30 pm', place: 'Adyar Eco Park', distance: '3.7 km', age: 'All ages', family: true, adults: true, tags: ['music','dance','kids','children','family','fun','energy','outdoors','story'], description: 'Tamil and English tales, songs, and easy games for the whole family.' },
];
const form = document.querySelector('#searchForm');
const region = document.querySelector('#region');
const postcode = document.querySelector('#postcode');
const intent = document.querySelector('#intent');
const results = document.querySelector('#results');
const grid = document.querySelector('#eventGrid');
const scrollResults = () => results.scrollIntoView({behavior:'smooth', block:'start'});

region.addEventListener('change', () => { postcode.value=''; postcode.placeholder=region.value==='uk'?'e.g. SW11 1AA':'e.g. Mylapore 600004'; });
document.querySelector('#clearIntent').addEventListener('click',()=>{intent.value='';intent.focus()});
document.querySelectorAll('.mood-chip').forEach(chip=>chip.addEventListener('click',()=>{intent.value=chip.dataset.mood;intent.focus()}));
document.querySelector('#tryExample').addEventListener('click',()=>{intent.value='Something fun for the kids';postcode.value='SW11 1AA';form.requestSubmit()});
document.querySelector('#editSearch').addEventListener('click',()=>{document.querySelector('.hero').scrollIntoView({behavior:'smooth'})});
document.querySelector('#backToSearch').addEventListener('click',()=>document.querySelector('.hero').scrollIntoView({behavior:'smooth'}));

function validPostcode(value, country) {
  if (country==='uk') return /^(GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i.test(value.trim());
  return /^\d{6}$/.test(value.trim());
}
function scoreEvent(event, words, kidIntent, adultIntent, aiIntent) {
  const haystack = `${event.title} ${event.category} ${event.description} ${event.tags.join(' ')}`.toLowerCase();
  let score = event.tags.reduce((sum,tag)=>sum+(words.includes(tag)?2:0),0);
  words.forEach(word=>{if(word.length>2 && haystack.includes(word)) score+=1});
  if(aiIntent?.audience==='family') score += event.family ? 7 : -5;
  else if(aiIntent?.audience==='adults') score += event.adults ? 7 : -4;
  else if(kidIntent) score += event.family ? 5 : -4;
  else if(adultIntent) score += event.adults ? 5 : -2;
  if(aiIntent?.themes?.length) aiIntent.themes.forEach(theme=>{if(haystack.includes(theme.toLowerCase())) score+=3});
  else score += event.family ? 2 : 0;
  return score;
}
function search(aiIntent) {
  const query = intent.value.trim().toLowerCase();
  const words = query.split(/[^a-z0-9]+/).filter(Boolean);
  const kidIntent = /kid|child|family|toddler|baby|bored|colour|color|school/.test(query);
  const adultIntent = /adult|date|night|workshop|wine|quiet|solo/.test(query);
  const pool = region.value==='uk'?events:tamilNaduEvents;
  return pool.map((event,index)=>({...event,index,score:scoreEvent(event,words,kidIntent,adultIntent,aiIntent)})).sort((a,b)=>b.score-a.score||a.index-b.index);
}
function cardMarkup(event) {
  return `<article class="event-card"><div class="event-image ${event.kind}"><span class="event-tag">${event.category}</span><span class="event-emoji">${event.emoji}</span></div><div class="event-content"><div class="event-meta"><span>◷ ${event.date}</span><span>·</span><span>${event.age}</span></div><h3>${event.title}</h3><p>${event.description}</p><div class="event-foot"><span>⌖ ${event.place}</span><span class="event-distance">${event.distance}</span></div></div></article>`;
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!validPostcode(postcode.value,region.value)){
    postcode.setCustomValidity(region.value==='uk'?'Enter a valid UK postcode, such as SW11 1AA.':'Enter a six-digit Tamil Nadu PIN code.');
    postcode.reportValidity(); postcode.addEventListener('input',()=>postcode.setCustomValidity(''),{once:true}); return;
  }
  const explanation=document.querySelector('#aiExplanation');
  explanation.hidden=true;
  let aiIntent=null;
  try {
    const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({intent:intent.value.trim()})});
    if(response.ok) aiIntent=await response.json();
  } catch(error) { /* Local static preview uses the transparent keyword fallback below. */ }
  grid.innerHTML=search(aiIntent).map(cardMarkup).join('');
  if(aiIntent?.method==='openrouter') {
    const audience={family:'family friendly',adults:'adult focused',mixed:'all ages'}[aiIntent.audience]||'all ages';
    const themes=(aiIntent.themes||[]).slice(0,3).join(', ');
    explanation.textContent=`AI read: ${audience}${themes?` · ${themes}`:''} — rankings still use event fields and tags.`;
    explanation.hidden=false;
  } else {
    explanation.textContent='Keyword matching used. Add OPENROUTER_API_KEY to enable AI mood interpretation.';
    explanation.hidden=false;
  }
  const area=region.value==='uk'?'near '+postcode.value.toUpperCase():'near PIN '+postcode.value;
  document.querySelector('#resultsTitle').textContent='Your next good story';
  document.querySelector('#resultsSub').textContent=`Ideas inspired by “${intent.value.trim()}” ${area}.`;
  document.querySelector('#resultCount').textContent=`${grid.children.length} things to do this weekend`;
  results.hidden=false;scrollResults();
});
