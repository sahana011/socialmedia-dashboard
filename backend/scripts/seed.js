// scripts/seed.js
// ─────────────────────────────────────────────────────────────────────────────
// One-time migration: seeds your existing dummy DB data into MongoDB.
// Run with:  node scripts/seed.js
// ─────────────────────────────────────────────────────────────────────────────
require('dotenv').config();
const mongoose = require('mongoose');
const Metric   = require('../models/Metric');
const Post     = require('../models/Post');
const User     = require('../models/User');
const Account  = require('../models/Account');

// ── Paste your existing DB data here ─────────────────────────────────────────
const METRICS = [
  {page:'Main',month:'Mar 2025',date:'2025-03-01',type:'Organic',views:2931469,reach:1749229,linkClicks:160668,profileVisits:132205,follows:11106,unfollows:8217,netFollowers:17122,messages:1571,adsSpent:0},
  {page:'Main',month:'Mar 2025',date:'2025-03-01',type:'Paid',views:5169983,reach:5908374,linkClicks:0,profileVisits:136916,follows:14233,unfollows:0,netFollowers:0,messages:1940,adsSpent:118025},
  {page:'Main',month:'Apr 2025',date:'2025-04-01',type:'Organic',views:6529210,reach:2357954,linkClicks:327661,profileVisits:222871,follows:10562,unfollows:7902,netFollowers:18758,messages:1648,adsSpent:0},
  {page:'Main',month:'Apr 2025',date:'2025-04-01',type:'Paid',views:30177799,reach:12474406,linkClicks:0,profileVisits:256012,follows:16098,unfollows:0,netFollowers:0,messages:1295,adsSpent:215220},
  {page:'Main',month:'May 2025',date:'2025-05-01',type:'Organic',views:4185938,reach:1465636,linkClicks:114365,profileVisits:98260,follows:5943,unfollows:8849,netFollowers:10298,messages:1623,adsSpent:0},
  {page:'Main',month:'May 2025',date:'2025-05-01',type:'Paid',views:8001522,reach:5104114,linkClicks:0,profileVisits:93186,follows:13204,unfollows:0,netFollowers:0,messages:652,adsSpent:63860},
  {page:'Main',month:'Jun 2025',date:'2025-06-01',type:'Organic',views:3892011,reach:1621533,linkClicks:98432,profileVisits:87654,follows:7234,unfollows:5412,netFollowers:8211,messages:1234,adsSpent:0},
  {page:'Main',month:'Jun 2025',date:'2025-06-01',type:'Paid',views:9234567,reach:6123456,linkClicks:0,profileVisits:112345,follows:11234,unfollows:0,netFollowers:0,messages:987,adsSpent:87650},
  {page:'Main',month:'Jul 2025',date:'2025-07-01',type:'Organic',views:5123456,reach:2134567,linkClicks:145678,profileVisits:123456,follows:9876,unfollows:6543,netFollowers:13245,messages:1456,adsSpent:0},
  {page:'Main',month:'Jul 2025',date:'2025-07-01',type:'Paid',views:12345678,reach:8234567,linkClicks:0,profileVisits:156789,follows:15678,unfollows:0,netFollowers:0,messages:1123,adsSpent:134560},
  {page:'Main',month:'Aug 2025',date:'2025-08-01',type:'Organic',views:4567890,reach:1987654,linkClicks:123456,profileVisits:109876,follows:8765,unfollows:5678,netFollowers:11234,messages:1345,adsSpent:0},
  {page:'Main',month:'Aug 2025',date:'2025-08-01',type:'Paid',views:10234567,reach:7123456,linkClicks:0,profileVisits:134567,follows:13456,unfollows:0,netFollowers:0,messages:1012,adsSpent:109870},
  {page:'Main',month:'Sep 2025',date:'2025-09-01',type:'Organic',views:6234567,reach:2456789,linkClicks:167890,profileVisits:145678,follows:10987,unfollows:7654,netFollowers:15678,messages:1567,adsSpent:0},
  {page:'Main',month:'Sep 2025',date:'2025-09-01',type:'Paid',views:14567890,reach:9234567,linkClicks:0,profileVisits:178901,follows:17890,unfollows:0,netFollowers:0,messages:1234,adsSpent:156780},
  {page:'Main',month:'Oct 2025',date:'2025-10-01',type:'Organic',views:7345678,reach:2789012,linkClicks:189012,profileVisits:167890,follows:12098,unfollows:8765,netFollowers:17234,messages:1678,adsSpent:0},
  {page:'Main',month:'Oct 2025',date:'2025-10-01',type:'Paid',views:16789012,reach:10345678,linkClicks:0,profileVisits:201234,follows:20123,unfollows:0,netFollowers:0,messages:1345,adsSpent:178900},
  {page:'Main',month:'Nov 2025',date:'2025-11-01',type:'Organic',views:8456789,reach:3012345,linkClicks:201234,profileVisits:178901,follows:13209,unfollows:9876,netFollowers:18456,messages:1789,adsSpent:0},
  {page:'Main',month:'Nov 2025',date:'2025-11-01',type:'Paid',views:18901234,reach:11456789,linkClicks:0,profileVisits:223456,follows:22345,unfollows:0,netFollowers:0,messages:1456,adsSpent:201230},
  {page:'Main',month:'Dec 2025',date:'2025-12-01',type:'Organic',views:9567890,reach:3234567,linkClicks:212345,profileVisits:189012,follows:14320,unfollows:10987,netFollowers:19678,messages:1890,adsSpent:0},
  {page:'Main',month:'Dec 2025',date:'2025-12-01',type:'Paid',views:21012345,reach:12567890,linkClicks:0,profileVisits:245678,follows:24567,unfollows:0,netFollowers:0,messages:1567,adsSpent:223450},
  {page:'Main',month:'Jan 2026',date:'2026-01-01',type:'Organic',views:5678901,reach:2123456,linkClicks:145678,profileVisits:134567,follows:9876,unfollows:7654,netFollowers:13456,messages:1456,adsSpent:0},
  {page:'Main',month:'Jan 2026',date:'2026-01-01',type:'Paid',views:13456789,reach:8901234,linkClicks:0,profileVisits:167890,follows:16789,unfollows:0,netFollowers:0,messages:1234,adsSpent:145670},
  {page:'Main',month:'Feb 2026',date:'2026-02-01',type:'Organic',views:4123456,reach:1678901,linkClicks:112345,profileVisits:101234,follows:7654,unfollows:5432,netFollowers:10234,messages:1234,adsSpent:0},
  {page:'Main',month:'Feb 2026',date:'2026-02-01',type:'Paid',views:10123456,reach:6789012,linkClicks:0,profileVisits:134567,follows:13456,unfollows:0,netFollowers:0,messages:1012,adsSpent:112340},
  {page:'Offer',month:'Mar 2025',date:'2025-03-01',type:'Organic',views:1234567,reach:567890,linkClicks:34567,profileVisits:45678,follows:3456,unfollows:2345,netFollowers:5678,messages:456,adsSpent:0},
  {page:'Offer',month:'Mar 2025',date:'2025-03-01',type:'Paid',views:2345678,reach:1678901,linkClicks:0,profileVisits:56789,follows:5678,unfollows:0,netFollowers:0,messages:345,adsSpent:34560},
  {page:'Offer',month:'Sep 2025',date:'2025-09-01',type:'Organic',views:5308025,reach:1754820,linkClicks:24561,profileVisits:126303,follows:13036,unfollows:3774,netFollowers:15545,messages:4239,adsSpent:0},
  {page:'Offer',month:'Sep 2025',date:'2025-09-01',type:'Paid',views:8125544,reach:3776759,linkClicks:0,profileVisits:52684,follows:6283,unfollows:0,netFollowers:0,messages:587,adsSpent:67172},
  {page:'Offer',month:'Oct 2025',date:'2025-10-01',type:'Organic',views:8364711,reach:2645908,linkClicks:29760,profileVisits:168667,follows:4993,unfollows:3969,netFollowers:18818,messages:5337,adsSpent:0},
  {page:'Offer',month:'Oct 2025',date:'2025-10-01',type:'Paid',views:4398438,reach:4118035,linkClicks:0,profileVisits:34377,follows:3131,unfollows:0,netFollowers:0,messages:400,adsSpent:40110},
  {page:'Offer',month:'Nov 2025',date:'2025-11-01',type:'Organic',views:13315280,reach:5310710,linkClicks:65498,profileVisits:292940,follows:19796,unfollows:3969,netFollowers:18818,messages:4439,adsSpent:0},
  {page:'Offer',month:'Nov 2025',date:'2025-11-01',type:'Paid',views:5910739,reach:2970938,linkClicks:0,profileVisits:232337,follows:2991,unfollows:0,netFollowers:0,messages:539,adsSpent:50998},
  {page:'Offer',month:'Dec 2025',date:'2025-12-01',type:'Organic',views:8794619,reach:3464271,linkClicks:151940,profileVisits:143796,follows:17137,unfollows:5079,netFollowers:12058,messages:2997,adsSpent:0},
  {page:'Offer',month:'Dec 2025',date:'2025-12-01',type:'Paid',views:6461793,reach:4560307,linkClicks:0,profileVisits:140199,follows:6829,unfollows:0,netFollowers:0,messages:1603,adsSpent:69600},
  {page:'Offer',month:'Jan 2026',date:'2026-01-01',type:'Organic',views:4485206,reach:1722398,linkClicks:85977,profileVisits:568286,follows:9922,unfollows:5210,netFollowers:4712,messages:2263,adsSpent:0},
  {page:'Offer',month:'Jan 2026',date:'2026-01-01',type:'Paid',views:3891724,reach:3891724,linkClicks:0,profileVisits:582884,follows:4663,unfollows:0,netFollowers:0,messages:920,adsSpent:7611},
  {page:'Offer',month:'Feb 2026',date:'2026-02-01',type:'Organic',views:2045093,reach:630693,linkClicks:17093,profileVisits:34549,follows:3110,unfollows:3927,netFollowers:-817,messages:1582,adsSpent:0},
  {page:'Offer',month:'Feb 2026',date:'2026-02-01',type:'Paid',views:1003831,reach:613379,linkClicks:0,profileVisits:16123,follows:340,unfollows:0,netFollowers:0,messages:109,adsSpent:10111},
];

