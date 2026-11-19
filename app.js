const form = document.querySelector('#searchForm');
const region = document.querySelector('#region');
const postcode = document.querySelector('#postcode');
const intent = document.querySelector('#intent');
const results = document.querySelector('#results');
const grid = document.querySelector('#eventGrid');
const distanceFilter = document.querySelector('#distanceFilter');
let currentResults = [];
let currentAI = null;
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
  const tags = Array.isArray(event.tags) ? event.tags : [];
  const haystack = `${event.title} ${event.category} ${event.description} ${tags.join(' ')}`.toLowerCase();
  let score = tags.reduce((sum,tag)=>sum+(words.includes(String(tag).toLowerCase())?2:0),0);
  words.forEach(word=>{if(word.length>2 && haystack.includes(word)) score+=1});
  if(aiIntent?.audience==='family') score += event.family ? 7 : -5;
  else if(aiIntent?.audience==='adults') score += event.adults ? 7 : -4;
  else if(kidIntent) score += event.family ? 5 : -4;
  else if(adultIntent) score += event.adults ? 5 : -2;
  if(aiIntent?.themes?.length) aiIntent.themes.forEach(theme=>{if(haystack.includes(theme.toLowerCase())) score+=3});
  else score += event.family ? 2 : 0;
  return score;
}
function rankResults(list, aiIntent) {
  const query = intent.value.trim().toLowerCase();
  const words = query.split(/[^a-z0-9]+/).filter(Boolean);
  const kidIntent = /kid|child|family|toddler|baby|bored|colour|color|school/.test(query);
  const adultIntent = /adult|date|night|workshop|wine|quiet|solo/.test(query);
  return list.map((event,index)=>({...event,index,score:scoreEvent(event,words,kidIntent,adultIntent,aiIntent)})).sort((a,b)=>{
    const aDistance=Number.isFinite(a.distanceKm)?a.distanceKm:Infinity;
    const bDistance=Number.isFinite(b.distanceKm)?b.distanceKm:Infinity;
    return aDistance-bDistance||b.score-a.score||a.index-b.index;
  });
}
function renderResults() {
  const maxDistance=Number(distanceFilter.value);
  const nearby=currentResults.filter(event=>Number.isFinite(event.distanceKm)&&event.distanceKm<=maxDistance);
  const ranked=rankResults(nearby,currentAI);
  grid.innerHTML=ranked.length?ranked.map(cardMarkup).join(''):'<p class="empty-results">No listings within this distance. Try a wider radius.</p>';
  document.querySelector('#resultCount').textContent=`${ranked.length} ${region.value==='uk'?'upcoming events':'nearby activity places'} within ${maxDistance} km`;
}
distanceFilter.addEventListener('change',renderResults);
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function cardMarkup(event) {
  const title=escapeHtml(event.title), url=/^https:\/\//i.test(event.url||'')?escapeHtml(event.url):'#';
  return `<article class="event-card"><div class="event-image ${escapeHtml(event.kind)}"><span class="event-tag">${escapeHtml(event.category)}</span><span class="event-emoji">${escapeHtml(event.emoji)}</span></div><div class="event-content"><div class="event-meta"><span>◷ ${escapeHtml(event.date)}</span><span>·</span><span>${escapeHtml(event.age)}</span></div><h3>${title}</h3><p>${escapeHtml(event.description)}</p><div class="event-foot"><span>⌖ ${escapeHtml(event.place)}</span><span class="event-distance">${escapeHtml(event.distance)}</span></div><a class="event-link" href="${url}" target="_blank" rel="noopener noreferrer">View on ${escapeHtml(event.source)} ↗</a></div></article>`;
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!validPostcode(postcode.value,region.value)){
    postcode.setCustomValidity(region.value==='uk'?'Enter a valid UK postcode, such as SW11 1AA.':'Enter a six-digit Tamil Nadu PIN code.');
    postcode.reportValidity(); postcode.addEventListener('input',()=>postcode.setCustomValidity(''),{once:true}); return;
  }
  const submitButton=form.querySelector('.search-button');
  const explanation=document.querySelector('#aiExplanation');
  const sourceNote=document.querySelector('#sourceNote');
  submitButton.disabled=true;
  submitButton.innerHTML='Looking around… <span>✳</span>';
  explanation.hidden=true;
  let aiIntent=null;
  try {
    const response=await fetch('/api/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({intent:intent.value.trim()})});
    if(response.ok) aiIntent=await response.json();
  } catch(error) { /* Ranking uses the user's words if AI classification is unavailable. */ }
  let listingData;
  try {
    const response=await fetch('/api/search-activities',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({region:region.value,postcode:postcode.value.trim()})});
    listingData=await response.json();
    if(!response.ok) throw new Error(listingData.error||'Could not load listings.');
  } catch(error) {
    submitButton.disabled=false;
    submitButton.innerHTML='Find my kind of day <span>→</span>';
    grid.innerHTML=`<p class="empty-results">${escapeHtml(error.message||'Live listings are unavailable right now. Please try again.')}</p>`;
    document.querySelector('#resultsTitle').textContent='We couldn’t load listings';
    document.querySelector('#resultsSub').textContent='Your search is ready to try again in a moment.';
    document.querySelector('#resultCount').textContent='';
    sourceNote.textContent='';
    results.hidden=false;scrollResults();return;
  }
  currentResults=listingData.events||[];
  currentAI=aiIntent;
  renderResults();
  if(aiIntent?.method==='openrouter') {
    const audience={family:'family friendly',adults:'adult focused',mixed:'all ages'}[aiIntent.audience]||'all ages';
    const themes=(aiIntent.themes||[]).slice(0,3).join(', ');
    explanation.textContent=`AI read: ${audience}${themes?` · ${themes}`:''} — listings are ranked by your words and their event details.`;
    explanation.hidden=false;
  } else {
    explanation.textContent='Ranked from your words. AI mood interpretation is unavailable just now.';
    explanation.hidden=false;
  }
  const area=region.value==='uk'?'near '+postcode.value.toUpperCase():'near PIN '+postcode.value;
  document.querySelector('#resultsTitle').textContent=region.value==='uk'?'Upcoming events near you':'Nearby places to try';
  document.querySelector('#resultsSub').textContent=`For “${intent.value.trim()}” ${area}.`;
  const locationAttribution=listingData.locationSourceUrl?` PIN area lookup: <a href="${escapeHtml(listingData.locationSourceUrl)}" target="_blank" rel="noopener noreferrer">India Pincode API</a>.`:'';
  sourceNote.innerHTML=`${escapeHtml(listingData.note)} Source: <a href="${escapeHtml(listingData.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(listingData.source)}</a>.${locationAttribution} Retrieved ${new Date(listingData.checkedAt).toLocaleString()}.`;
  submitButton.disabled=false;
  submitButton.innerHTML='Find my kind of day <span>→</span>';
  results.hidden=false;scrollResults();
});
