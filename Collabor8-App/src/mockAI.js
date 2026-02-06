// Mock AI service that provides realistic music-related responses
// Replaces the broken Gemini API calls with local intelligence

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Music theory knowledge base
const CHORD_THEORY = {
  // Common chord relationships by key
  keys: {
    C: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    G: ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
    D: ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
    A: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
    E: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
    F: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Edim'],
  },
  // Progressions by song part
  progressions: {
    Verse: [
      { chords: 'Am - F - C - G', why: 'A classic minor-start verse that builds emotional tension before resolving upward. The Am gives it a reflective mood.' },
      { chords: 'C - Am - F - G', why: 'The I-vi-IV-V is timeless — smooth, singable, and opens the door for a strong chorus lift.' },
      { chords: 'Em - C - G - D', why: 'Starting on the minor gives a contemplative feel. Great for storytelling verses that need forward motion.' },
      { chords: 'G - Em - C - D', why: 'Warm and folk-inspired. The Em adds a touch of melancholy that keeps the verse interesting.' },
    ],
    Chorus: [
      { chords: 'F - G - C - Am', why: 'The IV-V-I motion is pure anthem energy. Landing on C feels like arriving home — perfect for a big chorus hook.' },
      { chords: 'C - G - Am - F', why: 'This is the "four chord" progression that powers thousands of hits. It works because it never stops moving forward.' },
      { chords: 'G - D - Em - C', why: 'Bright and uplifting with just enough minor color from the Em. Great for feel-good, singalong choruses.' },
      { chords: 'Am - F - G - C', why: 'Starts dark and resolves bright — creates a "breakthrough" feeling that makes choruses feel triumphant.' },
    ],
    Bridge: [
      { chords: 'Dm - G - Em - Am', why: 'The bridge should contrast your other sections. This minor-heavy progression adds new harmonic color and emotional depth.' },
      { chords: 'F - Fm - C - A7', why: 'The chromatic movement from F to Fm is a classic surprise — it creates a beautiful, bittersweet moment before you return to the chorus.' },
      { chords: 'Am - Dm - G - C', why: 'A ii-V-I turnaround dressed up as a bridge. It creates harmonic movement that naturally pulls back into your chorus key.' },
      { chords: 'Em - F - G - Ab', why: 'Walking up in half steps at the end builds dramatic tension. Perfect for a bridge that explodes back into the final chorus.' },
    ],
  },
};

const INSPIRATION_IDEAS = [
  {
    theme: 'love',
    ideas: [
      { title: '"Frequencies"', concept: 'Two people who can only communicate through the static of an old radio, finding love in the spaces between signals.' },
      { images: ['Fingerprints on a foggy window', 'Two shadows merging under a streetlight', 'The warmth of a coffee cup passed between cold hands', 'A playlist that tells a whole love story in 12 songs'] },
      { scene: 'She keeps his voicemails saved — not for the words, but for the sound of him laughing at his own jokes before hanging up.' },
    ],
  },
  {
    theme: 'loss',
    ideas: [
      { title: '"Empty Chairs"', concept: 'A dinner table set for someone who will never sit down again, and the ritual of still setting their place.' },
      { images: ['An unanswered phone still ringing in a dream', 'The last page of a book with no ending', 'Footprints in snow that lead nowhere', 'A guitar with one broken string nobody replaces'] },
      { scene: 'He drives past their old apartment every Tuesday. The lights are different now — warmer, someone else\'s warm.' },
    ],
  },
  {
    theme: 'hope',
    ideas: [
      { title: '"First Light"', concept: 'The moment between the darkest part of night and the first crack of dawn — a metaphor for starting over.' },
      { images: ['Seeds pushing through cracked concrete', 'The first deep breath after crying', "A handwritten letter that says only 'I'm still here'", 'City lights seen from a plane, each one a life still going'] },
      { scene: 'She quit her job on a Tuesday, bought a one-way bus ticket on Wednesday, and smiled — really smiled — for the first time in months.' },
    ],
  },
  {
    theme: 'night',
    ideas: [
      { title: '"Neon Confessions"', concept: 'A late-night diner where strangers tell their deepest secrets to someone they\'ll never see again.' },
      { images: ['Rain painting the streets in neon reflections', 'The hum of a vending machine in an empty parking lot', 'Headlights cutting through fog on an empty highway', 'A skyline full of lit windows and untold stories'] },
      { scene: 'At 3 AM the city belongs to the insomniacs, the heartbroken, and the ones still chasing a dream that only makes sense in the dark.' },
    ],
  },
  {
    theme: 'freedom',
    ideas: [
      { title: '"Unwritten Maps"', concept: 'A road trip with no destination — the freedom of choosing which turn to take when every road is a possibility.' },
      { images: ['Wind through open car windows on a desert highway', 'Tearing up a to-do list and watching it scatter', 'Dancing alone in a kitchen at midnight', 'The echo of laughter in a canyon'] },
      { scene: 'They sold everything that fit in a storage unit and kept everything that fit in a backpack. The rest, they decided, was never really theirs.' },
    ],
  },
];