const POSTS = [
  {sku:'KPC33820',page:'Main',shootType:'Content',shootDate:'2025-12-05',editedDate:'2025-12-06',postDate:'2025-12-10',assignedTo:'Dharani',desc:'Top viral reel - card unboxing',status:'Posted',igUrl:'https://www.instagram.com/reel/DRt5BZbDExb/',workFile:'',remarks:'Best performer Dec',views:2800000,reach:1900000,likes:45000,comments:890,shares:7200,saves:12000,engRate:5.8,thumb:'🎬'},
  {sku:'KPR25080',page:'Main',shootType:'Studio',shootDate:'2025-11-19',editedDate:'2025-11-22',postDate:'2025-12-01',assignedTo:'Dwarika',desc:'White elephant premium card',status:'Posted',igUrl:'https://www.instagram.com/reel/DRuQPUuD9Yw/',workFile:'',remarks:'',views:512000,reach:340000,likes:7800,comments:143,shares:890,saves:1240,engRate:3.1,thumb:'🐘'},
  {sku:'KFR16090',page:'Main',shootType:'Store',shootDate:'2025-11-18',editedDate:'2025-11-19',postDate:'2025-12-01',assignedTo:'Dharani',desc:'Tri Blue Laser cut showcase',status:'Posted',igUrl:'https://www.instagram.com/reel/DRuRbqXkYvD/',workFile:'',remarks:'',views:284000,reach:192000,likes:4200,comments:87,shares:310,saves:620,engRate:2.4,thumb:'💙'},
  {sku:'KNKO7602',page:'Main',shootType:'Making',shootDate:'2025-11-19',editedDate:'2025-11-20',postDate:'2025-12-02',assignedTo:'Dharani',desc:'Blue MDF making process',status:'Posted',igUrl:'',workFile:'',remarks:'',views:193000,reach:128000,likes:2900,comments:54,shares:210,saves:380,engRate:1.9,thumb:'🔵'},
  {sku:'KNK50140',page:'Main',shootType:'Store',shootDate:'2025-12-01',editedDate:'2025-12-02',postDate:'2025-12-05',assignedTo:'Dwarika',desc:'Premium card collection display',status:'Posted',igUrl:'',workFile:'',remarks:'',views:421000,reach:280000,likes:6100,comments:110,shares:540,saves:980,engRate:2.8,thumb:'🃏'},
  {sku:'KNK9202W',page:'Main',shootType:'Outdoor',shootDate:'2025-10-15',editedDate:'2025-10-16',postDate:'2025-10-20',assignedTo:'Pradeep',desc:'White premium card outdoor shoot',status:'Posted',igUrl:'',workFile:'',remarks:'',views:310000,reach:210000,likes:4500,comments:92,shares:380,saves:710,engRate:2.7,thumb:'🌿'},
  {sku:'KJTS3685',page:'Main',shootType:'Store',shootDate:'2026-01-08',editedDate:'',postDate:'2026-01-26',assignedTo:'Dwarika',desc:'Store reel January',status:'Scheduled',igUrl:'',workFile:'',remarks:'',views:0,reach:0,likes:0,comments:0,shares:0,saves:0,engRate:0,thumb:'📦'},
  {sku:'KNK4419',page:'Main',shootType:'Concept',shootDate:'2026-02-10',editedDate:'2026-02-14',postDate:'',assignedTo:'Gungun Paladiya',desc:'Concept reel - love theme',status:'Edited',igUrl:'',workFile:'',remarks:'',views:0,reach:0,likes:0,comments:0,shares:0,saves:0,engRate:0,thumb:'❤️'},
  {sku:'KNK2036',page:'Main',shootType:'Content',shootDate:'2026-03-15',editedDate:'',postDate:'',assignedTo:'Meghana',desc:'March trending content',status:'Shooting',igUrl:'',workFile:'',remarks:'',views:0,reach:0,likes:0,comments:0,shares:0,saves:0,engRate:0,thumb:'🎥'},
  {sku:'KFR16430',page:'Main',shootType:'Studio',shootDate:'2026-03-12',editedDate:'2026-03-14',postDate:'2026-03-20',assignedTo:'Dwarika',desc:'Laser cut frame collection',status:'Edited',igUrl:'',workFile:'',remarks:'',views:0,reach:0,likes:0,comments:0,shares:0,saves:0,engRate:0,thumb:'🖼️'},
  {sku:'KNK50250',page:'Offer',shootType:'Store',shootDate:'2025-12-01',editedDate:'2025-12-01',postDate:'2025-12-01',assignedTo:'Dwarika',desc:'Orange ganesha offer',status:'Posted',igUrl:'https://www.instagram.com/reel/DRuZ91wkT1W/',workFile:'',remarks:'',views:198000,reach:132000,likes:3100,comments:62,shares:240,saves:410,engRate:2.1,thumb:'🧡'},
  {sku:'KNK9401G',page:'Offer',shootType:'Store',shootDate:'2025-12-01',editedDate:'2025-12-01',postDate:'2025-12-01',assignedTo:'Dharani',desc:'Grey balaji card offer',status:'Posted',igUrl:'https://www.instagram.com/reel/DRudYk0Echa/',workFile:'',remarks:'',views:172000,reach:115000,likes:2600,comments:48,shares:196,saves:330,engRate:1.9,thumb:'🪨'},
  {sku:'KNKZ0676',page:'Offer',shootType:'Store',shootDate:'2026-01-20',editedDate:'2026-01-21',postDate:'2026-01-22',assignedTo:'Dharani',desc:'Red ganesha offer reel',status:'Posted',igUrl:'',workFile:'',remarks:'',views:234000,reach:156000,likes:3800,comments:74,shares:312,saves:510,engRate:2.4,thumb:'🔴'},
  {sku:'CUSTOM-001',page:'Custom',shootType:'Customized Card',shootDate:'2025-12-10',editedDate:'2025-12-12',postDate:'2025-12-13',assignedTo:'Dharani',desc:'Tracing card custom reel',status:'Posted',igUrl:'https://www.instagram.com/reel/DSNMRMDjBQL/',workFile:'',remarks:'',views:89000,reach:59000,likes:1400,comments:28,shares:96,saves:182,engRate:2.0,thumb:'✏️'},
  {sku:'KNK7902P',page:'Gifts',shootType:'Making',shootDate:'2025-11-19',editedDate:'2025-11-20',postDate:'2025-12-01',assignedTo:'Dharani',desc:'Pink Box making reel',status:'Posted',igUrl:'https://www.instagram.com/reel/DRtvQMLDyvB/',workFile:'',remarks:'',views:143000,reach:95000,likes:2100,comments:38,shares:156,saves:248,engRate:1.9,thumb:'🎀'},
  {sku:'KMMEX8310',page:'Gifts',shootType:'Studio',shootDate:'2025-11-22',editedDate:'2025-12-04',postDate:'2025-12-05',assignedTo:'Dharani',desc:'Floral box KMMX studio',status:'Posted',igUrl:'https://www.instagram.com/reel/DR374xjjmkA/',workFile:'',remarks:'',views:267000,reach:178000,likes:4100,comments:79,shares:320,saves:540,engRate:2.6,thumb:'🌸'},
  {sku:'KNCM809R',page:'Main',shootType:'Making',shootDate:'2025-09-10',editedDate:'2025-09-12',postDate:'2025-09-15',assignedTo:'Uday',desc:'Red making reel process',status:'Posted',igUrl:'',workFile:'',remarks:'',views:190000,reach:128000,likes:2800,comments:55,shares:220,saves:360,engRate:2.0,thumb:'🔴'},
  {sku:'KPR25088',page:'Main',shootType:'Studio',shootDate:'2026-03-10',editedDate:'',postDate:'2026-03-25',assignedTo:'Dwarika',desc:'Spring collection studio',status:'Planned',igUrl:'',workFile:'',remarks:'',views:0,reach:0,likes:0,comments:0,shares:0,saves:0,engRate:0,thumb:'🌱'},
];

