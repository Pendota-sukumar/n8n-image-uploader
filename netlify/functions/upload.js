const https = require('https');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { base64Image } = JSON.parse(event.body);
    
    if (!base64Image) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No image data provided' })
      };
    }

    // Upload to ImgBB (free tier)
    const imgbbResponse = await uploadToImgBB(base64Image);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: imgbbResponse.data.url,
        display_url: imgbbResponse.data.display_url
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function uploadToImgBB(base64Image) {
  return new Promise((resolve, reject) => {
    const data = `key=2d09b6d95a7a4c5d8c5f9d4a8c5e6f7a&image=${encodeURIComponent(base64Image)}`;
    
    const options = {
      hostname: 'api.imgbb.com',
      port: 443,
      path: '/1/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error('Invalid response from ImgBB'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