const FEEDBACK_TEMPLATES = {
  'Classic Hitmaker': {
    strengths: [
      'You\'ve got a strong narrative thread here — that\'s the backbone of any great song.',
      'I can hear the melody in these words. Good lyrics should sing themselves off the page, and yours are getting there.',
      'There\'s an honesty in these lines that reminds me of the greats. Authenticity is your strongest asset.',
      'The imagery is vivid. You\'re showing, not telling — that\'s what separates good songwriters from great ones.',
    ],
    improvements: [
      'Tighten up the second line — every syllable needs to earn its place. Think of it like a telegram: say more with less.',
      'Your rhyme scheme breaks in the middle. Listeners lean on that pattern like a railing — take it away and they stumble.',
      'The hook needs to hit harder. I should be humming it after one listen. Try making it more conversational.',
      'Watch your syllable count — inconsistent meter makes it hard for a melody to sit naturally on the words.',
    ],
  },
  'Modern Hitmaker': {
    strengths: [
      'The vibe is right — this feels like something that would stop someone mid-scroll on their phone.',
      'Love the conversational tone. Today\'s listeners want to feel like you\'re talking TO them, not AT them.',
      'There\'s a real emotional punch here. This has TikTok-moment potential — that one line people would lip-sync to.',
      'The vulnerability is your superpower here. Gen Z connects with raw, unfiltered emotion.',
    ],
    improvements: [
      'Cut the filler words — in a 3-minute song, every word is real estate. Make each one count.',
      'The bridge feels safe. This is where you should surprise people — flip the perspective, change the energy.',
      'Think about how this sounds in headphones at 2 AM. That\'s your audience. Make it more intimate.',
      'The chorus needs a stickier hook. Think less poetry, more something someone would caption their Instagram story with.',
    ],
  },
};

