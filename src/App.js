import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  DETECTION UTILITIES  (v2 — exhaustive keyword matching)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if ANY of the keywords appear in the lowercased text.
 * Handles whole-word and substring matches.
 */
function anyOf(text, keywords) {
  return keywords.some(k => text.includes(k));
}

/**
 * Returns true if the text contains at least `minCount` keywords from the list.
 * Useful when you want "two of these things must be present".
 */
function countOf(text, keywords) {
  return keywords.filter(k => text.includes(k)).length;
}

// ── Keyword groups ────────────────────────────────────────────────────────────

const KW = {

  // ── EU / European market ──────────────────────────────────────────────────
  EU_MARKET: [
    "eu", "e.u.", "eea", "e.e.a.", "european union", "european economic area",
    "europe", "european", "european market", "eu market", "eu consumers",
    "eu customer", "eu customers", "eu user", "eu users", "eu citizen",
    "eu citizens", "eu member", "eu members", "eu member state",
    "eu member states", "member state", "member states",
    "single market", "ce mark", "ce marking", "ce certified",
    "ce compliance", "ce declaration", "declaration of conformity",
    "eu regulation", "eu directive", "eu law", "eu legislation",
    // Country mentions implying EU
    "germany", "france", "italy", "spain", "netherlands", "poland",
    "belgium", "sweden", "austria", "denmark", "finland", "ireland",
    "portugal", "czech", "slovakia", "hungary", "romania", "bulgaria",
    "greece", "croatia", "slovenia", "estonia", "latvia", "lithuania",
    "luxembourg", "malta", "cyprus",
  ],

  // ── Consumer / end-user ───────────────────────────────────────────────────
  CONSUMER: [
    "consumer", "consumers", "end user", "end users", "end-user", "end-users",
    "end consumer", "home user", "home users", "household", "households",
    "residential", "residential use", "home use", "personal use",
    "private use", "retail", "retail product", "retail market",
    "general public", "mass market", "b2c", "business to consumer",
    "individual user", "individual users", "everyday user", "everyday users",
    "domestic", "domestic use", "domestic product",
  ],

  // ── Industrial / professional ─────────────────────────────────────────────
  INDUSTRIAL: [
    "industrial", "industry", "b2b", "business to business",
    "professional", "professional use", "commercial", "commercial use",
    "factory", "warehouse", "facility", "facilities",
    "scada", "plc", "dcs", "automation", "process control",
    "manufacturing", "production line", "assembly line",
  ],

  // ── Medical / healthcare ──────────────────────────────────────────────────
  MEDICAL: [
    "medical", "medical device", "healthcare", "health care", "clinical",
    "clinical use", "diagnostic", "diagnostics", "therapeutic",
    "hospital", "clinic", "patient", "patients", "physician",
    "doctor", "nurse", "mdr", "ivdr", "ce class", "medical grade",
    "wellness device", "health monitor", "health monitoring",
  ],

  // ── Children ──────────────────────────────────────────────────────────────
  CHILDREN: [
    "child", "children", "kids", "kid", "toddler", "toddlers",
    "infant", "infants", "baby", "babies", "minor", "minors",
    "under 18", "under 16", "under 13", "toy", "toys", "school",
    "education", "educational", "classroom", "student", "students",
    "parental control", "parental controls", "age verification",
    "age restriction", "age gate", "coppa", "children's",
  ],

  // ── WiFi ──────────────────────────────────────────────────────────────────
  WIFI: [
    "wifi", "wi-fi", "wi fi", "wlan", "wireless lan", "wireless local area",
    "802.11", "802.11a", "802.11b", "802.11g", "802.11n", "802.11ac",
    "802.11ax", "802.11be", "wifi 4", "wifi 5", "wifi 6", "wifi 6e", "wifi 7",
    "2.4ghz", "2.4 ghz", "5ghz", "5 ghz", "6ghz", "6 ghz",
    "dual band", "dual-band", "tri band", "tri-band",
    "wireless network", "wireless networking", "access point",
  ],

  // ── Bluetooth ─────────────────────────────────────────────────────────────
  BLUETOOTH: [
    "bluetooth", "bt ", "bt5", "bt4", "bt 5", "bt 4",
    "ble", "bluetooth le", "bluetooth low energy",
    "bluetooth smart", "bluetooth classic",
    "bt 4.0", "bt 4.1", "bt 4.2", "bt 5.0", "bt 5.1", "bt 5.2", "bt 5.3",
    "bluetooth 4", "bluetooth 5",
  ],

  // ── Zigbee / Thread / Matter / Z-Wave ────────────────────────────────────
  ZIGBEE: [
    "zigbee", "z-wave", "zwave", "thread", "matter protocol",
    "ieee 802.15", "ieee 802.15.4", "openthread", "mesh network",
    "mesh networking", "smart home protocol",
  ],

  // ── LoRa / LPWAN ─────────────────────────────────────────────────────────
  LORA: [
    "lora", "lorawan", "lora wan", "lpwan", "low power wide area",
    "sigfox", "868mhz", "868 mhz", "915mhz", "915 mhz",
    "433mhz", "433 mhz", "sub-ghz", "sub ghz",
  ],

  // ── NFC / RFID ────────────────────────────────────────────────────────────
  NFC: [
    "nfc", "near field", "near-field communication",
    "rfid", "uhf rfid", "hf rfid", "contactless",
  ],

  // ── Cellular ─────────────────────────────────────────────────────────────
  CELLULAR: [
    "lte", "4g", "5g", "nb-iot", "nbiot", "nb iot",
    "cat-m", "cat m", "cat-m1", "lte-m", "emtc",
    "cellular", "cell modem", "sim card", "esim", "e-sim",
    "gsm", "3gpp", "umts", "2g", "3g",
    "mobile network", "mobile data", "mobile connectivity",
  ],

  // ── Mains power ───────────────────────────────────────────────────────────
  MAINS: [
    "mains", "mains power", "mains powered", "mains-powered",
    "mains supply", "wall power", "wall socket", "wall outlet",
    "ac power", "ac powered", "ac supply",
    "230v", "230 v", "240v", "240 v", "220v", "220 v",
    "110v", "110 v", "120v", "120 v",
    "grid power", "power grid", "hardwired", "hard-wired",
    "power supply unit", "psu", "ac adapter", "ac adaptor",
    "plug-in", "plug in", "mains plug",
  ],

  // ── Battery ───────────────────────────────────────────────────────────────
  BATTERY: [
    "battery", "batteries", "rechargeable", "rechargeable battery",
    "li-ion", "li ion", "lithium ion", "lithium-ion",
    "lipo", "li-po", "lithium polymer", "lithium-polymer",
    "lifepo4", "lifepo", "lithium iron",
    "alkaline", "alkaline battery", "aa battery", "aa batteries",
    "aaa battery", "aaa batteries", "coin cell", "button cell",
    "cr2032", "18650", "battery pack", "battery cell", "battery cells",
    "battery powered", "battery-powered", "battery operated",
    "battery operated", "usb charged", "usb-charged",
    "3.7v", "3.6v", "7.4v", "11.1v",
  ],

  // ── USB power ─────────────────────────────────────────────────────────────
  USB_POWER: [
    "usb power", "usb powered", "usb-powered",
    "usb-c power", "usb c power", "usb type-c power",
    "5v usb", "5v via usb", "powered by usb",
    "usb charging", "usb charger", "power bank",
    "usb pd", "usb power delivery",
  ],

  // ── Personal data ─────────────────────────────────────────────────────────
  PERSONAL_DATA: [
    "personal data", "personal information", "personally identifiable",
    "pii", "user data", "user information", "user profile", "user profiles",
    "account data", "account information",
    "email", "email address", "e-mail", "name", "full name",
    "phone number", "telephone", "address", "home address",
    "date of birth", "dob", "passport", "id number",
    "customer data", "customer information",
    "stores data", "collects data", "data collection",
    "data processing", "processes data",
  ],

  // ── Health data ───────────────────────────────────────────────────────────
  HEALTH_DATA: [
    "health data", "health information", "health record", "health records",
    "medical data", "medical information", "medical record",
    "heart rate", "heart rate monitor", "bpm", "pulse",
    "blood pressure", "blood oxygen", "spo2", "oxygen saturation",
    "ecg", "ekg", "electrocardiogram",
    "sleep data", "sleep tracking", "sleep monitor",
    "stress level", "stress monitoring",
    "body temperature", "temperature sensor",
    "calories", "calorie tracking", "steps", "step counter",
    "fitness data", "fitness tracking", "activity data",
    "glucose", "blood glucose", "diabetes",
    "weight", "bmi", "body mass",
  ],

  // ── Location data ─────────────────────────────────────────────────────────
  LOCATION_DATA: [
    "location", "location data", "location tracking", "location history",
    "gps", "global positioning", "gnss",
    "geolocation", "geo-location", "geofence", "geofencing",
    "latitude", "longitude", "coordinates",
    "tracking", "track location", "real-time location",
    "indoor positioning", "indoor location",
    "maps", "mapping",
  ],

  // ── Biometric data ────────────────────────────────────────────────────────
  BIOMETRIC: [
    "biometric", "biometrics", "biometric data",
    "fingerprint", "fingerprint scanner", "fingerprint reader",
    "face id", "face recognition", "facial recognition",
    "iris scan", "iris recognition", "retina scan",
    "voice recognition", "voice id", "voice print",
    "palm print", "vein recognition",
  ],

  // ── Cloud / internet connectivity ─────────────────────────────────────────
  CLOUD: [
    "cloud", "cloud server", "cloud platform", "cloud service",
    "cloud storage", "cloud backend", "cloud based", "cloud-based",
    "server", "remote server", "backend server", "api server",
    "aws", "amazon web services", "azure", "microsoft azure",
    "google cloud", "gcp", "firebase",
    "internet", "internet connection", "internet connected",
    "online", "connected device", "iot", "internet of things",
    "iiot", "industrial iot", "mqtt", "http", "https", "api",
    "rest api", "web service", "web server",
    "hosted", "hosting", "saas", "software as a service",
  ],

  // ── No cloud / offline ────────────────────────────────────────────────────
  NO_CLOUD: [
    "no cloud", "no internet", "no online", "local only", "locally only",
    "offline", "standalone", "self-contained", "no remote",
    "fully offline", "air-gapped", "air gapped", "no connectivity",
    "no network", "without internet", "without cloud",
  ],

  // ── OTA updates ───────────────────────────────────────────────────────────
  OTA: [
    "ota", "over-the-air", "over the air", "firmware update", "firmware updates",
    "software update", "software updates", "remote update", "remote updates",
    "automatic update", "automatic updates", "auto update", "auto-update",
    "fota", "fota update", "ota firmware", "update mechanism",
    "push update", "background update", "silent update",
  ],

  // ── Signed firmware ───────────────────────────────────────────────────────
  SIGNED_FW: [
    "signed firmware", "firmware signature", "firmware signing",
    "cryptographic signature", "code signing", "secure boot",
    "verified boot", "signature verification", "rsa", "ecdsa",
    "firmware verification", "trusted firmware",
  ],

  // ── Default password ─────────────────────────────────────────────────────
  DEFAULT_PW: [
    "default password", "default passwords", "default credentials",
    "factory default password", "preset password",
    "same password", "shared password", "universal password",
    "admin/admin", "admin password", "admin123",
    "default login", "default username",
  ],

  // ── Unique password ───────────────────────────────────────────────────────
  UNIQUE_PW: [
    "unique password", "unique passwords", "unique credentials",
    "per-device", "per device", "device-specific", "device specific",
    "individual password", "unique per device", "device password",
    "qr code password", "printed password", "label password",
  ],

  // ── Authentication ────────────────────────────────────────────────────────
  AUTH: [
    "login", "log in", "log-in", "sign in", "sign-in", "signin",
    "password", "passphrase", "passcode",
    "authentication", "authenticate",
    "user account", "user accounts", "account creation",
    "credentials", "credential",
    "pin", "pin code", "pin number",
    "mfa", "2fa", "two-factor", "two factor", "multi-factor",
    "totp", "authenticator app",
    "oauth", "oauth2", "sso", "single sign-on",
    "pairing", "device pairing", "bluetooth pairing",
    "biometric login",
  ],

  // ── MFA / 2FA ─────────────────────────────────────────────────────────────
  MFA: [
    "mfa", "2fa", "two-factor", "two factor", "multi-factor",
    "2-factor", "second factor", "totp", "authenticator",
    "authenticator app", "google authenticator", "hardware token",
    "one-time password", "otp", "one time password",
    "sms code", "email code", "verification code",
  ],

  // ── Brute force / lockout ─────────────────────────────────────────────────
  LOCKOUT: [
    "lockout", "lock out", "account lock", "account lockout",
    "rate limit", "rate limiting", "rate-limit",
    "brute force", "brute-force", "failed attempts",
    "max attempts", "maximum attempts", "login attempts",
    "temporary lock", "temporary ban",
  ],

  // ── AI / ML ───────────────────────────────────────────────────────────────
  AI: [
    "artificial intelligence", "ai ", "ai-powered", "ai powered",
    " ai,", " ai.", "(ai)", "ai-based", "ai based",
    "machine learning", "ml ", " ml,", " ml.", "ml model",
    "deep learning", "neural network", "neural net",
    "large language model", "llm", "gpt", "generative ai",
    "computer vision", "image recognition", "object detection",
    "natural language processing", "nlp", "text analysis",
    "recommendation engine", "recommender system",
    "predictive", "prediction model", "classification model",
    "inference", "model inference", "on-device model",
    "edge ai", "edge inference", "tflite", "tensorflow lite",
    "onnx",
  ],

  // ── Camera / video ────────────────────────────────────────────────────────
  CAMERA: [
    "camera", "cameras", "webcam", "video camera",
    "video stream", "video streaming", "live stream", "live video",
    "image capture", "photo capture", "snapshot",
    "cctv", "surveillance", "surveillance camera",
    "security camera", "ip camera", "ptz camera",
    "fisheye", "wide angle camera",
  ],

  // ── Face recognition ─────────────────────────────────────────────────────
  FACE_RECOG: [
    "face recognition", "facial recognition", "face id",
    "face detection", "face analysis", "face tracking",
    "facial analysis", "facial detection",
    "face unlock", "face authentication",
  ],

  // ── Voice assistant / always-on ───────────────────────────────────────────
  VOICE_AI: [
    "voice assistant", "voice assistants",
    "wake word", "hotword", "always listening", "always-on microphone",
    "speech recognition", "voice recognition",
    "voice command", "voice commands", "voice control",
    "alexa", "google assistant", "siri", "cortana",
    "smart speaker", "voice activated",
  ],

  // ── Prohibited AI ─────────────────────────────────────────────────────────
  PROHIBITED_AI: [
    "social scoring", "social credit",
    "real-time biometric surveillance", "real time biometric",
    "subliminal manipulation", "subliminal technique",
    "emotion recognition public", "mass surveillance",
  ],

  // ── High-risk AI ─────────────────────────────────────────────────────────
  HIGH_RISK_AI: [
    "emotion recognition", "emotion detection", "sentiment analysis face",
    "automated decision", "automated decisions", "automated decision-making",
    "autonomous decision", "autonomous decisions",
    "user scoring", "scoring users", "ranking users",
    "credit scoring", "insurance scoring",
    "recruitment ai", "hiring ai", "job selection ai",
    "law enforcement ai", "policing ai",
    "critical infrastructure ai",
    "educational ai", "children's ai", "ai for kids", "ai tutor",
    "adaptive learning ai",
    "biometric ai",
  ],

  // ── Software / firmware / digital ─────────────────────────────────────────
  SOFTWARE: [
    "software", "firmware", "embedded software", "embedded firmware",
    "application", "app", "mobile app", "web app", "web application",
    "rtos", "real-time os", "embedded linux", "linux", "freertos",
    "microcontroller", "mcu", "processor", "microprocessor",
    "digital", "digital product", "digital component",
    "code", "codebase", "source code",
    "sdk", "library", "libraries", "framework",
  ],

  // ── Third party / supply chain ───────────────────────────────────────────
  THIRD_PARTY: [
    "third party", "third-party", "3rd party", "3rd-party",
    "third-party sdk", "third party sdk", "third-party library",
    "open source", "open-source", "oss component",
    "supplier", "supplier module", "vendor module", "vendor sdk",
    "off-the-shelf", "off the shelf", "cots",
  ],

  // ── SBOM ─────────────────────────────────────────────────────────────────
  SBOM: [
    "sbom", "software bill of materials", "bill of materials",
    "component inventory", "software inventory",
    "open source inventory", "dependency list", "dependencies",
    "spdx", "cyclonedx",
  ],

  // ── Vulnerability disclosure ──────────────────────────────────────────────
  VULN_DISCLOSURE: [
    "vulnerability disclosure", "responsible disclosure",
    "coordinated vulnerability", "cvd", "cvd policy",
    "bug bounty", "bug bounty program",
    "security advisory", "security advisories",
    "cve", "cvss", "security patch", "security patches",
    "patch management", "security update policy",
  ],

  // ── Data sharing / third party ────────────────────────────────────────────
  DATA_SHARING: [
    "share data", "data sharing", "shares data",
    "third party", "third-party", "analytics provider",
    "advertising", "ad network", "monetise", "monetize", "monetisation",
    "sell data", "sell user data", "data broker",
    "partner", "affiliate",
  ],

  // ── Cross-border data transfer ────────────────────────────────────────────
  CROSS_BORDER: [
    "us server", "us cloud", "united states server",
    "aws", "amazon web services", "azure", "google cloud",
    "non-eu", "non eu", "outside eu", "outside europe",
    "us-based server", "us based server",
    "transfer to", "data transfer",
    "international transfer", "cross-border",
  ],

  // ── Data retention / logging ──────────────────────────────────────────────
  DATA_RETENTION: [
    "store data", "stores data", "data storage", "data stored",
    "data retention", "retention policy",
    "log", "logging", "logs", "audit log", "event log",
    "history", "usage history", "data history",
    "archive", "archiving", "backup",
    "record", "records", "data record",
  ],

  // ── Encryption ────────────────────────────────────────────────────────────
  ENCRYPTION: [
    "encrypt", "encrypted", "encryption",
    "tls", "tls 1.2", "tls 1.3", "ssl", "https",
    "aes", "aes-128", "aes-256",
    "end-to-end", "e2e", "end to end encryption",
    "at rest", "in transit", "in-transit",
    "cryptography", "cryptographic",
  ],

  // ── Repairability ─────────────────────────────────────────────────────────
  REPAIRABILITY: [
    "repair", "repairable", "reparable",
    "replaceable", "user replaceable", "user-replaceable",
    "spare part", "spare parts",
    "ifixit", "right to repair",
    "modular", "modular design", "serviceable",
    "disassemble", "disassembly",
  ],

  // ── Recycling / end of life ───────────────────────────────────────────────
  RECYCLING: [
    "recycled", "recycling", "recyclable",
    "circular", "circular economy", "circular design",
    "eol", "end of life", "end-of-life",
    "take back", "take-back", "return scheme",
    "weee", "electronic waste", "e-waste",
    "biodegradable", "compostable",
  ],

  // ── Energy label ──────────────────────────────────────────────────────────
  ENERGY_LABEL: [
    "energy label", "energy class", "energy rating", "energy efficiency class",
    "a+++", "a++", "a+ rating",
    "erp", "ecodesign regulation", "energy regulation",
    "standby power", "standby consumption",
    "energy consumption", "power consumption", "watts",
  ],

  // ── Safety functions ──────────────────────────────────────────────────────
  SAFETY: [
    "safety function", "safety critical", "safety-critical",
    "emergency", "emergency stop", "emergency shutdown",
    "alarm", "alarm system", "fire alarm", "smoke alarm",
    "co detector", "carbon monoxide", "smoke detector",
    "fail safe", "fail-safe", "failsafe",
    "iec 61508", "iec 62061", "iso 13849",
  ],

  // ── High voltage ─────────────────────────────────────────────────────────
  HIGH_VOLTAGE: [
    "high voltage", "hv", "high-voltage",
    "400v", "480v", "600v",
    "motor drive", "vfd", "variable frequency drive",
    "inverter", "power inverter",
    "igbt", "mosfet power",
  ],

  // ── Energy data ───────────────────────────────────────────────────────────
  ENERGY_DATA: [
    "energy data", "consumption data", "power usage",
    "electricity usage", "smart meter", "smart metering",
    "utility data", "grid data",
  ],

  // ── Behavioral data ───────────────────────────────────────────────────────
  BEHAVIORAL: [
    "behavior", "behaviour", "behavioural", "behavioral",
    "usage pattern", "usage patterns", "usage data",
    "activity data", "activity tracking", "habits",
    "consumption pattern", "consumption habits",
    "browsing history", "interaction data",
  ],

};

