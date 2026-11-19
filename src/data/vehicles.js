export const vehicleGroups = [
  { id: 'ev', label: 'Electric Vehicle', short: 'EV', icon: '⚡', fuel: 'electric',
    items: [
      { id:'atto3', name:'BYD Atto 3', energy:'electric', capacity:60.5, consumption:14.4, range:420, unit:'kWh/100km', note:'60.5 kWh · 420 km claimed range' },
      { id:'dolphin', name:'BYD Dolphin', energy:'electric', capacity:44.9, consumption:13.2, range:340, unit:'kWh/100km', note:'44.9 kWh · 340 km claimed range' },
      { id:'modely', name:'Tesla Model Y', energy:'electric', capacity:75, consumption:16.5, range:455, unit:'kWh/100km', note:'75 kWh · 455 km claimed range' },
      { id:'wuling', name:'Wuling Air EV', energy:'electric', capacity:26.7, consumption:8.9, range:300, unit:'kWh/100km', note:'26.7 kWh · 300 km claimed range' }
    ]},
  { id: 'hybrid', label: 'Hybrid', short: 'Hybrid', icon: '♻️', fuel: 'gasoline',
    items: [
      { id:'prius', name:'Toyota Prius 2010–2015', energy:'gasoline', capacity:45, consumption:4.7, unit:'L/100km', note:'4.7 L/100km · 45 L tank' },
      { id:'camryh', name:'Toyota Camry Hybrid', energy:'gasoline', capacity:65, consumption:5.5, unit:'L/100km', note:'5.5 L/100km · 65 L tank' },
      { id:'rx450h', name:'Lexus RX450h', energy:'gasoline', capacity:65, consumption:7.8, unit:'L/100km', note:'7.8 L/100km · 65 L tank' }
    ]},
  { id: 'gasoline', label: 'Gasoline Car', short: 'Gasoline', icon: '⛽', fuel: 'gasoline',
    items: [
      { id:'corollacross', name:'Toyota Corolla Cross', energy:'gasoline', capacity:47, consumption:6.8, unit:'L/100km', note:'6.8 L/100km · 47 L tank' },
      { id:'morning', name:'Kia Morning / Picanto', energy:'gasoline', capacity:35, consumption:5.2, unit:'L/100km', note:'5.2 L/100km · 35 L tank' },
      { id:'rx300', name:'Lexus RX300 / RX330', energy:'gasoline', capacity:72, consumption:11.5, unit:'L/100km', note:'11.5 L/100km · 72 L tank' }
    ]},
  { id: 'diesel', label: 'Diesel Car / Pickup', short: 'Diesel', icon: '🛻', fuel: 'diesel',
    items: [
      { id:'ranger', name:'Ford Ranger', energy:'diesel', capacity:80, consumption:8.5, unit:'L/100km', note:'8.5 L/100km · 80 L tank' },
      { id:'hilux', name:'Toyota Hilux Revo', energy:'diesel', capacity:80, consumption:8.2, unit:'L/100km', note:'8.2 L/100km · 80 L tank' },
      { id:'dmax', name:'Isuzu D-Max', energy:'diesel', capacity:76, consumption:7.9, unit:'L/100km', note:'7.9 L/100km · 76 L tank' }
    ]},
  { id: 'motorbike', label: 'Motorbike', short: 'Motorbike', icon: '🏍️', fuel: 'gasoline',
    items: [
      { id:'adv150', name:'Honda ADV150 (2021)', energy:'gasoline', capacity:8.0, consumption:2.4, unit:'L/100km', note:'2.4 L/100km · 8.0 L tank' },
      { id:'adv160', name:'Honda ADV160 (2026)', energy:'gasoline', capacity:8.1, consumption:2.2, unit:'L/100km', note:'2.2 L/100km · 8.1 L tank' },
      { id:'beat', name:'Honda BeAT (2027)', energy:'gasoline', capacity:4.2, consumption:1.7, unit:'L/100km', note:'1.7 L/100km · 4.2 L tank' },
      { id:'cb150r', name:'Honda CB150R (2024)', energy:'gasoline', capacity:8.5, consumption:2.6, unit:'L/100km', note:'2.6 L/100km · 8.5 L tank' },
      { id:'cbr150r', name:'Honda CBR150R (2021)', energy:'gasoline', capacity:12.0, consumption:2.4, unit:'L/100km', note:'2.4 L/100km · 12.0 L tank' },
      { id:'click125', name:'Honda CLICK125 (2027)', energy:'gasoline', capacity:5.5, consumption:1.9, unit:'L/100km', note:'1.9 L/100km · 5.5 L tank' },
      { id:'click125i', name:'Honda CLICK125i (2021)', energy:'gasoline', capacity:5.5, consumption:1.9, unit:'L/100km', note:'1.9 L/100km · 5.5 L tank' },
      { id:'click150i', name:'Honda CLICK150i (2021)', energy:'gasoline', capacity:5.5, consumption:1.9, unit:'L/100km', note:'1.9 L/100km · 5.5 L tank' },
      { id:'click160', name:'Honda CLICK160 (2027)', energy:'gasoline', capacity:5.5, consumption:2.1, unit:'L/100km', note:'2.1 L/100km · 5.5 L tank' },
      { id:'dream', name:'Honda Dream (2027)', energy:'gasoline', capacity:4.0, consumption:1.7, unit:'L/100km', note:'1.7 L/100km · 4.0 L tank' },
      { id:'dream125', name:'Honda Dream 125 (2020)', energy:'gasoline', capacity:4.0, consumption:1.7, unit:'L/100km', note:'1.7 L/100km · 4.0 L tank' },
      { id:'giorno', name:'Honda Giorno+ (2026)', energy:'gasoline', capacity:5.4, consumption:2.0, unit:'L/100km', note:'2.0 L/100km · 5.4 L tank' },
      { id:'icone', name:'Honda ICON e: (2026)', energy:'electric', capacity:1.47, consumption:2.8, unit:'kWh/100km', note:'2.8 kWh/100km · 1.47 kWh battery' },
      { id:'msxgrom', name:'Honda MSX Grom (2024)', energy:'gasoline', capacity:6.0, consumption:1.5, unit:'L/100km', note:'1.5 L/100km · 6.0 L tank' },
      { id:'msx125sf', name:'Honda MSX125SF (2018)', energy:'gasoline', capacity:5.7, consumption:2.0, unit:'L/100km', note:'2.0 L/100km · 5.7 L tank' },
      { id:'pcx', name:'Honda PCX (2025)', energy:'gasoline', capacity:8.1, consumption:2.2, unit:'L/100km', note:'2.2 L/100km · 8.1 L tank' },
      { id:'pcx125', name:'Honda PCX125 (2026)', energy:'gasoline', capacity:8.1, consumption:2.0, unit:'L/100km', note:'2.0 L/100km · 8.1 L tank' },
      { id:'pcx150', name:'Honda PCX150 (2020)', energy:'gasoline', capacity:8.0, consumption:2.4, unit:'L/100km', note:'2.4 L/100km · 8.0 L tank' },
      { id:'pcx160', name:'Honda PCX160 (2027)', energy:'gasoline', capacity:8.1, consumption:2.2, unit:'L/100km', note:'2.2 L/100km · 8.1 L tank' },
      { id:'scoopy', name:'Honda Scoopy (2026)', energy:'gasoline', capacity:4.2, consumption:1.7, unit:'L/100km', note:'1.7 L/100km · 4.2 L tank' },
      { id:'scoopyi', name:'Honda Scoopy i (2020)', energy:'gasoline', capacity:4.0, consumption:1.7, unit:'L/100km', note:'1.7 L/100km · 4.0 L tank' },
      { id:'wave100', name:'Honda Wave 100 (2019)', energy:'gasoline', capacity:3.7, consumption:1.9, unit:'L/100km', note:'1.9 L/100km · 3.7 L tank' },
      { id:'wave110', name:'Honda Wave 110 (2025)', energy:'gasoline', capacity:3.7, consumption:1.7, unit:'L/100km', note:'1.7 L/100km · 3.7 L tank' },
      { id:'winnerr', name:'Honda Winner R (2026)', energy:'gasoline', capacity:4.5, consumption:1.9, unit:'L/100km', note:'1.9 L/100km · 4.5 L tank' },
      { id:'zoomerx', name:'Honda Zoomer-X (2020)', energy:'gasoline', capacity:4.0, consumption:1.9, unit:'L/100km', note:'1.9 L/100km · 4.0 L tank' }
    ]}
]
