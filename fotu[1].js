/* Fotu — the instant-camera mascot for Living Room Labs.
   Self-contained: adds its own styles and markup. Include on any page with
   <script src="/fotu.js" defer></script> just before </body>.

   How it behaves
   - Starts every visit asleep and snoring, in a clear spot on the bottom edge.
   - Tap or click wakes it up where it stands (it does not walk off), then the chat opens.
   - Very few speech bubbles: at most a handful per visit, never while asleep.
   - On phones it stays put. It only shifts if a photo or text would end up underneath it.
   - Goes back to sleep after about a minute of nobody paying attention.
   - Close the chat twice and it takes the hint: it sleeps quietly for the rest of the visit.

   To change what Fotu says, edit the WORDS section below. Everything else can stay as is. */
(function () {
  "use strict";
  if (window.__fotuLoaded) return;
  window.__fotuLoaded = true;

  /* ================================================================
     WORDS — edit freely. {name} becomes ", Ravi" once Fotu knows the
     visitor's name, and disappears when it doesn't.
     ================================================================ */

  /* Main answers (also used by the quick-reply buttons) */
  var ANSWER_SHOOT = "We shoot food, pets, events, portraits, travel, products and real estate. If it matters to you, we'll make it look its best.";
  var ANSWER_PRICE = "Every shoot is different, so we quote based on what you need: the type of shoot, hours, location and number of photos. Send an enquiry and we'll get back with a price.";
  var ANSWER_FAST = "Edited photos usually arrive within a week. Big events like weddings can take a little longer, because every shot gets proper attention.";
  var ANSWER_TRAVEL = "Yes, our photographers travel. We're based in Hyderabad and happy to shoot in other cities too. Mention the location in your enquiry.";

  var FAQ_CHIPS = ["What do you shoot?", "How much does it cost?", "How fast do I get photos?", "Do you travel?", "Book a shoot"];
  var CATEGORIES = ["Food", "Pets", "Events", "Portraits", "Travel", "Products", "Real Estate"];
  var EVENT_TYPES = ["Wedding", "Birthday", "Baby Shower", "Housewarming", "Couple Shoot", "Performing Arts", "Corporate", "Other"];

  /* First thing Fotu says when woken up */
  var WAKE_LINES = [
    "Huh? I'm awake! I was just doing a very long exposure.",
    "Whoa, you woke me up! Good thing I sleep with my lens cap off.",
    "*yawn* Okay, okay, I'm up. Camera ready!",
    "Oh! A visitor. Let me adjust my focus... there you are.",
    "I wasn't sleeping. I was resting my shutter."
  ];
  var WAKE_BACK = ["Welcome back{name}! I saved your spot.", "Oh, it's you again{name}! My favourite visitor."];
  var WAKE_AGAIN = ["Back so soon? I had just started a dream about tripods.", "I'm up, I'm up! What did I miss?"];
  var WAKE_FOLLOW = "Ask me anything, or pick one below.";

  /* Time of day (used inside the wake-up greeting, not as pop-ups) */
  var TIME_GREETINGS = [
    [5, 11, ["Good morning! Best light of the day, and you're here for it."]],
    [11, 16, ["Good afternoon! Harsh light outside, perfect light in here."]],
    [16, 19, ["Golden hour! Everyone looks good right now. Including you."]],
    [19, 24, ["Good evening! Blue hour is a photographer's secret. Now it's yours too."]],
    [0, 5, ["Up late? Me too. Long exposure time."]]
  ];

  /* Festivals. "md" = same date every year (MM-DD). "from"/"to" = that year's dates (YYYY-MM-DD).
     Lunar festivals move every year, so add new dates here (or in content.json as "fotuFestivals").
     Lines marked * depend on moon sighting. */
  var FESTIVALS = [
    { md: "01-01", line: "Happy New Year! New year, new memories." },
    { md: "01-13", line: "Happy Lohri! Bonfire glow is free golden hour." },
    { md: "01-14", to_md: "01-15", line: "Happy Sankranti! Kites in the sky, me on the ground. Fair trade." },
    { md: "01-26", line: "Happy Republic Day!" },
    { md: "04-14", line: "Happy Baisakhi, Vishu and Puthandu!" },
    { md: "06-02", line: "Happy Telangana Formation Day! Proud Hyderabadi camera here." },
    { md: "08-15", line: "Happy Independence Day! The tiranga looks great on every sensor." },
    { md: "10-02", line: "Happy Gandhi Jayanti!" },
    { md: "12-25", line: "Merry Christmas! I asked Santa for a new lens cap." },
    { md: "12-31", line: "Last day of the year! Time for the year's best shots." },
    { from: "2026-11-06", to: "2026-11-09", line: "Happy Diwali! Finally, lighting I don't have to provide." },
    { from: "2026-11-15", to: "2026-11-15", line: "Happy Chhath Puja!" },
    { from: "2026-11-24", to: "2026-11-24", line: "Happy Guru Nanak Jayanti! Lights everywhere today." },
    { from: "2027-03-06", to: "2027-03-06", line: "Happy Maha Shivaratri! An all-night shoot. I respect that." },
    { from: "2027-03-10", to: "2027-03-10", line: "Eid Mubarak! Biryani, sheer khurma and great photos. *" },
    { from: "2027-03-21", to: "2027-03-22", line: "Happy Holi! Please don't throw colours at me. I'm not waterproof." },
    { from: "2027-04-07", to: "2027-04-07", line: "Ugadi Subhakankshalu! Sweet, sour and spicy, like a good year should be." },
    { from: "2027-04-15", to: "2027-04-15", line: "Happy Sri Rama Navami!" },
    { from: "2027-04-18", to: "2027-04-19", line: "Happy Mahavir Jayanti!" },
    { from: "2027-05-17", to: "2027-05-17", line: "Bakrid Mubarak! *" },
    { from: "2027-05-20", to: "2027-05-20", line: "Happy Buddha Purnima! Full moon tonight. Tripods out." },
    { from: "2027-07-11", to: "2027-08-01", sundays: true, line: "Happy Bonalu! Drums, colour and Hyderabad's best photo day." },
    { from: "2027-08-17", to: "2027-08-17", line: "Happy Raksha Bandhan! Siblings: the hardest group photo." },
    { from: "2027-08-25", to: "2027-08-25", line: "Happy Krishna Janmashtami!" },
    { from: "2027-09-04", to: "2027-09-14", line: "Ganpati Bappa Morya! Pandal-hopping with a camera is the best cardio." },
    { from: "2027-09-12", to: "2027-09-12", line: "Happy Onam! A pookalam is the most photogenic floor in the world." },
    { from: "2027-09-29", to: "2027-10-07", line: "Happy Bathukamma! Towers of flowers. My favourite still life." },
    { from: "2027-10-08", to: "2027-10-09", line: "Happy Dussehra! Good wins over evil, and over bad lighting." },
    { from: "2027-10-27", to: "2027-10-30", line: "Happy Diwali! Finally, lighting I don't have to provide." },
    { from: "2027-11-04", to: "2027-11-04", line: "Happy Chhath Puja!" },
    { from: "2027-11-14", to: "2027-11-14", line: "Happy Guru Nanak Jayanti! Lights everywhere today." }
  ];

  /* Small pop-up lines (rationed: only a few per visit) */
  var SLEEP_HINT = "Zzz... tap me if you need a photographer.";
  var LIGHTS_OFF = "Who turned off the lights? Good thing I brought my own flash.";
  var LIGHTS_ON = "Too bright! My aperture can't take this.";
  var LIGHTS_OFF_ASLEEP = "Thanks for dimming the lights... zzz";
  var LIGHTS_ON_ASLEEP = "Five more minutes...";
  var FAST_SCROLL = ["Whoa, motion blur!", "Slow down! My shutter can't keep up."];
  var PERSONAL_SPACE = "Personal space! Instant film is delicate.";
  var CLOSE_LINE = "Back to work. These photos won't print themselves.";
  var QUIET_LINE = "Got it, I'll take a nap. Tap me if you need me.";
  var BACK_LINE = "I'm back! Did you miss me? Don't answer that.";
  var EMPTY_LINE = "Type something first. Even a smiley works.";

  var PHOTO_LINES = {
    "Food": ["Hold still, biryani. Printing... delicious.", "No dishes were harmed. Several were eaten afterwards."],
    "Pets": ["This good boy held still for 0.4 seconds. Printed!", "Model fee: two treats and a belly rub."],
    "Events": ["Everyone's dancing. I'm printing as fast as I can.", "An uncle just told me my settings are wrong."],
    "Portraits": ["Natural smile, take 23. Printing take 24.", "Don't shake me, I'm developing."],
    "Travel": ["I walked here for this view. On these tiny legs.", "Postcard material. Literally, I print postcards."],
    "Products": ["That bottle has better lighting than my whole career.", "Is that dust? Crisis. Reprint."],
    "Real Estate": ["Wide-angle magic: a 1BHK with palace energy.", "Every light switched on. Even the fridge one."]
  };
  var QUIPS = [
    "Bokeh is just blur that went to art school.",
    "Golden hour is the sun showing off.",
    "Say cheese. Or paneer. I'm flexible.",
    "Fun fact: 'camera' is Latin for 'room'. So I'm a room inside Living Room Labs."
  ];

  /* Poking Fotu while the chat is open */
  var POKE_LINES = [
    ["Hey, that tickles!", "Hehe, stop it!", "Boop to you too."],
    ["Okay, I'm getting dizzy...", "The room is spinning. Is this a panorama?"],
    ["Seriously, I'm a precision instrument!", "One more poke and I'm switching to manual mode."],
    ["Fine. I'm ignoring you now. ...Okay, I can't. What do you need?"]
  ];

  /* When Fotu doesn't understand. Followed by helpful buttons. */
  var FALLBACK = [
    "That one went right past my lens. Try asking about shoots, prices or booking?",
    "I'm a camera, not a search engine. But ask me about photos and I'm brilliant.",
    "Hmm, my film didn't capture that. Can you say it another way?",
    "Interesting! Slightly out of focus for me, though.",
    "My manual doesn't cover that. It's mostly pages about lighting.",
    "That's above my resolution. Want to ask the humans instead?",
    "Error 404: answer not found. Smile still working, though.",
    "I asked my lens cap. It didn't know either.",
    "Let me think... nope, still just a camera.",
    "Bold question. I respect it. I can't answer it, but I respect it.",
    "Sounds deep. I'm more of a shallow depth-of-field camera.",
    "That's not on my memory card. Shall I pass it to the team?",
    "I zoomed in all the way and still couldn't work that out.",
    "You've stumped a camera. Achievement unlocked!",
    "I only understand three things: light, photos and biryani.",
    "My brain is 90% film and 10% jokes. That question needs the other kind.",
    "If I had hands, I'd scratch my head right now.",
    "Plot twist: the camera doesn't know. Try a photo question?",
    "That's a great question for someone who isn't a camera.",
    "I tried to print an answer, but it came out blank."
  ];
  var FALLBACK_TWICE = "I'm clearly out of my depth here. Want me to send your question to the team? They're smarter than me. Slightly.";

  /* The reply bank. Each topic has trigger words (English, Hinglish and Telugu-English,
     typos are handled automatically) and several replies, used in turn so nothing repeats.
     "c" = buttons shown after the reply. "a" = something Fotu does. */
  var INTENTS = [
    /* ---------- business ---------- */
    { id: "book", k: ["book", "booking", "book a shoot", "hire", "hire you", "want a shoot", "need a shoot", "need a photographer", "want a photographer", "looking for a photographer", "looking for photographer", "photographer for", "photographer needed", "want to hire", "need photos", "i need photos", "schedule a shoot", "sign me up", "reserve", "enquire", "enquiry", "inquiry", "enquery", "get in touch", "lets do it", "lets do this", "i want to book", "can i book", "shoot cheyali", "shoot karna", "photographer kavali", "photographer chahiye"], a: "book" },
    { id: "price", k: ["price", "prices", "pricing", "cost", "costs", "rate", "rates", "charge", "charges", "fee", "fees", "budget", "package", "packages", "quote", "quotation", "how much", "tariff", "expensive", "cheap", "affordable", "kitna", "kitne", "kitna hai", "entha", "enta", "rate enti", "price enti", "rate cheppu", "price cheppu", "kitne ka", "per hour", "hourly"],
      r: [ANSWER_PRICE, "It depends on the shoot, the hours and what you need delivered. Share a few details and you'll get a clear quote with no hidden charges.", "We don't do one-size-fits-all pricing, because no two shoots are the same. Tell us what you need and we'll send a quote."], c: ["Book a shoot", "How fast do I get photos?", "What do you shoot?"] },
    { id: "discount", k: ["discount", "discounts", "offer", "offers", "coupon", "deal", "deals", "student discount", "best price", "negotiate", "cheaper", "concession", "less price", "thoda kam"],
      r: ["I'm a camera, so I can't haggle. But mention your budget in the enquiry and the team will do their best to make it work.", "Tell the team your budget when you enquire. They're very reasonable people. Much more reasonable than me."], c: ["Book a shoot", "How much does it cost?"] },
    { id: "delivery", k: ["how fast", "how long", "delivery", "deliver", "turnaround", "when will i get", "get photos", "get the photos", "receive photos", "photos ready", "how many days", "time to deliver", "edited photos", "when do i get", "eppudu istaru", "kab milenge", "urgent", "same day", "next day", "quick delivery", "rush"],
      r: [ANSWER_FAST, "Usually within a week. If you need them sooner, mention it in your enquiry and the team will see what's possible.", "Good photos take a little time. Expect your edited gallery in about a week."], c: ["Book a shoot", "How much does it cost?"] },
    { id: "travel", k: ["do you travel", "travel", "outside hyderabad", "other city", "other cities", "outstation", "out of station", "destination", "destination wedding", "come to", "abroad", "bangalore", "bengaluru", "chennai", "mumbai", "delhi", "goa", "pune", "vizag", "visakhapatnam", "vijayawada", "warangal", "kolkata", "kerala"],
      r: [ANSWER_TRAVEL, "Our photographers will happily pack a bag. Tell us where in your enquiry and we'll sort out the details."], c: ["Book a shoot", "How much does it cost?"] },
    { id: "services", k: ["what do you shoot", "what do you do", "services", "service", "offerings", "what services", "categories", "types of shoot", "type of shoots", "kind of photography", "what kind", "specialise", "specialize", "speciality", "what can you shoot", "genres"],
      r: [ANSWER_SHOOT, "Food, pets, events, portraits, travel, products and real estate. We're a small collective with very different eyes, so we cover a lot."], c: ["See our work ↗", "How much does it cost?", "Book a shoot"] },
    { id: "location", k: ["where are you", "where are you based", "location", "located", "address", "office", "which city", "where is your studio", "hyderabad", "ekkada", "kahan ho", "kahan hai", "where r u"],
      r: ["We're based in Hyderabad, India. Most shoots happen on location, wherever your story is.", "Hyderabad! Home of biryani, Charminar and one very small camera with legs."], c: ["Do you have a studio?", "Do you travel?", "Book a shoot"] },
    { id: "studio", k: ["studio", "do you have a studio", "studio space", "indoor", "outdoor", "shoot location", "where will the shoot", "venue"],
      r: ["We mostly shoot on location: your home, venue, restaurant or a spot we pick together. Tell us what you have in mind and we'll suggest the best setting.", "Indoors or outdoors, both work. The team can suggest locations in Hyderabad that suit your shoot."], c: ["Book a shoot", "What do you shoot?"] },
    { id: "availability", k: ["available", "availability", "free on", "are you free", "date", "dates", "this weekend", "next weekend", "next week", "tomorrow", "today", "on sunday", "on saturday", "slot", "slots", "calendar", "booked", "next month"],
      r: ["Dates fill up quickly, so the team checks each one personally. Send your date in an enquiry and they'll confirm.", "I don't keep the calendar (no hands). Share your date in an enquiry and the team will tell you straight away."], c: ["Book a shoot"] },
    { id: "contact", k: ["contact", "email", "mail", "phone", "phone number", "mobile number", "number", "call", "call you", "whatsapp", "reach you", "talk to someone", "talk to a human", "speak to", "human", "real person", "person", "customer care", "support"],
      r: function () { return ["You can email the team at " + siteEmail() + ", or send an enquiry here and they'll reply directly.", "Prefer a human? Totally fair. Email " + siteEmail() + " or use Book a shoot and they'll get back to you."]; }, c: ["Book a shoot", "Instagram ↗"] },
    { id: "instagram", k: ["instagram", "insta", "ig", "social media", "socials", "behance", "follow you", "facebook", "youtube channel"],
      r: ["We're on Instagram as @fromlivingroomlabs. New work shows up there first.", "Follow @fromlivingroomlabs on Instagram for fresh shots. I'm not on it. Cameras can't take selfies of themselves."], c: ["Instagram ↗", "See our work ↗"] },
    { id: "team", k: ["team", "photographers", "who are the photographers", "who shoots", "crew", "collective", "members", "owner", "founder", "who runs", "who are you guys", "pooja", "chikita", "cherry", "chandu"],
      r: function () { return [teamLine()]; }, c: ["Meet the team ↗", "Book a shoot"] },
    { id: "portfolio", k: ["portfolio", "your work", "see photos", "show me photos", "show photos", "samples", "sample", "gallery", "examples", "previous work", "past work", "show me your work"],
      r: ["The best way to judge us is by our work. Take a look at What We Capture.", "Every photo on this site was shot by us. Have a look around, I'll wait here."], c: ["See our work ↗", "Book a shoot"] },
    { id: "experience", k: ["how long have you been", "since when", "when did you start", "how old is the studio", "experience", "how many years", "reviews", "review", "testimonials", "trust", "how good", "are you good", "clients", "professional", "professionals", "reliable"],
      r: ["We're a collective of four photographers with very different styles. The portfolio speaks for us better than I can.", "Don't take my word for it. I'm biased, I live here. Have a look at the work."], c: ["See our work ↗", "Meet the team ↗"] },
    { id: "hours", k: ["working hours", "hours", "timing", "timings", "office hours", "when are you open", "open now", "are you open", "closed"],
      r: ["The team replies to enquiries every day, usually quickly. Shoots happen whenever the light (or your event) needs them.", "Enquiries are open 24/7. I never sleep. Well, I do. A lot. But the inbox doesn't."], c: ["Book a shoot"] },
    { id: "payment", k: ["payment", "pay", "advance", "deposit", "upi", "gpay", "google pay", "phonepe", "paytm", "cash", "card", "refund", "cancel booking", "cancellation", "reschedule", "postpone"],
      r: ["Payment, advance and rescheduling details are shared along with your quote, so everything is clear before the shoot.", "The team will explain payment and cancellation terms when they send your quote. No surprises."], c: ["Book a shoot", "How much does it cost?"] },
    { id: "raw", k: ["raw", "raw files", "unedited", "unedited photos", "source files", "original files", "all the raw"],
      r: ["We deliver carefully edited photos. If you also need RAW or unedited files, ask in your enquiry and the team will let you know."], c: ["Book a shoot", "How many photos will I get?"] },
    { id: "count", k: ["how many photos", "number of photos", "photo count", "how many pictures", "how many edited", "all photos", "all pictures"],
      r: ["The number of edited photos depends on the shoot and the package. Ask about it in your enquiry and the team will spell it out.", "How many photos you get depends on the shoot. The quote will say exactly what's included."], c: ["Book a shoot", "How fast do I get photos?"] },
    { id: "prints", k: ["print", "prints", "album", "albums", "frame", "frames", "photo book", "photobook", "hard copy", "hard copies", "canvas"],
      r: ["Ask about albums and prints in your enquiry. I print tiny instant photos, but the team handles the proper ones."], c: ["Book a shoot"] },
    { id: "usage", k: ["copyright", "rights", "use the photos", "usage", "license", "licence", "commercial use", "can i use your photos", "download your photos", "credit"],
      r: function () { return ["To use our photos, or for usage rights on a brand shoot, email " + siteEmail() + " and the team will explain the options.", "Usage rights depend on the shoot. The team covers it in the quote, especially for brands."]; }, c: ["Book a shoot", "Talk to a human"] },
    { id: "edit", k: ["edit", "editing", "retouch", "retouching", "photoshop", "lightroom", "colour grading", "color grading", "edit my photo", "edit my photos", "touch up"],
      r: ["Every photo we deliver is carefully edited by the team. Editing photos you shot yourself isn't something we usually offer, but you can always ask.", "We edit everything we shoot, properly. Colour, light, little details. That's why it takes about a week."], c: ["Book a shoot", "How fast do I get photos?"] },
    { id: "video", k: ["video", "videos", "videography", "videographer", "reel", "reels", "film", "short film", "cinematic", "drone", "music video", "youtube video", "shoot a video"],
      r: ["Photos are our main thing, and our crew includes a DOP and filmmaker. Ask about video in your enquiry and the team will tell you what's possible.", "Mention video or reels in your enquiry. The team will let you know what they can do."], c: ["Book a shoot", "Meet the team ↗"] },
    { id: "jobs", k: ["job", "jobs", "hiring", "internship", "intern", "work with you", "join your team", "join the team", "career", "careers", "assistant", "collaborate", "collaboration", "collab", "freelance", "vacancy"],
      r: function () { return ["Love that you want to join! Email " + siteEmail() + " with your portfolio and a short note about yourself.", "Collaborations and work enquiries go to " + siteEmail() + ". Attach your best work!"]; }, c: ["Meet the team ↗"] },
    { id: "model", k: ["be a model", "model for you", "modelling", "modeling", "tfp", "model portfolio", "i want to model"],
      r: function () { return ["If you'd like to model for a shoot, email " + siteEmail() + " with a few photos and your Instagram handle."]; } },
    { id: "prepare", k: ["what to wear", "what should i wear", "what do i wear", "wear", "dress", "dress code", "clothes", "outfit", "outfits", "how to prepare", "prepare", "preparation", "makeup", "hair and makeup", "posing", "pose", "poses", "not photogenic", "camera shy", "awkward", "i look bad", "nervous"],
      r: ["Don't worry about posing. The team guides you through everything, and most people relax after the first ten shots.", "Everyone is photogenic with the right light and a little patience. Wear something you feel good in. Solid colours usually work best.", "Camera shy? Me too, ironically. The team is great at making people comfortable."], c: ["Book a shoot"] },
    { id: "group", k: ["group", "how many people", "large group", "big group", "family photo", "group photo", "whole family"],
      r: ["Groups are welcome, from couples to whole families and teams. Tell us the headcount in your enquiry."], c: ["Book a shoot"] },

    { id: "gear", k: ["camera", "cameras", "which camera", "what camera", "gear", "lens", "lenses", "sony", "canon", "nikon", "fujifilm", "fuji", "equipment", "mirrorless", "dslr", "lighting setup", "what do you shoot with"],
      r: ["The team shoots with professional mirrorless cameras, good lenses and proper lighting. Me? I'm an instant camera with legs. We each have our strengths.", "Good gear helps, but the eye matters more. Ask the team about their kit in your enquiry if you're curious."] },
    { id: "learn", k: ["teach me", "teach", "photography tips", "tips", "tip", "how to take", "how to click", "learn photography", "course", "courses", "workshop", "workshops", "class", "classes", "how do i take better", "beginner", "how to shoot"],
      r: ["Quick tip: shoot with the light behind you or to the side, not behind your subject. Instant improvement!", "Tip: get closer. Most photos improve when you fill the frame with what matters.", "Tip: shoot during golden hour, just after sunrise or before sunset. Everyone looks better.", "Tip: put your subject slightly off-centre. It's called the rule of thirds, and it works.", "For workshops or mentoring, email the team. They love talking about photography."], c: ["Another tip", "Book a shoot"] },
    { id: "phonetips", k: ["phone photography", "mobile photography", "iphone", "android", "phone camera", "mobile camera", "photos on my phone", "phone photos"],
      r: ["Phone tip: wipe your lens first. Seriously. Pockets are not kind to lenses.", "Phone tip: tap to focus on your subject, then slide down slightly to darken the exposure. Richer colours instantly.", "Phone tip: avoid digital zoom. Walk closer instead."], c: ["Another tip", "Book a shoot"] },
    { id: "safety", k: ["is it safe", "safe", "privacy", "my data", "share my photos", "will you post", "post my photos", "consent"],
      r: ["Good question. Mention any privacy needs in your enquiry (for example, not posting the photos online) and the team will make sure they're handled the way you want."], c: ["Book a shoot", "Talk to a human"] },

    /* ---------- shoot types ---------- */
    { id: "wedding", k: ["wedding", "weddings", "marriage", "shaadi", "shadi", "pelli", "engagement", "pre wedding", "prewedding", "haldi", "mehendi", "mehndi", "sangeet", "reception", "bride", "groom", "save the date", "nischitartham"],
      r: ["Congratulations! Weddings are a big part of our event work. Share the dates, venue and functions in an enquiry.", "A wedding! Pick Events in Book a shoot and tell us about the functions. I'll try not to cry."], c: ["Book a shoot", "How much does it cost?", "Do you travel?"], a: "cat:Events:Wedding" },
    { id: "birthday", k: ["birthday", "bday", "birthday party", "first birthday", "1st birthday", "anniversary", "party", "celebration"],
      r: ["Happy (early) birthday to whoever it is! We shoot birthdays and celebrations. Tell us the date and venue.", "Cake, candles and chaos. Our favourite kind of event. Shall we book it?"], c: ["Book a shoot", "How much does it cost?"], a: "cat:Events:Birthday" },
    { id: "babyshower", k: ["baby shower", "seemantham", "godh bharai", "valaikappu", "naming ceremony", "cradle ceremony", "barasala"],
      r: ["Baby showers are lovely to shoot. Lots of colour and happy faces. Tell us the date and venue."], c: ["Book a shoot"], a: "cat:Events:Baby Shower" },
    { id: "housewarming", k: ["housewarming", "house warming", "gruhapravesam", "griha pravesh", "new house"],
      r: ["A new home! Congratulations. Housewarmings make great photos. Send us the date."], c: ["Book a shoot"], a: "cat:Events:Housewarming" },
    { id: "couple", k: ["couple", "couple shoot", "couples", "proposal", "date shoot", "romantic shoot"],
      r: ["Couple shoots are some of our favourites. Relaxed, natural, no awkward poses. Shall we plan one?"], c: ["Book a shoot"], a: "cat:Events:Couple Shoot" },
    { id: "corporate", k: ["corporate", "office event", "conference", "company", "team photos", "headshots", "headshot", "linkedin", "employee", "employees", "seminar", "product launch", "launch event", "business event"],
      r: ["We do corporate work too: events, team photos and professional headshots. Tell us about your company and the date."], c: ["Book a shoot", "How much does it cost?"], a: "cat:Events:Corporate" },
    { id: "events", k: ["event", "events", "concert", "function", "college fest", "fest", "pageant", "miss universe", "performing arts", "dance show", "stage show", "theatre", "theater", "recital", "gig"],
      r: ["Events are what we shoot most. Performances, celebrations, launches and everything in between. What's the occasion?"], c: ["Book a shoot", "See our work ↗"], a: "cat:Events" },
    { id: "food", k: ["food photography", "food shoot", "restaurant", "menu", "dish", "dishes", "cafe", "chef", "bakery", "cloud kitchen", "zomato", "swiggy", "food"],
      r: ["Food is one of our favourites to shoot. Menus, restaurants, cafes and bakeries. And yes, we eat the props afterwards.", "Hungry customers start with great food photos. Tell us about your menu."], c: ["Book a shoot", "See our work ↗"], a: "cat:Food" },
    { id: "pets", k: ["pet", "pets", "dog", "dogs", "cat", "cats", "puppy", "kitten", "doggo", "pupper", "my dog", "my cat", "kukka", "pilli", "kutta", "billi"],
      r: ["Pet shoots! Our models are paid in treats and belly rubs. What's your pet's name?", "We love pets. Patient photographers, lots of treats, zero pressure. Shall we book one?"], c: ["Book a shoot", "See our work ↗"], a: "cat:Pets" },
    { id: "portraits", k: ["portrait", "portraits", "profile picture", "profile photo", "dp", "photoshoot", "photo shoot", "personal shoot", "personal photoshoot", "solo shoot", "birthday shoot"],
      r: ["Portraits are all about you looking like you, on a really good day. Want to book one?", "We do portraits that feel natural, not stiff. No awkward chin-up-a-bit-more moments. Well, maybe one."], c: ["Book a shoot", "What should I wear?"], a: "cat:Portraits" },
    { id: "products", k: ["product", "products", "product shoot", "ecommerce", "e commerce", "amazon", "flipkart", "meesho", "catalog", "catalogue", "brand shoot", "packshot", "jewellery", "jewelry", "clothing", "apparel", "skincare", "cosmetics", "brand"],
      r: ["Product photos that make people want to buy. Catalogues, e-commerce, brand shoots. Tell us what you sell.", "We make products look their absolute best. Even dust gets its own crisis meeting."], c: ["Book a shoot", "See our work ↗"], a: "cat:Products" },
    { id: "realestate", k: ["real estate", "realestate", "property", "properties", "apartment", "villa", "interior", "interiors", "airbnb", "hotel", "resort", "architecture", "house photos", "flat", "office space", "homestay"],
      r: ["Real estate and interiors: bright, wide and honest. Tell us about the property and its location."], c: ["Book a shoot"], a: "cat:Real Estate" },
    { id: "travelshoot", k: ["travel photography", "travel shoot", "landscape", "landscapes", "trip", "vacation", "holiday shoot", "nature", "tourism"],
      r: ["Travel and landscapes are where our photographers wander off and come back with magic. Thinking of a travel shoot?"], c: ["Book a shoot", "Do you travel?"], a: "cat:Travel" },
    { id: "family", k: ["maternity", "pregnancy", "newborn", "baby shoot", "baby photoshoot", "kids", "kid", "children", "child", "family shoot", "toddler"],
      r: ["Family moments are precious. Tell us what you have in mind (maternity, little ones or the whole family) and the team will plan it with you."], c: ["Book a shoot"], a: "cat:Portraits" },
    { id: "fashion", k: ["fashion", "lookbook", "fashion shoot", "designer", "boutique", "saree shoot", "editorial"],
      r: ["Fashion and lookbooks work well with our portrait and product style. Tell us about the collection."], c: ["Book a shoot"], a: "cat:Products" },

    /* ---------- chit-chat ---------- */
    { id: "greeting", w: 0.9, k: ["hi", "hello", "hey", "heya", "hii", "helo", "hola", "namaste", "namaskaram", "namaskar", "vanakkam", "salaam", "salam", "assalamualaikum", "good morning", "good afternoon", "good evening", "yo", "sup", "whats up", "wassup", "hai", "howdy", "greetings"],
      r: ["Hello{name}! What can I help you capture?", "Hey{name}! Ask me anything about shoots, or tap Book a shoot.", "Namaste{name}! Ready when you are. What's the occasion?"], c: FAQ_CHIPS },
    { id: "howareyou", k: ["how are you", "how r u", "how are u", "hows it going", "how do you do", "how is it going", "kaise ho", "kya haal", "ela unnav", "ela unnavu", "ela unnaru", "bagunnava", "bagunnara", "you good", "how you doing"],
      r: ["Fully charged and perfectly focused. How are you?", "I'm great! Just had a lovely nap. How can I help?", "Bagunnanu! Fine, thanks. Ready to talk photos."] },
    { id: "imfine", w: 0.8, k: ["im fine", "i am fine", "im good", "i am good", "doing well", "im ok", "im okay", "not bad", "great thanks", "bagunnanu", "theek hoon", "badhiya"],
      r: ["Glad to hear it! Anything I can help with today?", "Lovely. Now, can I interest you in some excellent photography?"], c: FAQ_CHIPS },
    { id: "whoareyou", k: ["who are you", "what are you", "your name", "whats your name", "are you a bot", "are you human", "are you real", "are you ai", "chatbot", "bot", "robot", "who made you", "who created you"],
      r: ["I'm Fotu, the studio's instant camera. I answer questions, take tiny photos and nap a lot.", "Fotu! Part camera, part chatbot, part professional napper. Built for Living Room Labs."], c: FAQ_CHIPS },
    { id: "whatdoing", k: ["what are you doing", "wyd", "what r u doing", "kya kar rahe", "kya kar raha", "em chestunnav", "emi chestunnav", "em chestunnavu", "what you up to"],
      r: ["Standing at the bottom of the screen, guarding the photos. It's a big responsibility.", "Talking to you, which is the highlight of my day so far."] },
    { id: "age", k: ["how old", "your age", "age", "when were you born", "your birthday"],
      r: ["I was built in 2026, so I'm very young. My lens is still getting used to the world.", "Old enough to take photos, young enough to still get excited about them."] },
    { id: "help", k: ["help", "what can you do", "what can i ask", "options", "menu", "commands", "how does this work", "guide me", "confused"],
      r: ["I can tell you about our shoots, prices, timelines and travel, help you book, and tell bad camera jokes. Try a button below or just type."], c: FAQ_CHIPS },
    { id: "thanks", k: ["thanks", "thank you", "thankyou", "thank u", "thx", "ty", "tq", "dhanyavad", "dhanyavaad", "shukriya", "dhanyavadalu", "thanks a lot", "thanks fotu", "much appreciated"],
      r: ["You're welcome{name}! Anything else?", "Happy to help! That's literally my only job. Well, that and photos.", "Anytime{name}!"] },
    { id: "bye", k: ["bye", "goodbye", "good bye", "see you", "see ya", "cya", "good night", "gn", "talk later", "ttyl", "tata", "later", "take care", "byee"],
      r: ["Bye{name}! Come back anytime. I'll probably be napping.", "See you{name}! Tap me if you need anything.", "Take care! I'll keep the flash warm."], a: "nap" },
    { id: "yes", w: 0.7, k: ["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "okk", "haan", "ha", "avunu", "alright", "of course", "definitely", "go ahead", "please", "k"], a: "yes" },
    { id: "no", w: 0.7, k: ["no", "nope", "nah", "not now", "ledu", "vaddu", "nahi", "nahin", "maybe later", "not really"],
      r: ["No problem! I'm here if you change your mind.", "Okay! I'll just be here, being a camera."], c: FAQ_CHIPS },
    { id: "compliment", w: 0.8, k: ["good", "great", "awesome", "amazing", "love it", "love this", "cute", "nice", "cool", "beautiful", "lovely", "well done", "adorable", "superb", "super", "fantastic", "wonderful", "best bot", "you are cute", "youre cute", "so cute", "bagundi", "chala bagundi", "mast", "badhiya", "wow", "brilliant", "excellent", "impressive", "gorgeous", "stunning"],
      r: ["Aww, my flash is blushing.", "Thank you! I'll print that and keep it forever.", "Stop it, you'll make me overexpose.", "You just made my shutter flutter."] },
    { id: "insult", k: ["stupid", "dumb", "idiot", "useless", "worst", "hate you", "shut up", "ugly", "annoying", "you suck", "trash", "pathetic", "bakwas", "waste", "bad bot", "go away"],
      r: ["Ouch. I'll pretend that was a blurry photo and delete it.", "Harsh, but I've survived worse. Someone once took me to a foam party.", "Noted. I'll file that under 'outtakes'."], c: FAQ_CHIPS },
    { id: "swear", k: ["fuck", "fucking", "shit", "bitch", "bastard", "asshole", "wtf", "damn", "bloody"],
      r: ["Language! I'm a family-friendly camera.", "Whoa, let's keep it PG. I'm only rated for family albums."] },
    { id: "joke", k: ["joke", "jokes", "tell me a joke", "funny", "make me laugh", "something funny", "pj", "another joke", "one more joke"],
      r: [
        "Why did the photographer break up with the camera? It kept focusing on other people.",
        "What did the camera say to the photographer? 'You light up my life.' Literally.",
        "I tried to take a photo of a fog bank. I mist.",
        "Why are cameras bad at keeping secrets? They always expose everything.",
        "What's a photographer's favourite food? Cheese, obviously.",
        "My friend bought a camera with no lens. He said it was a bit of a blur.",
        "Why don't cameras get lost? They always know their focal point.",
        "I asked the lens if it was okay. It said it was just going through a phase. A zoom phase."
      ], c: ["Another joke", "Book a shoot"] },
    { id: "fact", k: ["fact", "fun fact", "facts", "trivia", "tell me something", "interesting", "something interesting", "did you know"],
      r: [
        "Fun fact: the first photograph ever taken needed hours of exposure. I need a blink.",
        "Fun fact: 'camera' comes from the Latin for 'room'. So I'm a room inside Living Room Labs.",
        "Fun fact: the first digital camera was built in 1975 and weighed about 4 kg.",
        "Fun fact: the word 'photography' means 'drawing with light'.",
        "Fun fact: more photos are taken every two minutes today than in the whole 1800s."
      ], c: ["Another fact", "Tell me a joke"] },
    { id: "love", k: ["i love you", "love you", "marry me", "will you marry me", "date me", "be my girlfriend", "be my boyfriend", "crush", "do you love me", "kiss"],
      r: ["That's sweet, but I'm already in a relationship. With natural light.", "I'm flattered! But I'm married to my work. And my tripod."] },
    { id: "sad", k: ["sad", "lonely", "depressed", "feeling low", "upset", "bad day", "tired", "stressed", "not okay", "unhappy", "crying"],
      r: ["I'm sorry you're having a rough time. If it helps, here's a virtual hug from a small camera. Talking to someone you trust can really help too.", "Sending you good light and good vibes. Be kind to yourself today."] },
    { id: "bored", k: ["bored", "im bored", "nothing to do", "boring"],
      r: ["Bored? Go look at the photos. I'll wait. Then tell me your favourite.", "Want a joke? A fact? A photoshoot? I offer all three."], c: ["Tell me a joke", "Fun fact", "See our work ↗"] },
    { id: "weather", k: ["weather", "rain", "raining", "sunny", "hot", "cold", "temperature", "monsoon", "climate"],
      r: ["I don't check the weather, but cloudy days give lovely soft light for portraits.", "Rain means reflections, and reflections mean great photos. Every weather is photo weather."] },
    { id: "foodchat", k: ["hungry", "biryani", "lunch", "dinner", "breakfast", "chai", "coffee", "tea", "snack", "irani chai", "haleem", "osmania biscuit", "pizza"],
      r: ["Hyderabadi biryani is the most photogenic food on Earth. I will not be taking questions.", "I can't eat, but I've photographed enough biryani to feel full.", "Irani chai and Osmania biscuits: the official fuel of Hyderabad photographers."] },
    { id: "movies", k: ["movie", "movies", "cinema", "netflix", "tollywood", "bollywood", "favourite movie", "favorite movie", "film recommendation", "series", "web series"],
      r: ["My favourite films are the ones with great cinematography. So, all of them, if the lighting is good.", "Movies are just very, very long photo shoots. I respect the commitment."] },
    { id: "music", k: ["song", "songs", "music", "sing", "sing a song", "playlist"],
      r: ["La la la... that's the shutter sound remix. Available everywhere soon.", "I only know one song: click, click, click. It's a banger."] },
    { id: "sports", k: ["cricket", "ipl", "football", "rcb", "csk", "srh", "sunrisers", "kohli", "dhoni", "match", "sports"],
      r: ["I love sports. Fast action is the ultimate test of shutter speed.", "Sports photographers are heroes. They shoot at 1/2000th of a second while I struggle to stay awake."] },
    { id: "ai", k: ["chatgpt", "gpt", "artificial intelligence", "openai", "claude", "gemini", "siri", "alexa", "google assistant"],
      r: ["I'm much smaller than those big AI assistants. I just know photos, and how to nap."] },
    { id: "life", k: ["meaning of life", "why are we here", "purpose of life", "what is life", "life advice"],
      r: ["Good light, good people and good food. That's my whole philosophy.", "Life is like photography: focus on what matters, and take lots of shots."] },
    { id: "secret", k: ["secret", "tell me a secret", "any secrets"],
      r: ["Secret: the best photographers take hundreds of photos to get one great one. Don't tell anyone.", "My secret? I'm afraid of the dark. Which is awkward for a camera."] },
    { id: "favourite", k: ["favourite photo", "favorite photo", "best photo", "your favourite", "your favorite", "favourite colour", "favorite color", "favourite color"],
      r: ["My favourite photo is always the next one. My favourite colour is all four of my stripes.", "Hard to pick! Look through What We Capture and tell me yours."], c: ["See our work ↗"] },
    { id: "language", k: ["telugu", "hindi", "tamil", "kannada", "malayalam", "urdu", "speak telugu", "speak hindi", "do you speak", "language", "languages", "english"],
      r: ["I understand a bit of Telugu and Hindi mixed with English. Konchem konchem! The team speaks all three properly."] },
    { id: "lamp", k: ["lamp", "dark mode", "light mode", "theme", "rope", "pull the cord"],
      r: ["Pull the lamp cord at the top of the page to switch between light and dark. I'll react, I promise."] },
    { id: "website", k: ["website", "who made this site", "who built this", "this site", "nice website", "nice site", "site"],
      r: ["Glad you like the site! It was built to show off the photos. And me, obviously."] },
    { id: "selfie", k: ["selfie", "say cheese", "cheese", "take my photo", "take a photo", "take a picture", "take my picture", "click me", "click my photo", "photo of me", "picture of me", "snap"],
      r: ["Say cheese! *FLASH* Gorgeous. Printing your copy now.", "Hold still... *FLASH* Perfect. That's going on the wall."], a: "selfie" },
    { id: "sleepcmd", k: ["sleep", "go to sleep", "nap", "take a nap", "sleepy", "goodnight fotu"],
      r: ["Don't mind if I do. Zzz... (tap me to wake me up)"], a: "nap" },
    { id: "dance", k: ["dance", "can you dance", "do a dance", "dance for me", "naachu", "dance cheyi"],
      r: ["Watch this! *wobbles enthusiastically*", "These legs were made for walking, but okay... *wiggle*"], a: "dance" },
    { id: "laugh", w: 0.7, k: ["lol", "haha", "hahaha", "lmao", "rofl", "hehe", "funny one"],
      r: ["Glad I could make you laugh!", "Hehe. I'm here all week. And next week. I literally can't leave."], c: ["Another joke", "Book a shoot"] },
    { id: "sorry", k: ["sorry", "my bad", "apologies", "oops"],
      r: ["No worries at all!", "All good. Even I take blurry photos sometimes."] },
    { id: "wait", k: ["wait", "one sec", "one second", "hold on", "brb", "give me a minute"],
      r: ["Take your time. I'm very good at waiting. Ask any tripod."] },
    { id: "test", k: ["test", "testing", "asdf", "qwerty", "hello world"],
      r: ["Test received. Lens working, flash working, jokes questionable."] }
  ];

  var ACTION_CHIPS = {
    "See our work ↗": function () { go("/capture.html"); },
    "Meet the team ↗": function () { go("/#collective"); },
    "Instagram ↗": function () { window.open(instaUrl(), "_blank", "noopener"); },
    "Use the full form ↗": function () { closeChat(true); try { window.LRL.enquiry.open({ category: (chat.enq && chat.enq.cat) || "General Enquiry" }); } catch (e) { go("/?enquire=1"); } },
    "Another joke": function () { userSays("Another joke"); answerIntent(intentById("joke")); },
    "Another fact": function () { userSays("Another fact"); answerIntent(intentById("fact")); },
    "Another tip": function () { userSays("Another tip"); answerIntent(intentById("learn")); },
    "Fun fact": function () { userSays("Fun fact"); answerIntent(intentById("fact")); },
    "Tell me a joke": function () { userSays("Tell me a joke"); answerIntent(intentById("joke")); },
    "Talk to a human": function () { userSays("Talk to a human"); answerIntent(intentById("contact")); },
    "What should I wear?": function () { userSays("What should I wear?"); answerIntent(intentById("prepare")); },
    "How many photos will I get?": function () { userSays("How many photos will I get?"); answerIntent(intentById("count")); },
    "Do you have a studio?": function () { userSays("Do you have a studio?"); answerIntent(intentById("studio")); }
  };

  /* ================================================================
     Everything below is machinery. No need to edit.
     ================================================================ */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  function isPhone() { return window.innerWidth <= 800 || !finePointer; }
  var HIDE_KEY = "lrl_fotu_hidden", SENT_KEY = "lrl_fotu_sent", NAME_KEY = "lrl_fotu_name", MET_KEY = "lrl_fotu_met";
  var SS_HINT = "lrl_fotu_hint", SS_CLOSES = "lrl_fotu_closes", SS_QUIET = "lrl_fotu_quiet";
  var SITE = {}, catBySrc = {};
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sstore(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function sread(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function base(src) {
    if (!src) return "";
    var f = String(src).split("?")[0].split("#")[0].split("/").pop() || "";
    return decodeURIComponent(f).replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  }
  function siteEmail() { return SITE.email || "hello@livingroomlabs.in"; }
  function instaUrl() {
    var s = (SITE.socials || []).filter(function (x) { return x && /instagram/i.test(x.name || x.url || ""); })[0];
    return (s && s.url) || "https://www.instagram.com/fromlivingroomlabs/";
  }
  function teamLine() {
    var t = (SITE.team || []).filter(function (m) { return m && m.name; });
    if (!t.length) return "We're a small collective of photographers based in Hyderabad. Meet them on The Collective page.";
    var parts = t.map(function (m) { return m.name + (m.role ? " (" + m.role + ")" : ""); });
    var list = parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0];
    return "The collective is " + list + ". Different eyes, one team.";
  }
  function go(url) { closeChat(true); flushStats(); window.location.href = url; }

  fetch("/content.json", { cache: "no-cache" }).then(function (r) { return r.json(); }).then(function (d) {
    SITE = d || {};
    (d.photos || []).forEach(function (p) { if (p && p.src && p.category) catBySrc[base(p.src)] = p.category; });
  }).catch(function () {});

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function todayFestival() {
    var d = new Date(), ymd = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()), md = ymd.slice(5);
    var list = (SITE.fotuFestivals || []).concat(FESTIVALS);
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (!f || !f.line) continue;
      if (f.sundays && d.getDay() !== 0) continue;
      if (f.md && md >= f.md && md <= (f.to_md || f.md)) return f.line.replace(/ \*$/, "");
      if (f.from && ymd >= f.from && ymd <= (f.to || f.from)) return f.line.replace(/ \*$/, "");
    }
    return null;
  }
  function timeGreeting() {
    var h = new Date().getHours();
    for (var i = 0; i < TIME_GREETINGS.length; i++) if (h >= TIME_GREETINGS[i][0] && h < TIME_GREETINGS[i][1]) return pick(TIME_GREETINGS[i][2]);
    return null;
  }

  /* ================= stats (totals only; batched, sent when the visitor leaves or closes the chat) ================= */
  var ST = null;
  function resetStats() { ST = { woke: 0, opened: 0, msgs: 0, sent: 0, pokes: 0, topics: {}, unknown: [] }; }
  resetStats();
  var stDirty = false;
  function bump(k, n) { ST[k] = (ST[k] || 0) + (n || 1); stDirty = true; }
  function topic(id) { ST.topics[id] = (ST.topics[id] || 0) + 1; stDirty = true; }
  function scrub(t) {
    return String(t).replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]").replace(/\+?\d[\d\s-]{5,}\d/g, "[number]").slice(0, 120);
  }
  function logUnknown(t) { if (ST.unknown.length < 8) ST.unknown.push(scrub(t)); stDirty = true; }
  function flushStats() {
    if (!stDirty) return;
    var page = location.pathname.indexOf("capture") !== -1 ? "capture" : (location.pathname === "/" || /index/.test(location.pathname) ? "home" : "other");
    var body = JSON.stringify({ v: 2, page: page, device: isPhone() ? "phone" : "desktop", s: ST });
    resetStats(); stDirty = false;
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/fotu-stats", new Blob([body], { type: "application/json" }))) return;
      fetch("/api/fotu-stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flushStats(); });
  window.addEventListener("pagehide", flushStats);

  /* ================= styles ================= */
  var css = [
    "#fotu-root{--f-paper:#ffffff;--f-ink:#111;--f-mute:#6b6b6b;--f-line:#e2e2e2;--f-soft:#f3f2ee;--f-accent:#378ADD;font-family:inherit}",
    "html[data-theme='dark'] #fotu-root{--f-paper:#161616;--f-ink:#f2f2f2;--f-mute:#9a9a9a;--f-line:#2e2e2e;--f-soft:#232323}",
    "#fotu-bot{position:fixed;left:0;top:0;width:72px;height:72px;z-index:400;cursor:pointer;background:none;border:0;padding:0;-webkit-tap-highlight-color:transparent;transition:opacity .3s;touch-action:manipulation}",
    "#fotu-bot:focus-visible{outline:2px solid var(--f-accent);outline-offset:4px;border-radius:12px}",
    "#fotu-bot .fb{width:100%;height:100%;transform-origin:50% 100%;animation:fotuIdle 2.6s ease-in-out infinite}",
    "@keyframes fotuIdle{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-2px) rotate(-1.5deg)}75%{transform:translateY(-1px) rotate(1.5deg)}}",
    "#fotu-bot.sleep .fb{animation:fotuSnore 2.6s ease-in-out infinite}",
    "@keyframes fotuSnore{0%,100%{transform:scale(1,1) rotate(-4deg)}45%{transform:scale(1.06,.94) translateY(2px) rotate(-4deg)}}",
    "#fotu-bot.sleep.stir .fb{animation:fotuStir .5s ease-in-out 3}",
    "@keyframes fotuStir{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(3deg) scale(1.03,.97)}}",
    "#fotu-bot.sleep.stir .zz i{animation-duration:1.2s}",
    "#fotu-bot.waking .fb{animation:fotuWake .9s cubic-bezier(.3,1.4,.5,1)}",
    "@keyframes fotuWake{0%{transform:rotate(-4deg) scale(1.05,.92)}35%{transform:rotate(0) scale(.92,1.14) translateY(-6px)}60%{transform:scale(1.04,.96)}100%{transform:none}}",
    "#fotu-bot.waking .snore{display:block;animation:fotuYawn .9s ease-out}",
    "#fotu-bot.waking .smile{display:none}",
    "@keyframes fotuYawn{0%{transform:scale(.6)}40%{transform:scale(1.9,2.2)}100%{transform:scale(.4)}}",
    "#fotu-bot.walk .fb{animation:fotuBob .3s ease-in-out infinite alternate}",
    "@keyframes fotuBob{from{transform:translateY(0) rotate(-3deg)}to{transform:translateY(-4px) rotate(3deg)}}",
    "#fotu-bot .l1,#fotu-bot .l2{transform-box:fill-box;transform-origin:50% 0}",
    "#fotu-bot.walk .l1{animation:fotuLeg .3s infinite alternate}#fotu-bot.walk .l2{animation:fotuLeg .3s infinite alternate-reverse}",
    "@keyframes fotuLeg{from{transform:rotate(-24deg)}to{transform:rotate(24deg)}}",
    "#fotu-bot.hop .fb{animation:fotuHop .5s ease-out}",
    "@keyframes fotuHop{40%{transform:translateY(-12px) rotate(-6deg)}100%{transform:none}}",
    "#fotu-bot.spin .fb{animation:fotuSpin .7s ease-in-out}",
    "@keyframes fotuSpin{0%{transform:none}50%{transform:rotate(200deg) scale(.9)}100%{transform:rotate(360deg)}}",
    "#fotu-bot.grump .fb{animation:fotuGrump .45s ease-in-out 2}",
    "@keyframes fotuGrump{0%,100%{transform:none}30%{transform:translateX(-3px) rotate(-5deg)}70%{transform:translateX(3px) rotate(5deg)}}",
    "#fotu-bot .ey{transform-box:fill-box;transform-origin:50% 50%;transition:transform .08s}#fotu-bot .ey.cl{transform:scaleY(.1)}",
    "#fotu-bot .pr{transform:translateY(-22px);transition:transform .6s cubic-bezier(.3,1.4,.6,1)}#fotu-bot .pr.out{transform:translateY(14px)}",
    "#fotu-bot .zz{position:absolute;z-index:2;right:-4px;top:-6px;width:36px;height:30px;display:none;pointer-events:none;font-weight:800;color:var(--f-accent);text-shadow:0 0 2px #fff}",
    "#fotu-bot .zz i{position:absolute;left:0;bottom:0;font-style:normal;opacity:0;animation:fotuZz 2.6s ease-out infinite}",
    "#fotu-bot .zz i:nth-child(1){font-size:10px}#fotu-bot .zz i:nth-child(2){font-size:13px;animation-delay:.85s}#fotu-bot .zz i:nth-child(3){font-size:16px;animation-delay:1.7s}",
    "#fotu-bot.sleep .zz{display:block}",
    "#fotu-bot.peek .zz{right:auto;left:0;top:-20px;width:24px}",
    "#fotu-bot.peek .zz i{animation-name:fotuZzL}",
    "@keyframes fotuZzL{0%{opacity:0;transform:translate(2px,4px) rotate(8deg)}20%{opacity:1}100%{opacity:0;transform:translate(-2px,-14px) rotate(-8deg)}}",
    "#fotu-bot.peek .fb{transform-origin:0 100%}",
    "@keyframes fotuZz{0%{opacity:0;transform:translate(0,4px) rotate(-10deg)}20%{opacity:1}100%{opacity:0;transform:translate(14px,-16px) rotate(12deg)}}",
    "#fotu-bot .snore{display:none;transform-box:fill-box;transform-origin:50% 50%}",
    "#fotu-bot.sleep .snore{display:block;animation:fotuMouth 2.6s ease-in-out infinite}",
    "#fotu-bot.sleep .smile{display:none}",
    "@keyframes fotuMouth{0%,100%{transform:scale(.5)}45%{transform:scale(1.25)}}",
    "#fotu-bot.sleep .ey{transform:scaleY(.08)!important}",
    "#fotu-bot .lid{display:none}#fotu-bot.sleep .lid{display:block}",
    "#fotu-bot.squint .ey{transform:scaleY(.35)}",
    "#fotu-bot.wobble .fb{animation:fotuWobble .6s ease-in-out 2}",
    "@keyframes fotuWobble{0%,100%{transform:none}20%{transform:rotate(-14deg) translateX(-4px)}50%{transform:rotate(12deg) translateX(4px)}80%{transform:rotate(-6deg)}}",
    "#fotu-bub{position:fixed;z-index:401;max-width:230px;background:var(--f-paper);color:var(--f-ink);border:1px solid var(--f-line);border-radius:14px;padding:9px 12px;font-size:13.5px;line-height:1.45;box-shadow:0 6px 24px rgba(0,0,0,.12);display:none;pointer-events:none}",
    "#fotu-bub.on{display:block;animation:fotuPop .2s ease-out}",
    "@keyframes fotuPop{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}",
    "#fotu-bub.measure{display:block;visibility:hidden;left:0;top:0}",
    "#fotu-bot .burst{opacity:0;transform-box:fill-box;transform-origin:50% 50%}",
    "#fotu-bot.flash .burst{animation:fotuBurst .55s ease-out}",
    "@keyframes fotuBurst{0%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(3.4)}}",
    "#fotu-flashscreen{position:fixed;inset:0;z-index:460;background:#fff;opacity:0;pointer-events:none}",
    "#fotu-flashscreen.on{animation:fotuScreen .45s ease-out}",
    "@keyframes fotuScreen{0%{opacity:.75}100%{opacity:0}}",
    "#fotu-root.gone #fotu-bot,#fotu-root.gone #fotu-bub,#fotu-root.gone #fotu-back{opacity:0;pointer-events:none}",
    "#fotu-panel{position:fixed;z-index:450;width:330px;height:470px;max-height:calc(100vh - 24px);background:var(--f-paper);color:var(--f-ink);border:1px solid var(--f-line);border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.18);display:none;flex-direction:column;overflow:hidden;font-size:14px}",
    "#fotu-panel.on{display:flex;animation:fotuPop .2s ease-out}",
    "#fotu-panel .fh{display:flex;align-items:center;gap:10px;padding:11px 12px 11px 14px;border-bottom:1px solid var(--f-line)}",
    "#fotu-panel .fh b{display:block;font-size:14px}#fotu-panel .fh span{font-size:11.5px;color:var(--f-mute)}",
    "#fotu-panel .fx{margin-left:auto;display:flex;gap:2px}",
    "#fotu-panel .fx button{background:none;border:0;color:var(--f-mute);cursor:pointer;font-size:12px;padding:7px 8px;border-radius:8px;font-family:inherit}",
    "#fotu-panel .fx button:hover{background:var(--f-soft);color:var(--f-ink)}",
    "#fotu-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;overscroll-behavior:contain}",
    ".fotu-m{max-width:86%;padding:8px 12px;border-radius:14px;line-height:1.45;font-size:13.5px;white-space:pre-wrap;word-wrap:break-word;animation:fotuIn .18s ease-out}",
    "@keyframes fotuIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}",
    ".fotu-m.b{background:var(--f-soft);align-self:flex-start;border-bottom-left-radius:4px}",
    ".fotu-m.u{background:var(--f-ink);color:var(--f-paper);align-self:flex-end;border-bottom-right-radius:4px}",
    ".fotu-m.t{display:flex;gap:4px;align-items:center;padding:11px 13px}",
    ".fotu-m.t i{width:6px;height:6px;border-radius:50%;background:var(--f-mute);animation:fotuDot 1s infinite ease-in-out}",
    ".fotu-m.t i:nth-child(2){animation-delay:.15s}.fotu-m.t i:nth-child(3){animation-delay:.3s}",
    "@keyframes fotuDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}",
    "#fotu-chips{padding:8px 12px 2px;display:flex;flex-wrap:wrap;gap:6px;max-height:150px;overflow-y:auto}",
    "#fotu-chips:empty{display:none}",
    "#fotu-chips button{font:inherit;font-size:12.5px;padding:6px 11px;border-radius:999px;border:1px solid var(--f-line);background:var(--f-paper);color:var(--f-ink);cursor:pointer}",
    "#fotu-chips button:hover{border-color:var(--f-ink)}",
    "#fotu-chips button.main{background:var(--f-ink);color:var(--f-paper);border-color:var(--f-ink)}",
    "#fotu-in{display:flex;padding:8px 12px 10px;gap:6px}",
    "#fotu-in input{flex:1;min-width:0;font:inherit;font-size:16px;padding:8px 11px;border-radius:10px;border:1px solid var(--f-line);background:var(--f-paper);color:var(--f-ink)}",
    "#fotu-in input:focus,#fotu-in input:focus-visible{outline:none!important;box-shadow:none!important;border-color:var(--f-ink)}",
    "#fotu-in button{font:inherit;font-size:13px;padding:8px 14px;border-radius:10px;border:0;background:var(--f-ink);color:var(--f-paper);cursor:pointer}",
    "#fotu-err{display:none;color:#c0392b;font-size:12px;padding:0 14px 8px}",
    "#fotu-back{position:fixed;left:14px;top:0;z-index:400;width:34px;height:34px;border-radius:50%;border:1px solid var(--f-line);background:var(--f-paper);cursor:pointer;display:none;align-items:center;justify-content:center;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.12)}",
    "#fotu-root.paused #fotu-bot,#fotu-root.paused #fotu-bub,#fotu-root.paused #fotu-back{opacity:0;pointer-events:none}",
    "@media (max-width:640px){#fotu-chips{flex-wrap:nowrap;overflow-x:auto;max-height:none;padding-bottom:4px;scrollbar-width:none}#fotu-chips::-webkit-scrollbar{display:none}#fotu-chips button{flex:none}}",
    "@media (max-width:640px){#fotu-bot{width:56px;height:56px}#fotu-panel{left:8px!important;right:8px;width:auto!important;top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom,0px));height:min(480px,72vh)}#fotu-bub{max-width:200px;font-size:13px}}",
    "@media (prefers-reduced-motion:reduce){#fotu-bot .fb,#fotu-bot .zz i,.fotu-m{animation:none!important}}"
  ].join("\n");
  var styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ================= markup ================= */
  var SVG =
    '<svg viewBox="0 0 100 100" width="100%" height="100%" style="overflow:visible" aria-hidden="true">' +
    '<g class="pr"><rect x="30" y="64" width="40" height="28" rx="2" fill="#fff" stroke="#B4B2A9"/><rect class="pimg" x="34" y="67" width="32" height="17" fill="#FAC775"/></g>' +
    '<line class="l1" x1="32" y1="78" x2="32" y2="96" stroke="#5F5E5A" stroke-width="5" stroke-linecap="round"/>' +
    '<line class="l2" x1="68" y1="78" x2="68" y2="96" stroke="#5F5E5A" stroke-width="5" stroke-linecap="round"/>' +
    '<rect x="12" y="26" width="76" height="54" rx="14" fill="#FFFFFF" stroke="#B4B2A9" stroke-width="1.5"/>' +
    '<rect x="46" y="26" width="3" height="54" fill="#E24B4A"/><rect x="49" y="26" width="3" height="54" fill="#EF9F27"/>' +
    '<rect x="52" y="26" width="3" height="54" fill="#639922"/><rect x="55" y="26" width="3" height="54" fill="#378ADD"/>' +
    '<rect class="fbulb" x="66" y="32" width="14" height="9" rx="2" fill="#444441"/>' +
    '<circle class="burst" cx="73" cy="36" r="5" fill="#FFF8D6"/>' +
    '<g class="ey"><circle cx="30" cy="52" r="10" fill="#2C2C2A"/><circle class="p1" cx="33" cy="49" r="3" fill="#fff"/></g>' +
    '<g class="ey"><circle cx="70" cy="56" r="7" fill="#2C2C2A"/><circle class="p2" cx="72" cy="54" r="2" fill="#fff"/></g>' +
    '<path class="smile" d="M40 70 Q50 76 60 70" stroke="#444441" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<ellipse class="snore" cx="50" cy="71" rx="4" ry="3.5" fill="#444441"/>' +
    '<path class="lid" d="M21 52 Q30 57 39 52" stroke="#2C2C2A" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<path class="lid" d="M64 56 Q70 60 76 56" stroke="#2C2C2A" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  var root = document.createElement("div");
  root.id = "fotu-root";
  root.innerHTML =
    '<div id="fotu-safe" aria-hidden="true" style="position:fixed;left:0;bottom:0;width:1px;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none"></div>' +
    '<div id="fotu-flashscreen" aria-hidden="true"></div>' +
    '<div id="fotu-bub" role="status" aria-live="polite"></div>' +
    '<button id="fotu-bot" class="sleep" type="button" aria-label="Fotu is asleep. Tap to wake it up and chat"><div class="fb"><span class="zz"><i>z</i><i>z</i><i>Z</i></span>' + SVG + '</div></button>' +
    '<button id="fotu-back" type="button" aria-label="Bring Fotu back" title="Bring Fotu back">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--f-ink)"><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/></svg></button>' +
    '<div id="fotu-panel" role="dialog" aria-label="Chat with Fotu">' +
      '<div class="fh"><div style="width:30px;height:30px">' + SVG.replace('class="pr"', 'class="pr" style="display:none"') + '</div>' +
        '<div><b>Fotu</b><span>Instant camera. Instant opinions.</span></div>' +
        '<div class="fx"><button type="button" id="fotu-hide" title="Hide Fotu">Hide</button>' +
        '<button type="button" id="fotu-close" aria-label="Close chat">&#10005;</button></div></div>' +
      '<div id="fotu-log" aria-live="polite"></div>' +
      '<div id="fotu-chips"></div>' +
      '<form id="fotu-in" autocomplete="off"><input id="fotu-inp" type="text" maxlength="400" placeholder="Ask Fotu anything..." aria-label="Message Fotu"><button type="submit">Send</button></form>' +
      '<div id="fotu-err">' + EMPTY_LINE + '</div>' +
    '</div>';
  document.body.appendChild(root);

  function $(id) { return document.getElementById(id); }
  var bot = $("fotu-bot"), bub = $("fotu-bub"), panel = $("fotu-panel"), logEl = $("fotu-log"), flashScreen = $("fotu-flashscreen"),
      safeEl = $("fotu-safe"), chipsEl = $("fotu-chips"), inForm = $("fotu-in"), inp = $("fotu-inp"), errEl = $("fotu-err"), back = $("fotu-back");
  var printEl = bot.querySelector(".pr"), printImg = bot.querySelector(".pimg"), fbulb = bot.querySelector(".fbulb"),
      p1 = bot.querySelector(".p1"), p2 = bot.querySelector(".p2");
  /* ================= position & movement ================= */
  /* Fotu lives on the bottom edge of the screen and only walks left and right along it.
     Before it stands anywhere it checks that no text, photo, button or link is underneath,
     and it only walks inside clear gaps. If a gap closes (you scroll, the page changes) it
     slides to the nearest clear gap, or waits out of sight until one opens up. */
  var HEAD = 18; /* clear room kept above Fotu for hops and snore Zs */
  function size() { return bot.offsetWidth || 72; }
  function cssPx(name) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    var n = parseFloat(v); return isNaN(n) ? 0 : n;
  }
  function safeBottom() { return safeEl.offsetHeight || 0; }
  function laneY(sz) { return window.innerHeight - cssPx("--foot-h") - safeBottom() - sz - 10; }
  function bounds() {
    var s = size();
    var top = Math.max(cssPx("--header-h"), cssPx("--nav-h"), 70) + 8;
    var bottom = laneY(s);
    if (bottom < top) bottom = top;
    return { minX: 6, maxX: window.innerWidth - s - 6, minY: top, maxY: bottom };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var pos = { x: 0, y: 0 }, dir = 1, walking = false, walkTimer = null, isOpen = false, hidden = read(HIDE_KEY) === "1";
  var paused = false, bubTimer = null, printTimer = null;
  var shy = false, away = true, poofing = false, shyTimer = null, pendingFast = false;
  var placed = false, asleep = true, waking = false, lastActive = 0, quiet = sread(SS_QUIET) === "1";
  var popCount = 0, lastPop = 0;
  var NOMOVE = "transform 0s, opacity .3s";
  function refreshVis() { root.classList.toggle("gone", shy || away || poofing); }

  function place() {
    bot.style.transform = "translate(" + Math.round(pos.x) + "px," + Math.round(pos.y) + "px)";
    bot.querySelector(".fb").style.scale = dir < 0 ? "-1 1" : "";
  }

  /* ---- clear-space finder ---- */
  var CONTENT_SEL = "img,video,canvas,picture,svg,iframe,object,embed,a,button,input,select,textarea,label,summary,[role='button'],[role='link']";
  var BACKDROP = { CANVAS: 1, SVG: 1, IFRAME: 1, OBJECT: 1, EMBED: 1 };
  var TEXT_MARGIN = 8, PEEK = 24, peeking = false;
  var stackAt = document.elementsFromPoint
    ? function (x, y) { return document.elementsFromPoint(x, y); }
    : function (x, y) { var e = document.elementFromPoint(x, y); return e ? [e] : []; };

  /* true = this element is itself something to keep clear (photo, button, link...);
     false = nothing to avoid; array = the rectangles of its own text */
  function analyse(el) {
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
    var tag = String(el.tagName).toUpperCase(), vw = window.innerWidth, vh = window.innerHeight, r;
    if (el.matches(CONTENT_SEL)) {
      if (BACKDROP[tag]) { r = el.getBoundingClientRect(); if (r.width * r.height > 0.7 * vw * vh) return false; }
      return true;
    }
    var bg = cs.backgroundImage;
    if (bg && bg.indexOf("url(") !== -1) { r = el.getBoundingClientRect(); if (r.width * r.height < 0.5 * vw * vh) return true; }
    var rects = [], kids = el.childNodes, i, j;
    for (i = 0; i < kids.length; i++) {
      var n = kids[i];
      if (n.nodeType === 3 && /\S/.test(n.nodeValue)) {
        var range = document.createRange(); range.selectNodeContents(n);
        var cr = range.getClientRects();
        for (j = 0; j < cr.length; j++) rects.push(cr[j]);
      }
    }
    return rects.length ? rects : false;
  }
  function blockedAt(x, y, cache) {
    var stack = stackAt(x, y);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i];
      if (el === document.documentElement || el === document.body) continue;
      var info = cache.get(el);
      if (info === undefined) { info = analyse(el); cache.set(el, info); }
      if (info === false) continue;
      if (info === true) return true;
      for (var j = 0; j < info.length; j++) {
        var r = info[j];
        if (x >= r.left - TEXT_MARGIN && x <= r.right + TEXT_MARGIN && y >= r.top - TEXT_MARGIN && y <= r.bottom + TEXT_MARGIN) return true;
      }
    }
    return false;
  }
  /* run a check with Fotu's own elements out of the way, so it never mistakes itself for content */
  /* while checking, every element is made "hit-testable" for a moment, so captions and overlays
     that ignore taps (pointer-events: none) still count as content to keep clear of */
  var probeStyle = document.createElement("style");
  probeStyle.textContent = "body *{pointer-events:auto!important}";
  function withProbe(fn) {
    var prev = root.style.visibility;
    root.style.visibility = "hidden";
    document.head.appendChild(probeStyle);
    try { return fn(new Map()); } finally { probeStyle.remove(); root.style.visibility = prev; }
  }
  function rectFreeIn(l, t, w, h, step, cache) {
    for (var y = t; ; y += step) {
      var yy = Math.min(y, t + h);
      for (var x = l; ; x += step) {
        var xx = Math.min(x, l + w);
        if (blockedAt(xx, yy, cache)) return false;
        if (xx >= l + w) break;
      }
      if (yy >= t + h) break;
    }
    return true;
  }
  function rowsFor(top, h) {
    var n = Math.max(2, Math.ceil(h / 16)), out = [];
    for (var i = 0; i <= n; i++) out.push(top + 2 + (h - 4) * i / n);
    return out;
  }
  /* every clear stretch along the bottom edge, as ranges of left-edge positions Fotu may stand at */
  function scanSegments(sz) {
    sz = sz || size();
    var W = window.innerWidth, top = laneY(sz) - HEAD, h = sz + HEAD, step = W <= 800 ? 10 : 12;
    var rows = rowsFor(top, h);
    return withProbe(function (cache) {
      var runs = [], start = null, last = null, x, k, free;
      for (x = 3; x <= W - 3; x += step) {
        free = true;
        for (k = 0; k < rows.length; k++) if (blockedAt(x, rows[k], cache)) { free = false; break; }
        if (free) { if (start === null) start = x; last = x; }
        else if (start !== null) { runs.push([start, last]); start = null; }
      }
      if (start !== null) runs.push([start, last]);
      var out = [];
      runs.forEach(function (g) {
        var lo = Math.max(6, g[0] + 4), hi = Math.min(W - sz - 6, g[1] - sz - 4);
        if (hi >= lo) out.push({ lo: lo, hi: hi });
      });
      return out;
    });
  }
  function footprintFree() {
    if (peeking) return peekFree();
    var s = size();
    return withProbe(function (cache) { return rectFreeIn(pos.x - 4, pos.y - HEAD, s + 8, s + HEAD, 10, cache); });
  }
  /* "peek" spot: when the whole bottom edge is busy (common on phones), Fotu hides behind the
     right edge of the screen with just its side and one eye showing, in the page's empty margin. */
  function peekFree() {
    var s = size(), W = window.innerWidth, saved = TEXT_MARGIN;
    TEXT_MARGIN = 2;
    try { return withProbe(function (cache) { return rectFreeIn(W - PEEK, laneY(s) - 22, PEEK - 2, s + 22, 8, cache); }); }
    finally { TEXT_MARGIN = saved; }
  }
  function segmentFor(x, segs) {
    for (var i = 0; i < segs.length; i++) if (x >= segs[i].lo - 1 && x <= segs[i].hi + 1) return segs[i];
    return null;
  }
  function nearestSegment(x, segs) {
    var best = null, bd = 1e9;
    segs.forEach(function (g) { var d = x < g.lo ? g.lo - x : x > g.hi ? x - g.hi : 0; if (d < bd) { bd = d; best = g; } });
    return best;
  }


  function look(dx, dy) {
    dx = clamp(dx, -4, 4); dy = clamp(dy, -3, 3);
    p1.setAttribute("cx", 30 + dx); p1.setAttribute("cy", 52 + dy);
    p2.setAttribute("cx", 70 + dx * 0.7); p2.setAttribute("cy", 56 + dy * 0.7);
  }
  function stopWalk() {
    clearTimeout(walkTimer); walking = false;
    var r = bot.getBoundingClientRect(); pos.x = r.left; pos.y = r.top;
    bot.style.transition = NOMOVE; bot.classList.remove("walk"); place();
  }
  function walkTo(x, cb) {
    if (reduceMotion || asleep || waking) { cb && cb(); return; }
    var b = bounds(); x = clamp(x, b.minX, b.maxX);
    var d = Math.abs(x - pos.x), ms = Math.max(600, d * 11);
    dir = x < pos.x ? -1 : 1;
    bot.classList.add("walk");
    hideBubble(); printEl.classList.remove("out");
    bot.style.transition = "transform " + ms + "ms linear, opacity .3s";
    pos.x = x; pos.y = b.maxY; walking = true; place(); look(3, 0);
    clearTimeout(walkTimer);
    walkTimer = setTimeout(function () {
      walking = false; bot.classList.remove("walk"); bot.style.transition = NOMOVE; look(0, 0); cb && cb();
    }, ms);
  }
  /* a short stroll inside the clear stretch Fotu is standing in (desktop only) */
  function pace(cb) {
    if (isPhone() || peeking) { cb && cb(); return; }
    var segs = scanSegments(), cur = segmentFor(pos.x, segs);
    if (!cur) { settle(); return; }
    var span = Math.min(220, cur.hi - cur.lo);
    var tx = clamp(pos.x + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * span / 2), cur.lo, cur.hi);
    if (Math.abs(tx - pos.x) < 30) { cb && cb(); return; }
    walkTo(tx, cb);
  }
  /* fade out, reappear in a clear spot */
  function jumpTo(x) {
    if (poofing) return;
    poofing = true; refreshVis(); hideBubble();
    if (walking) stopWalk();
    setTimeout(function () {
      pos.x = x; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
      poofing = false; refreshVis();
    }, 260);
  }
  /* make sure Fotu is standing somewhere clear (or out of sight if nowhere is).
     It only moves if its current spot is no longer clear, and then only to the nearest clear spot. */
  function enterPeek() {
    if (walking) stopWalk();
    var wasAway = away;
    peeking = true; bot.classList.add("peek"); dir = 1;
    pos.x = window.innerWidth - PEEK; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
    if (wasAway) { away = false; refreshVis(); }
  }
  function exitPeek() { peeking = false; bot.classList.remove("peek"); }
  function settle() {
    if (hidden) { placeBack(); return; }
    var segs = scanSegments();
    /* on phones, a Fotu that is already peeking stays put as long as its spot is clear */
    if (peeking && (isPhone() || !segs.length) && peekFree()) {
      pos.x = window.innerWidth - PEEK; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
      if (away) { away = false; refreshVis(); }
      return;
    }
    if (!segs.length) {
      if (peekFree()) {
        if (peeking || away) enterPeek();
        else { poofing = true; refreshVis(); hideBubble(); setTimeout(function () { poofing = false; enterPeek(); refreshVis(); }, 260); }
        return;
      }
      if (!away) { away = true; refreshVis(); hideBubble(); if (walking) stopWalk(); }
      return;
    }
    var cur = peeking ? null : segmentFor(pos.x, segs);
    if (cur && !away) return;
    var seg = cur || nearestSegment(pos.x, segs), x = clamp(pos.x, seg.lo, seg.hi);
    if (away || peeking) {
      if (walking) stopWalk();
      exitPeek();
      pos.x = x; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
      away = false; refreshVis();
    } else jumpTo(x);
  }
  function anim(cls, ms) {
    if (reduceMotion) return;
    bot.classList.remove(cls); void bot.offsetWidth; bot.classList.add(cls);
    setTimeout(function () { bot.classList.remove(cls); }, ms);
  }
  function hop() { anim("hop", 500); }
  function blink() {
    if (asleep) return;
    var eyes = bot.querySelectorAll(".ey");
    eyes.forEach(function (e) { e.classList.add("cl"); });
    setTimeout(function () { eyes.forEach(function (e) { e.classList.remove("cl"); }); }, 130);
  }
  function flash() {
    bot.classList.remove("flash"); void bot.offsetWidth; bot.classList.add("flash");
    fbulb.setAttribute("fill", "#FFF8D6");
    setTimeout(function () { bot.classList.remove("flash"); fbulb.setAttribute("fill", "#444441"); }, 600);
  }
  function screenFlash() {
    if (reduceMotion) return;
    flashScreen.classList.remove("on"); void flashScreen.offsetWidth; flashScreen.classList.add("on");
    setTimeout(function () { flashScreen.classList.remove("on"); }, 500);
  }
  function printOut(color, ms) {
    printImg.setAttribute("fill", color || "#FAC775");
    setTimeout(function () { printEl.classList.add("out"); }, 250);
    clearTimeout(printTimer);
    printTimer = setTimeout(function () { printEl.classList.remove("out"); }, ms || 3600);
  }
  function touch() { lastActive = Date.now(); }

  /* ================= speech bubble (rationed) ================= */
  /* Spontaneous bubbles: at most MAX_POPS per page view, at least POP_GAP apart.
     Reactions to something the visitor did (lamp, closing the chat) may skip the queue,
     but still never come faster than every few seconds. Never while asleep (except the
     sleepy one-liners), never in quiet mode, never over content. */
  var MAX_POPS = 3, POP_GAP = 45000;
  function placeBubble(text) {
    var s = size(), W = window.innerWidth, H = window.innerHeight, cx = pos.x + s / 2;
    bub.textContent = text; bub.classList.remove("on"); bub.classList.add("measure");
    var cands = [];
    [230, 170, 130].forEach(function (mw) {
      mw = Math.min(mw, W - 16);
      bub.style.maxWidth = mw + "px";
      var bw = bub.offsetWidth, bh = bub.offsetHeight;
      cands.push({ l: clamp(cx - bw / 2, 8, W - bw - 8), t: pos.y - bh - 6, w: bw, h: bh, mw: mw });
      cands.push({ l: pos.x + s + 8, t: pos.y + s - bh, w: bw, h: bh, mw: mw });
      cands.push({ l: pos.x - bw - 8, t: pos.y + s - bh, w: bw, h: bh, mw: mw });
    });
    bub.classList.remove("measure");
    var c = withProbe(function (cache) {
      for (var i = 0; i < cands.length; i++) {
        var k = cands[i];
        if (k.t < 8 || k.l < 8 || k.l + k.w > W - 8 || k.t + k.h > H - 4) continue;
        if (rectFreeIn(k.l - 4, k.t - 4, k.w + 8, k.h + 8, 20, cache)) return k;
      }
      return null;
    });
    if (!c) return false;
    bub.style.maxWidth = c.mw + "px"; bub.style.left = Math.round(c.l) + "px"; bub.style.top = Math.round(c.t) + "px";
    return true;
  }
  function pop(text, ms, opt) {
    opt = opt || {};
    if (quiet && !opt.evenQuiet) return false;
    if (isOpen || hidden || paused || shy || away || poofing || !placed) return false;
    var now = Date.now();
    if (opt.force) { if (now - lastPop < 5000) return false; }
    else if (popCount >= MAX_POPS || now - lastPop < POP_GAP) return false;
    if (!placeBubble(text)) return false;
    clearTimeout(bubTimer);
    bub.classList.remove("on"); void bub.offsetWidth; bub.classList.add("on");
    bubTimer = setTimeout(hideBubble, ms || 3500);
    lastPop = now; popCount++;
    return true;
  }
  function hideBubble() { clearTimeout(bubTimer); bub.classList.remove("on"); }

  /* ================= sleeping and waking ================= */
  function goSleep() {
    if (asleep || waking) return;
    if (walking) stopWalk();
    asleep = true; hideBubble(); look(0, 0);
    bot.classList.add("sleep");
    bot.setAttribute("aria-label", "Fotu is asleep. Tap to wake it up and chat");
  }
  function wakeUp(cb) {
    if (!asleep) { cb && cb(); return; }
    if (waking) return;
    waking = true; asleep = false; hideBubble(); bump("woke");
    bot.classList.remove("sleep", "stir");
    bot.classList.add("waking");
    bot.setAttribute("aria-label", "Chat with Fotu");
    setTimeout(function () {
      bot.classList.remove("waking"); waking = false; blink(); touch(); cb && cb();
    }, reduceMotion ? 120 : 900);
  }

  /* ================= photos (desktop only) ================= */
  function visiblePhotos() {
    var out = [], b = bounds();
    document.querySelectorAll("img").forEach(function (img) {
      if (root.contains(img)) return;
      var src = img.currentSrc || img.src || "";
      if (!src || /logo/i.test(src)) return;
      var r = img.getBoundingClientRect();
      if (r.width < 90 || r.height < 70) return;
      if (r.bottom < b.minY + 20 || r.top > b.maxY + size() - 20 || r.right < 20 || r.left > window.innerWidth - 20) return;
      var cs = getComputedStyle(img);
      if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.2) return;
      out.push(img);
    });
    return out;
  }
  function categoryOf(img) {
    var c = catBySrc[base(img.currentSrc || img.src)];
    if (c) return c;
    var card = img.closest("[data-cat],[data-category]");
    if (card) return card.getAttribute("data-cat") || card.getAttribute("data-category");
    return null;
  }
  function lineFor(cat) {
    if (cat && PHOTO_LINES[cat]) return pick(PHOTO_LINES[cat]);
    for (var k in PHOTO_LINES) if (cat && k.toLowerCase() === String(cat).toLowerCase()) return pick(PHOTO_LINES[k]);
    return pick(QUIPS);
  }
  var PRINT_COLORS = { "Food": "#F0997B", "Pets": "#FAC775", "Events": "#ED93B1", "Portraits": "#AFA9EC", "Travel": "#85B7EB", "Products": "#5DCAA5", "Real Estate": "#B4B2A9" };
  var lastVisit = 0;
  function visit(img) {
    if (asleep || isPhone() || Date.now() - lastVisit < 15000) return;
    var list = img ? [img] : visiblePhotos();
    if (!list.length) return;
    lastVisit = Date.now();
    var t = img || pick(list), r = t.getBoundingClientRect(), s = size();
    var dx = (r.left + r.width / 2) - (pos.x + s / 2), dy = (r.top + r.height / 2) - (pos.y + s / 2);
    dir = dx < 0 ? -1 : 1; place(); hop();
    look(dx / 40 * dir, dy / 40);
    setTimeout(function () {
      if (isOpen || paused || shy || away || poofing || asleep) return;
      flash();
      var cat = categoryOf(t);
      printOut(PRINT_COLORS[cat]);
      pop(lineFor(cat));
    }, 350);
  }

  /* ================= behaviour loop ================= */
  function tick() {
    if (!placed || isOpen || hidden || paused || walking || shy || away || poofing || waking || asleep || document.hidden) return;
    var idleFor = Date.now() - lastActive;
    if (idleFor > (quiet ? 20000 : 70000)) { goSleep(); return; }
    var r = Math.random();
    if (isPhone()) { if (r < 0.3) blink(); return; } /* phones: stays put, just blinks */
    if (r < 0.12) pace();
    else if (r < 0.2 && !quiet) visit();
    else if (r < 0.3) blink();
  }
  setInterval(function () { if (Math.random() < 0.5 && !hidden && !away) blink(); }, 2600);

  /* pause and hide while the site's photo viewer, enquiry form or The Collective is open */
  function overlayOpen() {
    var cover = document.getElementById("cover-overlay");
    if (cover && !cover.hidden && !cover.classList.contains("cover-hide") &&
        !document.documentElement.classList.contains("cover-seen") && getComputedStyle(cover).display !== "none") return true;
    try { if (window.LRL && window.LRL.enquiry && window.LRL.enquiry.isOpen && window.LRL.enquiry.isOpen()) return true; } catch (e) {}
    return !!document.querySelector("#capLb.on, #capEnq.on, #lb.on, #lb[open], .lb.on, .enquiry-modal.open, body.bulk-open, .overlay-page.open");
  }
  setInterval(function () {
    var o = overlayOpen();
    if (o !== paused) {
      paused = o;
      root.classList.toggle("paused", paused);
      if (paused) { hideBubble(); if (walking) stopWalk(); if (isOpen) closeChat(true); }
    }
  }, 400);

  /* keep checking that Fotu is still standing on clear ground (content can move without a scroll) */
  function backFree() {
    var x = parseFloat(back.style.left), y = parseFloat(back.style.top);
    if (isNaN(x) || isNaN(y) || back.style.visibility === "hidden") return false;
    if (Math.abs(y - laneY(34)) > 1) return false;
    return withProbe(function (cache) { return rectFreeIn(x - 2, y - 2, 38, 38, 10, cache); });
  }
  setInterval(function () {
    if (document.hidden || shy || paused) return;
    if (hidden) { if (!backFree()) placeBack(); return; }
    if (!placed) { start(); return; }
    if (isOpen || walking || poofing) return;
    if (away) { settle(); return; }
    var lane = bounds().maxY;
    if (Math.abs(pos.y - lane) > 1) { pos.y = lane; bot.style.transition = NOMOVE; place(); }
    if (!footprintFree()) settle();
  }, 700);

  /* desktop: the eyes follow the mouse; hovering a sleeping Fotu makes it stir */
  var lastNear = 0;
  if (finePointer) {
    document.addEventListener("mousemove", function (e) {
      if (hidden || paused || isOpen || away || shy || asleep || waking) return;
      var s = size(), cx = pos.x + s / 2, cy = pos.y + s / 2, dx = e.clientX - cx, dy = e.clientY - cy;
      if (!walking) look(dx / 30 * dir, dy / 30);
      if (Math.hypot(dx, dy) < 60 && !walking && Date.now() - lastNear > 20000 && Math.random() < 0.04) {
        lastNear = Date.now(); hop(); pop(PERSONAL_SPACE, 2200);
      }
    }, { passive: true });
    bot.addEventListener("mouseenter", function () {
      if (!asleep || waking) return;
      bot.classList.add("stir");
      setTimeout(function () { bot.classList.remove("stir"); }, 1500);
    });
    /* hover on a photo for a moment and Fotu (if awake) turns to take a shot of it */
    var hoverTimer = null;
    document.addEventListener("mouseover", function (e) {
      var img = e.target && e.target.tagName === "IMG" ? e.target : null;
      clearTimeout(hoverTimer);
      if (!img || root.contains(img) || hidden || paused || isOpen || away || shy || asleep || quiet) return;
      hoverTimer = setTimeout(function () {
        if (walking) return;
        if (visiblePhotos().indexOf(img) === -1) return;
        visit(img);
      }, 1200);
    }, { passive: true });
  }

  /* scrolling or resizing: step out of sight, then come back to the same spot if it's still clear */
  function onMove() {
    if (isOpen) { placePanel(); return; }
    if (!placed) return;
    if (!shy) {
      shy = true; refreshVis();
      if (walking) stopWalk();
      hideBubble();
      if (hidden) back.style.visibility = "hidden";
    }
    clearTimeout(shyTimer);
    shyTimer = setTimeout(function () {
      settle();
      shy = false; refreshVis();
      consumeFast();
    }, 280);
  }
  window.addEventListener("scroll", onMove, { passive: true });
  window.addEventListener("resize", onMove);

  /* ================= lamp rope (theme switch) ================= */
  var lastTheme = document.documentElement.getAttribute("data-theme");
  new MutationObserver(function () {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === lastTheme) return;
    lastTheme = t;
    if (hidden || paused || !placed) return;
    if (asleep) {
      anim("stir", 1500);
      pop(t === "dark" ? LIGHTS_OFF_ASLEEP : LIGHTS_ON_ASLEEP, 2600, { force: true });
      return;
    }
    if (walking) stopWalk();
    touch();
    if (t === "dark") { flash(); hop(); pop(LIGHTS_OFF, 3000, { force: true }); }
    else {
      bot.classList.add("squint");
      setTimeout(function () { bot.classList.remove("squint"); }, 1800);
      pop(LIGHTS_ON, 3000, { force: true });
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ================= fast scrolling (once per page, only when awake) ================= */
  var wheelSum = 0, wheelStart = 0, fastDone = false, touchY = null, touchT = 0;
  function fastScroll() {
    if (fastDone || hidden || paused || isOpen || asleep || quiet) return;
    fastDone = true; pendingFast = true;
    setTimeout(consumeFast, 700);
  }
  function consumeFast() {
    if (!pendingFast || shy || away || poofing || walking || hidden || paused || isOpen || asleep) return;
    pendingFast = false;
    anim("wobble", 1250);
    pop(pick(FAST_SCROLL), 2400, { force: true });
  }
  window.addEventListener("wheel", function (e) {
    var now = Date.now();
    if (now - wheelStart > 400) { wheelStart = now; wheelSum = 0; }
    wheelSum += Math.abs(e.deltaY) + Math.abs(e.deltaX);
    if (wheelSum > 2400) { wheelSum = 0; fastScroll(); }
  }, { passive: true });
  window.addEventListener("touchstart", function (e) { var t = e.touches[0]; touchY = t ? t.clientY + t.clientX : null; touchT = Date.now(); }, { passive: true });
  window.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0]; if (touchY === null || !t) return;
    var dist = Math.abs(t.clientY + t.clientX - touchY), dt = Date.now() - touchT;
    if (dt > 0 && dt < 250 && dist / dt > 2.2) fastScroll();
    touchY = null;
  }, { passive: true });

  /* ================= chat: message queue with a typing indicator ================= */
  var chat = { step: null, enq: {}, name: read(NAME_KEY) || "", unknownStreak: 0, lastUnknown: "", offer: null,
               suggestCat: "", suggestEvent: "", rot: {}, pokes: 0, pokeTimer: null, fbIndex: Math.floor(Math.random() * FALLBACK.length) };
  var queue = [], qBusy = false;
  function enqueue(fn) { queue.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var fn = queue.shift(); if (!fn) { qBusy = false; return; } qBusy = true; fn(nextQ); }
  function say(text, who) {
    var m = document.createElement("div");
    m.className = "fotu-m " + (who || "b");
    m.textContent = text;
    logEl.appendChild(m);
    logEl.scrollTop = logEl.scrollHeight;
    return m;
  }
  function fill(s) { return String(s).replace(/\{name\}/g, chat.name ? ", " + chat.name : ""); }
  function botSay(text) {
    text = fill(text);
    enqueue(function (done) {
      var t = document.createElement("div");
      t.className = "fotu-m b t"; t.innerHTML = "<i></i><i></i><i></i>";
      t.setAttribute("aria-label", "Fotu is typing");
      logEl.appendChild(t); logEl.scrollTop = logEl.scrollHeight;
      var d = reduceMotion ? 120 : Math.min(1300, 380 + text.length * 12);
      setTimeout(function () { t.remove(); say(text, "b"); done(); }, d);
    });
  }
  function later(fn) { enqueue(function (done) { fn(); done(); }); }
  function setChips(list) {
    chipsEl.innerHTML = "";
    (list || []).forEach(function (label) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      if (label === "Book a shoot" || label === "Send it" || label === "Send my question to the team") b.className = "main";
      b.addEventListener("click", function () { onChip(label); });
      chipsEl.appendChild(b);
    });
  }
  function chipsLater(list) { later(function () { setChips(list); }); }
  function userSays(t) { say(t, "u"); }

  function onChip(label) {
    touch();
    if (chat.step) { userSays(label); handleStep(label); return; }
    if (ACTION_CHIPS[label]) { ACTION_CHIPS[label](); return; }
    userSays(label); bump("msgs");
    if (label === "Book a shoot") { topic("book"); startEnq(); return; }
    if (label === "Send my question to the team") { topic("send_question"); startEnq(chat.lastUnknown); return; }
    handleText(label);
  }
  inp.addEventListener("input", function () { errEl.style.display = "none"; });
  inForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    var v = inp.value.trim();
    if (!v) { errEl.style.display = "block"; return; }
    inp.value = ""; touch();
    userSays(v); bump("msgs");
    if (chat.step) handleStep(v); else handleText(v);
  });

  /* ================= understanding messages ================= */
  /* common text-speak, so "wat r u" reads as "what are you" */
  var SHORT = { u: "you", r: "are", ur: "your", wat: "what", wht: "what", wot: "what", hw: "how", abt: "about", pls: "please", plz: "please",
    pic: "photo", pics: "photos", pix: "photos", photo: "photo", fotos: "photos", foto: "photo", thnx: "thanks", thanx: "thanks", tnx: "thanks",
    wanna: "want to", gonna: "going to", gimme: "give me", lemme: "let me", hv: "have", cn: "can", dat: "that", da: "the", n: "and", btw: "by the way",
    whats: "what is", hows: "how is", wheres: "where is", whos: "who is", im: "im", cant: "cannot", dont: "do not", doesnt: "does not", shud: "should", shld: "should", wud: "would", cud: "could", y: "why", k: "k" };
  function norm(s) {
    var t = String(s).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    t = t.split(" ").map(function (w) { return Object.prototype.hasOwnProperty.call(SHORT, w) ? SHORT[w] : w; }).join(" ");
    return " " + t + " ";
  }
  function squash(w) { return w.replace(/(.)\1+/g, "$1"); }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  /* pre-sort every topic's triggers into phrases and single words */
  INTENTS.forEach(function (it) {
    it.phrases = []; it.words = [];
    it.k.forEach(function (k) {
      var n = norm(k).trim();
      if (!n) return;
      if (n.indexOf(" ") !== -1) it.phrases.push({ p: " " + n + " ", sq: " " + n.split(" ").map(squash).join(" ") + " ", len: n.split(" ").length });
      else it.words.push({ w: n, sq: squash(n) });
    });
  });
  function intentById(id) { for (var i = 0; i < INTENTS.length; i++) if (INTENTS[i].id === id) return INTENTS[i]; return null; }
  function scoreIntent(it, n, nSq, toks, sqToks) {
    var score = 0, i, j;
    for (i = 0; i < it.phrases.length; i++) {
      var ph = it.phrases[i];
      if (n.indexOf(ph.p) !== -1 || nSq.indexOf(ph.sq) !== -1) score += 3 + (ph.len - 2) * 0.5;
    }
    /* each word of the message counts once per topic: 2 for an exact match, 1.2 for a near miss (typo) */
    for (j = 0; j < toks.length; j++) {
      var hit = 0;
      for (i = 0; i < it.words.length && hit < 2; i++) {
        var w = it.words[i];
        if (toks[j] === w.w || sqToks[j] === w.sq) hit = 2;
        else if (!hit && w.w.length >= 5 && toks[j].length >= 4) {
          var d = lev(toks[j], w.w);
          if (d <= 1 || (w.w.length >= 8 && d <= 2)) hit = 1.2;
        }
      }
      score += hit;
    }
    return score * (it.w || 1);
  }
  function understand(text) {
    var n = norm(text), toks = n.trim().split(" ").filter(Boolean).slice(0, 40), sqToks = toks.map(squash), nSq = " " + sqToks.join(" ") + " ";
    var best = null, bestScore = 0, cat = null, catScore = 0;
    INTENTS.forEach(function (it) {
      var s = scoreIntent(it, n, nSq, toks, sqToks);
      if (s > bestScore) { best = it; bestScore = s; }
      if (it.a && it.a.indexOf("cat:") === 0 && s >= 2 && s > catScore) { cat = it; catScore = s; }
    });
    var ok = bestScore >= 2 || (bestScore >= 1.2 && toks.length <= 4);
    return { intent: ok ? best : null, cat: cat };
  }

  var NAME_STOP = /^(looking|interested|here|a|an|the|from|getting|planning|not|fine|good|ok|okay|bored|sad|happy|tired|hungry|new|back|just|so|very|doing|great|well|going|trying|also|still|in|at|sorry|confused|alright|done|ready|available|free|busy|curious|asking|wondering|need|want|a|photographer|human|bot|your|you|nice|cool|lost)$/i;
  function cleanName(raw) {
    var parts = String(raw).trim().split(/\s+/).slice(0, 2).filter(function (p) { return !/^(and|i|from|here|nd|&)$/i.test(p); });
    if (!parts.length || NAME_STOP.test(parts[0])) return "";
    if (parts[1] && NAME_STOP.test(parts[1])) parts = [parts[0]];
    return parts.map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); }).join(" ").slice(0, 30);
  }
  function findName(t) {
    var m = t.match(/(?:^|\b)(?:my name is|my names|my name's|myself|call me|naa peru|na peru|naa paeru|mera naam|mera nam)\s+([a-z][a-z'.-]{1,20}(?:\s+[a-z][a-z'.-]{1,20})?)/i);
    if (!m) m = t.match(/^\s*(?:hi|hello|hey)?[\s,!]*(?:i am|i'm|im|this is)\s+([a-z][a-z'.-]{1,20})[\s.!]*$/i);
    if (!m) m = t.match(/^\s*([a-z][a-z'.-]{1,20})\s+(?:here|this side)[\s.!]*$/i);
    return m ? cleanName(m[1]) : "";
  }
  function safeMath(t) {
    var m = t.toLowerCase().replace(/what is|whats|what's|calculate|solve|=|\?/g, "").replace(/x/g, "*").trim();
    if (!/^[\d\s+\-*/().]+$/.test(m) || !/\d\s*[+\-*/]\s*[\d(]/.test(m) || m.length > 40) return null;
    try { var v = Function('"use strict";return (' + m + ")")(); if (typeof v === "number" && isFinite(v)) return Math.round(v * 1000) / 1000; } catch (e) {}
    return null;
  }

  var EMOJI_REPLIES = ["I speak fluent emoji. 📸✨", "Right back at you! 😄", "📷 + 😊 = a great shoot."];
  function answerIntent(it, catHint, said) {
    if (!it) return;
    topic(it.id); chat.unknownStreak = 0;
    var list = typeof it.r === "function" ? it.r() : (it.r || []);
    var i = chat.rot[it.id] || 0; chat.rot[it.id] = i + 1;
    var line = list.length ? list[i % list.length] : null;
    var a = it.a || "";
    if (a === "book") {
      if (catHint && catHint.a) { var cp = catHint.a.split(":"); chat.suggestCat = cp[1]; chat.suggestEvent = cp[2] || ""; }
      startEnq(said && said.length > 25 ? said : ""); return;
    }
    if (a === "yes") {
      if (chat.offer === "book") { startEnq(); return; }
      if (chat.offer === "team") { startEnq(chat.lastUnknown); return; }
      botSay(pick(["Great! What would you like to know?", "Lovely. Ask away!"])); chipsLater(FAQ_CHIPS); return;
    }
    var catSrc = a.indexOf("cat:") === 0 ? a : (catHint && catHint.a) || "";
    if (catSrc) { var parts = catSrc.split(":"); chat.suggestCat = parts[1]; chat.suggestEvent = parts[2] || ""; }
    chat.offer = (it.c && it.c.indexOf("Book a shoot") !== -1) || catSrc ? "book" : null;
    if (line) botSay(line);
    if (a === "selfie") later(function () { flash(); screenFlash(); printOut(pick(["#F0997B", "#FAC775", "#85B7EB", "#AFA9EC", "#5DCAA5"]), 4000); });
    if (a === "dance") later(function () { anim("wobble", 1250); });
    if (a === "nap") { later(function () { setTimeout(function () { closeChat(true); goSleep(); }, 1500); }); return; }
    chipsLater(it.c || FAQ_CHIPS);
  }
  function handleText(raw) {
    var t = String(raw).trim();
    if (!/[a-z0-9\u0900-\u097F\u0C00-\u0C7F]/i.test(t)) { topic("emoji"); botSay(pick(EMOJI_REPLIES)); chipsLater(FAQ_CHIPS); return; }
    if (/https?:\/\/|www\./i.test(t)) { topic("link"); botSay("I don't open links. Bad for my lens. Tell me in words what you need?"); chipsLater(FAQ_CHIPS); return; }
    var mathV = safeMath(t);
    if (mathV !== null) { topic("math"); botSay("That's " + mathV + ". I'm better with apertures, but I'll take it."); chipsLater(FAQ_CHIPS); return; }
    var low = t.toLowerCase();
    if (/\b(what time|time now|current time|time is it)\b/.test(low)) {
      topic("time"); botSay("It's " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + " where you are. " + (timeGreeting() || "")); chipsLater(FAQ_CHIPS); return;
    }
    if (/\b(what day|todays date|today s date|what date|which day is|what is the date|whats the date)\b/.test(low.replace(/'/g, " "))) {
      topic("date"); botSay("Today is " + new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }) + ". " + (todayFestival() || "A good day for photos.")); chipsLater(FAQ_CHIPS); return;
    }
    var em = t.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/);
    if (em) { chat.enq = { email: em[0] }; chat.offer = "book"; topic("email_shared"); botSay("That looks like an email address. Want me to start an enquiry so the team can reply to it?"); chipsLater(["Book a shoot", "No"]); return; }

    var u = understand(t), nm = findName(t);
    if (nm) {
      var first = !chat.name || chat.name !== nm;
      chat.name = nm; store(NAME_KEY, nm); topic("name");
      if (u.intent && ["greeting", "imfine", "whoareyou"].indexOf(u.intent.id) === -1) {
        botSay("Nice to meet you, " + nm + "!"); answerIntent(u.intent, u.cat, t); return;
      }
      botSay(first ? pick(["Nice to meet you, " + nm + "! Lovely name. Very photogenic.", "Hello " + nm + "! I'll remember that. Cameras never forget a face. Or a name."]) : "I know, " + nm + "! I remembered.");
      chipsLater(FAQ_CHIPS); return;
    }
    if (u.intent) { answerIntent(u.intent, u.cat, t); return; }
    if (u.cat) { answerIntent(u.cat); return; }
    if (t.length > 160) {
      chat.lastUnknown = t; chat.offer = "team"; topic("long_message");
      botSay("That sounds like a proper brief! Want me to send it straight to the team as an enquiry?");
      chipsLater(["Send my question to the team", "What do you shoot?"]); return;
    }
    logUnknown(t); chat.unknownStreak++; chat.lastUnknown = t;
    if (chat.unknownStreak >= 2) {
      chat.offer = "team"; botSay(FALLBACK_TWICE);
      chipsLater(["Send my question to the team", "Talk to a human", "What do you shoot?"]);
    } else {
      chat.offer = null; botSay(FALLBACK[chat.fbIndex++ % FALLBACK.length]);
      chipsLater(["What do you shoot?", "How much does it cost?", "Book a shoot", "Tell me a joke"]);
    }
  }

  /* ================= booking a shoot (sent through the same Formspree form as the site) ================= */
  var sending = false;
  function setStep(s, list, placeholder, type) {
    later(function () {
      chat.step = s; setChips(list || ["Cancel"]);
      inp.type = type || "text"; inp.placeholder = placeholder || "Type your answer...";
      inp.setAttribute("autocomplete", s === "email" ? "email" : s === "name" ? "given-name" : "off");
      if (!isPhone()) inp.focus();
    });
  }
  function endSteps() { chat.step = null; inp.type = "text"; inp.placeholder = "Ask Fotu anything..."; inp.setAttribute("autocomplete", "off"); }
  function startEnq(prefill) {
    var keepEmail = chat.enq && chat.enq.email;
    chat.enq = { msg: prefill || "", cat: chat.suggestCat || "", ev: chat.suggestEvent || "", email: keepEmail || "" };
    chat.offer = null; chat.lastUnknown = "";
    if (chat.name) { chat.enq.name = chat.name; botSay("Let's do it, " + chat.name + "! A few quick details for the team."); askCat(); }
    else { botSay("Let's book it! First, what's your name?"); setStep("name", ["Cancel"], "Your name"); }
  }
  function askCat() {
    if (chat.enq.cat) { if (chat.enq.cat === "Events" && !chat.enq.ev) { askEvent(); return; } askEmail(); return; }
    botSay("What are we shooting?");
    setStep("cat", CATEGORIES.concat(["Something else", "Cancel"]), "Or type it here");
  }
  function askEvent() { botSay("Lovely! What kind of event?"); setStep("event", EVENT_TYPES.concat(["Cancel"]), "Or type it here"); }
  function askEmail() {
    if (chat.enq.email) { askMsg(); return; }
    botSay(chat.enq.cat === "Pets" ? "Is the model well-behaved? Asking for me. What's your email, so the team can reply?" : "Great choice. What's your email, so the team can reply?");
    setStep("email", ["Cancel"], "you@example.com", "email");
  }
  function askMsg() {
    if (chat.enq.msg) {
      botSay("I'll include what you told me. Anything to add? Dates, location, ideas?");
      setStep("msg", ["That's all", "Cancel"], "Dates, location, ideas...");
    } else {
      botSay("Tell me about the shoot: dates, location, ideas, wild dreams.");
      setStep("msg", ["Cancel"], "Dates, location, ideas...");
    }
  }
  function confirmEnq() {
    var e = chat.enq, what = e.cat + (e.ev ? " (" + e.ev + ")" : "");
    botSay("Here's your enquiry:\nName: " + e.name + "\nShoot: " + what + "\nEmail: " + e.email + "\nDetails: " + e.msg + "\n\nShall I send it?");
    setStep("confirm", ["Send it", "Start over", "Cancel"], "Or add something...");
  }
  var CATS_LOW = CATEGORIES.map(function (c) { return c.toLowerCase(); });
  function handleStep(v) {
    var low = v.toLowerCase().trim(), e = chat.enq, s = chat.step;
    if (/^(cancel|stop|quit|exit|never ?mind|forget it|no thanks|vaddu)$/.test(low)) {
      endSteps(); topic("book_cancelled"); botSay("No problem, cancelled. Anything else I can help with?"); chipsLater(FAQ_CHIPS); return;
    }
    if (s === "name") {
      var nm = findName(v) || cleanName(v.replace(/[^a-z\s'.-]/gi, " "));
      if (!nm || v.length > 50) { botSay("Just your first name is perfect."); return; }
      chat.name = nm; e.name = nm; store(NAME_KEY, nm);
      botSay(pick(["Lovely name, " + nm + ". Very photogenic.", "Nice to meet you, " + nm + "!"])); askCat(); return;
    }
    if (s === "cat") {
      var em2 = v.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/);
      if (em2) { e.email = em2[0]; botSay("Got your email. And what are we shooting?"); return; }
      var idx = CATS_LOW.indexOf(low);
      if (idx === -1) { var u = understand(v); if (u.cat) { var p = u.cat.a.split(":"); e.cat = p[1]; e.ev = p[2] || ""; } }
      else e.cat = CATEGORIES[idx];
      if (!e.cat) { e.cat = "General Enquiry"; if (low !== "something else") e.msg = v; }
      if (e.cat === "Events" && !e.ev) { askEvent(); return; }
      askEmail(); return;
    }
    if (s === "event") { e.ev = low === "other" ? "" : v.slice(0, 60); askEmail(); return; }
    if (s === "email") {
      var m = v.match(/[^\s@]+@[^\s@]+\.[^\s@]{2,}/);
      if (!m) { botSay("That email came out a bit blurry. Can you check it?"); return; }
      e.email = m[0]; askMsg(); return;
    }
    if (s === "msg") {
      if (low !== "that's all" && low !== "thats all") e.msg = (e.msg ? e.msg + "\n\n" : "") + v.slice(0, 1000);
      if (!e.msg) { botSay("Even one line helps. What's the occasion, and roughly when?"); return; }
      confirmEnq(); return;
    }
    if (s === "confirm") {
      if (low === "send it" || /^(yes|yeah|yep|ok|okay|sure|send|haan|avunu)\b/.test(low)) { endSteps(); setChips([]); send(); return; }
      if (low === "start over") { endSteps(); chat.suggestCat = ""; chat.suggestEvent = ""; startEnq(); return; }
      e.msg += "\n" + v.slice(0, 500); confirmEnq(); return;
    }
  }
  function send() {
    var e = chat.enq, last = parseInt(read(SENT_KEY) || "0", 10);
    if (Date.now() - last < 30000) { botSay("Easy, I'm still printing the last one. Try again in a few seconds."); chipsLater(["Send it", "Cancel"]); chat.step = "confirm"; return; }
    sending = true;
    botSay("Printing...");
    var payload = {
      name: e.name, email: e.email, category: e.cat, message: e.msg,
      _replyto: e.email,
      _subject: "New enquiry via Fotu: " + e.cat + " shoot (" + e.name + ")",
      source: "Fotu chatbot (" + location.pathname + ")",
      _gotcha: ""
    };
    if (e.ev) payload.eventType = e.ev;
    later(function () {
      fetch("https://formspree.io/f/" + (SITE.formspreeId || "xjykvnoz"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("bad status");
        store(SENT_KEY, String(Date.now()));
        sending = false; bump("sent"); flushStats();
        flash(); screenFlash(); printOut("#85B7EB", 4500);
        botSay("Printed and sent! The team will reply to " + e.email + " soon. Thanks" + (e.name ? ", " + e.name : "") + "!");
        chipsLater(["See our work ↗", "Instagram ↗"]);
        chat.suggestCat = ""; chat.suggestEvent = ""; chat.enq = {};
      }).catch(function () {
        sending = false;
        botSay("My printer jammed. Opening your email app so nothing gets lost.");
        later(function () {
          window.location.href = "mailto:" + siteEmail() +
            "?subject=" + encodeURIComponent("Enquiry: " + e.cat + " - " + e.name) +
            "&body=" + encodeURIComponent("Name: " + e.name + "\nEmail: " + e.email + "\nShoot: " + e.cat + (e.ev ? " (" + e.ev + ")" : "") + "\n\n" + e.msg);
        });
        chipsLater(FAQ_CHIPS);
      });
    });
  }

  /* ================= opening, closing, poking ================= */
  function placePanel() {
    if (window.innerWidth <= 640) { panel.style.left = ""; panel.style.top = ""; return; }
    var s = size(), w = 330, h = Math.min(470, window.innerHeight - 24), W = window.innerWidth;
    var left = pos.x + s / 2 > W / 2 ? pos.x + s - w : pos.x;
    left = clamp(left, 12, W - w - 12);
    var top = clamp(pos.y - h - 10, 12, window.innerHeight - h - 12);
    panel.style.left = left + "px"; panel.style.top = top + "px";
  }
  function openChat(fromWake) {
    if (walking) stopWalk();
    isOpen = true; hideBubble(); touch();
    placePanel(); panel.classList.add("on");
    bump("opened");
    if (!logEl.children.length) {
      var met = read(MET_KEY) === "1";
      botSay(met && chat.name ? pick(WAKE_BACK) : fromWake ? pick(WAKE_LINES) : "Hi{name}! I'm Fotu, the studio's camera.");
      var g = todayFestival() || (Math.random() < 0.6 ? timeGreeting() : null);
      if (g) botSay(g);
      botSay(WAKE_FOLLOW);
      chipsLater(FAQ_CHIPS);
      store(MET_KEY, "1");
    } else if (fromWake) botSay(pick(WAKE_AGAIN));
    if (!isPhone()) setTimeout(function () { inp.focus(); }, 80);
  }
  function closeChat(silent) {
    if (!isOpen) return;
    isOpen = false; panel.classList.remove("on"); touch();
    flushStats();
    if (silent) return;
    try { bot.focus({ preventScroll: true }); } catch (e) {}
    var n = parseInt(sread(SS_CLOSES) || "0", 10) + 1; sstore(SS_CLOSES, String(n));
    if (n >= 2 && !quiet) {
      quiet = true; sstore(SS_QUIET, "1");
      setTimeout(function () { pop(QUIET_LINE, 2800, { force: true, evenQuiet: true }); setTimeout(goSleep, 2000); }, 150);
    } else if (n === 1) setTimeout(function () { pop(CLOSE_LINE, 2600, { force: true }); }, 150);
  }
  function poke() {
    chat.pokes++; bump("pokes"); touch();
    clearTimeout(chat.pokeTimer); chat.pokeTimer = setTimeout(function () { chat.pokes = 0; }, 4000);
    var lvl = chat.pokes <= 2 ? 0 : chat.pokes <= 4 ? 1 : chat.pokes <= 6 ? 2 : 3;
    anim(["hop", "spin", "grump", "wobble"][lvl], lvl === 3 ? 1250 : 900);
    if (chat.pokes % 2 === 1 || lvl === 3) say(pick(POKE_LINES[lvl]), "b");
  }
  bot.addEventListener("click", function () {
    if (waking) return;
    touch();
    if (isOpen) { poke(); return; }
    if (asleep) { wakeUp(function () { openChat(true); }); return; }
    openChat(false);
  });
  $("fotu-close").addEventListener("click", function () { closeChat(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) { e.stopPropagation(); closeChat(); }
  }, true);
  document.addEventListener("mousedown", function (e) {
    if (isOpen && !panel.contains(e.target) && !bot.contains(e.target)) closeChat(true);
  });

  /* ================= hide / bring back ================= */
  function placeBack() {
    var segs = scanSegments(34);
    if (!segs.length) { back.style.visibility = "hidden"; return; }
    var curX = parseFloat(back.style.left), cur = isNaN(curX) ? null : segmentFor(curX, segs);
    var x = cur ? curX : segs[0].lo;
    back.style.left = Math.round(x) + "px"; back.style.top = Math.round(laneY(34)) + "px";
    back.style.visibility = "visible";
  }
  function applyHidden() {
    bot.style.display = hidden ? "none" : "";
    back.style.display = hidden ? "flex" : "none";
    if (hidden) { hideBubble(); closeChat(true); if (walking) stopWalk(); placeBack(); }
  }
  $("fotu-hide").addEventListener("click", function () { hidden = true; store(HIDE_KEY, "1"); topic("hidden"); applyHidden(); });
  back.addEventListener("click", function () {
    hidden = false; store(HIDE_KEY, null); applyHidden();
    placed = true; asleep = false; bot.classList.remove("sleep"); touch();
    away = true; refreshVis(); settle();
    hop(); lastPop = 0; pop(BACK_LINE, 3000, { force: true, evenQuiet: true });
  });

  /* ================= start: asleep, in a clear spot, no walking ================= */
  function start() {
    if (placed || hidden || paused) return;
    var segs = scanSegments();
    if (segs.length) {
      var seg = segs[segs.length - 1];
      pos.x = seg.hi; pos.y = bounds().maxY; bot.style.transition = NOMOVE; place();
      away = false;
    } else if (peekFree()) enterPeek();
    else return; /* nowhere clear yet: the 0.7s check tries again */
    placed = true; refreshVis();
    if (!quiet && !sread(SS_HINT)) {
      setTimeout(function () {
        if (asleep && !isOpen && pop(SLEEP_HINT, 4200, { force: true })) sstore(SS_HINT, "1");
      }, 3500);
    }
  }
  refreshVis();
  applyHidden();
  setTimeout(start, 1200);
  setInterval(tick, 5000);
})();
