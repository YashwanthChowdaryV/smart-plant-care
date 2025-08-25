#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>
#include <time.h>

// WiFi Credentials
const char* WIFI_SSID = "One Plus Nord Ce 2";
const char* WIFI_PASSWORD = "karthik12345";

// Firebase Configuration
const char* FIREBASE_HOST = "smartplantcare-78386-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* FIREBASE_AUTH = "AIzaSyAlRAlD6ry3UZh06Zr83iVzkroQqkrzhlw";

// Sensor Pins
#define DHTPIN 4
#define DHTTYPE DHT11
#define SOIL_PIN 34
#define RELAY_PIN 26  // Relay control pin for motor

// Timing Intervals
#define CURRENT_DATA_INTERVAL 5000    // 5 seconds
#define HISTORY_DATA_INTERVAL 30000   // 30 seconds

DHT dht(DHTPIN, DHTTYPE);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void debugPrint(String message) {
  Serial.println(message);
}

bool syncTime() {
  configTime(8 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  debugPrint("Syncing time...");
  
  time_t now = time(nullptr);
  int attempts = 0;
  while (now < 8 * 3600 * 2 && attempts < 20) {
    delay(500);
    now = time(nullptr);
    attempts++;
  }

  if (now > 1600000000) {
    char timeStr[20];
    strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M:%S", localtime(&now));
    debugPrint("Time synced: " + String(timeStr));
    return true;
  }
  debugPrint("Time sync failed");
  return false;
}

// Relay control
void turnMotorOn() {
  digitalWrite(RELAY_PIN, HIGH); // Activate relay
  debugPrint("Motor turned ON");
}

void turnMotorOff() {
  digitalWrite(RELAY_PIN, LOW); // Deactivate relay
  debugPrint("Motor turned OFF");
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW); // Ensure relay is OFF initially

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  debugPrint("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  debugPrint("\nConnected! IP: " + WiFi.localIP().toString());

  if (!syncTime()) {
    debugPrint("Proceeding without time sync");
  }

  config.database_url = "https://" + String(FIREBASE_HOST);
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  fbdo.setResponseSize(1024);
}

void updateCurrentData(float temp, float hum, int soil) {
  FirebaseJson json;
  json.set("temperature", temp);
  json.set("humidity", hum);
  json.set("soilMoisture", soil);
  json.set("timestamp", time(nullptr));

  if (!Firebase.set(fbdo, "/current", json)) {
    debugPrint("Current update failed: " + fbdo.errorReason());
  } else {
    debugPrint("Current data updated");
  }
}

void saveHistoryData(float temp, float hum, int soil) {
  time_t now;
  time(&now);
  char timestamp[20];
  strftime(timestamp, sizeof(timestamp), "%Y%m%d_%H%M%S", localtime(&now));

  FirebaseJson json;
  json.set("temperature", temp);
  json.set("humidity", hum);
  json.set("soilMoisture", soil);
  json.set("timestamp", now);

  String historyPath = "/history/" + String(timestamp);
  if (!Firebase.set(fbdo, historyPath.c_str(), json)) {
    debugPrint("History save failed: " + fbdo.errorReason());
  } else {
    debugPrint("History saved: " + historyPath);
  }
}

void controlMotorBySoilMoisture(int soilMoisture) {
  int threshold = 2500; // Set threshold as needed (adjust based on soil sensor range)
  if (soilMoisture < threshold) {
    turnMotorOn(); // Dry soil → turn on motor
  } else {
    turnMotorOff(); // Moist soil → turn off motor
  }
}

void loop() {
  static unsigned long lastCurrentUpdate = 0;
  static unsigned long lastHistoryUpdate = 0;

  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int soil = analogRead(SOIL_PIN);

  if (isnan(temp) || isnan(hum)) {
    debugPrint("Failed to read DHT sensor!");
    delay(1000);
    return;
  }

  // Control motor based on soil moisture
  controlMotorBySoilMoisture(soil);

  // Update current data every 5 seconds
  if (millis() - lastCurrentUpdate >= CURRENT_DATA_INTERVAL) {
    lastCurrentUpdate = millis();
    updateCurrentData(temp, hum, soil);
  }

  // Save history every 30 seconds
  if (millis() - lastHistoryUpdate >= HISTORY_DATA_INTERVAL) {
    lastHistoryUpdate = millis();
    saveHistoryData(temp, hum, soil);
  }

  delay(100); // Small delay to prevent watchdog trigger
}
