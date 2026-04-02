/**
 * Static fallback template library shown in ScrollingTemplateRows before
 * the backend metadata has loaded (or when it fails). Covers a broad range
 * of product categories so the marquee always has something meaningful.
 */
export const DEFAULT_TEMPLATES = [
  // Kitchen & food preparation
  {
    label: "Coffee machine",
    text: "Connected espresso machine with mains power, heating element, pressurised brew group, water tank, burr grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "Electric kettle",
    text: "Electric kettle with mains power, 2200 W heating element, food-contact stainless steel interior, dry-boil protection, and no wireless radio.",
  },
  {
    label: "Air fryer",
    text: "Air fryer with mains power, 1500 W heating element, motorized circulation fan, food-contact non-stick cooking basket, electronic timer and temperature controls, and no wireless connectivity.",
  },
  {
    label: "Smart air fryer",
    text: "Connected air fryer with mains power, heating element, motorized fan, food-contact cooking basket, Wi-Fi radio, app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "Coffee grinder",
    text: "Electric burr coffee grinder with mains power, high-speed motor, food-contact grind path and hopper, dosing chute, and no wireless connectivity.",
  },
  {
    label: "Blender",
    text: "Countertop blender with mains power, 1000 W motor, food-contact BPA-free jug and blades, multiple speed settings, pulse function, and no wireless connectivity.",
  },
  {
    label: "Microwave oven",
    text: "Countertop microwave oven with mains power, 800 W magnetron, glass turntable, electronic controls, child lock, and no wireless connectivity.",
  },
  {
    label: "Dishwasher",
    text: "Freestanding dishwasher with mains power, water inlet and drain connections, 60 °C wash cycle, food-contact interior and spray arms, detergent dispenser, and optional Wi-Fi app integration.",
  },
  {
    label: "Fridge-freezer",
    text: "Freestanding fridge-freezer with mains power, compressor, R600a refrigerant loop, food-contact interior, electronic thermostat, and no wireless connectivity.",
  },
  {
    label: "Smart fridge",
    text: "Connected fridge-freezer with mains power, inverter compressor, refrigerant loop, food-contact interior, internal cameras, Wi-Fi radio, app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "Bread maker",
    text: "Automatic bread maker with mains power, heating element, kneading motor, food-contact bread pan and paddle, programmable timer, and no wireless connectivity.",
  },
  {
    label: "Food processor",
    text: "Food processor with mains power, high-torque motor, food-contact bowl, multiple interchangeable blades and discs, electronic speed control, and no wireless connectivity.",
  },
  {
    label: "Rice cooker",
    text: "Electric rice cooker with mains power, 700 W heating plate, food-contact inner pot, keep-warm function, mechanical controls, and no wireless connectivity.",
  },
  {
    label: "Induction hob",
    text: "Portable induction hob with mains power, 2000 W electromagnetic induction zone, touch controls, child lock, residual heat indicator, and no wireless connectivity.",
  },
  {
    label: "Electric pressure cooker",
    text: "Multi-function electric pressure cooker with mains power, sealed pressure vessel, food-contact inner pot, automatic pressure relief valve, digital controls, and no wireless connectivity.",
  },
  {
    label: "Sous vide circulator",
    text: "Immersion sous vide circulator with mains power, water-immersion heating element, circulation pump, food-contact probe, precise temperature control, and Bluetooth app connectivity.",
  },
  {
    label: "Juice extractor",
    text: "Centrifugal juice extractor with mains power, high-speed motor, food-contact pulp container and filter basket, wide feeding chute, and no wireless connectivity.",
  },
  {
    label: "Electric grill",
    text: "Contact electric grill with mains power, 2000 W non-stick heating plates, food-contact upper and lower cooking surfaces, adjustable thermostat, and no wireless connectivity.",
  },
  {
    label: "Vacuum sealer",
    text: "Countertop food vacuum sealer with mains power, suction pump, food-contact sealing channel, heat sealer bar, and no wireless connectivity.",
  },
  {
    label: "Water dispenser",
    text: "Countertop hot and cold water dispenser with mains power, compressor cooling, heating tank, food-contact water path and taps, and no wireless connectivity.",
  },
  {
    label: "Milk frother",
    text: "Handheld battery-powered milk frother with food-contact whisk attachment, AA battery, motor drive, and no wireless connectivity.",
  },
  // Cleaning & laundry
  {
    label: "Robot vacuum",
    text: "Robot vacuum cleaner with rechargeable lithium battery, motorized suction and brush system, LiDAR navigation, camera, Wi-Fi and Bluetooth radio, cloud account, app control, and OTA firmware updates.",
  },
  {
    label: "Stick vacuum",
    text: "Cordless stick vacuum cleaner with rechargeable lithium battery, motorized suction head, swappable attachments, LED floor lights, Bluetooth radio, app control, and OTA firmware updates.",
  },
  {
    label: "Robot lawn mower",
    text: "Robotic lawn mower with rechargeable lithium battery, motorized cutting blade, IP55-rated outdoor enclosure, boundary wire sensing, Wi-Fi and Bluetooth radio, cloud account, app control, and OTA updates.",
  },
  {
    label: "Washing machine",
    text: "Freestanding washing machine with mains power, water inlet and drain connections, drum motor, 60 °C wash programme, electronic controls, and optional Wi-Fi app integration for remote start.",
  },
  {
    label: "Tumble dryer",
    text: "Heat-pump tumble dryer with mains power, drum motor, sealed refrigerant heat-pump loop, condensate tank, electronic controls, and Wi-Fi connectivity for app and OTA firmware updates.",
  },
  {
    label: "Steam iron",
    text: "Corded steam iron with mains power, 2400 W ceramic soleplate, steam boiler, water tank, drip-stop function, and no wireless connectivity.",
  },
  {
    label: "Handheld steam cleaner",
    text: "Handheld steam cleaner with mains power, pressurised steam boiler, interchangeable nozzles, auto-shutoff, and no wireless connectivity.",
  },
  {
    label: "Pressure washer",
    text: "Electric pressure washer with mains power, high-pressure pump motor, spray gun, lance and nozzle set, detergent tank, and no wireless connectivity.",
  },
  {
    label: "Window cleaning robot",
    text: "Window cleaning robot with rechargeable lithium battery, suction pad drive, motorized cleaning pad, safety tether, Wi-Fi radio, and app control.",
  },
  // Personal care & health
  {
    label: "Hair dryer",
    text: "Handheld hair dryer with mains power, 2200 W heating element, motorized fan, multiple heat and speed settings, cool-shot button, and no wireless connectivity.",
  },
  {
    label: "Electric toothbrush",
    text: "Rechargeable electric toothbrush with lithium battery, inductive charging base, oscillating brush head, bathroom IPX7 rating, Bluetooth radio, and app brushing coaching.",
  },
  {
    label: "Electric shaver",
    text: "Rechargeable rotary electric shaver with lithium battery, USB-C charging, motorized shaving heads, bathroom IP67 rating, and no wireless connectivity.",
  },
  {
    label: "Hair straightener",
    text: "Ceramic hair straightener with mains power, 230 °C floating plates, auto-shutoff after 30 minutes, temperature selector, and no wireless connectivity.",
  },
  {
    label: "Massage gun",
    text: "Percussive massage gun with rechargeable lithium battery, brushless motor, interchangeable attachment heads, three speed settings, and no wireless connectivity.",
  },
  {
    label: "Blood pressure monitor",
    text: "Automatic upper-arm blood pressure monitor with AA battery power, oscillometric measurement, inflatable cuff, LCD display, memory storage, and Bluetooth radio for app sync.",
  },
  {
    label: "Smart scale",
    text: "Bathroom smart scale with AA battery power, load-cell sensors, body composition estimation via bioimpedance, Bluetooth radio, app sync, and cloud account.",
  },
  {
    label: "UV sanitizer box",
    text: "UV-C sanitizer cabinet with mains power, UV-C LED array, enclosed sanitising chamber, safety lid interlock, and no wireless connectivity.",
  },
  {
    label: "Foot massager",
    text: "Electric shiatsu foot massager with mains power, rolling massage nodes, infrared heating, multiple intensity levels, and no wireless connectivity.",
  },
  // Home & building
  {
    label: "Air purifier",
    text: "Smart air purifier with mains power, HEPA and activated-carbon filter, motorized fan, PM2.5 air quality sensor, Wi-Fi radio, app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "Air conditioner",
    text: "Portable air conditioner with mains power, compressor, R290 refrigerant loop, motorized fan, exhaust hose, Wi-Fi radio, app control, and OTA firmware updates.",
  },
  {
    label: "Smart plug",
    text: "Smart plug with mains power input and output, 16 A relay, Wi-Fi radio, real-time energy monitoring, app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "Smart lock",
    text: "Connected door lock with AA battery power, motorized deadbolt, keypad and fingerprint reader, Bluetooth and Wi-Fi radio, mobile app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "Smart doorbell",
    text: "Video doorbell with mains or rechargeable battery power, 1080p camera, microphone, speaker, PIR motion sensor, Wi-Fi radio, app control, cloud account, video storage, and OTA firmware updates.",
  },
  {
    label: "Security camera",
    text: "Outdoor Wi-Fi security camera with mains power, IP66 weatherproof housing, 4 MP camera, infrared night vision LEDs, microphone, speaker, Wi-Fi radio, cloud account, local microSD storage, and OTA updates.",
  },
  {
    label: "Smart thermostat",
    text: "Smart thermostat with mains bus power, temperature and humidity sensors, OLED display, Wi-Fi radio, app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "Smoke detector",
    text: "Optical smoke detector with 9 V battery, piezo alarm, test button, interconnect terminal, and no wireless radio.",
  },
  {
    label: "Connected smoke alarm",
    text: "Interconnected smart smoke alarm with lithium battery, optical smoke sensor, piezo alarm, Wi-Fi radio, push notifications, app control, and OTA firmware updates.",
  },
  {
    label: "Smart LED bulb",
    text: "Smart LED bulb with mains power via E27 screw cap, 9 W LED module, 806 lm output, RGBW colour changing, Wi-Fi radio, app control, and OTA firmware updates.",
  },
  {
    label: "Smart LED strip",
    text: "Smart LED strip with low-voltage mains adapter, addressable RGB LEDs, Wi-Fi radio, app control, music-reactive mode, cloud account, and OTA firmware updates.",
  },
  {
    label: "Motion sensor",
    text: "Wireless PIR motion sensor with AA battery power, Zigbee radio, built-in temperature sensor, hub-connected smart home integration, and no standalone internet access.",
  },
  {
    label: "Water leak sensor",
    text: "Water leak detector with AA battery power, conductive probe contacts, local audible alarm, Wi-Fi radio, app push notifications, and cloud account.",
  },
  {
    label: "Smart radiator valve",
    text: "Smart thermostatic radiator valve with AA battery power, motorized valve actuator, temperature sensor, Zigbee radio, and hub-connected app control.",
  },
  // Entertainment & AV
  {
    label: "Smart speaker",
    text: "Smart speaker with mains power, full-range speaker driver, Wi-Fi and Bluetooth radio, microphone array with mute button, voice assistant, cloud account, app control, and OTA firmware updates.",
  },
  {
    label: "Smart display",
    text: "Smart home display with mains power, 10-inch touchscreen, Wi-Fi and Bluetooth radio, microphone, camera, voice assistant, cloud account, app platform, and OTA software updates.",
  },
  {
    label: "Baby monitor",
    text: "Connected baby monitor with mains power, 1080p camera, infrared night vision, microphone, speaker, temperature sensor, Wi-Fi radio, app control, cloud account, and OTA firmware updates.",
  },
  {
    label: "VR headset",
    text: "Standalone VR headset with rechargeable lithium battery, USB-C charging, Wi-Fi 6 and Bluetooth radio, inside-out tracking cameras, IMU sensors, LCD panels, microphone, speakers, app ecosystem, cloud account, and OTA updates.",
  },
  {
    label: "Portable projector",
    text: "Portable smart projector with mains power, LED optic module, autofocus, built-in stereo speakers, Wi-Fi and Bluetooth radio, Android app platform, cloud account, and OTA firmware updates.",
  },
  {
    label: "Smart TV",
    text: "Smart television with mains power, 55-inch LED panel, Wi-Fi and Bluetooth radio, HDMI and USB ports, integrated streaming app platform, cloud account, microphone in remote, and OTA software updates.",
  },
  {
    label: "Soundbar",
    text: "Soundbar with mains power, stereo speaker array, wireless subwoofer, HDMI ARC, optical input, Wi-Fi and Bluetooth radio, app control, cloud streaming, and OTA firmware updates.",
  },
  {
    label: "Wireless earbuds",
    text: "True wireless earbuds with lithium battery charging case, Bluetooth radio, active noise cancellation, microphone, touch controls, and USB-C charging case.",
  },
  {
    label: "Over-ear headphones",
    text: "Wireless over-ear headphones with rechargeable lithium battery, USB-C charging, Bluetooth radio, active noise cancellation, microphone, and no cloud account required.",
  },
  {
    label: "Portable speaker",
    text: "Portable Bluetooth speaker with rechargeable lithium battery, dual driver stereo, Wi-Fi and Bluetooth radio, IPX7 water resistance, microphone for calls, and OTA firmware updates.",
  },
  {
    label: "E-reader",
    text: "E-ink e-reader with rechargeable lithium battery, USB-C charging, 6-inch e-paper display, Wi-Fi radio, cloud-synced library and account, and OTA software updates.",
  },
  // Computing & office
  {
    label: "Router",
    text: "Wi-Fi 6 home router with mains power, 2.4 GHz and 5 GHz dual-band radio, four Gigabit Ethernet ports, web and app administration, cloud-assisted setup, and OTA firmware updates.",
  },
  {
    label: "Monitor",
    text: "Computer monitor with mains power, 27-inch IPS panel, HDMI and DisplayPort inputs, USB hub, height-adjustable stand, and no wireless radio.",
  },
  {
    label: "Webcam",
    text: "USB desktop webcam with 1080p camera, built-in microphone, privacy shutter, indicator LED, USB bus power, and no standalone wireless connectivity.",
  },
  {
    label: "NAS drive",
    text: "Network-attached storage device with mains power, dual 3.5-inch HDD bays, Gigabit Ethernet, optional Wi-Fi radio, web administration interface, cloud-sync capability, and OTA firmware updates.",
  },
  {
    label: "UPS",
    text: "Uninterruptible power supply with mains input and output, sealed lead-acid battery, surge protection, LCD status display, USB monitoring port, and no wireless connectivity.",
  },
  {
    label: "3D printer",
    text: "Desktop FDM 3D printer with mains power, heated print bed, stepper motors, hotend with 260 °C nozzle, HEPA exhaust filter, 4-inch touchscreen, Wi-Fi radio, app control, and OTA firmware updates.",
  },
  {
    label: "Wireless keyboard",
    text: "Wireless keyboard with AA battery power, Bluetooth radio, scissor-switch keys, 2.4 GHz USB dongle receiver alternative, and no cloud account.",
  },
  {
    label: "Wireless mouse",
    text: "Wireless optical mouse with AA battery power, Bluetooth and 2.4 GHz USB dongle receiver, adjustable DPI, scroll wheel, and no cloud account.",
  },
  // Power tools & garden
  {
    label: "Cordless drill",
    text: "Cordless combi drill with 18 V lithium battery pack, brushless motor, two-speed gearbox, 13 mm keyless chuck, torque clutch, and battery charging cradle.",
  },
  {
    label: "Angle grinder",
    text: "Corded angle grinder with mains power, 850 W motor, 125 mm wheel guard, spindle lock, anti-kickback electronics, and no wireless connectivity.",
  },
  {
    label: "Heat gun",
    text: "Electric heat gun with mains power, 2000 W heating element, motorized fan, two-temperature switch, overheat protection, and no wireless connectivity.",
  },
  {
    label: "Electric hedge trimmer",
    text: "Cordless hedge trimmer with 20 V lithium battery, dual-action 50 cm blade, hand guard, blade tip protector, and no wireless connectivity.",
  },
  {
    label: "Leaf blower",
    text: "Cordless leaf blower with 40 V lithium battery, brushless motor, variable speed trigger, vacuum and blower mode, and no wireless connectivity.",
  },
  // Transport & EV
  {
    label: "Portable EV charger",
    text: "Portable EV charging cable with mains Schuko plug, Type 2 vehicle connector, 7.4 kW single-phase output, pilot signalling electronics, thermal protection, and no wireless connectivity.",
  },
  {
    label: "E-bike charger",
    text: "E-bike battery charger with mains power, 42 V 2 A CC/CV output, proprietary bike connector, LED charge status indicator, and no wireless connectivity.",
  },
  {
    label: "Electric scooter",
    text: "Electric kick scooter with rechargeable lithium battery, brushless hub motor, regenerative braking, LED lighting front and rear, Bluetooth radio, app control, and OTA firmware updates.",
  },
  // Pets & toys
  {
    label: "Pet feeder",
    text: "Automatic pet feeder with mains power and battery backup, food-contact hopper and portion dispenser, 1080p camera, microphone, speaker, Wi-Fi radio, cloud account, and OTA updates.",
  },
  {
    label: "GPS pet tracker",
    text: "GPS collar tracker with rechargeable lithium battery, GPS and GLONASS receiver, LTE-M cellular radio, Bluetooth LE radio, IP67 waterproof housing, cloud account, app tracking, and OTA firmware updates.",
  },
  {
    label: "Interactive robot toy",
    text: "Interactive companion robot toy with rechargeable lithium battery, drive motors, distance and touch sensors, speaker, microphone, Wi-Fi radio, cloud account, app control, and OTA firmware updates.",
  },
];
