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
      { id:'dream', name:'Honda Dream 125', energy:'gasoline', capacity:4, consumption:1.6, unit:'L/100km', note:'1.6 L/100km · 4 L tank' },
      { id:'pcx', name:'Honda PCX 160', energy:'gasoline', capacity:8.1, consumption:2.1, unit:'L/100km', note:'2.1 L/100km · 8.1 L tank' }
    ]}
]
