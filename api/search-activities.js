const PLAYZ_URL = 'https://playz.in/api/v1/chennai/venues.json';
const PIN_URL = 'https://aniket-thapa.github.io/india-pincode-api/pincodes';
const POSTCODE_URL = 'https://api.postcodes.io/postcodes';
const TICKETMASTER_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

function distanceKm(aLat, aLng, bLat, bLng) {
  const radians = value => value * Math.PI / 180;
  const dLat = radians(bLat - aLat);
  const dLng = radians(bLng - aLng);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

async function jsonFrom(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.json();
}

async function tamilNaduResults(postcode) {
  const pin = await jsonFrom(`${PIN_URL}/${postcode}.json`);
  if (!/TAMIL NADU/i.test(pin.state || '')) {
    return { error: 'That PIN code is not in Tamil Nadu. Check it and try again.' };
  }
  const offices = Array.isArray(pin.offices) ? pin.offices : [];
  const geocoded = offices.filter(office => Number.isFinite(office.latitude) && Number.isFinite(office.longitude));
  if (!geocoded.length) return { error: 'We could not locate that PIN code. Try another nearby PIN code.' };
  const preferred = geocoded.find(office => office.officeType === 'HO') || geocoded[0];
  const venuesData = await jsonFrom(PLAYZ_URL);
  const venues = Array.isArray(venuesData) ? venuesData : venuesData.venues;
  if (!Array.isArray(venues)) throw new Error('Unexpected Playz response');
  const results = venues
    .filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .map(item => ({ ...item, distanceKm: distanceKm(preferred.latitude, preferred.longitude, item.lat, item.lng) }))
    .filter(item => item.distanceKm <= 25)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 40)
    .map(item => {
      const activities = Array.isArray(item.activities) ? item.activities : (typeof item.activities === 'string' ? [item.activities] : []);
      return ({
      id: item.slug,
      title: item.name,
      category: activities.slice(0, 2).join(' · ') || 'Activity venue',
      kind: 'activity',
      emoji: '✳',
      date: item.hours_text || 'Check opening hours',
      place: [item.area, item.city].filter(Boolean).join(', '),
      distance: `${item.distanceKm.toFixed(1)} km`,
      age: 'Check with venue',
      description: activities.length
        ? `Activities include ${activities.slice(0, 4).join(', ')}.`
        : 'Explore this nearby activity venue.',
      url: item.booking_url || item.website || item.source_url || 'https://playz.in/chennai/',
      source: 'Playz',
      family: /kids|child|play|trampoline/i.test(activities.join(' ')),
      adults: true,
      tags: activities
    });
    });
  return {
    events: results,
    source: 'Playz',
    checkedAt: new Date().toISOString(),
    locationLabel: `${pin.district || 'Tamil Nadu'} · approximate PIN location`,
    locationSourceUrl: 'https://aniket-thapa.github.io/india-pincode-api/',
    sourceUrl: 'https://playz.in/data/',
    note: 'Nearby places to try. Playz refreshes its directory daily; hours, prices and activities can change, so check with the venue before visiting.'
  };
}

async function ukResults(postcode) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return { error: 'UK live events are not connected yet. Add a free Ticketmaster API key to enable them.' };
  const location = await jsonFrom(`${POSTCODE_URL}/${encodeURIComponent(postcode)}`);
  const point = location.result;
  if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) {
    return { error: 'We could not locate that UK postcode. Check it and try again.' };
  }
  const now = new Date();
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    apikey: apiKey,
    countryCode: 'GB',
    latlong: `${point.latitude},${point.longitude}`,
    radius: '25',
    unit: 'km',
    startDateTime: now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
    endDateTime: end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''),
    size: '50',
    sort: 'date,asc',
    includeTest: 'no'
  });
  const payload = await jsonFrom(`${TICKETMASTER_URL}?${params}`);
  const items = payload._embedded?.events || [];
  const events = items.map(item => {
    const venue = item._embedded?.venues?.[0] || {};
    const category = item.classifications?.[0]?.segment?.name || 'Event';
    const localDate = item.dates?.start?.localDate;
    const localTime = item.dates?.start?.localTime;
    const date = [localDate, localTime].filter(Boolean).join(' · ') || 'See event page';
    const latitude = Number(venue.location?.latitude);
    const longitude = Number(venue.location?.longitude);
    const km = Number.isFinite(latitude) && Number.isFinite(longitude)
      ? distanceKm(point.latitude, point.longitude, latitude, longitude) : null;
    return {
      id: item.id,
      title: item.name,
      category,
      kind: /family|arts|sports|music/i.test(category) ? category.toLowerCase() : 'activity',
      emoji: '✳',
      date,
      place: [venue.name, venue.city?.name].filter(Boolean).join(', ') || point.admin_district || 'United Kingdom',
      distance: km === null ? '' : `${km.toFixed(1)} km`,
      age: item.ageRestrictions?.legalAgeEnforcement || 'See event details',
      description: item.info || item.pleaseNote || 'Check the event page for details, age guidance and availability.',
      url: item.url,
      source: 'Ticketmaster',
      family: /family|kids|children/i.test(`${category} ${item.name} ${item.info || ''}`),
      adults: true,
      tags: [category, ...(item.classifications?.[0]?.genre?.name ? [item.classifications[0].genre.name] : [])]
    };
  });
  return {
    events,
    source: 'Ticketmaster',
    checkedAt: new Date().toISOString(),
    locationLabel: point.postcode || postcode,
    sourceUrl: 'https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/',
    note: 'Upcoming ticketed events within about 25 km. Listings depend on Ticketmaster coverage; check the organiser page for current details.'
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const region = req.body?.region;
  const postcode = typeof req.body?.postcode === 'string' ? req.body.postcode.trim() : '';
  if (!['uk', 'tn'].includes(region)) return res.status(400).json({ error: 'Choose the UK or Tamil Nadu.' });
  if ((region === 'uk' && postcode.length > 12) || (region === 'tn' && !/^\d{6}$/.test(postcode))) {
    return res.status(400).json({ error: 'Enter a valid postcode or six-digit Tamil Nadu PIN code.' });
  }
  try {
    const result = region === 'uk' ? await ukResults(postcode) : await tamilNaduResults(postcode);
    if (result.error) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({ error: 'We could not reach the live listings right now. Please try again shortly.' });
  }
};