const ARTIST_DATABASE = {
  'Indie Pop': {
    Modern: [
      { name: 'Wallows', desc: 'Sun-soaked indie pop with a nostalgic edge — like a coming-of-age movie you can dance to.' },
      { name: 'Remi Wolf', desc: 'Genre-blending maximalism that mixes funk, pop, and pure chaos into infectiously catchy songs.' },
      { name: 'Men I Trust', desc: 'Dreamy, minimalist indie pop with silky vocals that sound like a warm afternoon nap.' },
      { name: 'Samia', desc: 'Confessional indie pop with sharp lyrics and a voice that can go from whisper to wail.' },
    ],
    '2010s': [
      { name: 'Tame Impala', desc: 'Psychedelic pop masterclass — lush, swirling production that redefined what indie could sound like.' },
      { name: 'Alvvays', desc: 'Jangly dream-pop perfection with hooks sharp enough to cut glass, wrapped in shoegaze haze.' },
      { name: 'Japanese Breakfast', desc: 'Lush, emotionally complex indie pop that turns grief and joy into shimmering sonic landscapes.' },
    ],
    '2000s': [
      { name: 'Postal Service', desc: 'Electronic-meets-indie blueprint that proved laptops could make you cry. Changed the game forever.' },
      { name: 'Vampire Weekend', desc: 'Preppy afro-pop-infused indie that made world music influences cool for a generation of college kids.' },
      { name: 'MGMT', desc: 'Psychedelic pop provocateurs who gave us "Kids" and then gleefully refused to repeat the formula.' },
    ],
    '1990s': [
      { name: 'Belle and Sebastian', desc: 'Literate, whisper-quiet indie pop from Glasgow — like a favorite novel set to music.' },
      { name: 'The Cardigans', desc: 'Swedish pop sophistication that ranged from breezy lounge to dark, guitar-driven heartbreak.' },
      { name: 'Stereolab', desc: 'Space-age bachelor pad pop meets Marxist theory — impossibly cool and endlessly inventive.' },
    ],
    '1980s': [
      { name: 'The Smiths', desc: 'Morrissey\'s melancholy poetry over Marr\'s jangly guitar — the blueprint for every sad indie kid since.' },
      { name: 'Cocteau Twins', desc: 'Ethereal, otherworldly soundscapes with vocals that sound like a language from a beautiful dream.' },
      { name: 'Orange Juice', desc: 'Post-punk optimism with a pop heart — they made indie music that actually wanted you to dance.' },
    ],
    '1970s': [
      { name: 'Big Star', desc: 'Power pop pioneers whose commercial failure and artistic triumph inspired decades of indie music to come.' },
      { name: 'Nick Drake', desc: 'Haunting acoustic folk-pop of devastating beauty — three perfect albums that the world discovered too late.' },
      { name: 'Television', desc: 'Interlocking guitar poetry that proved punk could be cerebral, beautiful, and endlessly inventive.' },
    ],
    '1960s': [
      { name: 'The Velvet Underground', desc: 'Lou Reed\'s art-noise-pop revolution — they sold few records, but everyone who bought one started a band.' },
      { name: 'Love', desc: 'Arthur Lee\'s psychedelic folk-rock masterpiece "Forever Changes" is still one of the greatest albums ever made.' },
      { name: 'The Zombies', desc: 'Baroque pop perfection — "Odessey and Oracle" invented the indie pop aesthetic 40 years early.' },
    ],
    '1950s': [
      { name: 'Buddy Holly', desc: 'The original indie artist — wrote, produced, and performed his own songs before anyone thought that was possible.' },
      { name: 'The Everly Brothers', desc: 'Close-harmony pioneers whose vocal blend became the template for every indie duo that followed.' },
      { name: 'Sam Cooke', desc: 'Smooth, soulful pop craftsmanship that proved a great voice and a great song is all you need.' },
    ],
  },
  'Bedroom Pop': {
    Modern: [
      { name: 'Clairo', desc: 'Lo-fi bedroom recordings turned mainstream success — intimate, soft-spoken pop that feels like a secret.' },
      { name: 'Boy Pablo', desc: 'Norwegian bedroom pop with sunny, jangly guitars and lovesick lyrics delivered with effortless charm.' },
      { name: 'Mk.gee', desc: 'Glitchy, experimental bedroom productions that sound like R&B transmitted through a broken radio.' },
    ],
    '2010s': [
      { name: 'Rex Orange County', desc: 'Earnest, jazz-inflected bedroom pop that wears its heart on its sleeve with every note.' },
      { name: 'Gus Dapperton', desc: 'Quirky synth-pop made in a bedroom that sounds like it belongs in a Wes Anderson movie.' },
      { name: 'Cuco', desc: 'Dreamy, bilingual bedroom pop that blends lo-fi production with Latin music influences.' },
    ],
  },
  'Lo-fi Hip Hop': {
    Modern: [
      { name: 'Joji', desc: 'Atmospheric lo-fi R&B/hip-hop that turned internet fame into genuinely beautiful, melancholic music.' },
      { name: 'Still Woozy', desc: 'Wobbly, psychedelic bedroom hip-hop with earworm melodies and delightfully off-kilter production.' },
      { name: 'Dayglow', desc: 'High-energy bedroom pop-meets-hip-hop production — impossibly catchy and relentlessly optimistic.' },
    ],
    '2010s': [
      { name: 'Nujabes', desc: 'The godfather of lo-fi hip hop — jazz-infused beats of devastating beauty that changed music forever.' },
      { name: 'J Dilla', desc: 'Beat-making genius whose off-kilter timing and soulful sampling became the foundation of modern lo-fi.' },
      { name: 'Tomppabeats', desc: 'Finnish producer whose warm, vinyl-crackle beats helped define the YouTube lo-fi study music movement.' },
    ],
  },
  'Synthwave': {
    Modern: [
      { name: 'The Midnight', desc: 'Cinematic synthwave with soaring sax solos and vocals — like driving through an 80s movie at sunset.' },
      { name: 'FM-84', desc: 'Nostalgic, sunset-drenched synthwave that captures the feeling of a summer that never ended.' },
      { name: 'Gunship', desc: 'Dark, cinematic synthwave with cyberpunk visuals and collaborations that bridge retro and modern.' },
    ],
    '1980s': [
      { name: 'Depeche Mode', desc: 'Dark, brooding synth-pop that proved electronic music could be deeply emotional and massively popular.' },
      { name: 'New Order', desc: 'Post-punk turned electronic dance pioneers — "Blue Monday" is still the best-selling 12" single ever.' },
      { name: 'Tangerine Dream', desc: 'Berlin School electronic pioneers whose pulsing synth soundscapes scored a generation of films.' },
    ],
  },
  'Modern Folk': {
    Modern: [
      { name: 'Adrianne Lenker', desc: 'Raw, intimate folk recordings that sound like overhearing someone\'s most private, beautiful moment.' },
      { name: 'Waxahatchee', desc: 'Indie folk-rock with Southern roots and lyrics that cut like a diary entry you weren\'t meant to read.' },
      { name: 'Boygenius', desc: 'Folk-rock supergroup of Phoebe Bridgers, Julien Baker, and Lucy Dacus — three voices, one devastating harmony.' },
    ],
    '2010s': [
      { name: 'Bon Iver', desc: 'From a cabin in Wisconsin to redefining folk music with auto-tune and falsetto — nothing sounds like this.' },
      { name: 'Fleet Foxes', desc: 'Lush, harmony-rich folk that sounds like sunlight filtering through ancient forest canopy.' },
      { name: 'The Lumineers', desc: 'Stomping, raw American folk-rock that turned campfire simplicity into stadium-sized anthems.' },
    ],
    '1970s': [
      { name: 'Joni Mitchell', desc: 'The greatest songwriter who ever lived, probably. "Blue" rewrote the rules of what music could confess.' },
      { name: 'John Prine', desc: 'Working-class poetry set to simple chords — funny, heartbreaking, and impossibly wise.' },
      { name: 'Sandy Denny', desc: 'The voice of British folk-rock — powerful, haunting, and tragically underappreciated.' },
    ],
    '1960s': [
      { name: 'Bob Dylan', desc: 'Changed popular music forever by proving songs could be literature. Won the Nobel Prize to prove the point.' },
      { name: 'Joan Baez', desc: 'Crystal-clear soprano that carried the folk revival and the civil rights movement on its wings.' },
      { name: 'Simon & Garfunkel', desc: 'Poetic folk-pop perfection — "Bridge Over Troubled Water" is still the sound of pure comfort.' },
    ],
  },
  'Country': {
    Modern: [
      { name: 'Zach Bryan', desc: 'Raw, working-class country that went from Oklahoma oil fields to stadiums on pure authenticity alone.' },
      { name: 'Sierra Ferrell', desc: 'Time-traveling country — vintage honky-tonk, gypsy jazz, and mountain music from another dimension.' },
      { name: 'Tyler Childers', desc: 'Appalachian country-folk with a poet\'s soul and a voice that sounds like the mountains themselves.' },
    ],
    '2010s': [
      { name: 'Sturgill Simpson', desc: 'Outlaw country rebel who made a psychedelic country album, then a soul album, then an anime. A true original.' },
      { name: 'Chris Stapleton', desc: 'Blues-soaked country with a powerhouse voice that made Nashville remember what real singing sounds like.' },
      { name: 'Kacey Musgraves', desc: 'Progressive country-pop that\'s equal parts traditional and trailblazing — "Golden Hour" is a masterpiece.' },
    ],
    '1990s': [
      { name: 'Garth Brooks', desc: 'Country music\'s biggest showman — turned honky-tonk into arena rock and outsold nearly everyone.' },
      { name: 'Shania Twain', desc: 'Country-pop supernova who rewrote the rules of what country music could look and sound like.' },
      { name: 'Alan Jackson', desc: 'Traditional country craftsmanship at its finest — simple, honest songs delivered with quiet dignity.' },
    ],
    '1970s': [
      { name: 'Willie Nelson', desc: 'Outlaw country godfather who left Nashville to do it his way — and changed American music forever.' },
      { name: 'Dolly Parton', desc: 'The greatest songwriter in country history, wrapped in rhinestones and armed with the sharpest wit in music.' },
      { name: 'Emmylou Harris', desc: 'Country-folk angel whose voice can make any song sound like the most important thing you\'ve ever heard.' },
    ],
    '1960s': [
      { name: 'Johnny Cash', desc: 'The Man in Black — outlaw spirit, deep baritone, and songs that spoke for prisoners, workers, and rebels.' },
      { name: 'Patsy Cline', desc: 'Crossover country queen whose voice on "Crazy" still stops people in their tracks 60 years later.' },
      { name: 'Merle Haggard', desc: 'Bakersfield sound pioneer who wrote from experience — prison, heartbreak, working life — with devastating honesty.' },
    ],
    '1950s': [
      { name: 'Hank Williams', desc: 'Country music\'s Shakespeare — died at 29 but left behind songs that will outlive us all.' },
      { name: 'Patsy Cline', desc: 'Smooth, sophisticated country vocals that crossed over to pop and changed what country singing could be.' },
      { name: 'Johnny Cash', desc: 'Boom-chicka-boom rhythm, deep voice, and rebel attitude — he made country cool before cool existed.' },
    ],
  },
};

