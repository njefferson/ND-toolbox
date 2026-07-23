// Single source of truth for the Feelings Wheel taxonomy.
// Edit the compact tree below; this script flattens it into the runtime
// dataset at src/modules/feelings/data/wheel.json (nodes + indexes-friendly
// shape). Keeping the taxonomy here — not in the UI — is the "data, not
// hardcoded" requirement, and makes the word list editable or swappable.
//
// Provenance: the 6 cores are Willcox (1982); secondary words follow the
// Willcox/Roberts lineage; tertiary words are curated for plain-language
// clarity and an ND-first, non-threat-heavy tone. `provenance` records this
// per node so any curated word is visible, not hidden.
//
// Guidance ("what this often points to / one option") is authored for the
// cores and secondaries only (per plan). It is non-clinical, non-moralizing,
// always optional in tone, and never implies a feeling is a problem to fix.
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..', 'src', 'modules', 'feelings', 'data', 'wheel.json'
);

// t(label, definition, aliases?) — a tertiary (ring-3) landing word.
const t = (label, definition, aliases = []) => ({ label, definition, aliases });
// s(...) — a secondary (ring-2) word with its guidance and tertiaries.
const s = (label, definition, guidance, tertiaries, aliases = []) =>
  ({ label, definition, guidance, aliases, tertiaries });