// ─────────────────────────────────────────────────────────────────────────────
//  CHECKLIST QUESTIONS  (v2 — robust detection per question)
// ─────────────────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: "what",
    label: "What does your product do?",
    example: '"A smart thermostat that controls home heating"',
    detect: t =>
      t.length > 60 &&
      anyOf(t, [
        "device", "product", "system", "sensor", "monitor", "tracker",
        "controller", "hub", "gateway", "camera", "speaker", "display",
        "wearable", "appliance", "charger", "meter", "lock", "alarm",
        "thermostat", "reader", "scanner", "detector", "module", "unit",
        "gadget", "accessory", "hardware", "machine", "equipment",
        "tool", "instrument", "panel", "beacon", "tag", "label",
        "actuator", "pump", "valve", "light", "bulb", "switch",
        "dimmer", "plug", "socket", "router", "modem", "repeater",
        "extender", "bridge", "dongle", "adapter", "converter",
        "transmitter", "receiver", "antenna", "remote",
      ]),
  },
  {
    id: "market",
    label: "Who uses it and where?",
    example: '"EU consumers at home" or "B2B industrial factory"',
    detect: t =>
      anyOf(t, [
        ...KW.CONSUMER,
        ...KW.INDUSTRIAL,
        ...KW.MEDICAL,
        ...KW.CHILDREN,
        ...KW.EU_MARKET,
      ]),
  },
  {
    id: "wireless",
    label: "Does it use wireless / radio?",
    example: '"WiFi 802.11ac" or "Bluetooth 5.0" or "No wireless"',
    detect: t =>
      anyOf(t, [
        ...KW.WIFI, ...KW.BLUETOOTH, ...KW.ZIGBEE,
        ...KW.LORA, ...KW.NFC, ...KW.CELLULAR,
        "wireless", "radio", "rf ", "rf-", "radio frequency",
        "no wireless", "no radio", "no wifi", "no bluetooth",
        "wired only", "ethernet only",
      ]),
  },
  {
    id: "power",
    label: "How is it powered?",
    example: '"230V mains" or "3.7V Li-ion battery" or "USB-C 5V"',
    detect: t =>
      anyOf(t, [
        ...KW.MAINS, ...KW.BATTERY, ...KW.USB_POWER,
        "poe", "power over ethernet",
        "solar", "solar powered", "solar panel",
        "energy harvesting",
      ]),
  },
  {
    id: "data",
    label: "Does it collect personal data?",
    example: '"Stores user email and GPS location" or "No personal data"',
    detect: t =>
      anyOf(t, [
        ...KW.PERSONAL_DATA, ...KW.HEALTH_DATA,
        ...KW.LOCATION_DATA, ...KW.BIOMETRIC,
        "no personal data", "no user data", "no data collected",
        "anonymous", "anonymised", "anonymized",
        "no pii", "privacy preserving",
      ]),
  },
  {
    id: "cloud",
    label: "Does it connect to the internet?",
    example: '"AWS cloud in Ireland" or "Fully offline, no internet"',
    detect: t =>
      anyOf(t, [
        ...KW.CLOUD,
        ...KW.NO_CLOUD,
        "mobile app", "smartphone app", "ios app", "android app",
        "web interface", "web dashboard", "web portal",
        "companion app", "dashboard",
      ]),
  },
  {
    id: "software",
    label: "Does it have software or firmware?",
    example: '"Embedded firmware with OTA updates" or "No software"',
    detect: t =>
      anyOf(t, [
        ...KW.SOFTWARE, ...KW.OTA,
        "no software", "no firmware", "purely mechanical",
        "no embedded", "mechanical only",
      ]),
  },
  {
    id: "login",
    label: "How do users log in?",
    example: '"Unique per-device password" or "OAuth2 + MFA" or "No login"',
    detect: t =>
      anyOf(t, [
        ...KW.AUTH, ...KW.MFA, ...KW.DEFAULT_PW, ...KW.UNIQUE_PW,
        "no login", "no authentication", "no password",
        "no account", "no user account", "open access",
      ]),
  },
  {
    id: "ai",
    label: "Does it use AI or machine learning?",
    example: '"On-device ML model" or "Cloud GPT" or "No AI features"',
    detect: t =>
      anyOf(t, [
        ...KW.AI, ...KW.FACE_RECOG, ...KW.VOICE_AI,
        ...KW.HIGH_RISK_AI, ...KW.PROHIBITED_AI,
        "no ai", "no ml", "no machine learning",
        "no artificial intelligence", "no ai features",
        "rule-based", "rule based", "not ai",
      ]),
  },
  {
    id: "safety",
    label: "Any physical safety concerns?",
    example: '"Contains Li-ion battery" or "230V inside" or "No hazards"',
    detect: t =>
      anyOf(t, [
        ...KW.HIGH_VOLTAGE, ...KW.MAINS, ...KW.BATTERY,
        ...KW.SAFETY,
        "high temperature", "hot surface", "burn hazard",
        "chemical", "toxic", "hazardous", "flammable",
        "ip67", "ip68", "ip65", "ip rating", "waterproof",
        "no safety", "no hazard", "no voltage hazard",
        "low voltage", "safe voltage", "extra-low voltage",
      ]),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  DIRECTIVE DETECTION  (v2)
//  Returns array like ["RED", "CRA", "GDPR"]
// ─────────────────────────────────────────────────────────────────────────────

function detectDirectives(text) {
  const t = text.toLowerCase();
  const result = new Set();

  // ── RED: Radio Equipment Directive ────────────────────────────────────────
  if (
    anyOf(t, KW.WIFI) ||
    anyOf(t, KW.BLUETOOTH) ||
    anyOf(t, KW.ZIGBEE) ||
    anyOf(t, KW.LORA) ||
    anyOf(t, KW.NFC) ||
    anyOf(t, KW.CELLULAR) ||
    anyOf(t, ["wireless", "rf module", "rf transmitter", "rf receiver",
               "radio frequency", "radio module", "radio transmit",
               "radio communication", "radio link"])
  ) {
    result.add("RED");
  }

  // ── CRA: Cyber Resilience Act ─────────────────────────────────────────────
  if (
    anyOf(t, KW.SOFTWARE) ||
    anyOf(t, KW.OTA) ||
    anyOf(t, KW.CLOUD) ||
    anyOf(t, KW.WIFI) ||
    anyOf(t, KW.BLUETOOTH) ||
    anyOf(t, KW.CELLULAR) ||
    anyOf(t, ["internet", "connected", "network", "ethernet",
               "tcp", "mqtt", "http", "https", "usb", "api",
               "digital", "processor", "microcontroller", "mcu"])
  ) {
    result.add("CRA");
  }

  // ── GDPR: General Data Protection Regulation ──────────────────────────────
  if (
    anyOf(t, KW.PERSONAL_DATA) ||
    anyOf(t, KW.HEALTH_DATA) ||
    anyOf(t, KW.LOCATION_DATA) ||
    anyOf(t, KW.BIOMETRIC) ||
    anyOf(t, KW.BEHAVIORAL) ||
    anyOf(t, KW.DATA_SHARING) ||
    anyOf(t, KW.DATA_RETENTION) ||
    anyOf(t, ["privacy", "gdpr", "data protection", "data subject",
               "consent", "lawful basis", "dpia", "data controller",
               "data processor", "right to erasure"])
  ) {
    result.add("GDPR");
  }

  // ── AI Act ────────────────────────────────────────────────────────────────
  if (
    anyOf(t, KW.AI) ||
    anyOf(t, KW.FACE_RECOG) ||
    anyOf(t, KW.VOICE_AI) ||
    anyOf(t, KW.HIGH_RISK_AI) ||
    anyOf(t, KW.PROHIBITED_AI)
  ) {
    result.add("AI_Act");
  }

  // ── LVD: Low Voltage Directive ────────────────────────────────────────────
  if (
    anyOf(t, KW.MAINS) ||
    anyOf(t, KW.BATTERY) ||
    anyOf(t, KW.USB_POWER) ||
    anyOf(t, KW.HIGH_VOLTAGE) ||
    anyOf(t, ["poe", "power over ethernet",
               "electrical", "voltage", "current", "ampere",
               "watt", "wattage", "joule",
               "fuse", "circuit breaker", "insulation",
               "transformer", "rectifier"])
  ) {
    result.add("LVD");
  }

  // ── EMC: Electromagnetic Compatibility Directive ───────────────────────────
  if (
    anyOf(t, KW.WIFI) ||
    anyOf(t, KW.BLUETOOTH) ||
    anyOf(t, KW.ZIGBEE) ||
    anyOf(t, KW.CELLULAR) ||
    anyOf(t, KW.MAINS) ||
    anyOf(t, ["electronic", "electrical", "pcb", "circuit board",
               "sensor", "actuator", "motor", "relay",
               "microcontroller", "microprocessor", "power supply",
               "usb", "display", "lcd", "oled", "led driver",
               "switching", "switch mode", "smps",
               "electromagnetic", "interference", "emc"])
  ) {
    result.add("EMC");
  }

  // ── ESPR: Ecodesign for Sustainable Products Regulation ───────────────────
  if (
    anyOf(t, KW.REPAIRABILITY) ||
    anyOf(t, KW.RECYCLING) ||
    anyOf(t, KW.ENERGY_LABEL) ||
    anyOf(t, KW.OTA) ||
    anyOf(t, ["ecodesign", "sustainability", "sustainable",
               "carbon footprint", "carbon neutral", "co2",
               "digital product passport", "dpp",
               "durability", "lifespan", "lifetime",
               "material", "materials", "recyclability",
               "repairability index", "spare parts availability"])
  ) {
    result.add("ESPR");
  }

  // ── Fallback: if nothing detected but text is substantial ─────────────────
  if (result.size === 0 && text.trim().length > 30) {
    result.add("CRA");
    result.add("EMC");
  }

  return Array.from(result);
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DIR_META = {
  RED:    { label: "RED",    full: "Radio Equipment Directive",          color: "#3b82f6" },
  CRA:    { label: "CRA",    full: "Cyber Resilience Act",               color: "#a855f7" },
  GDPR:   { label: "GDPR",   full: "General Data Protection Regulation", color: "#10b981" },
  AI_Act: { label: "AI Act", full: "Artificial Intelligence Act",        color: "#8b5cf6" },
  LVD:    { label: "LVD",    full: "Low Voltage Directive",              color: "#f97316" },
  EMC:    { label: "EMC",    full: "EMC Directive",                      color: "#eab308" },
  ESPR:   { label: "ESPR",   full: "Ecodesign for Sustainable Products", color: "#22c55e" },
};

const STATUS_CFG = {
  FAIL: { icon: "✕", color: "#ef4444", bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
  WARN: { icon: "!",  color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", text: "#b45309" },
  PASS: { icon: "✓", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  INFO: { icon: "i",  color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
};

const RISK_CFG = {
  CRITICAL: { color: "#ef4444", border: "#ef4444" },
  HIGH:     { color: "#f97316", border: "#f97316" },
  MEDIUM:   { color: "#f59e0b", border: "#f59e0b" },
  LOW:      { color: "#22c55e", border: "#22c55e" },
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [desc,      setDesc]      = useState("");
  const [depth,     setDepth]     = useState("standard");
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const textareaRef = useRef(null);

  const t        = desc.toLowerCase();
  const detected = detectDirectives(desc);

  const answered  = QUESTIONS.map(q => ({ ...q, done: q.detect(t) }));
  const doneCount = answered.filter(q => q.done).length;
  const progress  = Math.round((doneCount / QUESTIONS.length) * 100);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.max(280, textareaRef.current.scrollHeight) + "px";
    }
  }, [desc]);

  const run = async () => {
    if (desc.trim().length < 20) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const r = await fetch("https://regcheck-api.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, category: "", directives: detected, depth }),
      });
      if (!r.ok) throw new Error("Server error " + r.status);
      const data = await r.json();
      setResult(data);
      const g = groupFindings(data.findings);
      setActiveTab(Object.keys(g)[0] || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const groupFindings = (findings) =>
    findings.reduce((acc, f, i) => {
      if (!acc[f.directive]) acc[f.directive] = [];
      acc[f.directive].push({ ...f, _i: i });
      return acc;
    }, {});

  const grouped     = result ? groupFindings(result.findings) : {};
  const dirTabs     = Object.keys(grouped);
  const counts      = result ? result.findings.reduce((a, f) => { a[f.status] = (a[f.status]||0)+1; return a; }, {}) : {};
  const tabFindings = (activeTab && grouped[activeTab]) ? grouped[activeTab] : [];
  const riskCfg     = result ? (RISK_CFG[result.overall_risk] || RISK_CFG.LOW) : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: 14,
      color: "#0f172a",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f8fafc}
        textarea,button{font-family:inherit}
        button{cursor:pointer;border:none;outline:none}
        textarea{outline:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.45}50%{opacity:.8}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
        .q-row{transition:background 0.12s}
        .q-row:hover{background:#f8fafc !important}
        .dir-tab{transition:all 0.15s;cursor:pointer}
        .dir-tab:hover:not(.atab){background:#f1f5f9 !important}
        .run-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(29,78,216,0.2)!important}
        .run-btn{transition:all 0.18s}
        .finding-row:hover{background:#fafafa !important}
        .finding-row{transition:background 0.1s}
        .depth-btn{transition:all 0.15s}
        .depth-btn:hover{border-color:#93c5fd !important}
        textarea:focus-visible{outline:none}
        .textarea-wrap:focus-within{border-color:#93c5fd !important;box-shadow:0 0 0 3px rgba(147,197,253,0.2) !important}
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 28px", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: "#1e40af",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff",
            }}>R</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", letterSpacing: "-0.02em" }}>
              RuleGrid<span style={{ color: "#3b82f6", fontWeight: 400 }}>.net</span>
            </span>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>EU Compliance Checker</span>
        </div>
      </nav>

      {/* ─── INPUT VIEW ─── */}
      {!result && !loading && (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 80px", animation: "fadeUp 0.3s ease" }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              Describe your product, check EU compliance
            </h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, marginTop: 6 }}>
              Write a description on the left. The checklist on the right guides you — each topic ticks off automatically as you cover it.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 324px", gap: 20, alignItems: "start" }}>

            {/* ── textarea + controls ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div className="textarea-wrap" style={{
                background: "#fff", border: "1px solid #e2e8f0",
                borderRadius: 12, overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
              }}>
                <textarea
                  ref={textareaRef}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  placeholder={`Describe your product here — use the checklist on the right as your guide.\n\nExample:\n"A smart home water leak detector for EU consumers. It uses WiFi 802.11n to connect to our AWS cloud server in Ireland. It has embedded firmware with OTA update support. Powered by two AA batteries — no mains voltage inside. It only stores device ID and alert history, no personal data. No AI features."`}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    color: "#0f172a", fontSize: 14, lineHeight: 1.8,
                    padding: "20px 22px", minHeight: 280,
                    fontFamily: "inherit", resize: "none", outline: "none",
                  }}
                />
                <div style={{
                  padding: "10px 22px 14px", borderTop: "1px solid #f1f5f9",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                  <span style={{ fontSize: 12, color: "#cbd5e1" }}>{desc.length} chars</span>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {detected.length === 0
                      ? <span style={{ fontSize: 12, color: "#cbd5e1", fontStyle: "italic" }}>Directives appear here as you type…</span>
                      : detected.map(id => {
                          const d = DIR_META[id];
                          return (
                            <span key={id} style={{
                              fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 5,
                              color: "#fff", background: d.color,
                            }}>{d.label}</span>
                          );
                        })
                    }
                  </div>
                </div>
              </div>

              {/* Controls row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Depth:</span>
                {[
                  { v: "standard", label: "Standard" },
                  { v: "deep",     label: "Deep audit" },
                ].map(d => (
                  <button key={d.v} className="depth-btn" onClick={() => setDepth(d.v)} style={{
                    fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: 8,
                    border: `1.5px solid ${depth === d.v ? "#3b82f6" : "#e2e8f0"}`,
                    background: depth === d.v ? "#eff6ff" : "#fff",
                    color: depth === d.v ? "#1d4ed8" : "#64748b",
                  }}>{d.label}</button>
                ))}

                <button
                  className="run-btn"
                  onClick={run}
                  disabled={loading || desc.trim().length < 20}
                  style={{
                    marginLeft: "auto",
                    background: desc.trim().length < 20 ? "#f1f5f9" : "#1d4ed8",
                    color: desc.trim().length < 20 ? "#94a3b8" : "#fff",
                    fontSize: 14, fontWeight: 600, padding: "9px 24px", borderRadius: 9,
                    boxShadow: desc.trim().length >= 20 ? "0 4px 14px rgba(29,78,216,0.18)" : "none",
                    display: "flex", alignItems: "center", gap: 8,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {loading
                    ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />Analysing…</>
                    : "Run analysis →"
                  }
                </button>
              </div>

              {error && (
                <div style={{
                  background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                  padding: "14px 18px", display: "flex", gap: 12, alignItems: "flex-start",
                }}>
                  <span style={{ color: "#ef4444", flexShrink: 0 }}>⚠</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#b91c1c", marginBottom: 4 }}>Could not reach backend</div>
                    <div style={{ fontSize: 12, color: "#ef4444", lineHeight: 1.6, marginBottom: 8 }}>{error}</div>
                    <code style={{ fontSize: 12, color: "#7c3aed", background: "#f5f3ff", padding: "3px 10px", borderRadius: 5 }}>
                      uvicorn main:app --reload
                    </code>
                  </div>
                </div>
              )}
            </div>

            {/* ── CHECKLIST ── */}
            <div style={{
              background: "#fff", border: "1px solid #e2e8f0",
              borderRadius: 12, overflow: "hidden",
              position: "sticky", top: 68,
            }}>
              <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Coverage guide</div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    background: progress >= 80 ? "#f0fdf4" : progress >= 50 ? "#fffbeb" : "#fef2f2",
                    color: progress >= 80 ? "#15803d" : progress >= 50 ? "#b45309" : "#b91c1c",
                    border: `1px solid ${progress >= 80 ? "#bbf7d0" : progress >= 50 ? "#fde68a" : "#fecaca"}`,
                    transition: "all 0.3s",
                  }}>
                    {doneCount}/{QUESTIONS.length}
                  </div>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 10, width: `${progress}%`,
                    background: progress >= 80 ? "#22c55e" : progress >= 50 ? "#f59e0b" : "#ef4444",
                    transition: "width 0.4s ease, background 0.3s",
                  }} />
                </div>
              </div>

              <div>
                {answered.map((q, i) => (
                  <div key={q.id} className="q-row" style={{
                    padding: "13px 20px", display: "flex", gap: 12, alignItems: "flex-start",
                    background: "#fff",
                    borderBottom: i < answered.length - 1 ? "1px solid #f8fafc" : "none",
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      background: q.done ? "#22c55e" : "#fff",
                      border: q.done ? "2px solid #22c55e" : "2px solid #d1d5db",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.22s ease",
                    }}>
                      {q.done && (
                        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                          <path d="M1.5 4.5L4 7L9.5 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13.5, fontWeight: q.done ? 400 : 500,
                        color: q.done ? "#94a3b8" : "#1e293b",
                        textDecoration: q.done ? "line-through" : "none",
                        lineHeight: 1.4, transition: "color 0.22s, font-weight 0.22s",
                      }}>
                        {q.label}
                      </div>
                      {!q.done && (
                        <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8", lineHeight: 1.55, fontStyle: "italic" }}>
                          {q.example}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
                {progress === 100 ? (
                  <span style={{ fontSize: 13, color: "#15803d", fontWeight: 600 }}>
                    ✓ All topics covered — great detail!
                  </span>
                ) : (
                  <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
                    {QUESTIONS.length - doneCount} topic{QUESTIONS.length - doneCount !== 1 ? "s" : ""} remaining for best results
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── LOADING ─── */}
      {loading && (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13, marginBottom: 24 }}>
            <div style={{ width: 14, height: 14, border: "2px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
            Checking {detected.length} directive{detected.length !== 1 ? "s" : ""}…
          </div>
          {[75, 55, 85, 60].map((w, i) => (
            <div key={i} style={{
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
              padding: "20px 22px", marginBottom: 12,
              animation: `pulse 1.6s ease ${i * 0.16}s infinite`,
            }}>
              <div style={{ height: 12, background: "#f1f5f9", borderRadius: 4, width: `${w * 0.35}%`, marginBottom: 14 }} />
              <div style={{ height: 10, background: "#f8fafc", borderRadius: 4, width: `${w}%`, marginBottom: 8 }} />
              <div style={{ height: 10, background: "#f8fafc", borderRadius: 4, width: `${w * 0.65}%` }} />
            </div>
          ))}
        </div>
      )}

      {/* ─── RESULTS ─── */}
      {result && (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "36px 28px 80px", animation: "fadeUp 0.3s ease" }}>

          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderLeft: `4px solid ${riskCfg.color}`,
            borderRadius: 12, padding: "20px 24px", marginBottom: 20,
            display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                Overall risk
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: riskCfg.color, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {result.overall_risk}
              </div>
            </div>
            <div style={{ width: 1, background: "#e2e8f0", alignSelf: "stretch" }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Summary
              </div>
              <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7 }}>{result.summary}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["FAIL", "WARN", "PASS", "INFO"].map(s => {
                const n = counts[s] || 0;
                if (!n) return null;
                const sc = STATUS_CFG[s];
                return (
                  <div key={s} style={{
                    background: sc.bg, border: `1px solid ${sc.border}`,
                    borderRadius: 10, padding: "8px 14px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: sc.text, lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: sc.text, opacity: 0.7, letterSpacing: "0.06em", marginTop: 3 }}>{s}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => { setResult(null); setError(null); }} style={{
              background: "#fff", border: "1px solid #e2e8f0", color: "#64748b",
              fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 8,
              alignSelf: "center",
            }}>← Edit description</button>
          </div>

          {/* Directive tabs */}
          <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
            {dirTabs.map(dir => {
              const dm  = DIR_META[dir] || { label: dir, color: "#3b82f6" };
              const isA = activeTab === dir;
              const fc  = (grouped[dir] || []).filter(f => f.status === "FAIL").length;
              const wc  = (grouped[dir] || []).filter(f => f.status === "WARN").length;
              return (
                <button key={dir} className={`dir-tab${isA ? " atab" : ""}`} onClick={() => setActiveTab(dir)} style={{
                  padding: "9px 16px",
                  background: isA ? "#fff" : "transparent",
                  border: `1px solid ${isA ? "#e2e8f0" : "transparent"}`,
                  borderBottom: isA ? "1px solid #fff" : "1px solid transparent",
                  borderRadius: "8px 8px 0 0",
                  color: isA ? "#0f172a" : "#64748b",
                  fontSize: 13, fontWeight: isA ? 600 : 500,
                  whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 7,
                  position: "relative", bottom: -1,
                }}>
                  {isA && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dm.color, flexShrink: 0 }} />}
                  {dm.label}
                  {fc > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#ef4444", padding: "1px 5px", borderRadius: 4 }}>{fc}F</span>}
                  {fc === 0 && wc > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#b45309", background: "#fef9c3", padding: "1px 5px", borderRadius: 4 }}>{wc}W</span>}
                </button>
              );
            })}
          </div>

          {activeTab && DIR_META[activeTab] && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 8px 12px 12px", overflow: "hidden" }}>
              <div style={{
                padding: "16px 22px", borderBottom: "1px solid #f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{DIR_META[activeTab].full}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{DIR_META[activeTab].label}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["FAIL", "WARN", "PASS", "INFO"].map(s => {
                    const n = tabFindings.filter(f => f.status === s).length;
                    if (!n) return null;
                    const sc = STATUS_CFG[s];
                    return (
                      <div key={s} style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, padding: "5px 11px", textAlign: "center" }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: sc.text, lineHeight: 1 }}>{n}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: sc.text, opacity: 0.6, letterSpacing: "0.06em", marginTop: 2 }}>{s}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {tabFindings.map((f, idx) => {
                const sc = STATUS_CFG[f.status] || STATUS_CFG.INFO;
                return (
                  <div key={f._i} className="finding-row" style={{
                    padding: "16px 22px",
                    borderBottom: idx < tabFindings.length - 1 ? "1px solid #f8fafc" : "none",
                    display: "grid", gridTemplateColumns: "32px 1fr auto", gap: "0 14px",
                    background: "#fff",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: sc.text, flexShrink: 0, marginTop: 2,
                    }}>{sc.icon}</div>
                    <div>
                      <div style={{
                        fontSize: 11.5, fontWeight: 600, color: "#94a3b8", marginBottom: 5, lineHeight: 1.4,
                        fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
                      }}>{f.article}</div>
                      <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.72 }}>{f.finding}</div>
                      {f.action && (
                        <div style={{
                          marginTop: 10, paddingLeft: 14,
                          borderLeft: `2px solid ${sc.color}60`,
                          fontSize: 13, color: "#6b7280", lineHeight: 1.68,
                        }}>
                          <span style={{ fontWeight: 600, color: sc.text }}>Action: </span>
                          {f.action}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: sc.text,
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      padding: "3px 8px", borderRadius: 5, alignSelf: "start",
                      whiteSpace: "nowrap", letterSpacing: "0.06em",
                    }}>{f.status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}