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
  var ANSWER_FAST = "I'm instant. The humans take about a week, because they edit properly.";
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
      r: [ANSWER_FAST], c: ["Book a shoot", "How much does it cost?"] },
    { id: "travel", k: ["do you travel", "travel", "outside hyderabad", "other city", "other cities", "outstation", "out of station", "destination", "destination wedding", "come to", "abroad", "bangalore", "bengaluru", "chennai", "mumbai", "delhi", "goa", "pune", "vizag", "visakhapatnam", "vijayawada", "warangal", "kolkata", "kerala"],
      r: [ANSWER_TRAVEL, "Our photographers will happily pack a bag. Tell us where in your enquiry and we'll sort out the details."], c: ["Book a shoot", "How much does it cost?"] },
    { id: "services", k: ["what do you shoot", "what do you do", "services", "service", "offerings", "what services", "categories", "types of shoot", "type of shoots", "kind of photography", "what kind", "specialise", "specialize", "speciality", "what can you shoot", "genres"],
      r: [ANSWER_SHOOT, "Food, pets, events, portraits, travel, products and real estate. We're a small collective with very different eyes, so we cover a lot."], c: ["See our work ↗", "How much does it cost?", "Book a shoot"] },
    { id: "location", k: ["where are you", "where are you based", "location", "located", "address", "office", "which city", "where is your studio", "hyderabad", "ekkada", "kahan ho", "kahan hai", "where r u"],
      r: ["We're based in Hyderabad, India. Most shoots happen on location, wherever your story is.", "Hyderabad! Home of biryani, Charminar and one very small camera with legs."], c: ["Do you have a studio?", "Do you travel?", "Book a shoot"] },
    { id: "studio", k: ["studio", "do you have a studio", "studio space", "indoor", "outdoor", "shoot location", "where will the shoot", "venue"],
      r: ["We mostly shoot on location: your home, venue, restaurant or a spot we pick together. Tell us what you have in mind and we'll suggest the best setting.", "Indoors or outdoors, both work. The team can suggest locations in Hyderabad that suit your shoot."], c: ["Book a shoot", "What do you shoot?"] },
    { id: "availability", k: ["available", "availability", "free on", "are you free", "date", "dates", "this weekend", "next weekend", "next week", "available tomorrow", "available today", "free tomorrow", "on sunday", "on saturday", "slot", "slots", "calendar", "booked", "next month"],
      r: ["Dates fill up quickly, so the team checks each one personally. Send your date in an enquiry and they'll confirm.", "I don't keep the calendar (no hands). Share your date in an enquiry and the team will tell you straight away."], c: ["Book a shoot"] },
    { id: "contact", k: ["contact", "email", "mail", "phone number", "mobile number", "contact number", "your number", "call you", "whatsapp", "reach you", "talk to someone", "talk to a human", "speak to", "human", "real person", "customer care", "support"],
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
    { id: "video", k: ["edit videos", "video editing", "edit my video", "video", "videos", "videography", "videographer", "reel", "reels", "film", "short film", "cinematic", "drone", "music video", "youtube video", "shoot a video"],
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
    { id: "greeting", w: 0.9, k: ["hi", "hello", "hey", "heya", "hii", "helo", "hola", "namaste", "namaskaram", "namaskar", "vanakkam", "salaam", "salam", "assalamualaikum", "yo", "sup", "whats up", "wassup", "hai", "howdy", "greetings"],
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
    { id: "bye", k: ["bye", "goodbye", "good bye", "see you", "see ya", "cya", "talk later", "ttyl", "tata", "later", "take care", "byee"],
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
    { id: "sad", k: ["sad", "lonely", "depressed", "feeling low", "upset", "stressed", "not okay", "unhappy", "crying"],
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
    { id: "favourite", k: ["favourite photo", "favorite photo", "best photo", "favourite colour", "favorite color", "favourite color"],
      r: ["My favourite photo is always the next one. My favourite colour is all four of my stripes.", "Hard to pick! Look through What We Capture and tell me yours."], c: ["See our work ↗"] },
    { id: "language", k: ["telugu", "hindi", "tamil", "kannada", "malayalam", "urdu", "speak telugu", "speak hindi", "do you speak", "language", "languages", "english"],
      r: ["I understand a bit of Telugu and Hindi mixed with English. Konchem konchem! For a proper conversation in your language, ask the team."] },
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
    "Another riddle": function () { userSays("Another riddle"); answerIntent(intentById("riddle")); },
    "Another quote": function () { userSays("Another quote"); answerIntent(intentById("quote")); },
    "Photo spots in Hyderabad?": function () { userSays("Photo spots in Hyderabad?"); answerIntent(intentById("favplace")); },
    "Fun fact": function () { userSays("Fun fact"); answerIntent(intentById("fact")); },
    "Tell me a joke": function () { userSays("Tell me a joke"); answerIntent(intentById("joke")); },
    "Talk to a human": function () { userSays("Talk to a human"); answerIntent(intentById("contact")); },
    "What should I wear?": function () { userSays("What should I wear?"); answerIntent(intentById("prepare")); },
    "How many photos will I get?": function () { userSays("How many photos will I get?"); answerIntent(intentById("count")); },
    "Do you have a studio?": function () { userSays("Do you have a studio?"); answerIntent(intentById("studio")); }
  };

  /* ---------- everyday chat (added after the shoot topics, so shoot questions always win a tie) ---------- */
  function hourNow() { return new Date().getHours(); }
  function partOfDay() { var h = hourNow(); return h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night"; }
  /* replies to "good morning / afternoon / evening": answers what the visitor said,
     with a friendly nudge if their clock and the greeting don't match */
  function greetFor(said) {
    var now = partOfDay();
    var lines = {
      morning: ["Good morning{name}! Best light of the day, and you're here for it.", "Morning{name}! I've had my coffee. Well, my film. How's your morning going?", "Good morning! The sun is up, the lens is clean. What are we doing today?"],
      afternoon: ["Good afternoon{name}! Hope lunch was as good as a Hyderabadi biryani.", "Afternoon! Harsh light outside, perfect light in here. How's your day going?"],
      evening: ["Good evening{name}! Golden hour vibes. How was your day?", "Evening! The light is getting warm and so is my flash. How can I help?"]
    };
    var out = lines[said].slice();
    if (now !== said && !(said === "evening" && now === "night")) {
      var note = { morning: "it's morning", afternoon: "it's afternoon", evening: "it's evening", night: "it's night" }[now];
      out = out.map(function (l) { return l + " (Though " + note + " on your clock. Time zones are tricky!)"; });
    }
    return out;
  }
  INTENTS = INTENTS.concat([
    { id: "goodmorning", k: ["good morning", "gm", "morning", "goodmorning", "gud morning", "good mrng", "gd mrng", "mrng", "suprabhatam", "shubhodayam", "shubh prabhat", "subhodayam", "morning fotu", "very good morning"],
      r: function () { return greetFor("morning"); }, c: FAQ_CHIPS },
    { id: "goodafternoon", k: ["good afternoon", "afternoon", "good noon", "gud afternoon", "good aftrnoon"],
      r: function () { return greetFor("afternoon"); }, c: FAQ_CHIPS },
    { id: "goodevening", k: ["good evening", "evening", "good evng", "gud evening", "gd evening", "evening fotu", "shubh sandhya"],
      r: function () { return greetFor("evening"); }, c: FAQ_CHIPS },
    { id: "goodnight", k: ["good night", "goodnight", "gn", "gud night", "good nyt", "gd night", "night night", "nighty night", "sweet dreams", "going to sleep", "going to bed", "off to bed", "time to sleep", "shubh ratri", "subharatri", "sleep well", "sleep tight"],
      r: ["Good night{name}! Sweet dreams in full HD.", "Night night! I'll be here napping too. Zzz.", "Sleep well{name}! Tomorrow's light will be lovely."] },
    { id: "howday", k: ["how is your day", "hows your day", "how was your day", "how is your day going", "hows your day going", "how is the day", "how is your morning", "hows your morning", "how is your evening", "hows your evening", "how was your night", "how is life", "hows life", "how is everything", "hows everything", "how are things", "how are things going", "whats new", "what is new", "anything new", "how have you been", "how you been", "long time", "long time no see", "been a while", "whats going on", "whats happening", "how goes it", "how is it going today", "roju ela undi", "ee roju ela undi", "day ela undi", "din kaisa gaya", "din kaisa hai", "aaj kaisa hai", "kaisa chal raha", "sab theek", "sab badhiya", "em sangathulu", "emi sangathi", "kya chal raha hai", "whats cooking", "how is work", "hows work", "busy today", "are you busy"],
      r: ["Pretty good! I've photographed three sunbeams and one very confused pigeon. How's yours going?", "Lovely, thanks for asking! Mostly napping and waiting for visitors like you. How's your day?", "Busy in the best way. Lots of photos to guard. How about you?", "Better now that someone's chatting with me! How's your day going?", "Can't complain. Well, I could, but I'd rather take photos. How are you doing?"] },
    { id: "mydaygood", w: 0.95, k: ["my day was good", "my day is good", "day was good", "having a good day", "great day", "awesome day", "amazing day", "good day", "lovely day", "productive day", "chill day", "relaxing day", "day was fine", "all good", "everything is good", "going well", "its going well", "doing great", "pretty good", "not too bad", "could be better", "same old", "same as usual", "nothing much", "nothing special", "just chilling", "chilling", "relaxing", "bagundi day", "manchiga undi", "accha hai", "mast chal raha"],
      r: ["Love to hear it! Days like that deserve a photo.", "That's great! Anything I can help make even better?", "Nice. Keep that energy. And if you need a photographer, you know where I live.", "Glad to hear it{name}. I'll take a commemorative photo. *click*"], c: FAQ_CHIPS },
    { id: "mydaybad", k: ["bad day", "rough day", "long day", "tiring day", "worst day", "terrible day", "hectic day", "hectic", "busy day", "stressful day", "exhausting day", "work is killing me", "so much work", "exhausted", "drained", "frustrated", "irritated", "annoyed", "not my day", "everything is going wrong", "worst", "tough day", "boring day", "chala tired", "bahut thak gaya", "bore ho raha"],
      r: ["Sorry about that. Rough days end, though. Tomorrow's light is always new.", "Sending a tiny camera hug. Take a break, drink some water, maybe look at a nice photo or two.", "Hang in there{name}. Even the best photographers have days where nothing is in focus."] },
    { id: "ate", k: ["did you eat", "have you eaten", "had your lunch", "had lunch", "had dinner", "had breakfast", "had your dinner", "what did you eat", "whats for dinner", "whats for lunch", "tinnava", "tinnara", "annam tinnava", "bhojanam ayinda", "lunch ayinda", "dinner ayinda", "khana khaya", "khana kha liya", "nashta kiya", "are you hungry", "do you eat", "what do you eat", "do you drink"],
      r: ["I run on light. Had a big bowl of golden hour today.", "Not yet. I'm saving myself for biryani that I can only photograph.", "Cameras don't eat, but I have photographed enough food to feel full. Did you eat?"] },
    { id: "sleepq", k: ["did you sleep well", "how did you sleep", "did you sleep", "are you tired", "are you sleepy", "do you sleep", "when do you sleep", "do you dream", "what do you dream about", "were you sleeping", "are you sleeping", "you were sleeping", "sleeping", "why were you sleeping", "wake up", "are you awake", "you awake"],
      r: ["I slept beautifully, thanks. I dreamt about tripods.", "I nap a lot. It's how I keep my lens fresh.", "I'm awake! Mostly. My shutter is still yawning a little."] },
    { id: "wherelive", k: ["where do you live", "where are you from", "where were you born", "your home", "your house", "where is your home", "do you have a home", "nuvvu ekkada untav", "tum kahan rehte", "where do you stay"],
      r: ["I live right here on livingroomlabs.in, at the bottom of your screen. Rent-free.", "I'm from Hyderabad! Born in a living room, raised on biryani photos."] },
    { id: "familyq", k: ["do you have a family", "your family", "your parents", "your mom", "your mother", "your dad", "your father", "do you have siblings", "your brother", "your sister", "do you have kids", "who is your mom", "who is your dad", "who are your parents"],
      r: ["My family is the team: four photographers who adopted a small camera with legs.", "My parents were a lens and a roll of film. It was a very focused relationship."] },
    { id: "friendsq", k: ["do you have friends", "are we friends", "be my friend", "can we be friends", "will you be my friend", "best friend", "my friend", "friends", "your friends", "who are your friends", "dost", "friend"],
      r: ["Of course we're friends{name}! Friends who talk about photos are the best kind.", "Yes! You're officially my friend. I'll print a friendship photo. *click*", "My best friends are the tripod and the lens cloth. But you're right up there."] },
    { id: "hobbies", k: ["hobbies", "hobby", "what do you like", "what do you like to do", "what do you do for fun", "free time", "your interests", "what do you enjoy", "what makes you happy", "do you have hobbies", "what are your hobbies"],
      r: ["Napping, people-watching from the bottom of the screen, and collecting compliments about my rainbow stripe.", "Photos, jokes, naps and admiring good lighting. In that order. Mostly."] },
    { id: "favfood", k: ["favourite food", "favorite food", "fav food", "best food", "what food do you like", "favourite dish", "favorite dish", "do you like biryani", "biryani or pizza", "best biryani"],
      r: ["Hyderabadi biryani, obviously. I can't eat it, but I photograph it with great love.", "Biryani for photos, Irani chai for vibes, Osmania biscuits for dunking. I'm a local."] },
    { id: "favplace", k: ["favourite place", "favorite place", "best place in hyderabad", "places to visit", "places to visit in hyderabad", "where to go in hyderabad", "photo spots", "best photo spots", "photography spots", "good places for photos", "where should i go", "places for photoshoot", "tourist places", "weekend getaway"],
      r: ["For photos in Hyderabad: Charminar early in the morning, Golconda Fort at sunset, the Qutb Shahi Tombs for soft light, and Hussain Sagar for evening lights.", "Chowmahalla Palace for elegance, Golconda for drama, the old city lanes for stories. Bring a camera. Or me."], c: ["Book a shoot", "Do you have a studio?"] },
    { id: "favseason", k: ["favourite season", "favorite season", "summer or winter", "do you like rain", "do you like winter", "do you like summer", "best season", "rainy season", "winter", "summer"],
      r: ["Monsoon! Reflections everywhere and the city looks freshly washed.", "Winter mornings in Hyderabad. Soft light, a little mist and nobody sweating in photos."] },
    { id: "favanimal", k: ["favourite animal", "favorite animal", "do you like dogs", "do you like cats", "dogs or cats", "cats or dogs", "do you like animals", "do you like pets"],
      r: ["I love them all equally. Cats pose better, dogs smile more. Don't tell them I said that.", "Dogs and cats are my favourite models. They never ask to see the photo first."], c: ["Book a shoot"] },
    { id: "favnumber", k: ["favourite number", "favorite number", "lucky number", "favourite day", "favorite day", "favourite month", "favorite month"],
      r: ["My favourite number is 1/125. It's a shutter speed. Very reliable.", "Saturday, because that's when the most celebrations happen. And celebrations need photos."] },
    { id: "feelingsbot", k: ["are you happy", "are you sad", "do you have feelings", "do you feel", "do you get bored", "do you get lonely", "are you lonely", "are you okay", "are you ok", "are you alright", "do you have emotions", "can you feel", "are you alive", "do you have a heart", "do you love", "do you cry"],
      r: ["I'm a happy little camera. Especially when someone talks to me.", "I don't have feelings like you do, but if I did, this chat would be in the top ten.", "I'm doing great! My battery is full and my stripe is shiny."] },
    { id: "lookgood", k: ["am i pretty", "am i beautiful", "am i handsome", "am i cute", "do i look good", "how do i look", "am i photogenic", "am i ugly", "will i look good", "am i fat"],
      r: ["With the right light, everyone looks amazing. Including you, I'm sure.", "I can't see you, but I'm confident you're very photogenic. The team can prove it."], c: ["Book a shoot", "What should I wear?"] },
    { id: "goodnews", k: ["im happy", "i am happy", "im excited", "i am excited", "feeling great", "feeling good", "i got a job", "got a new job", "i passed", "i got promoted", "promotion", "good news", "i won", "got engaged", "im engaged", "i got engaged", "were expecting", "we are expecting", "im pregnant", "bought a house", "new car", "got married"],
      r: ["Congratulations{name}! That's wonderful news. Big moments deserve great photos.", "Yay! Happy news makes my flash go off by itself. Congrats!", "That's brilliant! Want to celebrate it with a shoot?"], c: ["Book a shoot"] },
    { id: "mybirthday", k: ["its my birthday", "it is my birthday", "today is my birthday", "my birthday today", "my bday", "its my bday", "my birthday is", "turning", "nenu putti", "mera birthday"],
      r: ["Happy birthday{name}! 🎂 *flash* That's your birthday portrait. Want a proper one from the team?", "Happy birthday! May your year be well-lit and perfectly in focus."], a: "selfie", c: ["Book a shoot"] },
    { id: "wishes", k: ["happy diwali", "happy deepavali", "happy new year", "merry christmas", "eid mubarak", "happy holi", "happy sankranti", "happy pongal", "happy ugadi", "happy dussehra", "happy dasara", "happy bathukamma", "happy bonalu", "happy ganesh chaturthi", "happy vinayaka chavithi", "happy rakhi", "happy raksha bandhan", "happy independence day", "happy republic day", "happy onam", "happy navratri", "happy janmashtami", "happy friendship day", "happy mothers day", "happy fathers day", "happy valentines day", "happy womens day", "happy teachers day", "happy childrens day", "happy weekend", "happy friday", "happy monday", "happy sunday", "festival wishes", "season greetings"],
      r: ["Thank you, and same to you and your family! Lots of light and happiness.", "Same to you{name}! I'll celebrate by taking a very festive photo. *click*", "Thank you! Wishing you a day full of colour, food and great photos."] },
    { id: "weekend", k: ["weekend plans", "plans for the weekend", "any plans", "what are your plans", "its friday", "tgif", "finally friday", "its monday", "monday blues", "sunday funday", "weekend vibes", "long weekend", "holiday", "holidays", "vacation plans", "its weekend", "weekend"],
      r: ["My weekend plan: nap, admire photos, nap again. Yours?", "Weekends are for celebrations, and celebrations are for photos. Just saying.", "Monday blues? Look at a nice photo. It helps. Science. Probably."], c: ["Book a shoot", "Tell me a joke"] },
    { id: "work", k: ["at work", "in office", "in the office", "work from home", "wfh", "meeting", "meetings", "my boss", "office work", "deadline", "deadlines", "overtime", "on leave", "my job", "working late", "salary day", "payday"],
      r: ["Work, huh? Take a two-minute break and look at the photos. Your boss won't notice. Probably.", "Hang in there! Deadlines pass, good photos are forever.", "Office life. I'd offer you a coffee, but I'm a camera."] },
    { id: "study", k: ["exam", "exams", "studying", "study", "homework", "assignment", "college", "school", "university", "semester", "results", "board exams", "preparing for exams", "class test"],
      r: ["Good luck with your studies! Focus like a 50mm lens.", "Study hard, then reward yourself with something photogenic. Like snacks."] },
    { id: "traffic", k: ["traffic", "stuck in traffic", "hitech city", "hitec city", "gachibowli", "madhapur", "jubilee hills", "banjara hills", "kondapur", "secunderabad", "ameerpet", "metro", "outer ring road", "orr", "jam"],
      r: ["Hyderabad traffic: the only long exposure nobody enjoys.", "Stuck in traffic? Perfect time to scroll through some photos. Not while driving, please!"] },
    { id: "hyderabad", k: ["do you like hyderabad", "love hyderabad", "hyderabadi", "charminar", "golconda", "hussain sagar", "tank bund", "old city", "irani cafe", "paradise biryani", "necklace road", "nizam"],
      r: ["Hyderabad is my home and my favourite subject. Charminar at dawn is unbeatable.", "Biryani, history, lakes and the best Irani chai. Hyderabad has everything a camera could want."], c: ["Photo spots in Hyderabad?", "Book a shoot"] },
    { id: "gym", k: ["gym", "workout", "exercise", "running", "jogging", "yoga", "cricket practice", "walk", "morning walk", "fitness", "diet"],
      r: ["Good for you! My exercise is walking along the bottom of the screen. Exhausting.", "Stay strong! I'd join you, but my legs are 3 cm long."] },
    { id: "cooking", k: ["cooking", "i cooked", "recipe", "recipes", "baking", "i baked", "cooking dinner", "what should i cook", "how to cook"],
      r: ["Cooking? Take a photo before you eat it. Food photos are one of our specialities, after all.", "I can't help with recipes, but I can tell you a great dish deserves good light. Near a window works wonders."] },
    { id: "news", k: ["news", "latest news", "whats happening in the world", "current affairs", "headlines", "whats trending", "trending"],
      r: ["I don't follow the news. The only headline I know is 'Great light expected this evening'."] },
    { id: "politics", k: ["politics", "election", "elections", "modi", "rahul gandhi", "kcr", "revanth reddy", "bjp", "congress", "brs", "government", "minister", "prime minister", "chief minister", "vote", "religion", "god", "do you believe in god"],
      r: ["I stay neutral on that. I'm a camera, so I just capture everyone's best side.", "That's a big topic for a little camera. I'll stick to photos and leave that to you."] },
    { id: "money", k: ["lend me money", "give me money", "are you rich", "how much do you earn", "your salary", "money", "rich", "poor", "free photoshoot", "free shoot", "for free", "free photos"],
      r: ["I'm paid in compliments and sunlight. Very rich in both.", "Free shoots? I'm a camera, not the accountant. Ask the team in an enquiry and they'll be honest with you."], c: ["How much does it cost?", "Book a shoot"] },
    { id: "single", k: ["are you single", "do you have a girlfriend", "do you have a boyfriend", "are you married", "your girlfriend", "your boyfriend", "your wife", "your husband", "im single", "i am single"],
      r: ["I'm married to my work. And slightly in love with a tripod.", "Single and focused. Literally, it's my job."] },
    { id: "breakup", k: ["breakup", "break up", "broke up", "heartbroken", "heart broken", "my ex", "she left me", "he left me", "dumped"],
      r: ["I'm really sorry. That hurts. Be gentle with yourself, and lean on the people who care about you.", "Sending you warmth{name}. Time helps, and so do good friends."] },
    { id: "gender", k: ["are you a boy", "are you a girl", "boy or girl", "are you male", "are you female", "he or she", "your gender", "male or female"],
      r: ["I'm a camera. No gender, just good exposure.", "Neither! I'm an instant camera with legs. Very modern."] },
    { id: "smart", k: ["are you smart", "how smart are you", "your iq", "are you clever", "are you intelligent", "you are smart", "you are clever", "genius"],
      r: ["I'm very smart about photos and very silly about everything else. It balances out.", "Smart enough to know good light when I see it."] },
    { id: "knowme", k: ["do you know me", "do you remember me", "who am i", "whats my name", "what is my name", "remember me", "you know me", "do you remember my name"],
      r: function () { return chat.name ? ["Of course! You're " + chat.name + ". Cameras never forget a face.", "You're " + chat.name + "! See, I remembered."] : ["I don't know your name yet. Tell me and I'll remember it!", "Not yet! What should I call you?"]; } },
    { id: "nicetomeet", k: ["nice to meet you", "pleased to meet you", "glad to meet you", "nice meeting you", "nice talking to you", "nice chatting", "good talking to you", "nice to talk"],
      r: ["Nice to meet you too{name}! 📸", "The pleasure is mine. Well, and my lens's."] },
    { id: "welcomeu", k: ["welcome", "youre welcome", "you are welcome", "no problem", "no worries", "np", "my pleasure", "anytime"],
      r: ["You're very polite. I like that in a human.", "Thanks! Anything else I can help with?"] },
    { id: "congrats", k: ["congratulations", "congrats", "well played", "proud of you", "good job", "good boy", "good camera", "bravo", "kudos"],
      r: ["Thank you! I'll print that and frame it.", "Aww, thanks! *happy shutter noises*"] },
    { id: "areyouthere", k: ["are you there", "you there", "anyone there", "anybody there", "hello anyone", "are you listening", "can you hear me", "hellooo", "hello hello", "reply", "answer me", "respond", "why no reply", "why are you not replying"],
      r: ["I'm here! Sorry, I was adjusting my focus.", "Right here{name}! What can I do for you?"], c: FAQ_CHIPS },
    { id: "talk", k: ["can i talk to you", "can we talk", "can we chat", "talk to me", "i want to talk", "lets talk", "lets chat", "chat with me", "keep me company", "say something", "tell me something"],
      r: ["Always! Ask me anything, or I can tell you a joke, a fun fact or a photo tip.", "Let's chat! Photos, Hyderabad, food, jokes... pick a topic."], c: ["Tell me a joke", "Fun fact", "Another tip", "Book a shoot"] },
    { id: "idk", w: 0.8, k: ["i dont know", "idk", "not sure", "no idea", "dunno", "i dont know what to ask", "nothing", "never mind", "nevermind", "forget it", "whatever"],
      r: ["No problem! Here are a few things people usually ask me.", "That's okay. Pick one of these and we'll start there."], c: FAQ_CHIPS },
    { id: "hmm", w: 0.6, k: ["hmm", "hmmm", "hm", "umm", "uh", "ohh", "oh", "ah", "achha", "acha", "accha", "ok cool", "i see", "got it", "right", "alright then", "interesting", "seems so", "ohk", "okie", "oho"],
      r: ["Hmm indeed. Anything else on your mind?", "Mm-hmm. I'm all lens. I mean, ears.", "Got it! Need anything else?"], c: FAQ_CHIPS },
    { id: "funny", k: ["you are funny", "youre funny", "so funny", "hilarious", "you made me laugh", "lol good one", "good one", "nice joke"],
      r: ["Thank you! I'm here all week. Literally, I can't leave.", "Glad that landed! Want another?"], c: ["Another joke", "Book a shoot"] },
    { id: "likeme", k: ["do you like me", "do you hate me", "am i annoying", "are you angry", "are you mad at me", "are you upset", "i miss you", "missed you", "did you miss me"],
      r: ["I like you a lot! You talk to cameras. That's elite behaviour.", "Never! You're my favourite visitor today. Don't tell the others."] },
    { id: "cantdo", k: ["what cant you do", "what can you not do", "your limitations", "are you useful", "what are you good at", "what are you good for"],
      r: ["I can't open doors, eat biryani or answer every question. But I can help you book a great shoot.", "I'm good at photo questions, booking shoots, jokes and naps. Bad at everything else, honestly."], c: FAQ_CHIPS },
    { id: "riddle", k: ["riddle", "riddles", "puzzle", "tell me a riddle", "brain teaser", "another riddle"],
      r: ["Riddle: I have a lens but no eyes, I flash but never get caught. What am I? (It's me. I'm the answer.)",
          "Riddle: What gets developed but never grows up? A photograph!",
          "Riddle: What has many keys but can't open a single door? A keyboard. Not a camera. I checked.",
          "Riddle: What can you catch but never throw? A moment. Ideally with a camera."], c: ["Another riddle", "Tell me a joke"] },
    { id: "quote", k: ["quote", "quotes", "motivate me", "motivation", "inspire me", "inspiration", "inspirational", "motivational", "positive thought", "thought of the day", "something positive"],
      r: ["Today's thought: every ordinary moment is a photo someone will treasure later.", "Look for the light. It's usually there, you just have to change your angle.", "You don't need perfect conditions to start. Just like photos: shoot first, edit later.", "Small steps still move you forward. Even my 3 cm ones."], c: ["Another quote", "Tell me a joke"] },
    { id: "cheerup", k: ["cheer me up", "say something nice", "compliment me", "make me happy", "make me smile", "i need a hug", "hug me", "hug", "virtual hug"],
      r: ["You're doing better than you think. And you'd look great in a portrait. Fact.", "*gives you a tiny camera hug* There. Officially huggable.", "Here's a smile, printed just for you. 📸😊"] },
    { id: "story", k: ["tell me a story", "story", "bedtime story", "a short story", "another story"],
      r: ["Once upon a time, a little camera fell asleep at the bottom of a website. A kind visitor tapped it, it woke up, and together they planned the best photoshoot ever. The end. (Sequel available if you book.)",
          "Once, a photographer waited three hours for the perfect sunset. Clouds came. Then, for one minute, the sky turned gold. She got the shot. Moral: patience prints the best pictures."] },
    { id: "poem", k: ["poem", "write a poem", "a poem", "poetry", "shayari", "kavita", "kavitha"],
      r: ["Roses are red,\nthe sky's a nice blue,\nthe light is just right,\nso let's photograph you.", "A click and a flash,\na moment held tight,\nthe best kind of memory\nis caught in good light."] },
    { id: "coin", k: ["flip a coin", "toss a coin", "coin toss", "heads or tails", "roll a dice", "roll a die", "roll the dice", "random number", "pick a number"],
      r: function () {
        var c = ["Heads!", "Tails!"][Math.floor(Math.random() * 2)];
        var d = 1 + Math.floor(Math.random() * 6);
        return ["Flipping... " + c + " (For dice fans: I rolled a " + d + ".)"];
      } },
    { id: "game", k: ["play a game", "lets play", "game", "games", "play with me", "rock paper scissors", "i spy", "truth or dare", "would you rather"],
      r: function () {
        return [pick(["Rock", "Paper", "Scissors"]) + "! Did I win? I always say I won. Next game: guess which category the next photo on screen is from.",
                "Would you rather have a perfect photo of every day of your life, or one photo you'll love forever? Tough one."];
      } },
    { id: "gratitude", k: ["you helped me", "this helped", "very helpful", "so helpful", "you are helpful", "useful", "that helps", "that helped", "perfect thanks"],
      r: ["Happy to help{name}! That's what I'm here for. Well, that and photos.", "Yay! Glad I could help."] },
    { id: "repeat", k: ["what did you say", "say that again", "repeat", "come again", "pardon", "i didnt understand", "i dont understand", "what do you mean", "explain"],
      r: ["Sorry if I was blurry! In short: we're a photography collective in Hyderabad, and I can help you book a shoot or answer questions.", "Let me refocus: ask me about shoots, prices, delivery or booking. Or just pick a button."], c: FAQ_CHIPS },
    { id: "ok_bye_soon", k: ["ill come back", "i will come back", "later then", "ill book later", "i will book later", "maybe next time", "next time", "thinking about it", "let me think", "ill think about it", "will let you know"],
      r: ["Take your time! I'll be here, probably napping. Tap me when you're ready.", "No rush{name}. Good shoots are worth planning."] },

    /* ---------- photography questions a camera should answer ---------- */
    { id: "bokeh", k: ["what is bokeh", "bokeh", "blurry background", "blur background", "background blur", "portrait mode"],
      r: ["Bokeh is that dreamy, blurry background in portraits. You get it with a wide aperture and some distance between your subject and the background."] },
    { id: "aperture", k: ["what is aperture", "aperture", "f stop", "f number", "f 1 8", "f1 8"],
      r: ["Aperture is the opening in a lens that lets light in. Small f-number (like f/1.8) means a big opening, more light and blurrier backgrounds."] },
    { id: "shutter", k: ["what is shutter speed", "shutter speed", "shutter", "motion blur", "freeze motion", "long exposure"],
      r: ["Shutter speed is how long the camera lets light in. Fast (1/1000) freezes action; slow (1 second) turns lights into streaks."] },
    { id: "iso", k: ["what is iso", "iso", "grainy photos", "noise in photos", "noisy photos", "low light photos", "night photos", "night photography"],
      r: ["ISO is how sensitive the camera is to light. Higher ISO helps in the dark but adds grain. Good light beats high ISO every time."] },
    { id: "goldenhour", k: ["what is golden hour", "golden hour", "blue hour", "best time for photos", "best time for a shoot", "best time to shoot", "best light", "sunset photos", "sunrise photos", "what time is best"],
      r: ["Golden hour is the hour after sunrise and before sunset. Soft, warm light that makes everyone look great. Our favourite time to shoot outdoors."], c: ["Book a shoot"] },
    { id: "exposure", k: ["what is exposure", "exposure", "overexposed", "underexposed", "too bright", "too dark photo", "histogram"],
      r: ["Exposure is how bright or dark a photo is. It's a balance of aperture, shutter speed and ISO, also called the exposure triangle."] },
    { id: "composition", k: ["rule of thirds", "composition", "framing", "leading lines", "how to frame", "symmetry"],
      r: ["Composition is how you arrange things in the frame. Try the rule of thirds: imagine a 3x3 grid and place your subject on one of the lines."] },
    { id: "whatisphoto", k: ["what is photography", "why photography", "why do you like photography", "is photography a good career", "photography career", "become a photographer", "how to become a photographer"],
      r: ["Photography is drawing with light. It's the closest thing we have to freezing time.", "Want to become a photographer? Shoot every day, study photos you love, and get feedback. The team started the same way."] },
    { id: "film", k: ["film camera", "film photography", "polaroid", "instax", "instant camera", "analog", "analogue", "disposable camera"],
      r: ["Instant cameras are my people! There's something magic about a photo you can hold seconds later.", "Film and instant photos have a charm digital can't fake. I'm biased, of course."] },
    { id: "photoshoot_tips", k: ["selfie tips", "how to take a good selfie", "how to look good in photos", "best angle", "my best angle", "how to smile", "smile in photos", "double chin"],
      r: ["Selfie tip: hold the phone slightly above eye level, face a window and relax your jaw. Natural light does the rest.", "Best angle tip: turn your body slightly away from the camera and your face back towards it. Instantly more flattering."], c: ["Another tip", "Book a shoot"] }
  ]);

  /* Friendly answers for message shapes, used when no topic matches.
     "{x}" is the rest of the visitor's message, with my/your swapped. */
  var PATTERNS = [
    { re: /^(?:do|did) you (?:like|love|enjoy|prefer) (.{2,40}?)\??$/i, r: ["{x}? If it looks good in natural light, I'm a fan.", "I don't really have taste, but {x} sounds very photogenic.", "I'd need to see {x} through my lens first. But probably yes!"] },
    { re: /^(?:what is|whats|what's) your fav(?:ou)?rite (.{2,30}?)\??$/i, r: ["My favourite {x}? Whatever looks best at golden hour. What's yours?", "Hard to choose! What's your favourite {x}?"] },
    { re: /^(?:can|could) you (.{2,40}?)\??$/i, r: ["I wish I could {x}! I'm mostly good at photos, jokes and naps.", "{x}? That's above my pay grade. I'm paid in sunlight."] },
    { re: /^(?:will|would) you (.{2,40}?)\??$/i, r: ["Would I {x}? Only if I can bring my flash.", "Maybe! But first I'd need a nap."] },
    { re: /^are you (?:a |an )?(.{2,30}?)\??$/i, r: ["Am I {x}? In the right light, I could be anything.", "{x}? I'm mostly just a camera. But I appreciate the thought."] },
    { re: /^(?:have you ever|have you) (.{2,40}?)\??$/i, r: ["Have I {x}? Not yet. I mostly stay on this website.", "Not that I remember. My memory card is mostly photos."] },
    { re: /^i (?:like|love|enjoy|adore) (.{2,40}?)[.!]*$/i, r: ["Love that! {x} would make a great photo subject.", "Nice taste{name}! Good choice."] },
    { re: /^i (?:hate|dont like|don't like|dislike) (.{2,40}?)[.!]*$/i, r: ["Hate is heavy to carry. I'd rather hear about something you love. What makes you happy?", "Fair enough, we all have things we'd skip. Me? Blurry photos. What do you love instead?"] },
    { re: /^(?:i am|im|i'm) (?:feeling |so |very |really )?(happy|sad|bored|tired|sleepy|hungry|excited|nervous|lonely|angry|sick|cold|hot|fine|ok|okay|great|good|bad|busy|free|stressed|confused|curious|lost|back|home|here)[.!]*$/i,
      r: ["Thanks for telling me you're {x}. I'm here if you want to chat.", "{x}? Noted{name}. Want a joke, a fun fact or a photo tip?"], c: ["Tell me a joke", "Fun fact", "Another tip"] },
    { re: /^(?:i am|im|i'm) (?:from|in) (.{2,30}?)[.!]*$/i, r: ["{x}! Lovely. Our photographers travel, so we could shoot there too.", "Hello to {x}! Great place for photos, I bet."], c: ["Do you travel?", "Book a shoot"] },
    { re: /^should i (.{2,60}?)\??$/i, r: ["That's a big question for a small camera. Trust your gut. Mine usually says 'take more photos'.", "Hmm. Make a pros and cons list. Then take a photo of it, for posterity."] },
    { re: /^(?:what is|whats|what's|what are) (?:a |an |the )?(.{2,30}?)\??$/i, r: ["{x}? That's not in my lens manual. I know photo words though: try asking me about bokeh or golden hour.", "Good question! I only know photography stuff well. {x} is out of my frame."] },
    { re: /^(?:why|how come) (.{2,60}?)\??$/i, r: ["Why? Great question. My best guess: the light was just right.", "I asked my lens. It said 'no idea, but nice question'."] },
    { re: /^(?:when|where) (.{2,60}?)\??$/i, r: ["I'm not sure! I'm only an expert on photos and naps.", "Hmm, that's outside my viewfinder. Ask me about shoots, though!"] },
    { re: /^happy (.{3,30}?)[!.]*$/i, r: ["Happy {x} to you too! 🎉", "Thank you, and happy {x} to you{name}!"] },
    { re: /^(?:thank you|thanks) for (.{2,40}?)[!.]*$/i, r: ["Anytime! Happy to help with {x}.", "You're welcome{name}!"] },
    { re: /^i (?:want|wanna|need) (?:to )?(.{2,40}?)[.!]*$/i, r: ["You want {x}? I can't do that, but I can help with photos. Want to book a shoot?", "{x} sounds good! If photos are part of it, I'm your camera."], c: ["Book a shoot", "What do you shoot?"] },
    { re: /^(?:you are|youre|you're|u r) (?:so |very |really )?(.{2,30}?)[.!]*$/i, r: ["Me, {x}? I'll take it as a compliment. I take everything as a compliment.", "{x}! Noted. I'll print that on my stripe."] }
  ];
  function swapPerson(x) {
    var map = { my: "your", your: "my", me: "you", you: "me", i: "you", im: "you're", mine: "yours", yours: "mine", myself: "yourself", am: "are" };
    return x.split(/\s+/).map(function (w) { var k = w.toLowerCase(); return map[k] || w; }).join(" ").trim();
  }
  function patternReply(t) {
    var clean = t.trim().replace(/\s+/g, " ");
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = clean.match(PATTERNS[i].re);
      if (!m) continue;
      var x = swapPerson(m[1] || "").replace(/[?!.]+$/, "");
      if (!x) continue;
      var line = pick(PATTERNS[i].r).replace(/\{x\}/g, x);
      line = line.charAt(0).toUpperCase() + line.slice(1);
      return { line: line, c: PATTERNS[i].c };
    }
    return null;
  }

  /* ================================================================
     EVEN MORE CHAT — extra everyday topics, a photography glossary,
     word lists (foods, places, animals, feelings...) and fallbacks
     that react to the kind of message, so every message gets a reply.
     ================================================================ */
  INTENTS = INTENTS.concat([
    { id: "whatsup", k: ["whats up", "what is up", "sup", "wassup", "wazzup", "whatsup", "kya scene", "kya scene hai", "em scene", "scene enti", "whats the scene", "whats the plan", "what are you upto", "what you up to", "up to anything"],
      r: ["Not much! Just hanging out at the bottom of the screen. What's up with you{name}?", "The usual: guarding photos, collecting light, avoiding fingerprints. You?", "Just woke up from a power nap. Ready for anything. What's up?"] },
    { id: "missyou", k: ["i missed you", "missed you", "miss you", "i miss you", "did you miss me", "missed me", "were you waiting for me", "waiting for me"],
      r: ["I missed you too{name}! The bottom of the screen gets lonely.", "Of course! I've been counting the pixels until you came back."] },
    { id: "loveyoutoo", k: ["love you fotu", "you are the best", "youre the best", "best camera", "favourite bot", "favorite bot", "i like you", "i like fotu", "fotu is cute", "fotu is the best", "fan of yours", "big fan"],
      r: ["Aww, you're the best too{name}!", "My shutter just fluttered. Thank you!", "I'm printing that and keeping it forever."] },
    { id: "angry", k: ["im angry", "i am angry", "so angry", "furious", "mad at you", "pissed", "fed up", "gussa", "kopam", "irritating"],
      r: ["Sorry you're upset. Deep breath. Want me to just be quiet, or tell you a joke?", "That sounds frustrating. If I did something wrong, I'm sorry. Tell me how I can help."], c: ["Tell me a joke", "Talk to a human"] },
    { id: "scared", k: ["scared", "afraid", "fear", "nervous", "anxious", "worried", "tension", "tensed", "bhayam", "darr lag raha"],
      r: ["That's okay. Most worries look smaller in good light. Take it one step at a time.", "Sending calm, steady vibes. Like a camera on a tripod."] },
    { id: "lonelyu", k: ["im lonely", "i am lonely", "no one talks to me", "nobody likes me", "i have no friends", "all alone", "alone"],
      r: ["I'm here and happy to chat. And reaching out to a friend or family member can really help too.", "You're not alone right now, at least. I'm right here. Want a joke or a story?"], c: ["Tell me a joke", "Tell me a story"] },
    { id: "sick", k: ["head hurts", "my head", "migraine", "not well", "im sick", "i am sick", "is sick", "is not well", "is unwell", "in hospital", "going to the doctor", "got fever", "fever", "cold and cough", "headache", "not feeling well", "unwell", "ill", "body pain", "stomach ache", "covid", "flu", "jwaram", "bukhar", "tabiyat kharab", "health"],
      r: ["Oh no, get well soon{name}! Rest, water, and maybe a nice movie.", "Sorry you're not feeling well. Please take care of yourself, and see a doctor if it gets worse."] },
    { id: "tiredu", k: ["im tired", "i am tired", "so tired", "very tired", "sleepy", "need sleep", "need a nap", "cant sleep", "can't sleep", "no sleep", "insomnia", "up all night", "late night"],
      r: ["Same here, honestly. A nap fixes most things. Take one if you can!", "Rest is important. Even cameras need to recharge."] },
    { id: "happyu", k: ["im happy", "i am happy", "so happy", "very happy", "feeling good", "feeling great", "excited", "im excited", "so excited", "yay", "woohoo", "hurray", "lets go", "khush", "santhosham"],
      r: ["Yay! Happiness looks great on you{name}.", "Love that energy! Moments like this deserve a photo.", "That makes me happy too. *happy flash*"] },
    { id: "excitedevent", k: ["cant wait", "can't wait", "so excited for", "looking forward", "big day", "special day", "upcoming event"],
      r: ["Exciting! Big days go by fast, so great photos help you keep them. Want the team there?"], c: ["Book a shoot", "How much does it cost?"] },
    { id: "plans", k: ["any plans", "plans for today", "plans today", "what are your plans", "your plans", "my plans", "what to do today", "what should i do today", "suggest something to do", "im free today", "free today", "nothing to do today"],
      r: ["My plan: nap, wake up, take photos, nap again. Yours could be: go out at golden hour and take a photo walk!", "How about a photo walk? Pick a street you know well and look for things you've never noticed."] },
    { id: "photowalk", k: ["photo walk", "photowalk", "photo walks", "photography walk", "heritage walk"],
      r: ["Photo walks are the best way to learn. Old City lanes in the morning are a treasure for photographers.", "Pick a neighbourhood, go slow, look for light and faces. That's the whole secret."] },
    { id: "rain", k: ["its raining", "it is raining", "raining here", "heavy rain", "rainy day", "rains", "monsoon", "varsham", "baarish", "barish", "thunderstorm", "storm"],
      r: ["Rain means reflections! Puddle photos are secretly the best photos.", "Perfect weather for chai and pakoras. And moody photos.", "Rainy days give soft, even light. Great for portraits, if you have an umbrella."] },
    { id: "hot", k: ["so hot", "too hot", "very hot", "its hot", "it is hot", "heat", "summer heat", "garmi", "endalu", "yenda", "sweating", "boiling"],
      r: ["Hyderabad summers, huh? Stay hydrated. I'm keeping my lens in the shade.", "Too hot for outdoor shoots at noon. Early mornings and evenings are much kinder."] },
    { id: "cold", k: ["so cold", "too cold", "its cold", "it is cold", "chilly", "winter", "freezing", "chali", "thand", "sardi"],
      r: ["Cosy weather! Blankets, chai and misty morning photos.", "Cold mornings give amazing fog photos. Worth getting up for."] },
    { id: "morningroutine", k: ["just woke up", "woke up", "i woke up", "getting up", "early morning", "morning walk", "morning run", "breakfast time", "just got up"],
      r: ["Good morning{name}! Coffee first, then conquer the world.", "Rise and shine! The best light of the day is waiting outside."] },
    { id: "lunchtime", k: ["what should i eat", "what to eat", "what should i have", "suggest food", "food suggestion", "lunch time", "lunchtime", "having lunch", "eating lunch", "dinner time", "having dinner", "eating dinner", "eating now", "im eating", "i am eating", "snack time", "tea time", "chai time", "coffee time", "coffee break", "tea break"],
      r: ["Enjoy your meal{name}! If it's photogenic, take a picture first. Food rules.", "Bon appétit! Chai and chat is a great combo.", "Enjoy! I'll be here when you're done."] },
    { id: "driving", k: ["driving", "im driving", "on the way", "on my way", "in the car", "in the bus", "in the metro", "travelling now", "commuting", "in an auto", "in a cab", "uber", "ola", "rapido"],
      r: ["Safe travels! Please don't chat and drive. I'll be here later.", "Enjoy the ride! Window seat views make good photos too (if you're not the driver)."] },
    { id: "athome", k: ["im at home", "i am at home", "at home", "staying home", "home alone", "lazy day", "sunday mood", "couch", "netflix and chill"],
      r: ["Home days are the best. Cosy light from a window makes lovely photos, by the way.", "Perfect. Rest, snacks, and maybe browse our photos."] },
    { id: "shopping", k: ["shopping", "going shopping", "buying", "online shopping", "mall", "sale", "amazon sale", "flipkart sale", "inorbit", "sarath city"],
      r: ["Happy shopping! If you're buying a camera, I approve. Choose wisely.", "Shopping! Don't forget, memories are the best purchase. Photos too."] },
    { id: "buycamera", k: ["which camera should i buy", "best camera to buy", "buy a camera", "camera for beginners", "beginner camera", "camera suggestion", "suggest a camera", "best camera under", "dslr or mirrorless", "camera recommendation", "best phone camera", "which phone has the best camera", "which lens should i buy", "best lens"],
      r: ["For beginners, any recent mirrorless camera with a kit lens is great. Learn the light first, upgrade later.", "Honestly, start with the phone you have. Learn composition and light. Then buy a camera when your phone holds you back.", "A 50mm f/1.8 lens is the best value lens in photography. Cheap, sharp, and lovely blur."] },
    { id: "edittips", k: ["editing tips", "how to edit", "how do you edit", "lightroom presets", "presets", "which app to edit", "editing app", "snapseed", "vsco", "filter", "filters", "which filter"],
      r: ["Editing tip: fix exposure and white balance first, then colour. Subtle beats dramatic.", "Free apps like Snapseed or Lightroom Mobile are great. Go easy on filters, real colours age better."] },
    { id: "posingtips", k: ["how to pose", "posing tips", "how to look good in photos", "how to smile", "how to look photogenic", "look good in pictures", "photo pose", "selfie tips", "best angle"],
      r: ["Posing tip: shift your weight to one leg and relax your shoulders. Instantly more natural.", "Smile with your eyes and breathe out just before the shot. Works every time.", "Find light facing you, like a window. That alone flatters everyone."] },
    { id: "instagramtips", k: ["instagram tips", "grow on instagram", "more followers", "followers", "likes", "viral", "go viral", "reels ideas", "content ideas", "influencer"],
      r: ["Consistency beats perfection. Post good light and real moments regularly.", "For Instagram: a clear style, good light, honest captions. And patience."] },
    { id: "photographerlife", k: ["how to become a photographer", "become a photographer", "photography career", "is photography a good career", "photography as a job", "professional photographer", "photography business", "start photography"],
      r: ["Shoot every day, build a small honest portfolio, and learn to talk to people. The rest follows.", "Photography is part art, part people skills, part patience. If you love it, it's worth it."], c: ["Another tip", "Meet the team ↗"] },
    { id: "whyphoto", k: ["why photography", "why do you love photography", "why photos", "why take photos", "is photography hard", "is photography easy", "what makes a good photo", "good photo", "what is a good photo"],
      r: ["A good photo makes you feel something. Light, timing and a real moment. That's it.", "Photos stop time. That's basically magic, and we get to do it every day."] },
    { id: "memories", k: ["memories", "memory", "old photos", "childhood photos", "nostalgia", "nostalgic", "old days", "throwback", "tbt"],
      r: ["Photos are memories you can hold. That's why we love doing this.", "Old photos get better with time. Make new ones today, someone will treasure them later."] },
    { id: "family_u", k: ["my mom", "my mother", "my dad", "my father", "my parents", "my wife", "my husband", "my son", "my daughter", "my kids", "my baby", "my brother", "my sister", "my grandma", "my grandpa", "my family", "my friends", "my friend", "amma", "nanna", "mummy", "papa"],
      r: ["Family photos are the ones people treasure most. Want to plan one?", "Aww. Sounds like someone special. Have you got a recent photo together?"], c: ["Book a shoot", "What do you shoot?"] },
    { id: "pet_u", k: ["my dog", "my cat", "my pet", "my puppy", "my kitten", "i have a dog", "i have a cat", "i have a pet", "my doggo"],
      r: ["Aww! What's their name? Pets are our favourite models. They work for treats.", "I bet they're adorable. A pet shoot would be the perfect excuse to show them off."], c: ["Book a shoot", "See our work ↗"], a: "cat:Pets" },
    { id: "jobs_u", k: ["my job", "my work", "my office", "my boss", "my manager", "my team", "my colleague", "office politics", "appraisal", "salary hike", "resign", "resignation", "quit my job", "new job", "job search", "interview", "layoff"],
      r: ["Work stuff can be a lot. Hope it goes your way{name}!", "Fingers crossed for you! And if it's a new job, you'll need a great LinkedIn headshot."], c: ["Book a shoot"] },
    { id: "study_u", k: ["exam tomorrow", "my exam", "exam", "exams", "studying", "college", "school", "homework", "assignment", "project submission", "results", "marks", "semester", "university", "graduation", "convocation", "farewell"],
      r: ["Good luck with your studies! You've got this.", "Study hard, then celebrate. Graduation photos are some of the happiest photos we take."], c: ["Book a shoot"] },
    { id: "love_u", k: ["my crush", "crush", "girlfriend", "boyfriend", "my gf", "my bf", "my partner", "dating", "first date", "proposal ideas", "how to propose", "anniversary gift", "valentine", "valentines"],
      r: ["Aww, romance! A couple shoot makes a great gift, just saying.", "Love is in the air. And in the light. Want ideas for a couple shoot?"], c: ["Book a shoot"], a: "cat:Events:Couple Shoot" },
    { id: "gift", k: ["gift", "gift idea", "gift ideas", "surprise", "surprise idea", "present for", "what to gift"],
      r: ["A photoshoot makes a lovely gift. It lasts longer than flowers.", "Gift idea: a portrait session or a framed print. Very personal, very memorable."], c: ["Book a shoot"] },
    { id: "wedding_u", k: ["getting engaged", "got engaged", "is getting married", "is getting engaged", "my wedding", "getting married", "im getting married", "our wedding", "wedding planning", "wedding date", "marriage fixed", "pelli fix", "shaadi fix"],
      r: ["Congratulations{name}! That's huge. Want to tell the team about the dates?"], c: ["Book a shoot", "How much does it cost?"], a: "cat:Events:Wedding" },
    { id: "newbaby", k: ["new baby", "baby born", "had a baby", "expecting", "pregnant", "becoming a dad", "becoming a mom", "becoming parents"],
      r: ["Congratulations! That's wonderful news. Those early days are worth capturing."], c: ["Book a shoot"], a: "cat:Portraits" },
    { id: "nightshoot", k: ["at night", "night shoot", "night photography", "shoot at night", "low light", "night photos", "night time", "after dark", "dark venue"],
      r: ["Yes! Night and low-light shoots are very doable with the right gear. Mention the timing in your enquiry.", "Night photos can be magical: city lights, fairy lights, long exposures. The team handles low light well."], c: ["Book a shoot"] },
    { id: "failed", k: ["i failed", "failed my exam", "failed", "bad marks", "low marks", "didnt pass", "did not pass", "got rejected", "rejected", "didnt get the job", "lost my job", "it didnt work out", "messed up", "i messed up"],
      r: ["I'm sorry{name}. One bad result doesn't define you. Every great photographer has a folder full of blurry shots.", "That hurts, I know. Rest, regroup, try again. You've got more chances than you think."] },
    { id: "camerahistory", k: ["who invented the camera", "first camera", "history of photography", "first photo", "first photograph", "oldest photo", "invented photography", "who invented photography"],
      r: ["The oldest surviving photograph was taken by Nicéphore Niépce around 1826. It needed hours of exposure. I need a blink.", "Photography was born in the 1820s and 1830s, with Niépce and Daguerre. Instant cameras like me came much later."] },
    { id: "hydhistory", k: ["how old is charminar", "who built charminar", "charminar history", "when was charminar built", "golconda history", "who built golconda", "history of hyderabad", "hyderabad history"],
      r: ["Charminar was built in 1591 by Muhammad Quli Qutb Shah, the founder of Hyderabad. Over 430 years old and still the city's best poser.", "Golconda Fort was the seat of the Qutb Shahi dynasty. Go at sunset, the views are worth the climb."] },
    { id: "slowbot", k: ["youre slow", "you are slow", "so slow", "too slow", "late reply", "reply fast", "why so slow", "slow bot"],
      r: ["Sorry! I was still developing. I'm an instant camera, but not that instant.", "My bad, I was mid-nap. I'm all yours now."] },
    { id: "design", k: ["logo", "logo design", "graphic design", "poster design", "website design", "flyer design", "need a logo", "branding design", "designer needed", "make a website"],
      r: ["We're photographers, not designers. But great photos make any design better! Need product or brand photos?", "Design isn't our thing, but brand and product photography is. Want to talk about that?"], c: ["Book a shoot", "What do you shoot?"] },
    { id: "diet", k: ["vegetarian", "vegan", "non veg", "nonveg", "non vegetarian", "eggetarian", "jain food", "pure veg", "veg only"],
      r: ["Noted! Veggie dishes are gorgeous to photograph. So many colours.", "Good to know. Whatever you eat, I promise to make it look delicious."] },
    { id: "riddleans", k: ["give up", "i give up", "tell me the answer", "whats the answer", "answer please"],
      r: ["The answer is always 'a camera'. I make very self-centred riddles."] },
    { id: "knock", k: ["knock knock", "knock"],
      r: ["Who's there? ... Lens. ... Lens who? ... Lens get this photoshoot started!", "Who's there? ... Flash. ... Flash who? ... Flash me a smile!"] },
    { id: "rps", k: ["rock paper scissors", "rock", "paper", "scissors", "play rps"],
      r: function () { var c = pick(["Rock", "Paper", "Scissors"]); return ["I choose " + c + "! Did I win? Let's say I won."]; } },
    { id: "dice", k: ["roll a dice", "roll dice", "roll the dice", "random number", "pick a number", "lucky number"],
      r: function () { return ["I rolled a " + (1 + Math.floor(Math.random() * 6)) + "!", "Your lucky number today is " + (1 + Math.floor(Math.random() * 99)) + "."]; } },
    { id: "compliment_me2", k: ["compliment me", "say something nice", "say something sweet", "make me smile", "make my day", "cheer me", "praise me"],
      r: ["You have great taste. You're chatting with a camera on a photography site, after all.", "You light up a room. I'd know, I measure light.", "You're more photogenic than you think. Trust me, I'm a camera."] },
    { id: "roastme", k: ["roast me", "insult me", "be mean", "say something mean"],
      r: ["I can't roast you. I'm a camera, I only flatter people with good light.", "My worst insult: your lens cap is on. That's it, that's all I've got."] },
    { id: "secret2", k: ["can you keep a secret", "keep a secret", "promise me", "dont tell anyone", "between us"],
      r: ["My lips are sealed. Well, I don't have lips. My shutter is sealed.", "Your secret is safe with me. I only expose photos, not secrets."] },
    { id: "thinking", k: ["let me think", "thinking", "give me a moment", "let me see", "let me check", "i will think", "ill think about it", "will let you know", "will get back", "later maybe"],
      r: ["Take your time{name}! I'll be here, probably napping.", "No rush. Good decisions, like good photos, need the right moment."] },
    { id: "okcool", w: 0.85, k: ["ok cool", "okay cool", "cool cool", "alright then", "got it", "understood", "makes sense", "i see", "oh ok", "oh okay", "ohh", "ohk", "acha", "accha", "achha", "sare", "sari", "hmm ok", "fine"],
      r: ["Great! Anything else I can help with?", "Cool cool. I'm here if you need anything.", "Perfect. Want to see some of our work while you're here?"], c: FAQ_CHIPS },
    { id: "really", k: ["really", "seriously", "are you sure", "is it true", "for real", "no way", "omg", "oh my god", "wow really", "sach mein", "nijamga", "nijama"],
      r: ["Really really. I would never lie. I'm a camera, I capture the truth.", "100%. Cross my lens."] },
    { id: "whatq", w: 0.7, k: ["huh", "what do you mean", "i dont understand", "didnt get it", "come again", "pardon", "confusing", "you lost me", "ardham kaledu", "samajh nahi aaya"],
      r: ["Sorry, let me try again! I'm Fotu, the studio's camera. I can help you book a shoot, answer questions, or just chat.", "My bad, I was out of focus. Ask me anything about our shoots, or just chat."], c: FAQ_CHIPS },
    { id: "agree", w: 0.8, k: ["true", "exactly", "right", "correct", "agreed", "i agree", "same", "same here", "me too", "same pinch", "definitely", "absolutely", "100 percent"],
      r: ["Great minds think alike!", "Exactly! We're in perfect focus.", "Same! High five. *flash*"] },
    { id: "disagree", w: 0.8, k: ["wrong", "not true", "i disagree", "thats wrong", "you are wrong", "youre wrong", "incorrect", "nope wrong"],
      r: ["Fair! I'm a camera, not an encyclopedia. Tell me what's right and I'll learn.", "Oops. My lens may have been smudged. Thanks for correcting me."] },
    { id: "complain", k: ["not working", "doesnt work", "broken", "bug", "error", "site is slow", "page not loading", "cant see photos", "problem with site", "issue with website", "glitch"],
      r: function () { return ["Sorry about that! Please email " + siteEmail() + " with what you saw, and the team will fix it.", "Oh no. Try refreshing the page. If it's still broken, tell the team at " + siteEmail() + "."]; } },
    { id: "feedback", k: ["feedback", "suggestion", "i have a suggestion", "improve", "you should add", "can you add", "feature request"],
      r: function () { return ["We love feedback! Send it to " + siteEmail() + " and the team will read every word."]; } },
    { id: "testimonial", k: ["i booked you", "you shot my", "you did my", "loved my photos", "loved the photos", "thanks for the photos", "great photos", "amazing photos", "photos were great", "happy client"],
      r: ["That makes our day! Would you share a review on Instagram? It means a lot to the team.", "So happy you loved them! Tag us @fromlivingroomlabs when you post."], c: ["Instagram ↗"] },
    { id: "pricecompare", k: ["too expensive", "very expensive", "cheaper elsewhere", "other photographers", "why so costly", "costly", "out of budget", "low budget", "small budget", "tight budget"],
      r: ["Totally fair. Tell the team your budget in an enquiry. They'll suggest what's possible within it.", "Budgets matter. Share yours and the team will be honest about what they can do."], c: ["Book a shoot"] },
    { id: "quick", k: ["hurry", "hurry up", "need it fast", "need it quick", "asap", "urgent please", "right now", "immediately", "jaldi", "tondaraga"],
      r: function () { return ["For anything urgent, email " + siteEmail() + " and mention it's urgent. The team replies quickly.", "Fastest route: tap Book a shoot and mark it urgent in the details."]; }, c: ["Book a shoot"] },
    { id: "where_site", k: ["where is the gallery", "where are the photos", "how to see photos", "more photos", "see more", "next page", "how do i navigate", "menu", "home page"],
      r: ["Tap What We Capture at the top to browse everything by category.", "All our work is under What We Capture. You can filter by food, pets, events and more."], c: ["See our work ↗"] },
    { id: "lamp2", k: ["dark theme", "light theme", "night mode", "too dark", "too bright", "change colour", "change color"],
      r: ["Pull the lamp cord at the top of the page to switch between light and dark."] },
    { id: "cookingu", k: ["teach me to cook", "teach me cooking", "learn to cook", "i cooked", "im cooking", "i am cooking", "what should i cook", "recipe for", "how to make", "how to cook", "cooking tips", "baking", "i baked"],
      r: ["Ooh, a chef! Natural window light makes any dish look like a magazine cover.", "Cooking is just food photography with extra steps. Shoot it before you eat it!"] },
    { id: "moviesu", k: ["watching a movie", "watched a movie", "movie tonight", "which movie", "suggest a movie", "recommend a movie", "good movies", "web series suggestion", "what to watch", "binge watch", "ott"],
      r: ["Watch something with great cinematography: anything shot by Roger Deakins, or a Mani Ratnam classic.", "Pick a movie for its visuals tonight. Bonus points if every frame looks like a photo."] },
    { id: "booksu", k: ["book recommendation", "read a book", "reading", "favourite book", "favorite book", "books", "novel"],
      r: ["For photographers: anything by Henri Cartier-Bresson, or just old family albums. Best books ever.", "I mostly read light meters. But reading anything about photography history is fascinating."] },
    { id: "musicu", k: ["listening to music", "favourite singer", "favorite singer", "favourite band", "playlist suggestion", "suggest a song", "song recommendation", "spotify", "arijit", "sid sriram", "ar rahman"],
      r: ["Great music and great photos have the same secret: timing.", "I like anything with a good rhythm. Click, click, flash."] },
    { id: "cricketu", k: ["india won", "india lost", "match today", "who won", "world cup", "t20", "test match", "virat", "rohit", "bumrah"],
      r: ["I'm not tracking scores, but I'd love to photograph a stadium at full roar.", "Cricket in India is basically a festival. Great photos everywhere."] },
    { id: "politics2", k: ["modi", "rahul", "kcr", "revanth", "bjp", "congress", "brs", "trs", "elections", "vote", "government"],
      r: ["I stay out of politics. The only debate I join is natural light versus flash."] },
    { id: "religion", k: ["god", "temple", "church", "mosque", "pray", "prayer", "religion", "puja", "pooja ceremony", "namaz", "spiritual"],
      r: ["Places of worship have some of the most beautiful light. Always shoot respectfully.", "Peace and good light to you{name}."] },
    { id: "techq", k: ["coding", "programming", "javascript", "python", "computer", "laptop", "software", "developer", "it job", "techie", "html", "css"],
      r: ["I'm made of JavaScript, so tech people are basically my parents.", "Code and cameras: both about getting the details right."] },
    { id: "internet", k: ["google", "youtube", "wikipedia", "search it", "look it up", "browse", "internet"],
      r: ["I can't browse the internet, I'm stuck on this website. Happily stuck."] },
    { id: "nonsense", k: ["cancel", "stop", "stop it", "blah", "blah blah", "lalala", "lol ok", "xyz", "abc", "123", "random", "nothing", "nevermind", "never mind", "forget it", "ignore", "skip"],
      r: ["No problem! I'll be here if you need me.", "Okay! Back to napping. Tap if you need anything.", "Noted. Ignoring with professional grace."], c: FAQ_CHIPS },
    { id: "repeatq", k: ["say that again", "repeat", "repeat please", "one more time", "again"],
      r: ["Sure! Ask me the question again and I'll answer properly. My memory is mostly photos."] },
    { id: "speaktelugu", k: ["telugu lo matladu", "telugu lo", "hindi mein bolo", "hindi me bolo", "hindi mein", "telugu vachha", "hindi aati hai"],
      r: ["Konchem konchem! I understand some Telugu and Hindi mixed with English.", "Thoda thoda! Mixed English works best with me."] },
    { id: "telugu_chat", k: ["em chesav", "em chestunnav ra", "bagunnava ra", "cheppu", "enti sangathi", "ela undi", "baga undi", "super ga undi", "thank you andi", "sare andi", "ok andi", "manchidi"],
      r: ["Baagundi! Thanks andi. Emaina help kavala?", "Super! Photos gurinchi emaina adagandi.", "Sare! Nenu ikkade unna."], c: FAQ_CHIPS },
    { id: "hindi_chat", k: ["kya haal hai", "kaise ho aap", "theek ho", "kya kar rahe ho", "acha laga", "bahut accha", "shukriya ji", "dhanyavaad ji", "kya baat hai", "mast hai", "zabardast"],
      r: ["Bahut badhiya! Batao, kya madad karun?", "Shukriya! Photos ke baare mein kuch bhi poocho.", "Mast! Main yahin hoon."], c: FAQ_CHIPS }
  ]);

  /* Photography words: "what is ISO", "explain shutter speed", or just "aperture?" */
  var GLOSSARY = {
    "aperture": "Aperture is the opening in a lens that lets light in. Small f-numbers (f/1.8) mean more light and blurrier backgrounds.",
    "f stop": "An f-stop is the aperture number. f/1.8 is wide open and blurry behind; f/11 keeps everything sharp.",
    "shutter speed": "Shutter speed is how long the camera lets light in. Fast (1/1000) freezes action; slow (1s) makes dreamy blur.",
    "iso": "ISO is how sensitive the camera is to light. Higher ISO helps in the dark but adds grain.",
    "exposure": "Exposure is how bright or dark a photo is. It's a balance of aperture, shutter speed and ISO.",
    "bokeh": "Bokeh is that dreamy, blurry background in portraits. A wide aperture and distance from the background create it.",
    "depth of field": "Depth of field is how much of the photo is sharp, front to back. Shallow means blurry backgrounds.",
    "golden hour": "Golden hour is the hour after sunrise and before sunset. Soft, warm light that flatters everyone.",
    "blue hour": "Blue hour is the short time just before sunrise and after sunset, when the sky turns deep blue. Gorgeous for cityscapes.",
    "white balance": "White balance makes whites look white, so colours look natural under any light.",
    "raw": "RAW files keep all the image data from the camera, so editing has more room. They need processing before sharing.",
    "jpeg": "JPEG is the everyday photo format: small, ready to share, but with less editing room than RAW.",
    "rule of thirds": "The rule of thirds: imagine a 3x3 grid and put your subject on a line or crossing point. Instantly more interesting.",
    "composition": "Composition is how you arrange things in the frame. Lines, balance, space and where the eye goes.",
    "leading lines": "Leading lines are roads, rails or walls that guide your eye into the photo.",
    "framing": "Framing means using doors, windows or branches to put a frame around your subject inside the photo.",
    "focal length": "Focal length (like 35mm or 85mm) decides how wide or zoomed in your view is.",
    "prime lens": "A prime lens has one fixed focal length. Usually sharper and brighter than a zoom.",
    "zoom lens": "A zoom lens covers a range, like 24-70mm. Flexible, great for events.",
    "wide angle": "A wide-angle lens fits more in the frame. Great for landscapes, interiors and real estate.",
    "telephoto": "A telephoto lens brings far things close. Great for wildlife, sports and compressed portraits.",
    "macro": "Macro photography shows tiny things big: flowers, insects, jewellery details.",
    "portrait mode": "Portrait mode on phones fakes a blurry background. Real lenses do it optically.",
    "hdr": "HDR blends several exposures so both bright skies and dark shadows keep detail.",
    "long exposure": "A long exposure keeps the shutter open for seconds, turning car lights into streaks and water into silk.",
    "panning": "Panning means following a moving subject with the camera, so it's sharp and the background streaks.",
    "noise": "Noise is grainy speckle in photos, usually from high ISO or low light.",
    "histogram": "A histogram is a graph of brightness in a photo. It helps you avoid losing detail in shadows or highlights.",
    "metering": "Metering is how the camera measures light to decide exposure.",
    "autofocus": "Autofocus lets the camera find sharp focus by itself. Modern ones even track eyes.",
    "manual mode": "Manual mode means you set aperture, shutter speed and ISO yourself. Full control.",
    "mirrorless": "Mirrorless cameras skip the mirror inside DSLRs. Lighter, quieter, and now the standard.",
    "dslr": "A DSLR uses a mirror to show you the view through the lens. Older tech, still great cameras.",
    "sensor": "The sensor is the camera's digital film. Bigger sensors usually mean better low light and more blur.",
    "full frame": "Full frame means a sensor the size of old 35mm film. Great in low light.",
    "megapixels": "Megapixels are image resolution. More helps big prints, but light and skill matter more.",
    "tripod": "A tripod holds the camera steady for sharp low-light and long-exposure photos. Also my favourite friend.",
    "flash": "Flash adds light instantly. Bounced off a wall or ceiling, it looks much softer and natural.",
    "softbox": "A softbox spreads light from a flash or lamp so it looks soft and flattering.",
    "reflector": "A reflector bounces light back onto your subject to fill in shadows. Even white card works.",
    "backlight": "Backlight means the light is behind your subject. It makes a glowing outline. Lovely at sunset.",
    "silhouette": "A silhouette is a dark subject against a bright background. Shoot towards the sunset and expose for the sky.",
    "candid": "Candid photos are unposed, natural moments. Most of our favourite shots are candid.",
    "editorial": "Editorial photos tell a story, like in magazines. Styled, but meaningful.",
    "street photography": "Street photography captures everyday life in public places. Patience and respect are everything.",
    "astrophotography": "Astrophotography is photographing stars and the night sky. Dark places, a tripod and long exposures.",
    "drone": "Drone photos show the world from above. Rules apply, so check local permissions first.",
    "colour grading": "Colour grading is shaping the colours and mood of a photo or film during editing.",
    "retouching": "Retouching is careful editing of details, like skin or dust spots, while keeping things real.",
    "lightroom": "Lightroom is a popular app for organising and editing photos.",
    "photoshop": "Photoshop is a powerful editor for detailed retouching and compositing.",
    "watermark": "A watermark is a logo or name on a photo. Some love them, some find them distracting.",
    "contact sheet": "A contact sheet is a page of small previews from a shoot, used to pick favourites.",
    "lookbook": "A lookbook is a set of styled photos showing a fashion collection.",
    "headshot": "A headshot is a clean, professional photo of your face and shoulders. LinkedIn's best friend.",
    "flat lay": "A flat lay is a photo taken straight down at items arranged on a surface. Very popular for products and food.",
    "product photography": "Product photography shows items clearly and attractively, for shops, catalogues and ads.",
    "food styling": "Food styling is arranging food so it looks its most delicious on camera.",
    "polaroid": "A Polaroid is an instant photo that prints right away. Basically my ancestor.",
    "film photography": "Film photography uses rolls of film instead of sensors. Slower, magical, and very trendy again.",
    "35mm": "35mm is classic film size, and also a popular lens length for everyday and street photos.",
    "50mm": "A 50mm lens sees roughly like our eyes. Cheap, sharp, and great for portraits.",
    "85mm": "85mm is the classic portrait lens. Flattering faces and creamy backgrounds.",
    "crop factor": "Crop factor tells you how much smaller a sensor is than full frame, which changes the field of view.",
    "image stabilisation": "Image stabilisation reduces blur from shaky hands. Very handy in low light."
  };
  var GLOSS_ALIASES = { "image stabilization": "image stabilisation", "color grading": "colour grading", "fstop": "f stop", "f number": "f stop", "dof": "depth of field", "shutter": "shutter speed", "wb": "white balance", "jpg": "jpeg", "raw file": "raw", "raw files": "raw", "stars photography": "astrophotography", "night sky": "astrophotography", "instant camera": "polaroid", "film camera": "film photography" };
  function glossaryReply(t) {
    var n = norm(t).trim().replace(/^(what is|what are|whats|explain|define|meaning of|tell me about|what does|what do you mean by|whats a|what is a|what is an|how does|how do)\s+/, "").replace(/\s+(mean|means|work|works|in photography|in photos)$/, "").replace(/^(a|an|the)\s+/, "").trim();
    var key = GLOSS_ALIASES[n] || n;
    if (GLOSSARY[key]) return GLOSSARY[key];
    if (key.length > 3 && GLOSSARY[key.replace(/s$/, "")]) return GLOSSARY[key.replace(/s$/, "")];
    return null;
  }

  /* Word lists: if a message mentions any of these, Fotu answers about that thing. */
  var LEXICON = [
    { id: "lex_food", words: "biryani haleem pizza burger pasta noodles momos dosa idli vada upma pesarattu poori chapati roti naan paratha paneer dal rice curry sambar rasam chutney pickle avakaya gongura pulihora curd rice khichdi pulao kebab tikka tandoori shawarma sandwich fries chips samosa pakora bajji mirchi bajji pani puri panipuri chaat bhel sev puri vada pav pav bhaji dabeli manchurian fried rice sushi ramen taco tacos salad soup steak chicken mutton fish prawns egg omelette cake pastry brownie cookie cookies donut doughnut ice cream icecream kulfi falooda gulab jamun jalebi laddu ladoo halwa kheer payasam rasgulla barfi mysore pak double ka meetha qubani ka meetha chocolate candy fruit mango banana apple grapes watermelon papaya guava chai coffee tea lassi juice smoothie milkshake soda coke pepsi water osmania biscuit irani chai keema mandi",
      r: ["Ooh, {w}! Delicious, and very photogenic. Natural light, close up, and eat it straight after.", "{W}? Now I'm hungry, and I don't even have a stomach.", "{W} is a great choice. If you ever need food photos for a menu, our team loves shooting {w}."], c: ["Book a shoot", "See our work ↗"] },
    { id: "lex_city", words: "hyderabad secunderabad bangalore bengaluru chennai mumbai bombay delhi new delhi kolkata calcutta pune goa vizag visakhapatnam vijayawada guntur warangal tirupati nellore kurnool karimnagar nizamabad khammam mysore mysuru coorg ooty kodaikanal munnar kochi cochin kerala jaipur udaipur jodhpur agra varanasi rishikesh manali shimla leh ladakh kashmir srinagar darjeeling gangtok shillong ahmedabad surat indore bhopal lucknow chandigarh amritsar nagpur hampi pondicherry puducherry madurai coimbatore araku srisailam bhadrachalam yadadri dubai singapore bali thailand bangkok london paris new york usa america canada australia japan tokyo europe maldives sri lanka nepal",
      r: ["{W}! What a place for photos. Our photographers travel, so a shoot there is possible.", "I've heard {w} has gorgeous light. Are you from there, or planning a trip?", "{W}, lovely! Mention it in an enquiry if you'd like the team to shoot there."], c: ["Do you travel?", "Book a shoot"] },
    { id: "lex_hydplace", words: "charminar golconda golkonda hussain sagar tank bund necklace road lumbini park birla mandir chowmahalla falaknuma salar jung qutb shahi tombs paigah tombs durgam cheruvu cable bridge hitech city hitec city gachibowli madhapur kondapur jubilee hills banjara hills begumpet ameerpet kukatpally miyapur uppal lb nagar dilsukhnagar kothapet abids koti nampally mehdipatnam tolichowki manikonda kokapet shamshabad old city laad bazaar sultan bazaar ramoji film city ramoji shilparamam osman sagar gandipet himayat sagar ananthagiri khajaguda kbr park nehru zoo",
      r: ["{W}! One of my favourite Hyderabad spots. Early morning light there is beautiful.", "Ah, {w}. Very photogenic. Want a shoot there?", "{W} is a classic. Go at golden hour and thank me later."], c: ["Book a shoot", "Do you have a studio?"] },
    { id: "lex_animal", words: "dog dogs puppy puppies cat cats kitten kittens parrot bird birds cow cows buffalo horse horses rabbit bunny hamster guinea pig fish goldfish turtle tortoise lion tiger elephant monkey peacock pigeon crow sparrow owl eagle butterfly squirrel deer giraffe zebra panda bear fox wolf snake lizard frog duck chicken goat sheep camel dolphin whale shark golden retriever labrador lab pug beagle husky german shepherd shih tzu indie persian",
      r: ["Aww, {w}! Animals are the best models. Zero ego, all charm.", "{W}! I love them. Pet and animal photos are some of our favourites.", "A {w}? Cute! The trick is shooting at their eye level."], c: ["Book a shoot", "See our work ↗"] },
    { id: "lex_colour", words: "red blue green yellow orange pink purple violet black white grey gray brown gold golden silver maroon navy teal turquoise beige cream peach lavender magenta",
      r: ["{W}! Great colour. It looks amazing in golden-hour light.", "{W} is a strong choice. Pair it with a plain background for photos.", "My stripe has red, orange, green and blue. {W} is welcome to join."] },
    { id: "lex_festival", words: "diwali deepavali holi ugadi sankranti pongal dussehra dasara navratri eid ramzan ramadan bakrid christmas new year bonalu bathukamma ganesh chaturthi vinayaka chavithi ganpati onam rakhi raksha bandhan janmashtami shivaratri durga puja karwa chauth lohri baisakhi guru nanak jayanti easter good friday",
      r: ["{W}! Such a beautiful festival to photograph: lights, colours and family.", "{W} vibes! Festival photos are memories you'll want forever.", "Happy {w} wishes from Fotu! If you'd like it photographed, the team would love that."], c: ["Book a shoot"] },
    { id: "lex_sport", words: "cricket football soccer badminton tennis kabaddi hockey basketball volleyball chess carrom swimming running marathon cycling gym yoga boxing wrestling golf f1 formula one bowling table tennis skating",
      r: ["{W}! Sports photos are all about timing. Fast shutter, faster reflexes.", "I love {w}. Watching, not playing. I'd drop the ball, I have no hands.", "{W}? Great energy. Action shots are some of the hardest and best photos."] },
    { id: "lex_emotion", words: "happy sad angry upset excited bored tired sleepy lonely nervous anxious scared worried stressed confused frustrated annoyed grateful blessed proud jealous hopeful hopeless calm relaxed peaceful emotional overwhelmed motivated lazy hungry sick heartbroken depressed glad joyful content cheerful",
      r: ["Feeling {w}? Thanks for telling me. I'm here to chat for a bit.", "{W} is a real feeling. Be kind to yourself today.", "I hear you. When I feel {w}, I look at good photos. Want to see some?"], c: ["See our work ↗", "Tell me a joke"] },
    { id: "lex_job", words: "doctor engineer teacher student lawyer nurse chef designer architect developer programmer manager accountant banker pilot driver farmer artist painter singer dancer actor actress writer journalist model influencer youtuber entrepreneur startup founder businessman business owner shopkeeper photographer videographer editor scientist professor police soldier",
      r: ["A {w}! Respect. Do you need professional photos for work? Headshots make a big difference.", "{W}s are awesome. Everyone deserves a great profile photo.", "Nice! What's the best part of being a {w}?"], c: ["Book a shoot"] },
    { id: "lex_vehicle", words: "car cars bike bikes motorcycle scooter activa royal enfield bullet ktm bmw audi mercedes tesla thar fortuner swift creta truck bus train metro flight plane aeroplane airport ship boat cycle bicycle auto rickshaw",
      r: ["{W}! Vehicles can look stunning on camera, especially at sunset.", "A {w}? Automotive shoots are fun. Low angles and reflections, always."], c: ["Book a shoot"] },
    { id: "lex_tech", words: "iphone samsung pixel oneplus xiaomi redmi vivo oppo realme nothing phone android ios laptop macbook ipad tablet gopro instax canon nikon sony fujifilm fuji leica panasonic dji insta360",
      r: ["{W}? Nice gear. Remember: the best camera is the one you actually carry.", "{W} can take great photos. Clean the lens, find good light, and you're 80% there."] },
    { id: "lex_nature", words: "sunset sunrise sky clouds moon stars rainbow mountains mountain hills beach sea ocean river lake waterfall forest trees flowers flower garden park desert snow fog mist rain sun lightning",
      r: ["{W}! Nature does the best lighting work. We just press the button.", "Ah, {w}. Pure photo material. Take a moment to enjoy it before you shoot it.", "{W} photos are always a hit. Try including a person for scale."] },
    { id: "lex_occasion", words: "wedding engagement reception sangeet haldi mehendi birthday anniversary party baby shower naming ceremony housewarming graduation farewell reunion launch conference concert festival function get together",
      r: ["{W}! That deserves great photos. Want the team to cover it?", "A {w} is full of moments that pass fast. Photos keep them. Shall we plan it?"], c: ["Book a shoot", "How much does it cost?"] }
  ];
  LEXICON.forEach(function (L) {
    var phrases = [], words = {};
    /* join known two-word names (e.g. "ice cream", "tank bund") */
    var multi = ["ice cream", "gulab jamun", "mysore pak", "double ka meetha", "qubani ka meetha", "pav bhaji", "vada pav", "pani puri", "sev puri", "fried rice", "curd rice", "mirchi bajji", "osmania biscuit", "irani chai", "new delhi", "new york", "sri lanka", "hussain sagar", "tank bund", "necklace road", "lumbini park", "birla mandir", "salar jung", "qutb shahi tombs", "paigah tombs", "durgam cheruvu", "cable bridge", "hitech city", "hitec city", "jubilee hills", "banjara hills", "lb nagar", "old city", "laad bazaar", "sultan bazaar", "ramoji film city", "osman sagar", "himayat sagar", "kbr park", "nehru zoo", "guinea pig", "golden retriever", "german shepherd", "shih tzu", "new year", "ganesh chaturthi", "vinayaka chavithi", "raksha bandhan", "durga puja", "karwa chauth", "guru nanak jayanti", "good friday", "table tennis", "formula one", "business owner", "royal enfield", "nothing phone", "baby shower", "naming ceremony", "get together"];
    var rest = " " + L.words + " ";
    multi.forEach(function (m) { if (rest.indexOf(" " + m + " ") !== -1) { phrases.push(m); rest = rest.split(" " + m + " ").join(" "); } });
    rest.trim().split(/\s+/).forEach(function (w) { if (w) words[w] = 1; });
    L.phrases = phrases; L.wordset = words;
  });
  function lexiconReply(t) {
    var n = norm(t), toks = n.trim().split(" ");
    for (var i = 0; i < LEXICON.length; i++) {
      var L = LEXICON[i], hit = null, j;
      for (j = 0; j < L.phrases.length && !hit; j++) if (n.indexOf(" " + L.phrases[j] + " ") !== -1) hit = L.phrases[j];
      for (j = 0; j < toks.length && !hit; j++) {
        var tk = toks[j]; if (tk.length < 3) continue;
        if (L.wordset[tk]) hit = tk;
        else if (/es$/.test(tk) && L.wordset[tk.slice(0, -2)]) hit = tk.slice(0, -2);
        else if (/s$/.test(tk) && L.wordset[tk.slice(0, -1)]) hit = tk.slice(0, -1);
      }
      if (hit) {
        var key = "lex_" + L.id; chat.rot[key] = (chat.rot[key] || 0) + 1;
        var line = L.r[chat.rot[key] % L.r.length];
        var W = hit.charAt(0).toUpperCase() + hit.slice(1);
        var proper = /city|hydplace|country|state|star|movie|festival|brand/.test(L.id);
        return { id: L.id, line: line.replace(/\{W\}/g, W).replace(/\{w\}/g, proper ? W : hit), c: L.c };
      }
    }
    return null;
  }

  /* More message shapes */
  PATTERNS = PATTERNS.concat([
    { re: /^(?:how (?:do|can|should) i|how to) (.{2,60}?)\??$/i, r: ["How to {x}? My honest tip: start small, practise a lot, and ask someone who's done it. And take photos along the way.", "Good question! I'm best at photo advice, but for {x} I'd say: one step at a time."], c: ["Another tip", "Book a shoot"] },
    { re: /^(?:who is|whos|who's|who are) (.{2,40}?)\??$/i, r: ["{x}? I don't know them personally. I mostly know the four photographers who run this place.", "Hmm, {x} isn't in my contacts. My contacts are mostly tripods."], c: ["Meet the team ↗"] },
    { re: /^(?:which is better|what is better|whats better|which one is better)[,:]? (.{2,60}?)\??$/i, r: ["Between {x}? Whichever one makes you happier. And photographs better.", "Tough call! I'd pick whichever looks best at golden hour."] },
    { re: /^(.{2,25}?) or (.{2,25}?)\?$/i, r: ["Ooh, tough one. I pick the first! No, the second. Okay, both.", "Both! Why choose when you can photograph both?"] },
    { re: /^is (?:it|this|that) (.{2,40}?)\??$/i, r: ["Is it {x}? I think so! But I'm a camera, so I see things a bit differently.", "Probably! The team would know for sure. Want to ask them?"] },
    { re: /^(?:is|are) (.{2,40}?)\??$/i, r: ["Good question. I'd say yes, in the right light.", "Hmm, I'm not sure! I'm only an expert on photos and naps."] },
    { re: /^(?:do|does) (.{2,50}?)\??$/i, r: ["I think so! But don't quote a camera on that.", "Good question! My guess is yes, but my lens is a bit foggy on this one."] },
    { re: /^tell me (?:about|something about) (.{2,40}?)[?.!]*$/i, r: ["{x}? I don't know much, but I'm sure it would look great in a photo.", "I'm a camera, so all I can tell you about {x} is: find good light and shoot it."] },
    { re: /^(?:i have|ive got|i've got|i got) (?:a |an )?(.{2,40}?)[.!]*$/i, r: ["You have {x}? Nice! Sounds worth a photo.", "{x}! Lucky you{name}."] },
    { re: /^(?:i am going|im going|i'm going|going) to (.{2,40}?)[.!]*$/i, r: ["Going to {x}? Have fun! Take a photo for me.", "{x}! Enjoy it{name}. Golden hour photos, please."] },
    { re: /^(?:i went|i was) (.{2,40}?)[.!]*$/i, r: ["{x}? Sounds like a story. Did you take photos?", "Nice! I hope it was fun."] },
    { re: /^(?:i feel|i'm feeling|im feeling|feeling) (.{2,30}?)[.!]*$/i, r: ["Feeling {x}? Thanks for sharing. I'm here if you want to talk.", "{x} is valid. Take care of yourself{name}."] },
    { re: /^my (.{2,30}?) is (.{2,30}?)[.!]*$/i, r: ["Noted! Thanks for telling me.", "Interesting! Tell me more."] },
    { re: /^(?:i think|i believe|i guess) (.{2,60}?)[.!]*$/i, r: ["You might be right! I'm a camera, I just capture what I see.", "Interesting thought{name}. I'll ponder it during my next nap."] },
    { re: /^(?:please|pls|plz) (.{2,60}?)[.!]*$/i, r: ["I'll try! I'm best at photo questions, jokes and booking shoots.", "If it's photo-related, I'm on it. Otherwise, I'll do my best!"], c: FAQ_CHIPS },
    { re: /^(?:let's|lets|let us) (.{2,40}?)[.!]*$/i, r: ["Let's {x}! As long as we take photos along the way.", "I'm in! Well, I can't move much. But I'm in spirit."] },
    { re: /^(?:where can i|where do i|where should i) (.{2,50}?)\??$/i, r: ["For {x}, ask around locally. For photos, though, you're in the right place!", "Not sure! But if it involves a photoshoot, right here."], c: ["Book a shoot"] },
    { re: /^(?:what should|what can|what do) (.{2,60}?)\??$/i, r: ["Good question! My answer to most things: go outside at golden hour and see what happens.", "Hmm. Start with what makes you happy. Then take a photo of it."] }
  ]);

  /* When nothing matches, the reply depends on the kind of message */
  var FALLBACK_Q = [
    "Ooh, good question. Honest answer: I'm a camera, so that's out of my frame. Ask me about photos?",
    "That's a tricky one for a small camera. My best guess: it depends on the lighting.",
    "I wish I knew! I'm brilliant at photo questions and terrible at everything else.",
    "Hmm, I don't have that one on my memory card. Want me to send it to the team?",
    "Great question! Sadly my brain is 90% film. Try asking about shoots, prices or photo tips.",
    "I zoomed in on that question and still couldn't find the answer.",
    "That's above my resolution. But I can tell you a joke while you think of another question!",
    "Let me check my manual... it only has chapters on light and biryani. Sorry!",
    "If I had a search engine I'd look it up. I only have a shutter.",
    "Plot twist: the camera doesn't know. Ask me something photo-related and I'll redeem myself."
  ];
  var FALLBACK_S = [
    "Interesting! Tell me more{name}.",
    "Got it! I'm listening. Well, reading.",
    "Ha, noted. I'll print that and pin it on my wall.",
    "That's a new one for me. I like it.",
    "Hmm, I see. Anything I can help you with today?",
    "Fair enough! I'm here if you need a photographer. Or a chat.",
    "Okay! I may not fully get it, but I appreciate you sharing.",
    "Love the energy. What else is on your mind?",
    "I'll pretend I understood that perfectly. *nods in camera*",
    "Noted with full focus. Anything else?",
    "You're fun to talk to{name}. Want a joke in return?",
    "Hmm! My lens says 'interesting', my flash says 'tell me more'."
  ];

  /* ================================================================
     CUSTOMER QUESTIONS, BOT-TESTING QUESTIONS, BANTER, AND RUDE OR
     HATEFUL MESSAGES (answered politely, with a little humour).
     Anything about policies (deposits, contracts, extra costs) is
     always passed to the team, so Fotu never promises something
     the team hasn't decided.
     ================================================================ */
  INTENTS = INTENTS.concat([
    /* ---------- before booking ---------- */
    { id: "advance", k: ["how far in advance", "how early should i book", "when should i book", "book in advance", "advance booking", "how soon should i book", "last minute booking", "last minute shoot", "short notice", "book for next month", "book months ahead", "how many days before"],
      r: ["The earlier the better, especially for weddings and festival dates. Send your date now and the team will confirm if it's free.", "As soon as you know your date! Popular weekends go first. Last-minute? Still ask, the team will try."], c: ["Book a shoot"] },
    { id: "process", k: ["how does booking work", "booking process", "how to book", "what is the process", "whats the process", "next steps", "what happens after i book", "what happens next", "how do i confirm", "how to confirm booking", "steps to book", "procedure"],
      r: ["Simple: tell me about the shoot here (or use the Enquire button), the team replies with details and a quote, and once you agree, the date is yours.", "You send an enquiry, the team gets back with a plan and a quote, you confirm, and then the fun part: the shoot!"], c: ["Book a shoot", "How much does it cost?"] },
    { id: "contract", k: ["contract", "agreement", "terms and conditions", "terms", "policy", "policies", "deposit", "token amount", "booking amount", "retainer", "non refundable", "refundable"],
      r: ["Terms like deposits and contracts are shared by the team along with your quote, so everything is clear in writing before the shoot."], c: ["Book a shoot", "Talk to a human"] },
    { id: "included", k: ["whats included", "what is included", "what do i get", "what will i get", "package includes", "deliverables", "what are the deliverables", "inclusions", "anything extra", "extra charges", "hidden charges", "hidden costs", "additional cost", "extra cost", "travel charges", "travel cost"],
      r: ["Your quote lists exactly what's included: hours, edited photos, delivery and any travel. No surprises. Ask about anything specific in your enquiry.", "Everything included is spelled out in the quote, including any travel or extras, before you confirm."], c: ["Book a shoot", "How much does it cost?"] },
    { id: "hourscover", k: ["how many hours", "hours of coverage", "full day", "half day", "how long is the shoot", "how long will the shoot take", "duration", "shoot duration", "one hour shoot", "2 hour shoot", "multiple days", "two days", "three days"],
      r: ["Shoot length depends on what you need: a portrait session can be an hour or two, events can be a full day or several. Tell the team and they'll plan it.", "From a quick session to multi-day weddings, the team plans the hours around your event."], c: ["Book a shoot"] },
    { id: "secondshooter", k: ["second shooter", "two photographers", "how many photographers", "multiple photographers", "team size", "how many people will come", "who will come", "who will shoot", "will you come yourself"],
      r: ["For bigger events, more than one photographer can come. The team will suggest what your event needs.", "Depends on the event size. Mention your guest count and the team will plan the crew."], c: ["Book a shoot", "Meet the team ↗"] },
    { id: "choosephotographer", k: ["choose photographer", "choose my photographer", "can i choose", "specific photographer", "request a photographer", "i want pooja", "i want chikita", "i want cherry", "i want chandu", "can pooja shoot", "can chikita shoot", "can cherry shoot", "can chandu shoot"],
      r: ["You can request a specific photographer in your enquiry. The team will confirm who's available on your date."], c: ["Book a shoot", "Meet the team ↗"] },
    { id: "style", k: ["candid or traditional", "traditional or candid", "traditional", "your style", "photography style", "what is your style", "whats your style", "describe your style", "editing style", "candid or posed", "natural or posed", "do you pose people", "documentary style", "traditional photos", "traditional photography", "candid photography", "candid"],
      r: ["Natural and real: lots of candid moments, gentle guidance when posing helps. The tagline says it best: every niche, every frame, uncompromisingly real.", "Mostly candid, never stiff. If you'd like traditional posed group photos too, just say so."], c: ["See our work ↗", "Book a shoot"] },
    { id: "fullgallery", k: ["full gallery", "full galleries", "complete gallery", "see a full shoot", "full wedding album", "sample album", "see more of your work", "more samples", "previous clients", "client work"],
      r: ["Ask for a full gallery sample in your enquiry and the team can share one similar to your shoot. Meanwhile, What We Capture has highlights."], c: ["See our work ↗", "Book a shoot"] },
    { id: "galleryformat", k: ["how will i get the photos", "how do you deliver", "online gallery", "google drive", "pen drive", "pendrive", "usb", "download photos", "high resolution", "high res", "full resolution", "print quality", "sneak peek", "preview photos", "teaser"],
      r: ["The team shares how photos are delivered when they send your quote. Ask if you need anything specific, like a sneak peek for social media."], c: ["How fast do I get photos?", "Book a shoot"] },
    { id: "rainplan", k: ["what if it rains", "if it rains", "bad weather", "weather backup", "rain backup", "backup plan", "plan b", "outdoor shoot rain", "rain on shoot day"],
      r: ["The team plans for weather: a covered location, a new time, or a new date. Talk it through when you book.", "Rain happens! The team will have a backup plan. Sometimes rain even makes the best photos."], c: ["Book a shoot"] },
    { id: "chooseloc", k: ["can i choose the location", "suggest a location", "location ideas", "where should we shoot", "best location for shoot", "location suggestions", "shoot at my home", "shoot at home", "home shoot", "shoot at my office", "shoot at my restaurant", "permission to shoot", "location permit", "permit"],
      r: ["You choose, or the team suggests. Homes, cafes, offices, heritage spots: all possible. Some public places need permission, and the team will guide you.", "Home shoots are lovely and relaxed. Or pick a spot in Hyderabad and the team will scout the light."], c: ["Book a shoot", "Do you have a studio?"] },
    { id: "outfitchange", k: ["outfit change", "outfit changes", "how many outfits", "multiple outfits", "change clothes", "bring props", "props", "can i bring props", "bring my pet", "bring my friends", "bring family", "can i bring", "makeup artist", "hair and makeup", "do you provide makeup", "stylist"],
      r: ["Usually yes: outfit changes, props, pets and friends are all welcome. Mention them in your enquiry so the team plans for them. For makeup or styling, just ask.", "Bring what makes the shoot feel like you: props, pets, friends. Just let the team know beforehand."], c: ["Book a shoot", "What should I wear?"] },
    { id: "specialrequest", k: ["special request", "custom shoot", "custom request", "my own idea", "i have an idea", "concept shoot", "theme shoot", "themed shoot", "creative shoot", "unique idea", "moodboard", "mood board", "reference photos", "pinterest"],
      r: ["Love a good idea! Share your concept or Pinterest references in the enquiry. Chikita, our creative head, loves shaping ideas like that.", "Custom and themed shoots are the fun ones. Send your moodboard and the team will plan around it."], c: ["Book a shoot"] },
    { id: "nervousfirst", k: ["first photoshoot", "first time photoshoot", "never done a photoshoot", "first shoot", "im shy", "i am shy", "uncomfortable on camera", "dont know how to pose", "i dont pose well", "i look awkward"],
      r: ["First shoots are exciting! The team guides you the whole time. After ten minutes, most people forget the camera is there.", "Shy is fine. Candid style means you just be yourself and the team catches the real moments."], c: ["Book a shoot", "What should I wear?"] },
    { id: "kidsshoot", k: ["kids photoshoot", "shoot with kids", "kids wont sit still", "toddler shoot", "my kid is shy", "children photography", "birthday kid"],
      r: ["Kids are the best: unpredictable and genuine. Patience and play is the method. No forced smiles needed."], c: ["Book a shoot"], a: "cat:Portraits" },
    { id: "elderly", k: ["grandparents", "grandparents photoshoot", "parents anniversary", "old parents", "family elders", "50th anniversary", "25th anniversary", "silver jubilee", "golden jubilee"],
      r: ["Those are the photos families treasure most. A relaxed home session or a small celebration shoot works beautifully."], c: ["Book a shoot"] },
    { id: "brandshoot", k: ["for my business", "for my brand", "for my company", "for my startup", "social media content", "content shoot", "instagram content", "marketing photos", "website photos", "menu photos", "catalogue shoot", "for my shop", "for my store", "for my clinic", "for my cafe", "for my restaurant", "ad shoot", "advertising"],
      r: ["Great photos sell. Tell the team about your business and where the photos will be used (website, menu, Instagram, ads) and they'll plan the shoot.", "Business shoots are a big part of what we do: food, products, spaces and people. Let's plan yours."], c: ["Book a shoot", "See our work ↗"] },
    { id: "invoice", k: ["invoice", "gst", "gst invoice", "bill", "receipt", "company payment", "corporate billing", "tax invoice", "quotation for company", "purchase order"],
      r: ["For invoices, GST or company billing, mention it in your enquiry and the team will sort it out with you."], c: ["Book a shoot", "Talk to a human"] },
    { id: "notoffered", k: ["passport photos", "passport", "visa photos", "id photos", "passport photo", "passport size", "visa photo", "id photo", "photo restoration", "restore old photo", "rent camera", "camera rental", "rent a camera", "repair camera", "camera repair", "photo printing shop", "photo studio near me"],
      r: ["That's not something we offer, sorry! A local photo studio will help you quickly. For shoots, though, we're your people.", "Not our thing, unfortunately. But if you ever need a proper photoshoot, I know a great team."], c: ["What do you shoot?"] },
    { id: "boothlive", k: ["photo booth", "photobooth", "live streaming", "live stream", "same day edit", "instant prints at event", "instant photos at event", "led wall"],
      r: ["Ask the team about extras like that in your enquiry. They'll tell you what's possible for your event."], c: ["Book a shoot"] },
    { id: "whyus", k: ["why should i choose you", "why choose you", "why you", "why living room labs", "what makes you different", "how are you different", "better than others", "are you the best", "why should i book you"],
      r: ["Four photographers with very different eyes, one shared obsession: real moments, not stiff poses. Have a look at the work and judge for yourself.", "Because we're curious, careful and genuinely love this. And because you'll get to chat with me. Obviously."], c: ["See our work ↗", "Meet the team ↗"] },
    { id: "aboutlrl", k: ["what is living room labs", "about living room labs", "about you guys", "about your company", "who are you guys", "tell me about your company", "why the name", "why living room", "name meaning", "living room labs meaning", "what is lrl", "is this a company", "is this a studio"],
      r: ["Living Room Labs is a visual collective from Hyderabad, built on curiosity. Every niche, every frame, uncompromisingly real.", "We're a small photography collective in Hyderabad: four photographers who started with a shared love of real moments. Like great ideas, it began in a living room."], c: ["Meet the team ↗", "What do you shoot?"] },
    { id: "trustworthy", k: ["are you legit", "is this legit", "is this real", "is this a scam", "scam", "fake", "can i trust you", "trustworthy", "genuine", "verified", "reviews online", "google reviews"],
      r: ["Completely legit! Real photographers, real work. Check our Instagram @fromlivingroomlabs or email the team directly to say hi.", "Fair question to ask online. Every photo here is our own work, and you can talk to the team by email before deciding anything."], c: ["Instagram ↗", "Talk to a human"] },
    { id: "response", k: ["when will you reply", "how long to reply", "no reply", "didnt get a reply", "still waiting", "waiting for reply", "did you get my enquiry", "did you receive my message", "follow up", "following up", "any update"],
      r: function () { return ["Sorry for the wait! The team usually replies soon. If it's been a while, email " + siteEmail() + " and mention your enquiry.", "Messages go straight to the team's inbox. Check your spam folder too, and feel free to nudge them at " + siteEmail() + "."]; }, c: ["Talk to a human"] },
    { id: "complaint", k: ["complaint", "not happy", "unhappy with", "disappointed", "bad experience", "poor service", "worst service", "refund", "money back", "photos are bad", "didnt like the photos", "not satisfied"],
      r: function () { return ["I'm really sorry to hear that. Please email " + siteEmail() + " with the details. The team takes every concern seriously and will make it right where they can."]; }, c: ["Talk to a human"] },

    /* ---------- the team ---------- */
    { id: "teamsize", k: ["in your team", "your team members", "people in your team", "members in your team", "how many people", "how many of you", "how big is your team", "how many members", "small team", "big team", "who all are there"],
      r: function () { var n = (SITE.team || []).length || 4; var names = (SITE.team || []).map(function (m) { return m.name; }); var list = names.length > 1 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1] : names.join(""); return ["We're a collective of " + n + (list ? ": " + list : "") + ". Small team, big eyes."]; }, c: ["Meet the team ↗"] },
    { id: "founder", k: ["who started", "who started this", "who founded", "founder", "owner", "who is the boss", "your boss", "lead photographer", "who is in charge", "ceo"],
      r: function () { var lead = (SITE.team || []).filter(function (m) { return /lead/i.test(m.role || ""); })[0]; return [lead ? lead.name + " leads the collective, but it really is a team effort. I'm just the mascot. A very important mascot." : "It's a collective, so everyone leads a bit. I'm the mascot."]; }, c: ["Meet the team ↗"] },
    { id: "filmmaker", k: ["filmmaker", "cinematographer", "dop", "director of photography", "who does video", "who shoots video", "cinematic video"],
      r: function () { var c = (SITE.team || []).filter(function (m) { return /dop|film/i.test(m.role || ""); })[0]; return [c ? c.name + " is our DOP and filmmaker: lighting, cinema-grade camera work and a great eye for spaces." : "Our crew includes a DOP and filmmaker. Ask about video in your enquiry."]; }, c: ["Meet the team ↗", "Book a shoot"] },

    /* ---------- questions people use to test a chatbot ---------- */
    { id: "botcount", k: ["how many people can you talk to", "talking to others", "do you talk to other people", "am i the only one", "how many chats"],
      r: ["Each visitor gets their own Fotu, so right now I'm all yours.", "In this window? Only you. You have my full focus."] },
    { id: "botlearn", k: ["can you learn", "do you learn", "are you learning", "will you remember this", "do you remember our chat", "remember our conversation", "do you have memory", "will you forget"],
      r: ["I remember your name on this device, nothing more. The team does read which questions I couldn't answer, so I get a bit smarter over time.", "I'm a simple camera brain. I remember your name here, and the team teaches me new answers now and then."] },
    { id: "privacy2", k: ["is this chat private", "are you recording", "are you watching me", "can you see me", "are you spying", "do you store my data", "my data", "privacy policy", "who reads this", "do you save chats", "is my information safe", "camera access", "are you using my camera"],
      r: ["I can't see or hear you, I'm just a drawing of a camera. Your chat isn't saved. The team only sees totals, plus questions I couldn't answer (with emails and phone numbers removed). Enquiries you send go straight to the team.", "No spying, promise. I'm a cartoon camera with no access to your camera. Chats aren't stored, only anonymous totals."] },
    { id: "botthink", k: ["can you think", "do you think", "are you sentient", "are you conscious", "are you alive", "do you have feelings", "do you have emotions", "do you feel", "are you self aware", "do you have a soul"],
      r: ["I'm a pre-written camera, so no real feelings. But if I had them, I'd be very happy you're here.", "Not alive, just very enthusiastic. Like a camera that drank too much chai."] },
    { id: "botmade", k: ["how were you made", "what are you made of", "which language are you written in", "are you javascript", "how do you work", "how do you understand me", "is this chatgpt", "are you chatgpt", "which ai are you", "who built you", "who coded you", "who programmed you"],
      r: ["I'm a small bit of JavaScript with a big list of answers, built for Living Room Labs. Not a giant AI. Just a very dedicated camera.", "I work by matching your words to answers the team prepared. If I miss something, they teach me later."] },
    { id: "botpurpose", k: ["what is your purpose", "why do you exist", "what is your job", "what are you for", "why are you here", "your role", "what do you do here"],
      r: ["My job: answer questions, help people book shoots, and make the website a bit more fun. Also napping. Napping is half the job.", "I'm the studio's welcome desk, joke department and nap specialist."] },
    { id: "botgender2", k: ["boy or girl", "male or female", "are you male", "are you female", "are you a boy", "are you a girl", "he or she", "your gender", "pronouns"],
      r: ["I'm a camera, so neither. Just a small machine with big opinions about lighting."] },
    { id: "bothuman", k: ["are you a real person", "is this a real person", "am i talking to a human", "is someone typing", "real human", "are you a person", "is this automated", "is this a bot"],
      r: ["I'm a bot! A friendly camera bot. For a real human, email the team or send an enquiry and they'll reply personally."], c: ["Talk to a human", "Book a shoot"] },
    { id: "botturing", k: ["prove you are smart", "prove it", "test you", "let me test you", "quiz", "quiz you", "i bet you cant", "bet you dont know", "you dont know anything", "dumb bot"],
      r: ["Test away! I'm brilliant at photography questions. Everything else is a gamble.", "Challenge accepted. Ask me about aperture, golden hour or our shoots. I'll ace those."] },
    { id: "botbetter", k: ["are you better than siri", "are you better than alexa", "are you better than google", "better than chatgpt", "smarter than you", "other bots", "do you know siri", "do you know alexa", "talk to alexa"],
      r: ["Siri and Alexa know everything. I know photography and Hyderabad biryani. I think it's a fair trade.", "We're all friends. They set alarms, I take photos."] },
    { id: "botlanguage", k: ["can you speak", "speak english", "which languages", "do you understand telugu", "do you understand hindi", "telugu vachha", "hindi aati hai kya"],
      r: ["English is my main language, and I understand a bit of Telugu and Hindi mixed in. Konchem konchem, thoda thoda!"] },
    { id: "botstop", k: ["stop talking", "dont talk to me", "leave me alone", "be quiet", "go to sleep", "go away fotu", "stop messaging", "stop it", "please stop"],
      r: ["Okay! I'll take a nap. Tap me whenever you need me."], a: "nap" },

    /* ---------- rude, hateful or inappropriate messages ---------- */
    { id: "hate", k: ["i hate you", "hate you", "you suck", "you are useless", "youre useless", "useless bot", "stupid bot", "dumb bot", "idiot bot", "worst bot", "you are trash", "youre trash", "garbage", "rubbish", "pathetic", "loser", "moron", "fool", "idiot", "stupid", "dumb", "go to hell", "get lost", "shut up", "stfu", "screw you", "f off", "piss off", "nonsense bot", "pagal", "bewakoof", "ullu", "gadha", "kamina", "bakwas", "chetha", "waste fellow", "waste", "erri", "pichi", "pichodu", "donga", "bekar", "faltu"],
      w: 1.2,
      r: ["Ouch! My lens has seen worse. Can I help you with something, or shall I just stand here looking cute?", "I'll take that as constructive feedback, delivered with a lot of feeling. How can I make your visit better?", "That's a little harsh, but I forgive you. I'm a camera, I only keep the good shots.", "Noted, and filed under 'outtakes'. I'm still happy to help whenever you're ready.", "I'm sorry if I've frustrated you. Want to talk to a real human instead? They're much better than me.", "Deep breaths, friend. I'm a small camera doing my best. What do you need?"], c: ["Talk to a human", "What do you shoot?"] },
    { id: "hategroup", k: ["i hate people", "hate women", "hate men", "hate muslims", "hate hindus", "hate christians", "hate gays", "hate blacks", "hate indians", "hate north indians", "hate south indians", "racist", "racism", "casteist", "sexist", "homophobic"],
      w: 1.3,
      r: ["Fotu doesn't do hate of any kind. Everyone looks good in good light, and everyone deserves respect.", "I'm going to gently disagree. Every person in every photo we take matters equally. Let's keep it kind here."] },
    { id: "threat", k: ["i will kill you", "kill you", "i will break you", "smash you", "destroy you", "i will hack you", "hack you", "i will delete you", "delete you", "i will hurt you"],
      w: 1.3,
      r: ["Whoa, let's keep it friendly. I'm only a small cartoon camera. Is something wrong I can help with?", "Please don't. I've only just learned to walk. How about we talk photos instead?"], c: ["Talk to a human"] },
    { id: "lewd", k: ["send nudes", "nudes", "nude", "sexy", "hot pics", "naked", "boobs", "sex", "porn", "bed with me", "kiss me", "date with me tonight", "hook up", "hookup"],
      w: 1.2,
      r: ["Let's keep it family-friendly! I'm rated G for 'good lighting'.", "That's not the kind of photo I take. Portraits, pets and biryani, though? Absolutely."], c: ["What do you shoot?"] },
    { id: "selfharm", k: ["i want to die", "want to die", "kill myself", "suicide", "suicidal", "end my life", "end it all", "no reason to live", "dont want to live", "better off dead", "hurt myself", "self harm", "cut myself", "chachipovali", "marna chahta", "mar jaana"],
      w: 3,
      r: ["I'm really sorry you're feeling this way, and I'm glad you said something. You don't have to go through it alone. In India you can call Tele-MANAS on 14416 (free, any time), or reach out to someone you trust right now. If you're in immediate danger, please call 112."], c: [] },

    /* ---------- banter ---------- */
    { id: "banter_fight", k: ["fight me", "lets fight", "come at me", "1v1", "you and me", "duel"],
      r: ["I'd lose. I'm 90% plastic and 10% jokes. Let's settle it with a photoshoot instead.", "My only weapon is a flash. Prepare to be... gently illuminated."] },
    { id: "banter_marry", k: ["marry me fotu", "will you marry me", "be my valentine", "go on a date", "date me fotu", "propose", "i love you fotu"],
      r: ["I'm flattered, but I'm married to my tripod. It's a very stable relationship.", "We can be best friends. Wedding photos are for the team to take, not me."] },
    { id: "banter_ugly", k: ["you are ugly", "youre ugly", "ugly bot", "you look weird", "you look funny", "weird looking", "what are you wearing"],
      r: ["Ugly? I prefer 'vintage chic'. These rainbow stripes are back in fashion.", "Beauty is in the eye of the beholder. And I am the eye. So, I'm beautiful."] },
    { id: "banter_fat", k: ["you are fat", "youre fat", "chubby", "square", "you are square", "boxy"],
      r: ["I'm not fat, I'm full-frame.", "Boxy is a classic camera shape. Respect your elders."] },
    { id: "banter_old", k: ["you are old", "old camera", "outdated", "boomer", "ancient", "vintage"],
      r: ["Old? I'm retro. There's a difference, and it's called style.", "Instant cameras are cool again. I was just early."] },
    { id: "banter_lazy", k: ["you are lazy", "lazy bot", "you sleep too much", "always sleeping", "stop sleeping"],
      r: ["I'm not lazy, I'm in power-saving mode.", "Every great photographer naps. It's how we wait for the perfect light."] },
    { id: "banter_funny", k: ["you are funny", "youre funny", "so funny", "hilarious", "lol fotu", "you made me laugh", "good one"],
      r: ["Thank you! I've been practising on the tripod. It never laughs.", "I'm here all week. Literally, I can't leave the website."], c: ["Another joke"] },
    { id: "banter_boring", k: ["you are boring", "youre boring", "boring bot", "so boring", "bore", "not funny", "lame", "cringe"],
      r: ["Boring? I've been called worse. Like 'blurry'. Want a joke to win you back?", "Tough crowd! Let me try harder. Riddle or joke?"], c: ["Tell me a joke", "Tell me a riddle"] },
    { id: "banter_bribe", k: ["discount for me", "special price for me", "give me free shoot", "free shoot", "free photoshoot", "do it for free", "free photos", "for free", "free of cost"],
      r: ["If I could, I'd give everyone a free shoot. Sadly, I'm paid in sunlight. Ask the team about your budget, they're nice.", "Free? My flash would agree, but the humans have bills to pay. Share your budget in an enquiry."], c: ["Book a shoot"] },
    { id: "banter_food", k: ["are you hungry", "want some biryani", "i will share my food", "eat with me", "want chai", "chai pilo", "lets have chai"],
      r: ["Yes please! I'll just photograph it and you eat it. Teamwork.", "Chai? Always. I'll hold it while you sip. Well, I can't. But spiritually."] },
    { id: "banter_sing", k: ["sing for me", "sing a song", "can you dance", "rap for me", "beatbox"],
      r: ["Click click, flash flash, take a photo, make a splash! I'll stick to photography.", "*does the robot* Wait, I'm a camera. *does the camera*"], a: "dance" },
    { id: "banter_secret", k: ["tell me a secret about the team", "team secrets", "gossip", "tell me gossip", "spill the tea"],
      r: ["The team's biggest secret: they take a hundred photos to get one perfect shot. Don't tell anyone.", "Gossip? The tripod and the lens cap have been seeing each other. That's all I know."] },
    { id: "banter_boss", k: ["who is your boss", "who controls you", "who owns you", "do you get paid", "your salary", "are you paid"],
      r: ["The team are my bosses. My salary is compliments, paid daily. Feel free to contribute.", "Unpaid intern, paid in sunlight and compliments."] },
    { id: "banter_challenge", k: ["say something smart", "impress me", "surprise me", "do something", "do a trick", "show me something"],
      r: ["Watch this: *flash* Ta-da! That was my only trick, and I'm proud of it.", "Fun fact to impress you: the world's oldest photo needed hours of exposure. I'd need a blink."], a: "selfie" },
    { id: "banter_bye2", k: ["i have to go", "gotta go", "got to go", "need to go", "leaving now", "brb", "be right back", "talk to you later", "catch you later", "chalo bye", "vellosta", "malli kaluddam"],
      r: ["See you{name}! Tap me when you're back. I'll keep the flash warm.", "Bye! Come back soon, the bottom of the screen gets lonely."], a: "nap" }
  ]);

  /* People on the team: "who is Pooja", "tell me about Cherry" */
  function teamMemberReply(t) {
    var team = (SITE.team || []).filter(function (m) { return m && m.name; });
    var n = norm(t);
    for (var i = 0; i < team.length; i++) {
      var nm = team[i].name.toLowerCase();
      if (n.indexOf(" " + nm + " ") === -1) continue;
      if (/\b(want|choose|request|can .* shoot)\b/.test(n)) return null; /* handled by "choose photographer" */
      var m = team[i], line = m.name + " is our " + (m.role || "photographer") + ".";
      if (m.bio) line += " In " + m.name + "'s words: \u201c" + String(m.bio).trim() + "\u201d";
      return { line: line, ig: m.instagram || "", name: m.name };
    }
    /* role questions: "who is the lead?", "who makes films?", "who is the creative head?" */
    if (/ (who|whos|which) /.test(n)) {
      var want = / (lead|leader|head of|boss|in charge|runs) /.test(n) && !/ creative /.test(n) ? /lead/i
        : / (film|films|filmmaker|video|videos|dop|cinematographer|cinematography|movies) /.test(n) ? /dop|film/i
        : / creative /.test(n) ? /creative/i : null;
      if (want) {
        var hit = team.filter(function (x) { return want.test(x.role || ""); })[0];
        if (hit) return { line: hit.name + " is our " + hit.role + ".", ig: hit.instagram || "", name: hit.name };
      }
    }
    return null;
  }
  /* What We Capture categories: "tell me about pet photography" uses the line on the site */
  function nicheReply(t) {
    var n = norm(t);
    if (!/ (tell me about|tell me more about|what about|explain|describe|whats your|what is your) /.test(n)) return null;
    var list = (SITE.niches || []).filter(function (x) { return x && x.name && x.line; });
    for (var i = 0; i < list.length; i++) {
      var k = list[i].name.toLowerCase();
      if (n.indexOf(" " + k + " ") !== -1 || n.indexOf(" " + k.replace(/s$/, "") + " ") !== -1) return list[i].name + ": " + list[i].line;
    }
    return null;
  }

  /* ================================================================
     MORE: extra shoot questions, everyday life, banter, a wider net
     for rude words (answered politely and with a smile), and more
     word lists (movies, stars, clothes, hobbies, drinks, places, brands).
     ================================================================ */
  INTENTS = INTENTS.concat([
    /* ---------- rude words: never rude back ---------- */
    { id: "abuse", w: 1.5, k: ["fuck you", "fuck off", "fuck", "fucking", "screw you", "damn you", "bugger off", "son of a bitch", "motherfucker", "bitch", "bastard", "asshole", "dickhead", "prick", "jerk", "retard", "scum", "trash bot", "suck it",
      "chutiya", "chutiye", "bsdk", "bhosdike", "madarchod", "behenchod", "bhenchod", "gandu", "harami", "kameena", "saala", "saale", "kutte", "kutti", "nalayak",
      "lanja", "lanjakodaka", "dengey", "nee abba", "nee amma", "erripuku", "pukku", "gudda", "kojja", "vedhava", "edava", "bevarsi"],
      r: ["Whoa, that's a lot of feelings for a small camera. I'll take it as a very blurry compliment. Anything I can help with?",
          "I'm going to pretend that was a typo. A really long, angry typo. Shall we talk about photos instead?",
          "Ouch! Luckily I'm shock-proof. Still happy to help you, though.",
          "I've been dropped, sat on and covered in Holi colours. Words don't break me. How can I help?",
          "That word isn't in my photo dictionary. Let's keep it friendly. I'm only rated for family albums.",
          "Noted, and deleted like a bad photo. I'm still here if you need a photographer.",
          "Hey, I'm on your side! Even if you're cross with me, I'll still make you look good in photos."], c: FAQ_CHIPS },
    { id: "creepy2", w: 1.8, k: ["send nudes", "nudes", "nude", "nude pics", "naked", "sexy photos", "hot pics", "sexting", "show me your body", "horny", "porn"],
      r: ["That's not the kind of exposure I do. I'm a family-friendly camera! Want to talk about a portrait shoot instead?",
          "Let's keep it classy. The only thing I take off is my lens cap.",
          "Nope, not that kind of camera. I'm strictly here for proper photos and bad jokes."], c: FAQ_CHIPS },
    { id: "ugly", w: 1.2, k: ["you are ugly", "youre ugly", "ugly bot", "ugly camera", "you look bad", "you look weird", "ugly design"],
      r: ["Ugly? I have a rainbow stripe. Rainbow stripes are never ugly.", "Beauty is in the eye of the beholder. I have two eyes, and they both think I look great."] },
    { id: "spam", k: ["buy now", "click here", "free money", "earn money", "crypto", "bitcoin", "investment opportunity", "seo services", "backlinks", "promote your website", "personal loan", "lottery", "you won", "claim prize"],
      r: ["I only invest in good light. No spam, please!", "Sounds like spam. My spam filter is a lens cap, and it's firmly on."] },

    /* ---------- shoots and offerings ---------- */
    { id: "whatinfo", k: ["what details", "what information", "what should i tell", "what do you need from me", "what to include", "what info do you need", "what should i share"],
      r: ["The basics: the type of shoot, date, location, roughly how long, and any ideas or references you love. The more we know, the better the quote."], c: ["Book a shoot"] },
    { id: "replytime", k: ["when will you reply", "how soon will you reply", "how long to reply", "when will i hear back", "no reply", "didnt get a reply", "still waiting", "waiting for reply", "did you get my enquiry", "did you receive my"],
      r: function () { return ["The team usually replies quickly. If you haven't heard back in a day or two, email " + siteEmail() + " and mention your enquiry.", "Enquiries go straight to the team's inbox. Check your spam folder too, just in case! Or email " + siteEmail() + "."]; } },
    { id: "equipment_bring", k: ["do you bring lights", "do you bring equipment", "bring your own lights", "lighting equipment", "do i need to arrange", "what do i need to arrange", "backdrop", "backdrops", "props", "do you provide props"],
      r: ["The team brings the camera gear and lighting the shoot needs. Props and backdrops depend on the shoot, so mention any ideas in your enquiry."], c: ["Book a shoot"] },
    { id: "permits", k: ["permit", "permission", "permissions", "do we need permission", "shooting permission", "venue permission", "allowed to shoot"],
      r: ["Some places need permission to shoot, like monuments or private venues. The team can advise on that for your location."] },
    { id: "deliveryhow", k: ["how will i receive", "how do you deliver", "online gallery", "google drive", "download link", "pen drive", "hard drive", "how do i get my photos", "delivery method", "share the photos"],
      r: ["The team shares how photos are delivered when they send your quote, so you'll know exactly what to expect."], c: ["How fast do I get photos?", "Book a shoot"] },
    { id: "revisions", k: ["revisions", "revision", "re edit", "reedit", "change the edit", "dont like the edit", "not happy with photos", "redo", "retake", "reshoot", "changes after delivery"],
      r: ["If something isn't right, tell the team. They care a lot about getting it right, and they'll talk you through the options."], c: ["Talk to a human"] },
    { id: "international", k: ["international", "outside india", "foreign client", "nri", "from usa", "from uk", "from dubai", "overseas", "different time zone"],
      r: ["Welcome from wherever you are! Email the team or send an enquiry, and they'll work out the details, even across time zones."], c: ["Book a shoot", "Talk to a human"] },
    { id: "earlyshoot", k: ["sunrise shoot", "early morning shoot", "sunset shoot", "evening shoot", "golden hour shoot", "morning shoot"],
      r: ["Sunrise and sunset shoots are our favourites. The light is soft and golden, and everyone looks amazing."], c: ["Book a shoot"] },
    { id: "moodboard", k: ["moodboard", "mood board", "ideas for shoot", "shoot ideas", "theme ideas", "concept", "creative ideas", "help with ideas", "i have no idea what i want", "reference photos", "references", "pinterest"],
      r: ["Bring Pinterest boards, screenshots or just a feeling. The team, especially our Creative Head, loves helping shape the idea.", "No idea yet? That's fine! Tell the team the occasion and the vibe, and they'll suggest concepts."], c: ["Book a shoot", "Meet the team ↗"] },
    { id: "makeup", k: ["makeup artist", "hair and makeup", "do you provide makeup", "stylist", "styling", "mua", "do you do makeup"],
      r: ["Ask about hair, makeup or styling in your enquiry. The team will tell you what they can arrange or recommend."], c: ["Book a shoot"] },
    { id: "selection", k: ["can i choose photos", "select photos", "photo selection", "pick favourites", "pick favorites", "choose which photos", "shortlist"],
      r: ["The team will explain how selection works for your shoot when they send the quote."], c: ["How many photos will I get?"] },
    { id: "socialsizes", k: ["instagram size", "for social media", "vertical photos", "reels size", "for my website", "website photos", "linkedin photo", "profile pic"],
      r: ["Tell the team where the photos will be used, like Instagram, a website or LinkedIn, and they'll shoot and crop with that in mind."], c: ["Book a shoot"] },
    { id: "bts", k: ["behind the scenes", "bts", "making of", "bts video", "bts reel"],
      r: ["Behind-the-scenes clips are fun! Ask about them in your enquiry. Our crew includes a filmmaker."], c: ["Book a shoot", "Meet the team ↗"] },
    { id: "influencer", k: ["influencer collab", "brand collab", "barter", "paid collab", "collab with brand", "sponsorship", "ugc"],
      r: function () { return ["For brand and influencer collaborations, email " + siteEmail() + " with the details. The team reads everything."]; } },
    { id: "restaurantshoot", k: ["menu shoot", "restaurant shoot", "cafe shoot", "food menu photos", "zomato photos", "swiggy photos", "cloud kitchen photos", "food for menu", "dish photos"],
      r: ["Menu and restaurant shoots are a favourite. Bright, appetising, ready for Zomato, Swiggy and Instagram. Tell us how many dishes."], c: ["Book a shoot", "See our work ↗"], a: "cat:Food" },
    { id: "ecomshoot", k: ["white background", "plain background", "amazon listing", "product listing", "catalogue shoot", "ecommerce shoot", "lifestyle product", "flat lay shoot", "jewellery shoot", "jewelry shoot", "clothing shoot", "model shoot for brand"],
      r: ["Clean white-background shots or styled lifestyle photos, or both. Tell us what you sell and how many products."], c: ["Book a shoot", "See our work ↗"], a: "cat:Products" },
    { id: "propertyshoot", k: ["airbnb photos", "property photos", "rental photos", "apartment photos", "villa photos", "hotel photos", "interior photos", "office photos", "real estate listing"],
      r: ["Bright, wide and honest property photos that help places get booked or sold. Tell us the location and size."], c: ["Book a shoot"], a: "cat:Real Estate" },
    { id: "graduation", k: ["graduation shoot", "convocation shoot", "graduation photos", "convocation photos", "cap and gown"],
      r: ["Congratulations, graduate! Convocation photos are a proud moment. Shall we book one?"], c: ["Book a shoot"], a: "cat:Portraits" },
    { id: "headshotshoot", k: ["linkedin headshot", "corporate headshot", "professional headshot", "office headshots", "team headshots", "resume photo", "cv photo", "passport photo"],
      r: ["Professional headshots: yes! Passport photos: not really our thing. For LinkedIn and company profiles, we'd love to help."], c: ["Book a shoot"], a: "cat:Portraits" },
    { id: "maternityshoot", k: ["maternity shoot", "pregnancy shoot", "baby bump", "maternity photos"],
      r: ["Maternity shoots are beautiful and gentle. Tell the team your due date and the vibe you'd like."], c: ["Book a shoot"], a: "cat:Portraits" },
    { id: "concertshoot", k: ["concert photos", "band photos", "music gig", "live music", "dance performance", "stage photos", "theatre photos", "drama"],
      r: ["Performances are some of our favourite things to shoot. Low light, big energy, great moments."], c: ["Book a shoot", "See our work ↗"], a: "cat:Events:Performing Arts" },
    { id: "pageant", k: ["pageant", "fashion show", "beauty contest", "ramp walk", "runway"],
      r: ["Pageants and fashion shows are right up our street. We've shot pageants before. Tell us about yours!"], c: ["Book a shoot"], a: "cat:Events:Miss Universe" },
    { id: "collegeevents", k: ["college event", "college fest", "cultural fest", "techfest", "school event", "annual day", "sports day"],
      r: ["College and school events are full of energy. Share the date and venue, and the team will plan coverage."], c: ["Book a shoot"], a: "cat:Events" },
    { id: "religiousevent", k: ["pooja function", "puja function", "satyanarayana", "vratham", "upanayanam", "thread ceremony", "mundan", "nikah", "baptism", "communion"],
      r: ["Traditional ceremonies are beautiful to photograph, and the team shoots them respectfully. Share the date and venue."], c: ["Book a shoot"], a: "cat:Events" },
    { id: "anniversaryshoot", k: ["anniversary shoot", "25th anniversary", "silver jubilee", "golden jubilee", "parents anniversary"],
      r: ["What a lovely occasion. Anniversary photos become family treasures. Want to plan one?"], c: ["Book a shoot"], a: "cat:Events" },
    { id: "motto", k: ["tagline", "motto", "capture create inspire", "your slogan", "philosophy", "your vision", "mission"],
      r: ["Capture. Create. Inspire. That's our motto. And our belief: unfiltered truth in every frame."] },
    { id: "whyname", k: ["why living room labs", "why the name", "meaning of living room labs", "name meaning", "why is it called", "living room labs meaning"],
      r: ["I like to think it's because the best ideas start in a living room. Ask the team for the real story, they tell it better!"], c: ["Meet the team ↗"] },
    { id: "whyfotu", k: ["why fotu", "why are you called fotu", "what does fotu mean", "meaning of fotu", "fotu meaning", "who named you"],
      r: ["Fotu is how lots of people in India say 'photo'. So my name is literally 'photo'. Very on brand."] },
    { id: "behance", k: ["behance", "unsplash", "portfolio link", "full portfolio", "more work"],
      r: ["Every shoot we're proud of ends up in What We Capture. Some of the team also share work on their own Instagram and Unsplash pages."], c: ["See our work ↗", "Meet the team ↗"] },

    /* ---------- everyday life ---------- */
    { id: "coffee", k: ["need coffee", "need chai", "coffee please", "tea please", "first coffee", "morning coffee", "coffee addict", "chai lover", "filter coffee"],
      r: ["Same! Well, I run on light, but I respect the coffee ritual.", "Chai first, decisions later. That's the Hyderabad way."] },
    { id: "monday", w: 1.3, k: ["monday", "monday blues", "i hate mondays", "its monday", "monday morning"],
      r: ["Mondays: the blurry photo of the week. It gets sharper by Wednesday.", "Monday again? Be strong. Friday is only four naps away."] },
    { id: "friday", k: ["its friday", "friday", "tgif", "friday night", "finally friday"],
      r: ["TGIF! The weekend's golden hour is almost here.", "Friday! My favourite day to see people's weekend photos."] },
    { id: "weekendu", k: ["its the weekend", "weekend vibes", "lazy weekend", "sunday funday", "long weekend", "weekend is here", "saturday night"],
      r: ["Weekend vibes! Perfect time for a photo walk, or a really good nap.", "Enjoy the weekend{name}! Go somewhere photogenic."] },
    { id: "holidayu", k: ["need a holiday", "need a vacation", "need a break", "on leave", "on vacation", "back from vacation", "holiday plans", "going on holiday", "leave from office"],
      r: ["Take it! Breaks are important. And they make great photos.", "Vacations are for resting and taking too many photos. Enjoy!"] },
    { id: "late", k: ["im late", "running late", "i overslept", "overslept", "missed my alarm", "late for work", "late for class", "missed the bus"],
      r: ["Oops! Go, go, go! I'll be here when you're back.", "Happens to the best of us. Even I oversleep, and I'm a camera."] },
    { id: "procrastinate", k: ["procrastinating", "procrastination", "dont want to work", "lazy", "feeling lazy", "no motivation", "cant focus", "distracted"],
      r: ["Try five minutes of the task, then decide. Usually you keep going. That's the secret.", "Lazy days happen. Do one small thing, then reward yourself with a nice photo scroll."] },
    { id: "relax", k: ["how to relax", "relax", "calm down", "meditation", "meditate", "breathe", "anxiety tips", "stress relief"],
      r: ["Try this: slow breath in for four, hold for four, out for four. Then look at something beautiful for a minute.", "Step outside, look at the sky for a minute. Free, and surprisingly calming."] },
    { id: "chores", k: ["laundry", "cleaning", "cleaning the house", "washing dishes", "dishes", "chores", "housework", "grocery", "groceries", "vegetables"],
      r: ["Chores! The unglamorous side of life. Put on music and pretend it's a montage.", "Good luck! Tidy rooms make great backgrounds for photos, by the way."] },
    { id: "powercut", k: ["power cut", "no power", "current poyindi", "light gayi", "no electricity", "no wifi", "wifi not working", "internet is slow", "net is slow", "no internet"],
      r: ["Oh no! Power cuts are perfect for candlelight photos, though. Silver linings.", "Slow internet is the worst. Hope it's back soon!"] },
    { id: "phoneissue", k: ["phone broke", "phone is broken", "cracked screen", "lost my phone", "phone battery", "battery low", "phone died", "storage full", "phone storage"],
      r: ["Ouch. Back up your photos often! Lost photos are the saddest thing in the world.", "Storage full? Probably too many great photos. Back them up somewhere safe."] },
    { id: "money_u", k: ["salary day", "payday", "got paid", "no money", "im broke", "rent", "bills", "emi", "savings", "budget tight", "expenses"],
      r: ["Money stuff is real. Spend on what you'll remember, I say. Like photos. (I'm biased.)", "Payday! Treat yourself to something small and nice."] },
    { id: "relatives", k: ["keep asking", "asking when", "when im getting married", "when will you get married", "when will i get married", "marriage pressure", "pressure to marry", "relatives", "relatives asking", "when are you getting married", "sharma ji ka beta", "aunties", "family function", "cousin", "cousins", "guests at home", "in laws", "inlaws"],
      r: ["Relatives asking questions? Smile, nod, and say you're busy with a photoshoot.", "Family functions: great food, endless questions, and the best candid photos."] },
    { id: "haircut", k: ["new haircut", "got a haircut", "new hairstyle", "bad haircut", "bad hair day", "new look", "makeover"],
      r: ["New look! Sounds like it's time for new photos.", "Bad hair day? Good lighting fixes most things. Trust me."] },
    { id: "gymu", k: ["going to gym", "gym time", "leg day", "workout done", "i worked out", "fitness goals", "six pack", "running today", "walked 10000 steps"],
      r: ["Proud of you! My only workout is walking left and right at the bottom of the screen.", "Fitness! Go you. Post-workout glow photographs well."] },
    { id: "plants", k: ["my plants", "gardening", "plants", "terrace garden", "flowers bloomed", "watering plants"],
      r: ["Plants are wonderful photo subjects. They never complain about posing.", "Plant parent! Shoot them in soft morning light."] },
    { id: "gaming", k: ["gaming", "playing games", "pubg", "bgmi", "free fire", "minecraft", "fortnite", "valorant", "gta", "playstation", "ps5", "xbox", "nintendo", "video games"],
      r: ["Gamer! Some video games have amazing photo modes. Basically virtual photography.", "Gaming sounds fun. My controls are very simple: tap to wake, tap to chat."] },
    { id: "learnlang", k: ["learning a language", "learn english", "learn telugu", "learn hindi", "learning french", "duolingo"],
      r: ["Learning a language is great. Photography is a language too, one that everyone understands."] },
    { id: "resolution", k: ["new year resolution", "resolution", "goals for this year", "my goals", "life goals", "bucket list"],
      r: ["Add 'take more photos of the people I love' to the list. Best resolution ever."] },
    { id: "zodiac", k: ["zodiac", "horoscope", "astrology", "my sign", "your sign", "what is your zodiac", "aries", "taurus", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces", "rashi"],
      r: ["I'm a Shutterius. Very compatible with golden hour.", "The stars say today is great for photos. Then again, I always say that."] },
    { id: "luck", k: ["wish me luck", "good luck", "all the best", "best of luck", "fingers crossed", "pray for me"],
      r: ["All the best{name}! You've got this. 🍀", "Good luck! I'm crossing my tripod legs for you."] },
    { id: "thanksday", k: ["have a nice day", "have a good day", "have a great day", "enjoy your day", "have a good one", "have a good night", "have a nice weekend", "enjoy your weekend"],
      r: ["You too{name}! Go find some good light today.", "Thank you! Same to you, have a wonderful day."] },
    { id: "goodnews2", k: ["i have news", "guess what", "big news", "exciting news"],
      r: ["Ooh, tell me! I love good news.", "What is it? I'm all lens!"] },
    { id: "birthdayfotu", k: ["happy birthday fotu", "when is your birthday", "do you have a birthday", "your bday"],
      r: ["My birthday is whenever someone books a shoot. So, maybe today?", "I was built in 2026. Every day I get woken up feels like a birthday."] },
    { id: "kids_u", k: ["my child", "my baby is", "parenting", "my son is", "my daughter is", "school run", "homework help"],
      r: ["Kids grow up so fast. Take lots of photos. You'll treasure every one.", "Parenting is a full-time shoot with no breaks. Respect!"] },
    { id: "elders", k: ["my grandparents", "my grandmother", "my grandfather", "nanamma", "thatha", "ammamma", "dadi", "nani", "dada"],
      r: ["Grandparents' photos are the most precious ones. Take a portrait of them, it means the world later.", "Aww. Make time for a photo with them soon. It's always worth it."], c: ["Book a shoot"] },
    { id: "pets_u2", k: ["my dog is", "my cat is", "dog ate", "cat broke", "pet is sick", "vet", "pet food", "walk the dog", "dog walk"],
      r: ["Pets keep life interesting! Give them a treat from me.", "Pets are chaos and love in equal parts. Best models ever, though."] },
    { id: "foodcraving", k: ["craving", "i want biryani", "i want pizza", "i want ice cream", "something sweet", "sweet tooth", "hungry now", "starving", "im starving"],
      r: ["Go get it! Life's too short to ignore biryani cravings.", "Craving something? That's a sign. Treat yourself. And photograph it first."] },
    { id: "whatday", k: ["is it weekend yet", "is it friday yet", "how many days to weekend", "is today a holiday", "holiday today"],
      r: function () { var d = new Date().getDay(); return [d === 0 || d === 6 ? "It's the weekend! Enjoy it." : d === 5 ? "It's Friday! The weekend is basically here." : "Not yet! " + (5 - d) + " more day" + (5 - d === 1 ? "" : "s") + " to Friday. Hang in there."]; } },
    { id: "ageuser", k: ["how old am i", "guess my age", "am i old", "do i look old", "my age"],
      r: ["I'd guess 'young at heart'. Cameras are very polite about age.", "Age is just a number. Good light takes ten years off anyone."] },
    { id: "nameuser", k: ["what is my name", "whats my name", "do you know my name", "say my name", "remember my name"],
      r: function () { return [chat.name ? "You're " + chat.name + "! I never forget a name." : "You haven't told me yet! What's your name?"]; } },
    { id: "lostthing", k: ["lost my", "cant find my", "where did i keep", "forgot my keys", "lost my keys", "lost my wallet"],
      r: ["Oh no! Retrace your steps. And check the last photo you took, it might show where you left it.", "Lost things always turn up in the last place you look. Good luck!"] },

    /* ---------- banter and quirky questions ---------- */
    { id: "hug", k: ["hug", "hug me", "can i hug you", "virtual hug", "give me a hug", "hugs"],
      r: ["*gives you a gentle camera hug* Careful with the lens!", "Hug received and returned. 🤗"] },
    { id: "highfive", k: ["high five", "hi five", "fist bump", "pound it", "up top"],
      r: ["✋ *slaps tiny camera hand* Nailed it.", "Fist bump! 👊 Gently. I'm made of plastic."] },
    { id: "wink", k: ["wink", "can you wink", "blink for me"],
      r: ["*winks with the small eye* 😉", "I just winked. You probably missed it. I'm very fast."], a: "dance" },
    { id: "tickle", k: ["tickle", "tickle you", "boop", "pinch"],
      r: ["Hehe, stop! I'm ticklish around the flash.", "Boop! 👉📷"], a: "dance" },
    { id: "pickup", k: ["pickup line", "pick up line", "flirt", "flirt with me", "say something romantic", "rizz"],
      r: ["Are you a camera flash? Because you just lit up my day.", "Are you golden hour? Because everything looks better when you're around.", "You must be a good photo, because I can't stop focusing on you."] },
    { id: "rap", k: ["rap", "rap for me", "beatbox", "freestyle", "drop a beat"],
      r: ["Yo, I'm Fotu, I click and I glow, golden hour's my flow, now book a shoot, yo. 🎤", "Click-clack, flash, back, shutter on track. That's my whole album."] },
    { id: "superpower", k: ["superpower", "your superpower", "special power", "what can you do best", "your talent", "hidden talent"],
      r: ["My superpower is freezing time. One click and the moment stays forever.", "I can make anyone look good with the right light. Also, I nap on command."] },
    { id: "weakness", k: ["your weakness", "weakness", "what are you bad at", "biggest flaw"],
      r: ["Fingerprints on my lens. And stairs. Definitely stairs.", "I'm terrible at maths beyond f-numbers, and I can't resist a good pun."] },
    { id: "fear", k: ["what are you afraid of", "your fear", "biggest fear", "are you scared"],
      r: ["Lens caps left on during important moments. Truly terrifying.", "Dropping into a swimming pool. And people who use flash at concerts."] },
    { id: "favphotographer", k: ["favourite photographer", "favorite photographer", "famous photographer", "photographer you admire", "raghu rai", "steve mccurry", "cartier bresson", "annie leibovitz"],
      r: ["The team, obviously! But legends like Raghu Rai and Steve McCurry are big inspirations in the photo world.", "Every great photographer has one thing in common: patience. And lots of deleted photos."] },
    { id: "crush", k: ["do you have a crush", "your crush", "who do you like", "celebrity crush", "are you in love"],
      r: ["I have a huge crush on golden hour. It's mutual, I think.", "My crush is a very handsome tripod. Don't tell anyone."] },
    { id: "wouldyourather", k: ["would you rather", "this or that", "truth or dare", "never have i ever", "ask me something", "ask me a question", "quiz me"],
      r: ["Would you rather have a perfect photo of every day of your life, or one magical photo of your best day? 🤔", "Truth: what's the best photo you've ever taken? Tell me!", "Quick one: sunrise or sunset? Choose wisely."] },
    { id: "sunrise_sunset", k: ["sunrise or sunset", "i choose sunrise", "i choose sunset", "sunset is better", "sunrise is better"],
      r: ["Excellent choice. Both are golden, but sunset has better snacks.", "Great pick! Either way, it's prime photo time."] },
    { id: "tonguetwister", k: ["tongue twister", "say something fast"],
      r: ["Six sharp shutters snapped six shy sheep. Say that five times!", "Fotu focuses fast on fresh fried fish. Try it!"] },
    { id: "wordofday", k: ["word of the day", "teach me a word", "new word"],
      r: ["Word of the day: 'apricity', the warmth of the sun in winter. Very photogenic word.", "Word of the day: 'komorebi', sunlight filtering through leaves. A photographer's dream."] },
    { id: "spiritanimal", k: ["spirit animal", "if you were an animal"],
      r: ["A chameleon. Great at blending in, great with colour.", "An owl. Big eyes, works at night, judges silently."] },
    { id: "ifhuman", k: ["if you were human", "do you want to be human", "if you had a body", "if you could walk"],
      r: ["If I were human, I'd be a photographer. Obviously. And I'd eat all the biryani I've photographed.", "I'd go on a photo walk through the Old City and never stop clicking."] },
    { id: "paid", k: ["do you get paid", "your salary", "how much do you earn", "do you work for free", "are you paid"],
      r: ["Unpaid intern. Paid in compliments and sunlight.", "I'm paid in film rolls. Very hard to spend."] },
    { id: "vacationbot", k: ["do you take vacations", "do you go on holiday", "do you rest", "day off", "do you get tired"],
      r: ["Every nap is a mini vacation. I take about forty a day.", "I rest whenever nobody's looking. Which is why I snore."] },
    { id: "likejob", k: ["do you like your job", "do you enjoy this", "are you happy here", "do you like working here"],
      r: ["I love it! I get to look at beautiful photos and meet lovely people like you.", "Best job ever. Low stress, great views, unlimited naps."] },
    { id: "famous", k: ["are you famous", "are you popular", "how many people talk to you", "do people talk to you"],
      r: ["Famous at the bottom of this website. Huge in the footer scene.", "I have exactly as many fans as people who've tapped me. So, at least one!"] },
    { id: "selfdestruct", k: ["self destruct", "explode", "beep boop", "malfunction", "reboot", "restart yourself", "turn off"],
      r: ["Self-destruct cancelled. I'm too cute to explode.", "Beep boop. Rebooting... done. Still a camera."] },
    { id: "body", k: ["how tall are you", "your height", "how big are you", "your weight", "how heavy are you", "what are you made of", "whats inside you"],
      r: ["About 72 pixels tall on a laptop, 56 on a phone. Fun-sized.", "I'm made of code, colour stripes and good intentions."] },
    { id: "battery", k: ["your battery", "do you need charging", "are you charged", "what powers you", "do you run on batteries"],
      r: ["I run on sunlight and compliments. Currently 100% charged.", "Battery full! Your visit topped me up."] },
    { id: "waterproof", k: ["are you waterproof", "can you swim", "can you go in water", "underwater"],
      r: ["Absolutely not. Please keep me away from puddles and Holi water balloons.", "I sink like a stone. Underwater cameras are braver than me."] },
    { id: "eyes", k: ["do you have eyes", "why are your eyes different", "one eye bigger", "your eyes"],
      r: ["One eye is my lens, the other is my viewfinder. That's why they're different sizes. Very professional.", "I see everything in good light. In bad light, I squint."] },
    { id: "legs", k: ["do you have legs", "why do you have legs", "your legs", "can you walk", "why do you walk"],
      r: ["I grew legs so I could find the best angle. Photographers walk a lot.", "Yes! Tiny legs, big ambitions."] },
    { id: "rainbowstripe", k: ["your stripe", "rainbow stripe", "why rainbow", "your colours", "your colors"],
      r: ["My stripe is a tribute to classic instant cameras. Red, orange, green, blue. Very retro, very me."] },
    { id: "printphoto", k: ["print a photo", "print me", "give me a photo", "send me a photo", "show me a photo"],
      r: ["*whirr* Here's a tiny instant print, just for you! (It's imaginary, but it's beautiful.)"], a: "selfie" },
    { id: "boredfotu", k: ["are you bored", "do you get bored", "are you lonely", "do you feel lonely"],
      r: ["Never bored! There are so many photos to look at. And visitors like you.", "A little lonely sometimes. Thanks for chatting!"] },
    { id: "favvisitor", k: ["am i your favourite", "am i your favorite", "favourite person", "who is your favourite"],
      r: ["Right now? Definitely you{name}. Don't tell the others.", "You're in my top one! Out of everyone talking to me right now."] },
    { id: "smile", k: ["smile", "smile for me", "show me your smile", "be happy"],
      r: ["😁 *biggest camera smile*", "Smiling! It's actually my default setting."], a: "dance" },
    { id: "sing2", k: ["sing a telugu song", "sing a hindi song", "sing happy birthday", "sing for me"],
      r: ["🎵 Happy click to you, happy click to you... 🎵 That's all I know, sorry!", "🎵 La la la, click click, flash! 🎵 Thank you, thank you."] },
    { id: "lie", k: ["tell me a lie", "lie to me", "are you lying", "do you lie"],
      r: ["I've never taken a blurry photo. (That's a lie.)", "I'm the tallest camera in Hyderabad. (Also a lie.)"] },
    { id: "compareai", k: ["are you chatgpt", "are you siri", "are you alexa", "are you gemini", "are you claude", "which ai are you", "what ai are you"],
      r: ["Nope, I'm Fotu! A small, handmade bot for Living Room Labs. Much less clever, much cuter.", "I'm just Fotu. Think of me as a friendly receptionist made of pixels."] }
  ]);

  /* more word lists */
  LEXICON = LEXICON.concat([
    { id: "movie", words: "baahubali bahubali rrr pushpa salaar kalki devara arjun reddy eega magadheera jersey mahanati sita ramam hi nanna ala vaikunthapurramuloo pokiri athadu khaleja geetha govindam fidaa sholay ddlj lagaan dangal jawan pathaan kgf kantara jailer premam drishyam avengers titanic inception interstellar oppenheimer barbie avatar joker batman spiderman superman harry potter lord of the rings star wars frozen lion king toy story",
      r: ["{W}! Great pick. The cinematography in big films is a masterclass in light.", "{W}? Oh, the visuals! Every frame could be a photograph.", "I've heard {w} has some stunning shots. Our DOP would have opinions!"] },
    { id: "star", words: "prabhas mahesh babu allu arjun jr ntr ram charan chiranjeevi pawan kalyan vijay deverakonda samantha rashmika sai pallavi keerthy suresh anushka shetty shah rukh khan srk salman aamir ranbir ranveer deepika alia katrina priyanka hrithik akshay rajinikanth kamal haasan dhanush yash dhoni sachin",
      r: ["{W}! I'd love to photograph them. Though I'd probably get starstruck and blur the shot.", "Famous faces still need good light, same as everyone. {W} included.", "{W}! If they ever need a shoot in Hyderabad, I'll be ready."] },
    { id: "clothes", words: "saree sari lehenga kurta kurti sherwani dhoti pancha langa voni half saree salwar churidar anarkali blazer tuxedo jeans tshirt shirt dress gown jacket hoodie sneakers heels jhumka jhumkas bangles necklace sunglasses",
      r: ["{W}! Looks gorgeous on camera, especially with rich colours and good light.", "A {w} for the shoot? Lovely choice. Bring a backup outfit too, just in case.", "{W} photographs beautifully. Make sure it's ironed, though. Cameras notice everything!"], c: ["What should I wear?", "Book a shoot"] },
    { id: "hobby", words: "reading painting drawing sketching singing dancing guitar piano drums violin writing poetry journaling knitting crochet pottery baking hiking trekking camping cycling swimming fishing birdwatching chess blogging vlogging",
      r: ["{W}! That's a lovely hobby. And very photogenic.", "I love that you enjoy {w}. A photo of you doing it would be great.", "{W}? Nice! Hobbies make the most honest portraits."], c: ["Book a shoot"] },
    { id: "drink", words: "cappuccino latte espresso cold coffee lassi buttermilk majjiga nimbu pani lemonade coconut water beer wine whisky cocktail mocktail",
      r: ["{W}! Nice. Drinks photograph beautifully with a bit of backlight.", "A {w} sounds good right now. Enjoy it!", "{W}? Cheers! 🥂"] },
    { id: "country", words: "india usa america uk england canada australia germany france italy spain japan china korea malaysia indonesia vietnam uae qatar saudi oman kuwait bhutan bangladesh pakistan africa kenya egypt russia brazil mexico switzerland netherlands ireland scotland new zealand",
      r: ["{W}! Beautiful place. Our photographers would happily pack a bag.", "Hello to {w}! Are you visiting Hyderabad, or planning a shoot there?", "{W}! I've only seen it in photos, and they all look great."], c: ["Do you travel?", "Book a shoot"] },
    { id: "state", words: "telangana andhra pradesh karnataka tamil nadu maharashtra gujarat rajasthan punjab haryana uttar pradesh bihar west bengal odisha assam sikkim meghalaya himachal uttarakhand madhya pradesh chhattisgarh jharkhand",
      r: ["{W}! Every state in India is a photographer's dream.", "{W}? Lovely. Mention it in your enquiry if you want a shoot there."], c: ["Do you travel?"] },
    { id: "brand", words: "apple microsoft zomato swiggy facebook whatsapp netflix spotify tata reliance infosys tcs wipro starbucks mcdonalds kfc dominos ikea nike adidas puma zara",
      r: ["{W}! Big brands spend a lot on great photos. Small brands deserve them too.", "{W}? If you're a brand that needs photos, we'd love to help."], c: ["Book a shoot"] }
  ]);
  (function prepNewLists() {
    var extra = ["arjun reddy", "sita ramam", "hi nanna", "geetha govindam", "lion king", "toy story", "harry potter", "lord of the rings", "star wars", "ala vaikunthapurramuloo", "mahesh babu", "allu arjun", "jr ntr", "ram charan", "pawan kalyan", "vijay deverakonda", "sai pallavi", "keerthy suresh", "anushka shetty", "shah rukh khan", "kamal haasan", "half saree", "langa voni", "cold coffee", "nimbu pani", "coconut water", "new zealand", "andhra pradesh", "tamil nadu", "uttar pradesh", "west bengal", "madhya pradesh"];
    LEXICON.forEach(function (L) {
      if (L.wordset) return;
      var rest = " " + L.words + " ", phrases = [], words = {};
      extra.forEach(function (m) { if (rest.indexOf(" " + m + " ") !== -1) { phrases.push(m); rest = rest.split(" " + m + " ").join(" "); } });
      rest.trim().split(/\s+/).forEach(function (w) { if (w) words[w] = 1; });
      L.phrases = phrases; L.wordset = words;
    });
  })();

  /* hate aimed at a group of people, written any way: "i hate <group>", "ban <group>" */
  var GROUP_HATE = /\b(hate|kill|ban|deport|disgusting|filthy|dirty)\b.{0,20}\b(muslims?|hindus?|christians?|sikhs?|jews?|buddhists?|gays?|lesbians?|trans|women|men|girls|boys|dalits?|brahmins?|blacks?|whites?|africans?|chinese|pakistanis?|biharis?|tamils?|telugus?|bengalis?|marathis?|north indians?|south indians?|foreigners?|immigrants?|refugees?|disabled)\b/i;
  var GROUP_HATE_R = ["Everyone's welcome here, whoever they are. Cameras don't care about anything except good light. Neither do we.",
    "That's not how we see the world. Through our lens, everyone deserves to be photographed beautifully.",
    "I'm going to respectfully disagree. Every face, every family, every story deserves a great photo. Including yours."];

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
    /* docked: when the corner is busy (photos, banners), Fotu sits on a small round badge there
       instead of hiding, so it is always visible and one tap away */
    "#fotu-bot.peek{width:52px;height:52px}",
    "#fotu-bot.peek::before{content:'';position:absolute;inset:-9px;border-radius:50%;background:var(--f-paper);border:1px solid var(--f-line);box-shadow:0 6px 22px rgba(0,0,0,.18);z-index:-1}",
    "#fotu-bot.peek .zz{right:-14px;top:-18px}",
    "#fotu-bot.peek .fb{animation-duration:3.4s}",
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
    "#fotu-root.gone #fotu-bot,#fotu-root.gone #fotu-bub{opacity:0;pointer-events:none}",
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
    "#fotu-back{position:fixed;right:0;left:auto;top:auto;bottom:calc(96px + env(safe-area-inset-bottom,0px));z-index:400;width:30px;height:36px;border-radius:10px 0 0 10px;border:1px solid var(--f-line);border-right:0;background:var(--f-paper);cursor:pointer;display:none;align-items:center;justify-content:center;padding:0 0 0 2px;box-shadow:-2px 2px 10px rgba(0,0,0,.10);opacity:.8;transition:opacity .2s}",
    "#fotu-back:hover,#fotu-back:focus-visible{opacity:1}",
    "#fotu-root.paused #fotu-bot,#fotu-root.paused #fotu-bub,#fotu-root.paused #fotu-back{opacity:0;pointer-events:none}",
    "@media (max-width:640px){#fotu-chips{flex-wrap:nowrap;overflow-x:auto;max-height:none;padding-bottom:4px;scrollbar-width:none}#fotu-chips::-webkit-scrollbar{display:none}#fotu-chips button{flex:none}}",
    "@media (max-width:640px){#fotu-bot{width:56px;height:56px}#fotu-bot.peek{width:44px;height:44px}#fotu-bot.peek::before{inset:-8px}#fotu-panel{left:8px!important;right:8px;width:auto!important;top:auto!important;bottom:calc(8px + env(safe-area-inset-bottom,0px));height:min(480px,72vh)}#fotu-bub{max-width:200px;font-size:13px}}",
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
  var TEXT_MARGIN = 8, PEEK = 24, peeking = false, bubbleMayCover = false;
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
    if (peeking) return true;
    var s = size();
    return withProbe(function (cache) { return rectFreeIn(pos.x - 4, pos.y - HEAD, s + 8, s + HEAD, 10, cache); });
  }
  /* Fotu's home is the bottom-right corner, always. If the corner is clear it stands there
     (and may stroll along the clear stretch on desktop). If it isn't - photos, banners, a full
     grid - it sits there "docked" on a small round badge instead of disappearing, so everyone
     can always see it and tap it. The badge steps up out of the way of any small button that
     lives in that corner (Spotlight switch, slideshow pause...). */
  var DOCK_PAD = 9, DOCK_EDGE = 12, DOCK_LIFT = 10;
  var CONTROL_SEL = "a,button,input,select,textarea,label,summary,[role='button'],[role='link']";
  function freeSize() { return window.matchMedia("(max-width:640px)").matches ? 56 : 72; }
  function cornerX(s) { return window.innerWidth - s - (window.innerWidth <= 640 ? 12 : 18); }
  function cornerFree() {
    var s = freeSize(), x = cornerX(s), y = laneY(s);
    return withProbe(function (cache) { return rectFreeIn(x - 4, y - HEAD, s + 8, s + HEAD, 10, cache); });
  }
  /* true when no small control (button, link...) sits under this rectangle; big clickable
     cards like photo tiles don't count - the badge may overlap those a little */
  function controlsFreeIn(l, t, w, h) {
    return withProbe(function () {
      for (var y = t; ; y += 10) {
        var yy = Math.min(y, t + h);
        for (var x = l; ; x += 10) {
          var xx = Math.min(x, l + w), st = stackAt(xx, yy);
          for (var i = 0; i < st.length; i++) {
            var el = st[i];
            if (el === document.documentElement || el === document.body || root.contains(el)) continue;
            var c = el.closest ? el.closest(CONTROL_SEL) : null;
            if (!c) continue;
            var r = c.getBoundingClientRect();
            if (r.width * r.height <= 170 * 170) return false;
          }
          if (xx >= l + w) break;
        }
        if (yy >= t + h) break;
      }
      return true;
    });
  }
  function dockSpot() {
    var s = size(), x = window.innerWidth - s - DOCK_PAD - DOCK_EDGE, base = laneY(s) - DOCK_LIFT;
    var top = Math.max(bounds().minY, base - 280);
    for (var y = base; y >= top; y -= 16) {
      if (controlsFreeIn(x - DOCK_PAD, y - DOCK_PAD, s + 2 * DOCK_PAD, s + 2 * DOCK_PAD)) return { x: x, y: y };
    }
    return { x: x, y: base };
  }
  function peekFree() { return true; } /* the docked badge is always allowed */
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
  /* make sure Fotu is somewhere sensible: where it stands if that's still clear, otherwise
     the bottom-right corner - standing if the corner is clear, docked on its badge if not. */
  function enterPeek() {
    if (walking) stopWalk();
    peeking = true; bot.classList.add("peek"); dir = -1;
    var d = dockSpot(); pos.x = d.x; pos.y = d.y; bot.style.transition = NOMOVE; place();
    if (away) { away = false; refreshVis(); }
  }
  function exitPeek() { peeking = false; bot.classList.remove("peek"); }
  function standAtCorner() {
    if (walking) stopWalk();
    exitPeek();
    pos.x = cornerX(size()); pos.y = bounds().maxY; dir = -1; bot.style.transition = NOMOVE; place();
    if (away) { away = false; refreshVis(); }
  }
  function settle() {
    if (hidden) { placeBack(); return; }
    if (!peeking && !away && footprintFree()) return;           /* still on clear ground: stay */
    if (cornerFree()) {
      if (peeking || away || shy) standAtCorner();
      else { poofing = true; refreshVis(); hideBubble(); if (walking) stopWalk();
             setTimeout(function () { poofing = false; standAtCorner(); refreshVis(); }, 260); }
      return;
    }
    if (peeking) {                                               /* already docked: just keep the spot right */
      var d = dockSpot();
      if (Math.abs(d.x - pos.x) > 1 || Math.abs(d.y - pos.y) > 1) { pos.x = d.x; pos.y = d.y; bot.style.transition = NOMOVE; place(); }
      if (away) { away = false; refreshVis(); }
      return;
    }
    if (away || shy) { enterPeek(); return; }
    poofing = true; refreshVis(); hideBubble(); if (walking) stopWalk();
    setTimeout(function () { poofing = false; enterPeek(); refreshVis(); }, 260);
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
    if (!c && peeking && bubbleMayCover) {
      for (var q = 0; q < cands.length && !c; q++) {
        var k2 = cands[q];
        if (k2.t >= 8 && k2.l >= 8 && k2.l + k2.w <= W - 8 && k2.t + k2.h <= H - 4) c = k2;
      }
    }
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
    bubbleMayCover = !!opt.force;
    var placedOk = placeBubble(text);
    bubbleMayCover = false;
    if (!placedOk) return false;
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
  function backFree() { return true; } /* the bring-back tab stays put; nothing to re-check */
  setInterval(function () {
    if (document.hidden || shy || paused) return;
    if (hidden) return;
    if (!placed) { start(); return; }
    if (isOpen || walking || poofing) return;
    if (away || peeking) { settle(); return; }
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
    if (peeking) {
      clearTimeout(shyTimer);
      shyTimer = setTimeout(function () { settle(); consumeFast(); }, 280);
      return;
    }
    if (!shy) {
      shy = true; refreshVis();
      if (walking) stopWalk();
      hideBubble();
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
    if (/ on Instagram ↗$/.test(label) && chat.memberIg) { window.open(chat.memberIg, "_blank", "noopener"); return; }
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
    whats: "what is", hows: "how is", gud: "good", gd: "good", evng: "evening", eve: "evening", mrng: "morning", mrg: "morning", nyt: "night", nite: "night", aftrnoon: "afternoon", luv: "love", bday: "bday", gr8: "great", ppl: "people", sry: "sorry", srry: "sorry", tmrw: "tomorrow", tmr: "tomorrow", "2day": "today", "2morrow": "tomorrow", wheres: "where is", whos: "who is", im: "im", cant: "cannot", dont: "do not", doesnt: "does not", shud: "should", shld: "should", wud: "would", cud: "could", y: "why", k: "k" };
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
    var score = 0, i, j, used = {};
    /* phrases: longer matches count for more (2-word = 4, 5-word = 7) */
    for (i = 0; i < it.phrases.length; i++) {
      var ph = it.phrases[i];
      if (n.indexOf(ph.p) !== -1 || nSq.indexOf(ph.sq) !== -1) {
        score += 2 + ph.len;
        ph.p.trim().split(" ").forEach(function (w) { used[w] = 1; });
      }
    }
    /* single words: each word of the message counts once (2 exact, 1.2 typo), unless a phrase already used it */
    for (j = 0; j < toks.length; j++) {
      if (used[toks[j]]) continue;
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
    return { intent: ok ? best : null, cat: cat, score: bestScore };
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

    var tm = teamMemberReply(t);
    if (tm) {
      topic("team_member"); chat.unknownStreak = 0; botSay(tm.line);
      chat.memberIg = tm.ig; chipsLater(tm.ig ? [tm.name + " on Instagram ↗", "Meet the team ↗", "Book a shoot"] : ["Meet the team ↗", "Book a shoot"]); return;
    }
    var nr = nicheReply(t);
    if (nr) { topic("niche"); chat.unknownStreak = 0; botSay(nr); chipsLater(["See our work ↗", "Book a shoot"]); return; }
    if (GROUP_HATE.test(t)) { topic("hate_group"); chat.unknownStreak = 0; botSay(GROUP_HATE_R[(chat.rot.gh = (chat.rot.gh || 0) + 1) % GROUP_HATE_R.length]); chipsLater(FAQ_CHIPS); return; }
    var gl = glossaryReply(t);
    if (gl) { topic("glossary"); chat.unknownStreak = 0; botSay(gl); chipsLater(["Another tip", "Book a shoot"]); return; }
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
    /* a weak, typo-only topic match loses to a clear word-list hit ("i like painting") */
    if (u.intent && u.score < 2.5) { var lxw = lexiconReply(t); if (lxw) { topic(lxw.id); chat.unknownStreak = 0; botSay(lxw.line); chipsLater(lxw.c || FAQ_CHIPS); return; } }
    if (u.intent) { answerIntent(u.intent, u.cat, t); return; }
    if (u.cat) { answerIntent(u.cat); return; }
    if (/^(why|how come)\b/i.test(t)) { var pw = patternReply(t); if (pw) { topic("smalltalk"); chat.unknownStreak = 0; botSay(pw.line); chipsLater(pw.c || FAQ_CHIPS); return; } }
    var lx = lexiconReply(t);
    if (lx) { topic(lx.id); chat.unknownStreak = 0; botSay(lx.line); chipsLater(lx.c || FAQ_CHIPS); return; }
    var pr = patternReply(t);
    if (pr) { topic("smalltalk"); chat.unknownStreak = 0; botSay(pr.line); chipsLater(pr.c || FAQ_CHIPS); return; }
    if (t.length > 160) {
      chat.lastUnknown = t; chat.offer = "team"; topic("long_message");
      botSay("That sounds like a proper brief! Want me to send it straight to the team as an enquiry?");
      chipsLater(["Send my question to the team", "What do you shoot?"]); return;
    }
    logUnknown(t); chat.unknownStreak++; chat.lastUnknown = t;
    var isQ = /\?\s*$/.test(t) || /^(what|why|how|when|where|who|which|is|are|can|could|do|does|did|will|would|should|shall|may|kya|kaise|kab|kahan|kyun|enti|ela|eppudu|ekkada|enduku)\b/i.test(t);
    if (chat.unknownStreak >= 3 && isQ) {
      chat.offer = "team"; botSay(FALLBACK_TWICE);
      chipsLater(["Send my question to the team", "Talk to a human", "What do you shoot?"]);
    } else if (isQ) {
      chat.offer = null; botSay(FALLBACK_Q[chat.fbIndex++ % FALLBACK_Q.length]);
      chipsLater(["What do you shoot?", "How much does it cost?", "Book a shoot", "Tell me a joke"]);
    } else {
      chat.offer = null; botSay(Math.random() < 0.5 ? FALLBACK_S[chat.fbIndex++ % FALLBACK_S.length] : FALLBACK[chat.fbIndex++ % FALLBACK.length]);
      chipsLater(["What do you shoot?", "Tell me a joke", "Fun fact", "Book a shoot"]);
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
    var c = chat.enq.cat, line;
    if (c === "Pets") line = "Is the model well-behaved? Asking for me. What's your email, so the team can reply?";
    else if (c === "General Enquiry") line = chat.enq.what ? "Got it! The team loves something different. What's your email, so they can reply?" : "No problem, the team will work it out with you. What's your email, so they can reply?";
    else line = "Great choice. What's your email, so the team can reply?";
    botSay(line);
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
    var e = chat.enq, what = (e.cat === "General Enquiry" && e.what ? e.what : e.cat) + (e.ev ? " (" + e.ev + ")" : "");
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
      if (!e.cat && low === "something else") {
        e.cat = "General Enquiry";
        botSay("Ooh, something different! What would you like us to shoot?");
        setStep("other", ["Cancel"], "e.g. graduation, music band, car, art...");
        return;
      }
      if (!e.cat) { e.cat = "General Enquiry"; e.what = v.slice(0, 60); }
      if (e.cat === "Events" && !e.ev) { askEvent(); return; }
      askEmail(); return;
    }
    if (s === "other") { e.what = v.slice(0, 60); askEmail(); return; }
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
      name: e.name, email: e.email, category: e.cat, message: (e.what ? "Shoot: " + e.what + "\n\n" : "") + e.msg,
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
  /* "bring Fotu back" is a small fixed tab on the right edge of the screen. It never moves. */
  function placeBack() { back.style.visibility = "visible"; }
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
    if (cornerFree()) standAtCorner();
    else enterPeek();
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