const TREE = [
  {
    id: 'joyful', label: 'Joyful', glyph: '◆', aliases: ['joy', 'happy', 'glad'],
    definition: 'A bright, warm feeling of gladness or delight.',
    guidance: {
      pointsTo: 'Joy often shows up when something matters to you and is going well.',
      oneOption: 'If it fits, you might pause a moment to let the good feeling land.',
    },
    secondaries: [
      s('Content', 'Quietly satisfied; you have enough right now.',
        { pointsTo: 'Contentment often points to a need that is, for now, met.',
          oneOption: 'You might simply notice what is going right, no need to change anything.' },
        [t('Satisfied', 'Pleased with how something turned out.', ['pleased']),
         t('Fulfilled', 'Full and complete, as if something meaningful is done.', ['complete'])]),
      s('Happy', 'A light, glad feeling.',
        { pointsTo: 'Happiness often follows a moment that fits what you value.',
          oneOption: 'You might name out loud one thing that sparked it.' },
        [t('Cheerful', 'Bright and good-humored.', ['upbeat']),
         t('Delighted', 'Sharply, happily surprised by something good.', ['thrilled']),
         t('Glad', 'Simply pleased that something is so.')]),
      s('Excited', 'Lit up and energized about what is ahead.',
        { pointsTo: 'Excitement often points to something you are looking forward to.',
          oneOption: 'You might channel a little of the energy into one small first step.' },
        [t('Energetic', 'Full of ready energy.', ['lively']),
         t('Eager', 'Keen and impatient to begin.', ['keen'])]),
      s('Playful', 'Lighthearted and up for fun.',
        { pointsTo: 'Playfulness often shows up when you feel safe enough to be loose.',
          oneOption: 'You might give yourself permission to follow it for a few minutes.' },
        [t('Amused', 'Quietly entertained; something struck you as funny.'),
         t('Lighthearted', 'Free of weight or worry for now.', ['carefree'])]),
      s('Optimistic', 'Leaning toward things working out.',
        { pointsTo: 'Optimism often points to a sense that effort here is worth it.',
          oneOption: 'You might jot one hope so you can return to it later.' },
        [t('Hopeful', 'Expecting good things are possible.'),
         t('Inspired', 'Moved to make or do something.', ['motivated to create'])]),
      s('Interested', 'Drawn in; wanting to know more.',
        { pointsTo: 'Interest often points to something worth your attention.',
          oneOption: 'You might follow the curiosity one question further.' },
        [t('Curious', 'Wanting to explore or understand.', ['inquisitive']),
         t('Absorbed', 'Fully taken up by something.', ['engrossed']),
         t('Engaged', 'Actively involved and present.')]),
    ],
  },
  {
    id: 'powerful', label: 'Powerful', glyph: '▲', aliases: ['strong', 'empowered', 'in control'],
    definition: 'A feeling of capability, confidence, and agency.',
    guidance: {
      pointsTo: 'A sense of power often points to something you can affect or do.',
      oneOption: 'If it fits, you might name the one thing that is yours to act on.',
    },
    secondaries: [
      s('Confident', 'Sure of yourself and what you can do.',
        { pointsTo: 'Confidence often points to skill or preparation you can trust.',
          oneOption: 'You might let one recent success stand as evidence.' },
        [t('Self-assured', 'Steady in who you are.', ['assured']),
         t('Bold', 'Willing to take a risk.', ['daring']),
         t('Empowered', 'Free and able to act on your own terms.')]),
      s('Proud', 'Warmly pleased with something you did or are.',
        { pointsTo: 'Pride often points to effort or values you lived up to.',
          oneOption: 'You might let yourself take quiet credit for it.' },
        [t('Accomplished', 'You achieved something that took work.', ['achieved']),
         t('Worthy', 'Deserving of respect and care.', ['deserving']),
         t('Triumphant', 'Victorious after a real effort.')]),
      s('Respected', 'Seen and regarded by others.',
        { pointsTo: 'Feeling respected often points to a need to be taken seriously being met.',
          oneOption: 'You might notice who offered it, and let it register.' },
        [t('Valued', 'Treated as if you matter.', ['valued']),
         t('Admired', 'Looked up to for who you are or what you do.')]),
      s('Capable', 'Up to the task in front of you.',
        { pointsTo: 'Capability often points to a match between the task and your skills.',
          oneOption: 'You might start with the part you already know how to do.' },
        [t('Competent', 'Skilled and reliable at this.', ['skilled']),
         t('Resourceful', 'Good at finding a way through.', ['inventive'])]),
      s('Determined', 'Set on seeing something through.',
        { pointsTo: 'Determination often points to a goal that matters to you.',
          oneOption: 'You might define the next single step and stop there.' },
        [t('Motivated', 'Moved and ready to act.', ['driven']),
         t('Focused', 'Attention gathered on one thing.', ['locked in'])]),
      s('Appreciated', 'Your contribution was noticed.',
        { pointsTo: 'Feeling appreciated often points to a need to be seen being met.',
          oneOption: 'You might let the acknowledgment fully arrive before moving on.' },
        [t('Recognized', 'Acknowledged for what you did.', ['acknowledged']),
         t('Important', 'Your presence makes a difference here.', ['significant'])]),
    ],
  },
  {
    id: 'peaceful', label: 'Peaceful', glyph: '●', aliases: ['calm', 'serene', 'at peace'],
    definition: 'A settled, calm, unhurried ease.',
    guidance: {
      pointsTo: 'Peace often shows up when nothing urgent is pulling at you.',
      oneOption: 'If it fits, you might slow one breath and stay here a beat longer.',
    },
    secondaries: [
      s('Calm', 'Settled and unbothered.',
        { pointsTo: 'Calm often points to a nervous system that feels safe enough.',
          oneOption: 'You might let your shoulders drop and notice the quiet.' },
        [t('Settled', 'At rest, not stirred up.', ['at rest']),
         t('Still', 'Quiet and unmoving inside.', ['quiet'])]),
      s('Relaxed', 'Loose and free of tension.',
        { pointsTo: 'Relaxation often points to a load that has, for now, lifted.',
          oneOption: 'You might let one part of your body soften a little more.' },
        [t('At ease', 'Comfortable and unworried.', ['comfortable']),
         t('Unhurried', 'No need to rush anything.', ['leisurely'])]),
      s('Secure', 'Safe and steady.',
        { pointsTo: 'Security often points to a need for safety being met right now.',
          oneOption: 'You might notice one thing that is holding you steady.' },
        [t('Safe', 'Out of harm; protected.', ['protected']),
         t('Grounded', 'Rooted and present in your body.', ['centered']),
         t('Protected', 'Shielded from what could harm you.')]),
      s('Loving', 'Warm and caring toward someone.',
        { pointsTo: 'Love often points to a connection that matters to you.',
          oneOption: 'You might let the person know, in a small way, if it feels right.' },
        [t('Affectionate', 'Warmly fond.', ['fond']),
         t('Tender', 'Gentle and soft-hearted.', ['gentle']),
         t('Devoted', 'Committed and loyal in care.')]),
      s('Grateful', 'Thankful for something you have or received.',
        { pointsTo: 'Gratitude often points to something good you have noticed.',
          oneOption: 'You might name one thing, however small, that you are glad of.' },
        [t('Thankful', 'Appreciative of a specific good.', ['appreciative']),
         t('Warm', 'Softly glowing toward someone or something.')]),
      s('Trusting', 'Willing to be open and rely on someone.',
        { pointsTo: 'Trust often points to a bond that has felt safe over time.',
          oneOption: 'You might let one small honesty pass between you.' },
        [t('Open', 'Willing to receive and share.', ['receptive']),
         t('Connected', 'In genuine contact with someone.', ['close'])]),
    ],
  },
  {
    id: 'sad', label: 'Sad', glyph: '▽', aliases: ['unhappy', 'down', 'low', 'blue'],
    definition: 'A heavy, low feeling, often tied to loss.',
    guidance: {
      pointsTo: 'Sadness often points to something you care about that has been lost or missed.',
      oneOption: 'If it fits, you might let the feeling be here without needing to fix it.',
    },
    secondaries: [
      s('Lonely', 'Disconnected; missing closeness.',
        { pointsTo: 'Loneliness often points to a need for connection that is not being met right now.',
          oneOption: 'You might send one small message to someone you trust — no pressure to.' },
        [t('Isolated', 'Cut off from others.', ['alone', 'cut off']),
         t('Abandoned', 'Left behind by someone you counted on.', ['deserted']),
         t('Disconnected', 'Present with others but not in contact.', ['distant'])]),
      s('Hurt', 'Wounded by something that happened.',
        { pointsTo: 'Hurt often points to something that mattered being damaged or dismissed.',
          oneOption: 'You might place a hand where you feel it and breathe once, slowly.' },
        [t('Wounded', 'Cut deeply by words or actions.', ['injured']),
         t('Heartbroken', 'In deep grief over a loss.', ['devastated'])]),
      s('Disappointed', 'Let down when things fell short.',
        { pointsTo: 'Disappointment often points to a hope that did not come to pass.',
          oneOption: 'You might name what you had wanted, plainly, to yourself.' },
        [t('Let down', 'Failed by someone or something.'),
         t('Discouraged', 'Losing heart to keep going.', ['disheartened'])]),
      s('Depressed', 'Heavily low, often flat or empty.',
        { pointsTo: 'This heaviness often points to being depleted or grieving, not to a flaw in you.',
          oneOption: 'You might make the next step very small — a glass of water counts.' },
        [t('Empty', 'Hollow, as if something is missing.', ['numb inside']),
         t('Hopeless', 'As if nothing will change.', ['despairing']),
         t('Numb', 'Feeling little or nothing at all.', ['flat'])]),
      s('Guilty', 'Uneasy that you did something wrong.',
        { pointsTo: 'Guilt often points to a value of yours that you feel you crossed.',
          oneOption: 'You might ask what, if anything, is actually yours to repair.' },
        [t('Ashamed', 'Wanting to hide, as if you are bad.', ['humiliated']),
         t('Remorseful', 'Sorry and wishing you had acted differently.', ['regretful'])]),
      s('Vulnerable', 'Exposed and open to being hurt.',
        { pointsTo: 'Vulnerability often points to something tender being close to the surface.',
          oneOption: 'You might choose who, if anyone, is safe enough to see it.' },
        [t('Fragile', 'Easily overwhelmed right now.', ['delicate']),
         t('Exposed', 'Uncomfortably seen or unguarded.', ['unprotected'])]),
    ],
  },
  {
    id: 'mad', label: 'Mad', glyph: '✕', aliases: ['angry', 'anger', 'pissed', 'upset'],
    definition: 'A charged feeling that something is wrong or unfair.',
    guidance: {
      pointsTo: 'Anger often points to a boundary crossed or a need going unmet.',
      oneOption: 'If it fits, you might ask what the anger is trying to protect.',
    },
    secondaries: [
      s('Frustrated', 'Blocked from something you want.',
        { pointsTo: 'Frustration often points to an obstacle between you and a goal.',
          oneOption: 'You might name the specific blocker; it is often smaller once named.' },
        [t('Blocked', 'Stopped from moving forward.', ['stuck']),
         t('Exasperated', 'Worn thin by repeated trouble.', ['fed up']),
         t('Fed up', 'Done with putting up with it.')]),
      s('Irritated', 'Bothered and on edge.',
        { pointsTo: 'Irritation often points to a small, repeated friction — or to being depleted.',
          oneOption: 'You might check whether you are hungry, tired, or overstimulated first.' },
        [t('Annoyed', 'Mildly bothered.', ['bugged']),
         t('Agitated', 'Restless and stirred up.', ['restless'])]),
      s('Resentful', 'Holding onto an old unfairness.',
        { pointsTo: 'Resentment often points to a hurt that was never fully addressed.',
          oneOption: 'You might name the unmet expectation underneath it.' },
        [t('Bitter', 'Sour from lasting hurt.', ['embittered']),
         t('Indignant', 'Angry at something clearly unfair.', ['affronted'])]),
      s('Hostile', 'Strongly angry, ready to push back.',
        { pointsTo: 'Hostility often points to feeling attacked or deeply wronged.',
          oneOption: 'You might give the heat somewhere safe to go — move, or step away.' },
        [t('Furious', 'Intensely angry.', ['livid']),
         t('Enraged', 'Overtaken by anger.', ['irate']),
         t('Seething', 'Anger held tightly under the surface.')]),
      s('Jealous', 'Threatened by what someone else has.',
        { pointsTo: 'Jealousy often points to something you want or fear losing.',
          oneOption: 'You might name what you actually want underneath the comparison.' },
        [t('Envious', 'Wanting what another has.', ['covetous']),
         t('Possessive', 'Afraid of losing someone or something.', ['clingy'])]),
      s('Disrespected', 'Treated as if you do not matter.',
        { pointsTo: 'Feeling disrespected often points to a need to be valued being crossed.',
          oneOption: 'You might decide what boundary, if any, you want to name later.' },
        [t('Dismissed', 'Waved off or ignored.', ['brushed aside']),
         t('Belittled', 'Made to feel small.', ['put down'])]),
    ],
  },
  {
    id: 'scared', label: 'Scared', glyph: '◇', aliases: ['afraid', 'fearful', 'fear', 'frightened', 'nervous'],
    definition: 'A guarded feeling of threat or uncertainty.',
    guidance: {
      pointsTo: 'Fear often points to something that feels unsafe or unknown.',
      oneOption: 'If it fits, you might ask whether the danger is here now, or anticipated.',
    },
    secondaries: [
      s('Anxious', 'Keyed up and uneasy about what might happen.',
        { pointsTo: 'Anxiety often points to uncertainty your mind is trying to solve ahead of time.',
          oneOption: 'You might bring attention to one thing you can sense right now.' },
        [t('Nervous', 'Jittery before something.', ['on edge']),
         t('Worried', 'Turning a concern over and over.', ['fretful']),
         t('Uneasy', 'Something feels off, hard to name.')]),
      s('Insecure', 'Unsure of your footing or worth.',
        { pointsTo: 'Insecurity often points to a fear of not being enough in this moment.',
          oneOption: 'You might recall one time you handled something like this.' },
        [t('Inadequate', 'As if you fall short.', ['not enough']),
         t('Self-conscious', 'Overly aware of being watched or judged.', ['exposed'])]),
      s('Overwhelmed', 'Too much coming at once.',
        { pointsTo: 'Overwhelm often points to more input or demand than capacity right now.',
          oneOption: 'You might reduce the field to the single next action, and hide the rest.' },
        [t('Stressed', 'Under heavy pressure.', ['pressured']),
         t('Frazzled', 'Frayed and scattered.', ['scattered']),
         t('Swamped', 'Buried under too much to do.')]),
      s('Rejected', 'Pushed away or not wanted.',
        { pointsTo: 'Rejection often points to a need to belong that feels threatened.',
          oneOption: 'You might remind yourself that one no is not a verdict on your worth.' },
        [t('Excluded', 'Left out of something.', ['left out']),
         t('Unwanted', 'As if your presence is not welcome.', ['unwelcome'])]),
      s('Confused', 'Unable to make sense of things.',
        { pointsTo: 'Confusion often points to missing information or mixed signals.',
          oneOption: 'You might write down the one question you most want answered.' },
        [t('Bewildered', 'Thoroughly lost or puzzled.', ['baffled']),
         t('Uncertain', 'Unsure which way to go.', ['unsure'])]),
      s('Threatened', 'Sensing something could harm you.',
        { pointsTo: 'Feeling threatened often points to a real or perceived danger to you or what you hold.',
          oneOption: 'You might create a little distance or a barrier while you assess.' },
        [t('Alarmed', 'Suddenly on high alert.', ['startled']),
         t('Defensive', 'Braced to protect yourself.', ['guarded'])]),
    ],
  },
];

