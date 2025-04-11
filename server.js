require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

const serviceAccount = require("./firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
console.log("✅ Firebase Admin initialized");

const registrationSchema = new mongoose.Schema({
  uid: String,
  phone: String,
  members: Array,
  vehicle: String,
  arrivalDate: String,
  departureDate: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Registration = mongoose.model("Registration", registrationSchema);

app.post("/api/register", async (req, res) => {
  try {
    const { idToken, formData } = req.body;
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;
    const uid = decoded.uid;

    if (!phone) {
      return res.status(400).json({ error: "Invalid or unverified phone number." });
    }

    const registration = new Registration({
      uid,
      phone,
      ...formData
    });

    await registration.save();
    res.status(201).json({ message: "✅ Registration saved successfully" });
  } catch (err) {
    console.error("Error in registration:", err);
    res.status(500).json({ error: "❌ Registration failed" });
  }
});

app.get("/api/registrations", async (req, res) => {
  try {
    const all = await Registration.find().sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).json({ error: "❌ Could not fetch data" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
