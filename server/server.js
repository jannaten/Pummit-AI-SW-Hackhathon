// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

dotenv.config();
const app = express();

// app.use(cors({
//   origin: 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: false
// }));

app.use(cors());
app.use(express.json());

// Helper function to read and parse CSV data
const readEventData = () => {
//   console.log('Reading event data');
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.join(__dirname, 'files', '2_tapahtumat_agrihubi.csv'))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Function to analyze text using OpenAI with better error handling
const analyzeWithAI = async (text, prompt) => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not found, skipping AI analysis');
    return 'AI analysis not available';
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
        // messages: [
        //   { 
        //     role: 'system', 
        //     content: 'You are an expert in agricultural policy and event analysis. Analyze the given data and provide insights.' 
        //   },
        //   { 
        //     role: 'user', 
        //     content: `${prompt}\n\nData to analyze:\n${text}` 
        //   }
        // ],
        // temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return 'AI analysis temporarily unavailable';
  }
};

// Endpoint to get all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await readEventData();
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error reading event data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read event data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint to search events with AI-enhanced results
app.get('/api/events/search', async (req, res) => {
  try {
    const { query } = req.query;
    const events = await readEventData();
    
    const searchResults = events.filter(event => {
      const searchString = query.toLowerCase();
      return (
        event.Otsikko?.toLowerCase().includes(searchString) ||
        event.Tiivistelmä?.toLowerCase().includes(searchString) ||
        event.Sisältö?.toLowerCase().includes(searchString) ||
        event.Aiheet?.toLowerCase().includes(searchString)
      );
    });

    // Get AI insights for the search results
    const aiAnalysis = await analyzeWithAI(
      JSON.stringify(searchResults),
      'Analyze these search results and provide insights about how they relate to CAP goals. Consider themes, target audiences, and potential impact.'
    );

    res.json({ 
      success: true, 
      data: searchResults,
      aiInsights: aiAnalysis
    });
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Search failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced analytics endpoint with AI insights and error handling
app.get('/api/events/analytics', async (req, res) => {
  try {
    const events = await readEventData();
    
    // Basic statistical analysis
    const themeAnalysis = events.reduce((acc, event) => {
      const themes = event.Aiheet?.split(',').map(t => t.trim()) || [];
      themes.forEach(theme => {
        if (theme) acc[theme] = (acc[theme] || 0) + 1;
      });
      return acc;
    }, {});

    const typeAnalysis = events.reduce((acc, event) => {
      const type = event.Tyyppi;
      if (type) acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Get AI insights with error handling
    let aiAnalysis, aiRecommendations;
    try {
      [aiAnalysis, aiRecommendations] = await Promise.all([
        analyzeWithAI(
          JSON.stringify({ events: events.length, themes: Object.keys(themeAnalysis) }),
          'Analyze this event data and provide insights about: \n1. How well these events support CAP goals\n2. Recommendations for future event focus areas\n3. Gaps in current event coverage'
        ),
        analyzeWithAI(
          JSON.stringify(themeAnalysis),
          'Based on the current event theme distribution, what types of events should be prioritized in the future to better support CAP goals? Provide specific recommendations.'
        )
      ]);
    } catch (aiError) {
      console.error('AI Analysis Error:', aiError);
      aiAnalysis = 'AI analysis temporarily unavailable';
      aiRecommendations = 'AI recommendations temporarily unavailable';
    }

    res.json({
      success: true,
      data: {
        totalEvents: events.length,
        themeAnalysis,
        typeAnalysis,
        aiAnalysis,
        aiRecommendations
      }
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});