// Curated search aliases, keyed by label. Merged in at flatten time so words are
// reachable by the common terms people actually type — including informal ones —
// without cluttering the tree literal above. Labels are unique across the tree,
// so keying by label is collision-free. These fuel search only (never shown as
// the word); provenance stays `curated`.
//
// Coverage note: every ring-2 word (secondaries) shipped with no aliases, and 15
// leaves had none, so search could only reach them by their exact label. This map
// closes that gap.
const ALIASES = {
  // Joyful
  Content: ['satisfied', 'gratified'],
  Happy: ['glad', 'pleased', 'cheery'],
  Excited: ['thrilled', 'pumped', 'stoked'],
  Playful: ['silly', 'goofy', 'fun'],
  Optimistic: ['hopeful', 'positive'],
  Interested: ['curious', 'intrigued'],
  Glad: ['pleased', 'happy'],
  Amused: ['entertained', 'tickled'],
  Hopeful: ['encouraged', 'optimistic'],
  Engaged: ['involved', 'present'],
  // Powerful
  Confident: ['self-assured', 'sure', 'assured'],
  Proud: ['proud of myself'],
  Respected: ['esteemed', 'honored'],
  Capable: ['able', 'up to it'],
  Determined: ['resolved', 'driven', 'set on it'],
  Appreciated: ['valued', 'thanked'],
  Empowered: ['capable', 'in control'],
  Triumphant: ['victorious', 'on top'],
  Admired: ['looked up to', 'respected'],
  Valued: ['prized', 'cherished'],
  // Peaceful
  Calm: ['chill', 'at peace', 'mellow'],
  Relaxed: ['loose', 'unwound', 'chilled out'],
  Secure: ['safe', 'stable', 'steady'],
  Loving: ['caring', 'warm', 'affection'],
  Grateful: ['thankful', 'appreciative', 'blessed'],
  Trusting: ['open', 'trustful'],
  Protected: ['safe', 'shielded'],
  Devoted: ['loyal', 'committed'],
  Warm: ['tender', 'affectionate'],
  // Sad
  Lonely: ['alone', 'lonesome', 'isolated'],
  Hurt: ['wounded', 'pained', 'aching'],
  Disappointed: ['let down', 'deflated', 'bummed'],
  Depressed: ['down', 'low', 'flat'],
  Guilty: ['ashamed', 'bad about it'],
  Vulnerable: ['exposed', 'raw', 'tender'],
  'Let down': ['disappointed', 'failed'],
  // Mad
  Frustrated: ['stuck', 'fed up', 'blocked'],
  Irritated: ['annoyed', 'bugged', 'on edge'],
  Resentful: ['bitter', 'grudge'],
  Hostile: ['aggressive', 'antagonistic'],
  Jealous: ['envious', 'covetous'],
  Disrespected: ['dismissed', 'disregarded', 'slighted'],
  'Fed up': ['had enough', 'done with it'],
  Seething: ['fuming', 'boiling'],
  // Scared
  Anxious: ['nervous', 'on edge', 'worried', 'uneasy'],
  Insecure: ['not enough', 'unsure'],
  Overwhelmed: ['too much', 'swamped', 'maxed out'],
  Rejected: ['left out', 'turned away', 'shut out'],
  Confused: ['lost', 'unsure', 'muddled'],
  Threatened: ['in danger', 'unsafe', 'under threat'],
  Uneasy: ['unsettled', 'off'],
  Swamped: ['buried', 'overloaded'],
};

