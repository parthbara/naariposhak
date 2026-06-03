import https from 'https';

const data = JSON.stringify({
  model: "google/gemma-2-9b-it",
  messages: [{ role: "user", content: "sabai bhanda sasto saree kasto cha hola" }],
  temperature: 0.7,
  max_tokens: 150
});

const options = {
  hostname: 'integrate.api.nvidia.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let responseData = '';
  res.on('data', d => {
    responseData += d;
  });
  res.on('end', () => {
    console.log(responseData);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
