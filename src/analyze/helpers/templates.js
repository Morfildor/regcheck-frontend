// Curated template catalog and dynamic template building.

import { uniqueBy } from "./text";

const CURATED_TEMPLATE_SPECS = [
  { productId: "coffee_machine",           label: "Coffee machine",                         suffix: "mains power, heating element, pressurised brew group, water tank, burr grinder, food-contact brew path, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "electric_kettle",          label: "Electric kettle",                        suffix: "mains power, 2200 W heating element, food-contact stainless steel interior, dry-boil protection, and no wireless radio" },
  { productId: "air_fryer",               label: "Air fryer",                              suffix: "mains power, 1500 W heating element, motorized circulation fan, food-contact non-stick cooking basket, electronic timer and temperature controls, and no wireless connectivity" },
  { productId: "coffee_grinder",           label: "Coffee grinder",                         suffix: "mains power, high-speed motor, food-contact grind path and hopper, dosing chute, and no wireless connectivity" },
  { productId: "blender",                 label: "Blender",                                suffix: "mains power, 1000 W motor, food-contact BPA-free jug and blades, multiple speed settings, pulse function, and no wireless connectivity" },
  { productId: "microwave_oven",           label: "Microwave oven",                         suffix: "mains power, 800 W magnetron, glass turntable, electronic controls, child lock, and no wireless connectivity" },
  { productId: "dishwasher",              label: "Dishwasher",                             suffix: "mains power, water inlet and drain connections, food-contact interior and spray arms, detergent dispenser, and optional Wi-Fi app integration" },
  { productId: "refrigerator_freezer",    label: "Refrigerator / freezer",                 suffix: "mains power, compressor, refrigerant loop, food-contact interior, electronic thermostat, and no wireless connectivity" },
  { productId: "food_processor",           label: "Food processor",                         suffix: "mains power, high-torque motor, food-contact bowl, multiple interchangeable blades and discs, electronic speed control, and no wireless connectivity" },
  { productId: "rice_cooker",             label: "Rice cooker",                            suffix: "mains power, 700 W heating plate, food-contact inner pot, keep-warm function, mechanical controls, and no wireless connectivity" },
  { productId: "hob",                     label: "Hob / cooktop",                          suffix: "mains power, 2000 W induction cooking zone, touch controls, child lock, residual heat indicator, and no wireless connectivity" },
  { productId: "juicer",                  label: "Juicer",                                 suffix: "mains power, high-speed motor, food-contact pulp container and filter basket, wide feeding chute, and no wireless connectivity" },
  { productId: "robot_vacuum",            label: "Robot vacuum cleaner",                   suffix: "rechargeable lithium battery, motorized suction and brush system, LiDAR navigation, camera, Wi-Fi and Bluetooth radio, cloud account, app control, and OTA firmware updates" },
  { productId: "vacuum_cleaner",          label: "Vacuum cleaner",                         suffix: "rechargeable lithium battery, motorized suction head, swappable attachments, LED floor lights, Bluetooth radio, app control, and OTA firmware updates" },
  { productId: "washing_machine",         label: "Washing machine",                        suffix: "mains power, water inlet and drain connections, drum motor, electronic controls, and optional Wi-Fi app integration for remote start" },
  { productId: "tumble_dryer",            label: "Tumble dryer",                           suffix: "mains power, drum motor, sealed refrigerant heat-pump loop, condensate tank, electronic controls, and Wi-Fi connectivity for app and OTA firmware updates" },
  { productId: "electric_iron",           label: "Electric iron",                          suffix: "mains power, ceramic soleplate, steam boiler, water tank, drip-stop function, and no wireless connectivity" },
  { productId: "high_pressure_cleaner",   label: "High-pressure cleaner",                  suffix: "mains power, high-pressure pump motor, spray gun, lance and nozzle set, detergent tank, and no wireless connectivity" },
  { productId: "oral_hygiene_appliance",  label: "Oral hygiene appliance",                 suffix: "rechargeable lithium battery, inductive charging base, oscillating brush head, bathroom IPX7 rating, Bluetooth radio, and app brushing coaching" },
  { productId: "shaver",                  label: "Electric shaver",                        suffix: "rechargeable lithium battery, USB-C charging, motorized shaving heads, bathroom IP67 rating, and no wireless connectivity" },
  { productId: "skin_hair_care_appliance",label: "Skin or hair care appliance",            suffix: "mains power, 2200 W heating element, motorized fan, multiple heat and speed settings, cool-shot button, and no wireless connectivity" },
  { productId: "massage_gun",             label: "Massage gun / percussion massager",       suffix: "rechargeable lithium battery, brushless motor, interchangeable attachment heads, three speed settings, and no wireless connectivity" },
  { productId: "smart_blood_pressure_monitor", label: "Smart blood pressure monitor",      suffix: "AA battery power, oscillometric measurement, inflatable cuff, LCD display, Bluetooth radio, app sync, and cloud account" },
  { productId: "smart_scale",             label: "Smart body scale / composition monitor", suffix: "AA battery power, load-cell sensors, body composition estimation via bioimpedance, Bluetooth radio, app sync, and cloud account" },
  { productId: "uv_c_sanitizer",          label: "UV-C sanitizer",                         suffix: "mains power, UV-C LED array, enclosed sanitising chamber, safety lid interlock, and no wireless connectivity" },
  { productId: "massage_appliance",       label: "Massage appliance",                      suffix: "mains power, rolling massage nodes, infrared heating, multiple intensity levels, and no wireless connectivity" },
  { productId: "air_purifier",            label: "Air purifier",                           suffix: "mains power, HEPA and activated-carbon filter, motorized fan, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "heat_pump",               label: "Heat pump / air conditioner",            suffix: "mains power, compressor, refrigerant loop, motorized fan, exhaust hose, Wi-Fi radio, app control, and OTA firmware updates" },
  { productId: "smart_plug",              label: "Smart plug / smart outlet",              suffix: "mains power input and output, 16 A relay, Wi-Fi radio, real-time energy monitoring, app control, cloud account, and OTA firmware updates" },
  { productId: "smart_lock",              label: "Smart lock",                             suffix: "AA battery power, motorized deadbolt, keypad and fingerprint reader, Bluetooth and Wi-Fi radio, mobile app control, cloud account, and OTA firmware updates" },
  { productId: "smart_doorbell",          label: "Smart video doorbell",                   suffix: "mains or rechargeable battery power, 1080p camera, microphone, speaker, PIR motion sensor, Wi-Fi radio, app control, cloud account, video storage, and OTA firmware updates" },
  { productId: "smart_security_camera",   label: "Smart security camera",                  suffix: "mains power, IP66 weatherproof housing, 4 MP camera, infrared night vision LEDs, microphone, speaker, Wi-Fi radio, cloud account, local microSD storage, and OTA firmware updates" },
  { productId: "smart_thermostat",        label: "Smart thermostat",                       suffix: "mains bus power, temperature and humidity sensors, OLED display, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "smart_smoke_co_alarm",    label: "Smart smoke / CO alarm",                 suffix: "lithium battery, optical smoke sensor, piezo alarm, Wi-Fi radio, push notifications, app control, and OTA firmware updates" },
  { productId: "smart_radiator_valve",    label: "Smart thermostatic radiator valve (TRV)",suffix: "AA battery power, motorized valve actuator, temperature sensor, Zigbee radio, and hub-connected app control" },
  { productId: "smart_speaker",           label: "Smart speaker",                          suffix: "mains power, full-range speaker driver, Wi-Fi and Bluetooth radio, microphone array with mute button, voice assistant, cloud account, app control, and OTA firmware updates" },
  { productId: "smart_display",           label: "Smart display",                          suffix: "mains power, touchscreen, Wi-Fi and Bluetooth radio, microphone, camera, voice assistant, cloud account, app platform, and OTA software updates" },
  { productId: "baby_monitor",            label: "Baby monitor",                           suffix: "mains power, 1080p camera, infrared night vision, microphone, speaker, temperature sensor, Wi-Fi radio, app control, cloud account, and OTA firmware updates" },
  { productId: "vr_ar_headset",           label: "VR / AR headset",                        suffix: "rechargeable lithium battery, USB-C charging, Wi-Fi 6 and Bluetooth radio, inside-out tracking cameras, IMU sensors, LCD panels, microphone, speakers, app ecosystem, cloud account, and OTA updates" },
  { productId: "home_projector",          label: "Home projector / smart projector",       suffix: "mains power, LED optic module, autofocus, built-in stereo speakers, Wi-Fi and Bluetooth radio, app platform, cloud account, and OTA firmware updates" },
  { productId: "smart_tv",               label: "Television / smart TV",                  suffix: "mains power, 55-inch LED panel, Wi-Fi and Bluetooth radio, HDMI and USB ports, integrated streaming app platform, cloud account, microphone in remote, and OTA software updates" },
  { productId: "soundbar",               label: "Soundbar",                               suffix: "mains power, stereo speaker array, wireless subwoofer, HDMI ARC, optical input, Wi-Fi and Bluetooth radio, app control, cloud streaming, and OTA firmware updates" },
  { productId: "true_wireless_earbuds",   label: "True wireless earbuds (TWS)",            suffix: "lithium battery charging case, Bluetooth radio, active noise cancellation, microphone, touch controls, and USB-C charging case" },
  { productId: "wireless_headphones",     label: "Wireless headphones / earbuds",          suffix: "rechargeable lithium battery, USB-C charging, Bluetooth radio, active noise cancellation, microphone, and no cloud account required" },
  { productId: "bluetooth_speaker",       label: "Portable Bluetooth speaker",             suffix: "rechargeable lithium battery, dual driver stereo, Wi-Fi and Bluetooth radio, IPX7 water resistance, microphone for calls, and OTA firmware updates" },
  { productId: "e_reader",               label: "E-reader",                               suffix: "rechargeable lithium battery, USB-C charging, 6-inch e-paper display, Wi-Fi radio, cloud-synced library and account, and OTA software updates" },
  { productId: "router",                 label: "Router",                                 suffix: "mains power, 2.4 GHz and 5 GHz dual-band radio, four Gigabit Ethernet ports, web and app administration, cloud-assisted setup, and OTA firmware updates" },
  { productId: "monitor",               label: "Monitor",                                suffix: "mains power, 27-inch IPS panel, HDMI and DisplayPort inputs, height-adjustable stand, and no wireless radio" },
  { productId: "webcam",                label: "Webcam",                                 suffix: "USB desktop camera, built-in microphone, privacy shutter, indicator LED, USB bus power, and no standalone wireless connectivity" },
  { productId: "server",                label: "Server / NAS",                           suffix: "mains power, dual 3.5-inch HDD bays, Gigabit Ethernet, optional Wi-Fi radio, web administration interface, cloud-sync capability, and OTA firmware updates" },
  { productId: "printer_3d",            label: "3D printer",                             suffix: "mains power, heated print bed, stepper motors, hotend with 260 °C nozzle, HEPA exhaust filter, touchscreen, Wi-Fi radio, app control, and OTA firmware updates" },
  { productId: "cordless_power_drill",   label: "Cordless power drill / drill driver",    suffix: "18 V lithium battery pack, brushless motor, two-speed gearbox, 13 mm keyless chuck, torque clutch, and battery charging cradle" },
  { productId: "angle_grinder",          label: "Angle grinder",                          suffix: "mains power, 850 W motor, 125 mm wheel guard, spindle lock, anti-kickback electronics, and no wireless connectivity" },
  { productId: "electric_garden_tool",   label: "Electric garden tool",                   suffix: "20 V lithium battery, dual-action hedge trimmer blade, hand guard, blade tip protector, and no wireless connectivity" },
  { productId: "portable_ev_charger",    label: "Portable EV charger / mode 2 EVSE",      suffix: "mains Schuko plug, Type 2 vehicle connector, 7.4 kW single-phase output, pilot signalling electronics, thermal protection, and no wireless connectivity" },
  { productId: "electric_scooter",       label: "Electric scooter",                       suffix: "rechargeable lithium battery, brushless hub motor, regenerative braking, LED lighting front and rear, Bluetooth radio, app control, and OTA firmware updates" },
  { productId: "smart_pet_feeder",       label: "Smart pet feeder",                       suffix: "mains power and battery backup, food-contact hopper and portion dispenser, 1080p camera, microphone, speaker, Wi-Fi radio, cloud account, and OTA updates" },
  { productId: "gps_pet_tracker",        label: "GPS pet tracker",                        suffix: "rechargeable lithium battery, GPS and GLONASS receiver, LTE-M cellular radio, Bluetooth LE radio, IP67 waterproof housing, cloud account, app tracking, and OTA firmware updates" },
  { productId: "smart_toy",             label: "Smart connected toy",                    suffix: "rechargeable lithium battery, drive motors, distance and touch sensors, speaker, microphone, Wi-Fi radio, cloud account, app control, and OTA firmware updates" },
];

function buildCuratedTemplateText(label, suffix) {
  return `${label} with ${suffix}.`;
}

function makeCuratedTemplateChoice(spec, product = null) {
  const label = product?.label || spec.label;
  return {
    label,
    text:      buildCuratedTemplateText(label, spec.suffix),
    productId: product?.id || spec.productId,
  };
}

export function buildDynamicTemplates(products) {
  const lookup = new Map((products || []).map((product) => [product.id, product]));
  return uniqueBy(
    CURATED_TEMPLATE_SPECS.map((spec) => makeCuratedTemplateChoice(spec, lookup.get(spec.productId))),
    (item) => item.label
  );
}