const USERS = [
  {name:'Gungun Paladiya',role:'Admin',team:'Strategy',initials:'GP',color:'#3b82f6',reels:12,shoots:12,edits:0,score:91,email:'gungun@kingofcards.in',password:'changeme123'},
  {name:'Geetika',role:'Admin',team:'Strategy',initials:'GK',color:'#0ea5e9',reels:6,shoots:6,edits:0,score:87,email:'geetika@kingofcards.in',password:'changeme123'},
  {name:'Rahul',role:'Admin',team:'Management',initials:'RH',color:'#ec4899',reels:0,shoots:0,edits:0,score:82,email:'rahul@kingofcards.in',password:'changeme123'},
  {name:'Dharani',role:'Editor',team:'Video',initials:'DH',color:'#3b82f6',reels:54,shoots:60,edits:0,score:88,email:'dharani@kingofcards.in',password:'changeme123'},
  {name:'Dwarika',role:'Editor',team:'Video',initials:'DW',color:'#10b981',reels:74,shoots:80,edits:0,score:94,email:'dwarika@kingofcards.in',password:'changeme123'},
  {name:'Pradeep',role:'Editor',team:'Video',initials:'PR',color:'#8b5cf6',reels:12,shoots:14,edits:0,score:79,email:'pradeep@kingofcards.in',password:'changeme123'},
  {name:'Uday',role:'Editor',team:'Video',initials:'UD',color:'#f59e0b',reels:12,shoots:13,edits:0,score:81,email:'uday@kingofcards.in',password:'changeme123'},
  {name:'Meghana',role:'Editor',team:'Editing',initials:'MG',color:'#ec4899',reels:1,shoots:0,edits:8,score:73,email:'meghana@kingofcards.in',password:'changeme123'},
  {name:'Radhika',role:'Editor',team:'Editing',initials:'RD',color:'#3b82f6',reels:0,shoots:0,edits:12,score:76,email:'radhika@kingofcards.in',password:'changeme123'},
  {name:'Himanshi',role:'Editor',team:'Editing',initials:'HI',color:'#f97316',reels:0,shoots:0,edits:10,score:74,email:'himanshi@kingofcards.in',password:'changeme123'},
  {name:'Lokesh',role:'Viewer',team:'Video',initials:'LK',color:'#64748b',reels:3,shoots:4,edits:0,score:68,email:'lokesh@kingofcards.in',password:'changeme123'},
];

