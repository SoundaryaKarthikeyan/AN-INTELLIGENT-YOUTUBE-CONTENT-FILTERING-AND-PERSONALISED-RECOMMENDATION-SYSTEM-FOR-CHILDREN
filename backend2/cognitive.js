const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Connect to your local MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/childAppDB')
  .then(() => console.log("Connected to MongoDB at localhost:27017"))
  .catch(err => console.error("Could not connect to MongoDB", err));

const ActivitySchema = new mongoose.Schema({
  childId: String,
  category: String, // e.g., 'Memory', 'Logic', 'Attention'
  score: Number,
  date: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', ActivitySchema);

// 3. API Endpoints
// This matches your frontend: API.get(`/parent/cognitive/${childId}`)
app.get('/parent/cognitive/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    // We aggregate the data to get real-time averages
    const stats = await Activity.aggregate([
      { $match: { childId } },
      { $group: { _id: "$category", value: { $avg: "$score" } } }
    ]);

    // Convert array to a clean object for your frontend
    const result = {};
    stats.forEach(s => result[s._id] = Math.round(s.value));
    
    res.json(result); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/parent/trends/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    const trends = await Activity.aggregate([
      { $match: { childId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          score: { $avg: "$score" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});