// Merge a node's own aliases with its curated map entry, de-duped
// case-insensitively (keeping first-seen casing) and never echoing the label.
function withAliases(label, base) {
  const out = [];
  const seen = new Set([label.toLowerCase()]);
  for (const a of [...(base || []), ...(ALIASES[label] || [])]) {
    const k = a.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(a); }
  }
  return out;
}

// Guidance for the landing (tertiary) words, keyed by label and merged at flatten
// time — same pattern as ALIASES, so the tree literal above stays readable. Until
// now only cores and secondaries carried a "what this points to · one option"
// panel; the words people actually land on had a definition and nothing more.
//
// VOICE (unchanged from cores/secondaries, and load-bearing here): every line is
// non-clinical, non-moralizing, and optional in tone. `pointsTo` validates and
// gently locates the feeling; it never pathologizes or implies a flaw. `oneOption`
// is a small, take-it-or-leave-it thing you *might* do — never advice, never a fix,
// never a should. The panel is collapsed by default, so it never blocks the word.
const g = (pointsTo, oneOption) => ({ pointsTo, oneOption });
const LEAF_GUIDANCE = {
  // Joyful
  Satisfied: g('Satisfaction often points to something that matched what you hoped for.', 'You might let yourself register that it worked out, before moving to the next thing.'),
  Fulfilled: g('Fulfilment often points to something that lined up with what matters to you.', 'You might note what made it meaningful, so you can seek more of it.'),
  Cheerful: g('Cheerfulness often shows up when nothing is weighing on you just now.', 'You might let it be light, with no need to justify it.'),
  Delighted: g('Delight often points to a good surprise — something better than you expected.', 'You might share it with someone; delight tends to grow when it is passed on.'),
  Glad: g('Gladness often points to a small thing quietly going right.', 'You might name the one thing you are glad of, out loud or to yourself.'),
  Energetic: g('Energy often points to a body and mind that are ready to move.', 'You might spend a little of it on something you actually want to do.'),
  Eager: g('Eagerness often points to something ahead that you care about.', 'You might channel it into one small first step now.'),
  Amused: g('Amusement often shows up when something catches you pleasantly off guard.', 'You might let yourself enjoy it without analysing why it is funny.'),
  Lighthearted: g('Lightheartedness often shows up when, for now, nothing needs carrying.', 'You might let this be a break, and pick the weight back up later.'),
  Hopeful: g('Hope often points to a sense that things could genuinely go well.', 'You might write the hope down so you can return to it on a harder day.'),
  Inspired: g('Inspiration often points to something you would like to make or do.', 'You might capture the idea quickly, before it fades.'),
  Curious: g('Curiosity often points to something worth a closer look.', 'You might follow it one question further.'),
  Absorbed: g('Absorption often shows up when something fits your attention just right.', 'You might protect the focus for a while longer, if you can.'),
  Engaged: g('Engagement often points to something holding your interest and effort.', 'You might notice what makes it click, so you can find more of it.'),
  // Powerful
  'Self-assured': g('Self-assurance often points to a settled sense of who you are.', 'You might let it steady you, without needing to prove it to anyone.'),
  Bold: g('Boldness often points to caring about something more than the risk of it.', 'You might take the one brave step while the nerve is here.'),
  Empowered: g('Feeling empowered often points to a real choice being yours to make.', 'You might name the one thing that is genuinely in your hands.'),
  Accomplished: g('Accomplishment often points to effort that finally paid off.', 'You might take quiet credit before rushing to the next task.'),
  Worthy: g('Feeling worthy often points to a sense that you matter as you are.', 'You might let that be true without earning it today.'),
  Triumphant: g('Triumph often points to something hard that you came through.', 'You might mark it somehow, even quietly, so it counts.'),
  Valued: g('Feeling valued often points to being treated as if you matter here.', 'You might let it land, rather than waving it off.'),
  Admired: g('Being admired often points to something real in you that others can see.', 'You might consider believing them, just a little.'),
  Competent: g('Competence often points to skill you have built and can trust.', 'You might start with the part you already know how to do.'),
  Resourceful: g('Resourcefulness often points to your knack for finding a way through.', 'You might trust that you will figure out the next bit too.'),
  Motivated: g('Motivation often points to a goal that feels worth the effort.', 'You might define the single next step and stop there.'),
  Focused: g('Focus often shows up when your attention and the task line up.', 'You might guard the quiet around it while it lasts.'),
  Recognized: g('Being recognized often points to a need to be seen being met.', 'You might let the acknowledgement fully arrive.'),
  Important: g('Feeling important often points to your presence making a real difference here.', 'You might notice where you are most needed, and where you are free to rest.'),
  // Peaceful
  Settled: g('Feeling settled often points to a body that feels safe enough to rest.', 'You might let your shoulders drop and stay a moment longer.'),
  Still: g('Stillness often shows up when nothing is pulling at you.', 'You might simply notice the quiet, without needing to fill it.'),
  'At ease': g('Ease often points to a load that has, for now, lifted.', 'You might let one more part of you soften.'),
  Unhurried: g('Feeling unhurried often points to enough time, and permission to use it.', 'You might take the next thing slowly, on purpose.'),
  Safe: g('Safety often points to a need for protection being met right now.', 'You might notice the one thing helping you feel it.'),
  Grounded: g('Feeling grounded often points to being present in your body and the moment.', 'You might feel your feet on the floor and stay there a breath.'),
  Protected: g('Feeling protected often points to something or someone keeping you safe.', 'You might let yourself lean on it a little.'),
  Affectionate: g('Affection often points to warmth toward someone who matters.', 'You might let them know, in a small way, if it feels right.'),
  Tender: g('Tenderness often points to something soft and open in you right now.', 'You might treat both yourself and them gently while it is here.'),
  Devoted: g('Devotion often points to a care you have chosen and want to keep.', 'You might notice what makes it worth it to you.'),
  Thankful: g('Thankfulness often points to a specific good you have noticed.', 'You might name the one thing, however small.'),
  Warm: g('Warmth often points to a quiet glow toward someone or something.', 'You might stay with the feeling a moment before it passes.'),
  Open: g('Openness often points to feeling safe enough to receive and share.', 'You might let one honest thing pass between you.'),
  Connected: g('Connection often points to genuine contact with someone.', 'You might do one small thing to keep the thread alive.'),
  // Sad
  Isolated: g('Isolation often points to a need for connection that is not being met right now.', 'You might make one small reach toward someone — there is no pressure to.'),
  Abandoned: g('Feeling abandoned often points to counting on someone who was not there.', 'You might be extra gentle with yourself; this one cuts deep.'),
  Disconnected: g('Disconnection often points to being near others but not quite in contact.', 'You might name what would help you feel met, even if you cannot act on it yet.'),
  Wounded: g('Feeling wounded often points to something that mattered being hurt or dismissed.', 'You might place a hand where you feel it and breathe once, slowly.'),
  Heartbroken: g('Heartbreak often points to the loss of something you loved — its size matches how much it meant.', 'You might let the grief be here without rushing it toward okay.'),
  'Let down': g('Feeling let down often points to a hope or expectation that was not met.', 'You might name plainly what you had wanted, just to yourself.'),
  Discouraged: g('Discouragement often points to effort that has not paid off yet.', 'You might rest before deciding whether to keep going.'),
  Empty: g('Emptiness often points to being depleted, or to something missing — not to a flaw in you.', 'You might make the next step very small; a glass of water counts.'),
  Hopeless: g('Hopelessness often settles in when you are worn down, and it tends to lift more than it feels like it will right now.', 'You might hold off on big conclusions until you have rested or eaten.'),
  Numb: g('Numbness is often a way the mind protects you when things are too much — not a sign that nothing matters.', 'You might let yourself feel little for now; sensation tends to return.'),
  Ashamed: g('Shame often says you ARE bad, when at most you did something you regret — those are not the same.', 'You might name the specific thing, which is smaller than the whole-self feeling.'),
  Remorseful: g('Remorse often points to a value of yours you feel you crossed.', 'You might ask what, if anything, is actually yours to repair.'),
  Fragile: g('Fragility often points to being close to your limit right now.', 'You might lower what you ask of yourself for a while.'),
  Exposed: g('Feeling exposed often points to something tender being uncomfortably seen.', 'You might choose who, if anyone, is safe enough to see it.'),
  // Mad
  Blocked: g('Feeling blocked often points to an obstacle between you and something you want.', 'You might name the specific blocker; it is often smaller once named.'),
  Exasperated: g('Exasperation often points to the same trouble happening one time too many.', 'You might step back before responding to the latest round.'),
  'Fed up': g('Being fed up often points to a limit you have quietly reached.', 'You might ask what you are no longer willing to put up with.'),
  Annoyed: g('Annoyance often points to a small friction — or to being tired or hungry underneath.', 'You might check whether it is really the thing, or the state you are in.'),
  Agitated: g('Agitation often points to stirred-up energy with nowhere to go.', 'You might give it an outlet — move, or step outside for a minute.'),
  Bitter: g('Bitterness often points to a hurt that never got fully addressed.', 'You might name the unmet expectation underneath it.'),
  Indignant: g('Indignation often points to something you see as clearly unfair.', 'You might separate what is yours to act on from what is not.'),
  Furious: g('Fury often points to a boundary or value that feels badly crossed.', 'You might give the heat somewhere safe to go before you act on it.'),
  Enraged: g('Rage often points to something that feels deeply wrong or threatening.', 'You might move your body or step away until the peak passes.'),
  Seething: g('Seething often points to anger held tightly under the surface.', 'You might let it out somewhere safe, rather than only holding it in.'),
  Envious: g('Envy often points to something you want, shown to you by someone who has it.', 'You might name what you actually want underneath the comparison.'),
  Possessive: g('Possessiveness often points to a fear of losing someone or something.', 'You might name the fear directly; it is usually softer than the grip.'),
  Dismissed: g('Feeling dismissed often points to a need to be taken seriously being crossed.', 'You might decide what, if anything, you want to name later.'),
  Belittled: g('Feeling belittled often points to being made smaller than you are.', 'You might remind yourself of the size you actually take up.'),
  // Scared
  Nervous: g('Nervousness often points to something ahead that matters to you.', 'You might bring your attention to one thing you can sense right now.'),
  Worried: g('Worry often points to a concern your mind is trying to solve ahead of time.', 'You might write the worry down so it can stop circling.'),
  Uneasy: g('Unease often points to something feeling off before you can name it.', 'You might trust the signal and give it time to become clearer.'),
  Inadequate: g('Feeling inadequate often points to a fear of not being enough in this moment.', 'You might recall one time you handled something like this.'),
  'Self-conscious': g('Self-consciousness often points to feeling watched or judged.', 'You might notice that most people are far more focused on themselves.'),
  Stressed: g('Stress often points to more demand than capacity right now.', 'You might reduce the field to the single next action and hide the rest.'),
  Frazzled: g('Feeling frazzled often points to too many threads pulled at once.', 'You might drop all but one thread for a few minutes.'),
  Swamped: g('Feeling swamped often points to more to do than any one person could hold.', 'You might pick the one thing that would ease the most, and start there.'),
  Excluded: g('Feeling excluded often points to a need to belong that feels threatened.', 'You might remind yourself that one room is not everywhere.'),
  Unwanted: g('Feeling unwanted often points to a fear that your presence is not welcome.', 'You might be gentle with yourself, and check the story against the facts later.'),
  Bewildered: g('Bewilderment often points to missing information or mixed signals.', 'You might write down the one question you most want answered.'),
  Uncertain: g('Uncertainty often points to not yet having enough to choose.', 'You might name what you would need to know to feel surer.'),
  Alarmed: g('Alarm often points to something sudden your body flagged as a threat.', 'You might take one slow breath and check whether the danger is here now.'),
  Defensive: g('Defensiveness often points to feeling got at, and bracing to protect yourself.', 'You might pause to check whether you are actually under attack right now.'),
};