const ACCOUNTS = [
  {name:'Main Instagram',handle:'@kingofcards.in',platform:'Instagram',icon:'📸',isActive:true,syncedAt:'2 mins ago',dbKey:'Main'},
  {name:'Offer Instagram',handle:'@kingofcards.offers',platform:'Instagram',icon:'📸',isActive:true,syncedAt:'4 mins ago',dbKey:'Offer'},
  {name:'Gifts Instagram',handle:'@kingofcards.gifts',platform:'Instagram',icon:'📸',isActive:true,syncedAt:'10 mins ago',dbKey:'Gifts'},
  {name:'Custom Instagram',handle:'@kingofcards.custom',platform:'Instagram',icon:'📸',isActive:true,syncedAt:'Just now',dbKey:'Custom'},
  {name:'YouTube',handle:'@KingOfCards',platform:'YouTube',icon:'▶',isActive:true,syncedAt:'1 hr ago',dbKey:'YouTube'},
  {name:'Facebook',handle:'King of Cards',platform:'Facebook',icon:'💬',isActive:true,syncedAt:'1 hr ago',dbKey:''},
  {name:'LinkedIn',handle:'—',platform:'LinkedIn',icon:'💼',isActive:false,syncedAt:'Never',dbKey:''},
  {name:'Pinterest',handle:'—',platform:'Pinterest',icon:'📌',isActive:false,syncedAt:'Never',dbKey:''},
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    // Clear existing
    await Promise.all([
      Metric.deleteMany({}),
      Post.deleteMany({}),
      User.deleteMany({}),
      Account.deleteMany({}),
    ]);
    console.log('🗑   Cleared existing data');

    // Seed metrics
    const metricDocs = METRICS.map(m => ({ ...m, date: new Date(m.date) }));
    await Metric.insertMany(metricDocs);
    console.log(`✅  Inserted ${metricDocs.length} metrics`);

    // Seed posts (convert date strings)
    const postDocs = POSTS.map(p => ({
      ...p,
      shootDate:  p.shootDate  ? new Date(p.shootDate)  : undefined,
      editedDate: p.editedDate ? new Date(p.editedDate) : undefined,
      postDate:   p.postDate   ? new Date(p.postDate)   : undefined,
    }));
    await Post.insertMany(postDocs);
    console.log(`✅  Inserted ${postDocs.length} posts`);

    // Seed users (passwords will be hashed by pre-save hook)
    for (const u of USERS) {
      await User.create(u);
    }
    console.log(`✅  Inserted ${USERS.length} users`);

    // Seed accounts
    await Account.insertMany(ACCOUNTS);
    console.log(`✅  Inserted ${ACCOUNTS.length} accounts`);

    console.log('\n🎉  Seed complete! All dummy DB data is now in MongoDB.');
    console.log('⚠️   Remember to change all default passwords before production use.\n');
  } catch (err) {
    console.error('❌  Seed failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
