// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data.choices[0].message.content
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get response from OpenAI'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});