// --- flatten to the runtime dataset ---
const glyphs = {};
const nodes = [];

for (const core of TREE) {
  glyphs[core.id] = core.glyph;
  const secIds = core.secondaries.map((sec) => slug(core.id, sec.label));
  nodes.push({
    id: core.id, label: core.label, coreId: core.id, parentId: null, depth: 0,
    aliases: withAliases(core.label, core.aliases), definition: core.definition, neighbors: [],
    guidance: core.guidance, colorToken: `core.${core.id}`, provenance: 'willcox-1982',
  });
  for (const sec of core.secondaries) {
    const secId = slug(core.id, sec.label);
    const terIds = sec.tertiaries.map((ter) => slug(secId, ter.label));
    nodes.push({
      id: secId, label: sec.label, coreId: core.id, parentId: core.id, depth: 1,
      aliases: withAliases(sec.label, sec.aliases), definition: sec.definition,
      neighbors: secIds.filter((x) => x !== secId),
      guidance: sec.guidance, colorToken: `core.${core.id}`, provenance: 'willcox-1982-lineage',
    });
    for (const ter of sec.tertiaries) {
      const terId = slug(secId, ter.label);
      nodes.push({
        id: terId, label: ter.label, coreId: core.id, parentId: secId, depth: 2,
        aliases: withAliases(ter.label, ter.aliases), definition: ter.definition,
        neighbors: terIds.filter((x) => x !== terId),
        guidance: LEAF_GUIDANCE[ter.label] || null, colorToken: `core.${core.id}`, provenance: 'curated',
      });
    }
  }
}