// --- AI Feature Functions ---

function detectThemeKeywords(text) {
  const lower = text.toLowerCase();
  const themes = [];
  if (/love|heart|kiss|together|hold|touch|romance/.test(lower)) themes.push('love');
  if (/loss|gone|miss|goodbye|memory|remember|funeral|death/.test(lower)) themes.push('loss');
  if (/hope|light|tomorrow|dream|future|believe|rise/.test(lower)) themes.push('hope');
  if (/night|dark|moon|star|midnight|late|neon|city/.test(lower)) themes.push('night');
  if (/free|road|run|escape|wind|fly|open|wild/.test(lower)) themes.push('freedom');
  return themes.length > 0 ? themes : ['hope'];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function getChordSuggestions(inputChords, songPart) {
  await delay(800 + Math.random() * 700);

  const options = CHORD_THEORY.progressions[songPart] || CHORD_THEORY.progressions.Chorus;
  const picks = [];
  const used = new Set();
  while (picks.length < 3 && picks.length < options.length) {
    const idx = Math.floor(Math.random() * options.length);
    if (!used.has(idx)) {
      used.add(idx);
      picks.push(options[idx]);
    }
  }

  let response = `Based on your progression "${inputChords}", here are some suggestions for your ${songPart}:\n\n`;
  picks.forEach((p, i) => {
    response += `**Option ${i + 1}: ${p.chords}**\n${p.why}\n\n`;
  });
  response += `Try playing these alongside your original "${inputChords}" and see which one gives you chills — that's the one.`;
  return response;
}

export async function getInspiration(theme) {
  await delay(800 + Math.random() * 700);

  const themes = detectThemeKeywords(theme);
  const matchedTheme = INSPIRATION_IDEAS.find((t) => themes.includes(t.theme)) || pickRandom(INSPIRATION_IDEAS);

  const ideas = matchedTheme.ideas;
  let response = `Here are some creative sparks inspired by "${theme}":\n\n`;
  response += `**1. Song Concept:** ${ideas[0].title} — ${ideas[0].concept}\n\n`;
  response += `**2. Vivid Images & Metaphors:**\n`;
  ideas[1].images.forEach((img) => {
    response += `  - ${img}\n`;
  });
  response += `\n**3. Scene Sketch:**\n${ideas[2].scene}\n\n`;
  response += `Let these marinate — sometimes the best songs come from connecting two ideas that don't seem related at first.`;
  return response;
}

export async function getLyricFeedback(lyrics, songPart, rhymeScheme, persona) {
  await delay(1000 + Math.random() * 800);

  const template = FEEDBACK_TEMPLATES[persona] || FEEDBACK_TEMPLATES['Classic Hitmaker'];
  const strength = pickRandom(template.strengths);
  const improvement = pickRandom(template.improvements);

  const lines = lyrics.split('\n').filter((l) => l.trim());
  const lineCount = lines.length;

  // Generate refined lyrics by making small improvements
  const refinedLines = lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    // Capitalize first word if not already
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return capitalized;
  });

  const isReady = lineCount >= 4 && lyrics.length > 100;

  return {
    critique: `**Strengths:** ${strength}\n\n**Areas to develop:** ${improvement}\n\nYou're writing for the ${songPart} with a ${rhymeScheme} scheme — ${lineCount >= 4 ? 'the structure is solid' : 'consider adding more lines to fill out the section'}. ${isReady ? 'This has real potential — keep refining and it could be something special.' : 'Keep pushing — great songs are rewritten, not written.'}`,
    refinedLyrics: refinedLines.join('\n'),
    isReady: isReady,
    readinessExplanation: isReady
      ? 'The bones are strong here. The imagery works, the rhythm is starting to click, and the emotional core is clear. A few more passes on the word choices and this could really connect with people.'
      : 'You\'re building something, but it needs more development. Focus on strengthening your central image, tightening the meter, and making every line serve the story. Great songs take many drafts — keep going.',
  };
}