// Ids are label-based slugs. All labels across the tree are unique (the guard
// below enforces it), so no parent namespacing is needed to stay collision-free.
function slug(_prefix, label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Guard: ids must be unique. (slug() is label-based; duplicate labels would clash.)
const seen = new Set();
for (const n of nodes) {
  if (seen.has(n.id)) throw new Error(`duplicate node id: ${n.id}`);
  seen.add(n.id);
}

// Guard: every leaf must carry guidance now, and every guidance key must map to a
// real leaf — so a typo in a label can't silently drop a panel or leave a dangling
// entry. (Doctrine §4/§5: added content is verified, not assumed.)
const leafLabels = new Set(nodes.filter((n) => n.depth === 2).map((n) => n.label));
const missingGuidance = [...leafLabels].filter((l) => !LEAF_GUIDANCE[l]);
const danglingGuidance = Object.keys(LEAF_GUIDANCE).filter((l) => !leafLabels.has(l));
if (missingGuidance.length) throw new Error(`leaves without guidance: ${missingGuidance.join(', ')}`);
if (danglingGuidance.length) throw new Error(`LEAF_GUIDANCE keys with no matching leaf: ${danglingGuidance.join(', ')}`);

const counts = { core: 0, ring2: 0, ring3: 0 };
for (const n of nodes) counts[['core', 'ring2', 'ring3'][n.depth]]++;

const dataset = {
  datasetId: 'willcox-feelings-wheel',
  datasetVersion: 3,
  source: 'Willcox, G. (1982), The Feeling Wheel. Secondary words follow the Willcox/Roberts lineage; tertiary words curated for ND Toolbox.',
  coreOrder: TREE.map((c) => c.id),
  glyphs,
  nodes,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(dataset, null, 2) + '\n');
console.log(
  `wrote ${nodes.length} nodes -> ${OUT}\n  cores: ${counts.core}  ring2: ${counts.ring2}  ring3: ${counts.ring3}`
);