export async function getArtistDiscovery(genre, decade) {
  await delay(800 + Math.random() * 700);

  const genreData = ARTIST_DATABASE[genre];
  if (!genreData) {
    return `I don't have deep knowledge of ${genre} yet, but here's a tip: search "${genre} ${decade} essential artists" and dive into the rabbit hole. The best discoveries happen when you follow the trail from one artist to the next.`;
  }

  const decadeData = genreData[decade];
  if (!decadeData) {
    // Fall back to Modern
    const fallback = genreData.Modern || Object.values(genreData)[0];
    if (!fallback) {
      return `I'm still building my ${genre} knowledge for the ${decade}. Try a different decade or genre!`;
    }
    let response = `I don't have specific ${decade} picks for ${genre}, but here are some modern artists in the genre you should check out:\n\n`;
    fallback.forEach((a, i) => {
      response += `**${i + 1}. ${a.name}** — ${a.desc}\n\n`;
    });
    return response;
  }

  let response = `Here are some ${decade === 'Modern' ? 'up-and-coming' : `essential ${decade}`} artists in ${genre}:\n\n`;
  decadeData.forEach((a, i) => {
    response += `**${i + 1}. ${a.name}** — ${a.desc}\n\n`;
  });
  response += `Start with any of these and let the algorithm take you deeper. Happy listening!`;
  return response;
}
